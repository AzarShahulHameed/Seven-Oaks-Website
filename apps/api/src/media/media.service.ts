import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { PrismaService } from '../common/common.module';
import { IntegrationsService } from '../integrations/integrations.service';
import { NotificationsService } from '../common/notifications.service';
import { config } from '../config';

const ALLOWED = new Set(['jpeg', 'png', 'webp', 'avif', 'gif']); // SVG deliberately excluded (script injection risk)
export const MAX_MB = () => config.MAX_UPLOAD_MB;
/** Media ids are 24 hex chars and appear as the last path segment of the Cloudinary public_id. */
export const MEDIA_ID_RE = /\/([a-f0-9]{24})(?=[\\"'?\s,.\/)]|$)/g;
const BASE_T = 'f_auto,q_auto';

@Injectable()
export class MediaService {
  constructor(private db: PrismaService, private integ: IntegrationsService, private notes: NotificationsService) {}

  private url(cloud: string, publicId: string, t = BASE_T) { return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${publicId}`; }
  private rawUrl(cloud: string, publicId: string) { return `https://res.cloudinary.com/${cloud}/raw/upload/${publicId}`; }

  private async present(m: any, consent: boolean, cloud?: string) {
    cloud ??= await this.integ.cloudinaryCloudName();
    if (m.kind === 'VIDEO') {
      const v = `https://res.cloudinary.com/${cloud}/video/upload`;
      return { id: m.id, kind: 'VIDEO', folder: m.folder, url: `${v}/f_auto,q_auto/${m.storageKey}`, thumbUrl: `${v}/so_0,f_jpg,q_auto,w_480/${m.storageKey}.jpg`, posterUrl: `${v}/so_0,f_jpg,q_auto,w_1280/${m.storageKey}.jpg`, mime: m.mime, filename: (m.caption as any)?.en ?? '', width: m.width, height: m.height, sizeBytes: m.sizeBytes, altText: m.altText ?? { en: '', ar: '' }, showsChild: m.showsChild, hasConsent: consent, createdAt: m.createdAt };
    }
    if (m.kind === 'DOCUMENT') {
      return { id: m.id, kind: 'DOCUMENT', folder: m.folder, url: this.rawUrl(cloud, m.storageKey), thumbUrl: '', filename: (m.caption as any)?.en ?? '', mime: m.mime, width: null, height: null, sizeBytes: m.sizeBytes, altText: m.altText ?? { en: '', ar: '' }, showsChild: false, hasConsent: false, createdAt: m.createdAt };
    }
    return {
      id: m.id, kind: 'IMAGE', mime: m.mime, filename: '', folder: m.folder, url: this.url(cloud, m.storageKey), thumbUrl: this.url(cloud, m.storageKey, 'f_auto,q_auto,w_480'),
      width: m.width, height: m.height, sizeBytes: m.sizeBytes, altText: m.altText ?? { en: '', ar: '' },
      showsChild: m.showsChild, hasConsent: consent, createdAt: m.createdAt,
    };
  }

  async list(q: { folder?: string; search?: string; kind?: 'IMAGE' | 'DOCUMENT' | 'VIDEO' }) {
    const rows = await this.db.media.findMany({
      where: { deletedAt: null, kind: q.kind ?? 'IMAGE', ...(q.folder ? { folder: q.folder } : {}) },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    const consents = await this.db.consent.findMany({ where: { type: 'PHOTO_PUBLIC', granted: true, withdrawnAt: null, mediaId: { in: rows.map((r) => r.id) } }, select: { mediaId: true } });
    const ok = new Set(consents.map((c) => c.mediaId));
    const cloud = await this.integ.cloudinaryCloudName();
    return Promise.all(rows.map((r) => this.present(r, ok.has(r.id), cloud)));
  }

  /** Looks at the file's own bytes (not its name or declared type) and says what it really is. */
  private sniff(buf: Buffer): { kind: 'image' | 'document' | 'heic' | 'svg' | 'unknown'; ext?: string; mime?: string } {
    const head = buf.subarray(0, 16);
    if (head.subarray(0, 5).toString('latin1') === '%PDF-') return { kind: 'document', ext: 'pdf', mime: 'application/pdf' };
    if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) { // zip container: Office Open XML
      const t = buf.toString('latin1');
      if (t.includes('word/')) return { kind: 'document', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      if (t.includes('xl/')) return { kind: 'document', ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      if (t.includes('ppt/')) return { kind: 'document', ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
      return { kind: 'unknown' };
    }
    const ftyp = buf.subarray(4, 12).toString('latin1');
    if (ftyp.startsWith('ftyp') && /heic|heix|hevc|mif1|heim|heis/.test(ftyp)) return { kind: 'heic' };
    if (/^\s*(<\?xml|<svg)/i.test(buf.subarray(0, 200).toString('utf8'))) return { kind: 'svg' };
    return { kind: 'image' }; // decided by sharp below
  }

  /** Validates by looking inside the file, strips EXIF/GPS from pictures, then uploads to Cloudinary. Accepts pictures and PDF/Word/Excel/PowerPoint documents. */
  async upload(file: Express.Multer.File | undefined, meta: { altEn: string; altAr: string; folder: string; showsChild: boolean }, actor?: string) {
    try { return await this.uploadInner(file, meta); }
    catch (e: any) {
      void this.notes.notify({ type: 'upload', severity: 'error', title: 'An upload failed', body: `${file?.originalname ? `“${file.originalname.slice(0, 60)}”: ` : ''}${String(e?.message ?? e).slice(0, 200)}`, link: '/admin/media' });
      throw e;
    }
  }

  private async uploadInner(file: Express.Multer.File | undefined, meta: { altEn: string; altAr: string; folder: string; showsChild: boolean }) {
    if (!file) throw new BadRequestException('No file was received. Choose a file and try again.');
    if (!file.size) throw new BadRequestException('That file is empty (0 KB). Choose a different file.');
    await this.integ.cloudinary(); // fails early with a clear message if not configured
    const s = this.sniff(file.buffer);
    const id = randomBytes(12).toString('hex'); // 24 hex chars, never derived from the user's filename
    const folder = (await this.integ.cloudinary()).folder;

    if (s.kind === 'heic') throw new BadRequestException('This is an iPhone HEIC photo, which browsers and our image tools cannot use. Please save it as JPG or PNG first (iPhone: Settings → Camera → Formats → “Most Compatible”).');
    if (s.kind === 'svg') throw new BadRequestException('SVG files are not accepted because they can hide scripts. Please upload a PNG, JPG or WebP picture instead.');
    if (s.kind === 'unknown') throw new BadRequestException(`“${file.originalname}” is not a supported file. You can upload JPG, PNG, WebP, AVIF, GIF pictures and PDF, Word (.docx), Excel (.xlsx) or PowerPoint (.pptx) documents.`);

    if (s.kind === 'document') {
      const safeName = file.originalname.replace(/[^\w.\- ]+/g, '').slice(0, 80) || `document.${s.ext}`;
      const up = await this.integ.cloudinaryUpload(file.buffer, `${id}.${s.ext}`, folder, { resource: 'raw', mime: s.mime, filename: `${id}.${s.ext}` });
      const row = await this.db.media.create({ data: { id, kind: 'DOCUMENT', folder: meta.folder, storageKey: up.publicId, mime: s.mime!, sizeBytes: up.bytes ?? file.size, variants: {}, altText: { en: meta.altEn || safeName.replace(/\.[^.]+$/, ''), ar: meta.altAr }, caption: { en: safeName, ar: safeName }, showsChild: false } });
      return this.present(row, false, up.cloudName);
    }

    let info;
    try { info = await sharp(file.buffer, { limitInputPixels: 50_000_000 }).metadata(); }
    catch { throw new BadRequestException(`“${file.originalname}” could not be read as a picture. It may be damaged or a very large image. Try saving it again as JPG or PNG.`); }
    if (!info.format || !ALLOWED.has(info.format)) throw new BadRequestException(`Pictures in ${String(info.format ?? 'this').toUpperCase()} format are not accepted. Use JPG, PNG, WebP, AVIF or GIF.`);

    const out = await sharp(file.buffer, { limitInputPixels: 50_000_000 }).rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true }); // no .withMetadata(): all EXIF/GPS is dropped
    const up = await this.integ.cloudinaryUpload(out.data, id, folder);
    const row = await this.db.media.create({
      data: {
        id, kind: 'IMAGE', folder: meta.folder, storageKey: up.publicId, mime: 'image/webp', sizeBytes: up.bytes ?? out.data.length,
        width: up.width ?? out.info.width, height: up.height ?? out.info.height, variants: {}, altText: { en: meta.altEn, ar: meta.altAr }, showsChild: meta.showsChild,
      },
    });
    return this.present(row, false, up.cloudName);
  }

  /** Step 1 of a video upload: hands the browser signed parameters for a direct upload to Cloudinary. */
  async videoTicket(originalName: string, sizeBytes: number) {
    if (sizeBytes > config.MAX_VIDEO_MB * 1024 * 1024) throw new BadRequestException(`That video is ${(sizeBytes / 1048576).toFixed(0)} MB. The limit is ${config.MAX_VIDEO_MB} MB. Please compress it (for example with HandBrake) or trim it.`);
    if (!/\.(mp4|webm|mov)$/i.test(originalName)) throw new BadRequestException('Videos must be MP4, WebM or MOV files.');
    const id = randomBytes(12).toString('hex');
    return { id, ...(await this.integ.cloudinaryVideoSign(id)) };
  }

  /** Step 2: after the browser finished uploading, confirm with Cloudinary that the file really exists and is a video, then add it to the library. */
  async videoRegister(id: string, meta: { altEn: string; altAr: string; folder: string; showsChild: boolean; filename: string }) {
    const folder = (await this.integ.cloudinary()).folder;
    const publicId = `${folder}/${id}`;
    const r = await this.integ.cloudinaryResource(publicId, 'video');
    if (!r) throw new BadRequestException('Cloudinary does not have this video yet. Wait a moment and try again, or upload it again.');
    if ((r.bytes ?? 0) > config.MAX_VIDEO_MB * 1024 * 1024) { await this.integ.cloudinaryDestroy(publicId, 'video').catch(() => undefined); throw new BadRequestException(`That video is larger than ${config.MAX_VIDEO_MB} MB, so it was removed.`); }
    const safe = meta.filename.replace(/[^\w.\- ]+/g, '').slice(0, 80) || 'video';
    const row = await this.db.media.create({ data: { id, kind: 'VIDEO', folder: meta.folder, storageKey: publicId, mime: `video/${r.format === 'mov' ? 'quicktime' : r.format ?? 'mp4'}`, sizeBytes: r.bytes ?? 0, width: r.width ?? null, height: r.height ?? null, variants: { duration: r.duration ?? null }, altText: { en: meta.altEn || safe.replace(/\.[^.]+$/, ''), ar: meta.altAr }, caption: { en: safe, ar: safe }, showsChild: meta.showsChild } });
    return this.present(row, false, r.cloudName);
  }

  async update(id: string, d: { altText?: { en?: string; ar?: string }; folder?: string; showsChild?: boolean }) {
    const m = await this.db.media.findFirst({ where: { id, deletedAt: null } });
    if (!m) throw new NotFoundException();
    const row = await this.db.media.update({ where: { id }, data: { ...(d.altText ? { altText: d.altText } : {}), ...(d.folder !== undefined ? { folder: d.folder } : {}), ...(d.showsChild !== undefined ? { showsChild: d.showsChild } : {}) } });
    return this.present(row, await this.hasConsent(id));
  }

  async hasConsent(mediaId: string) {
    return (await this.db.consent.count({ where: { mediaId, type: 'PHOTO_PUBLIC', granted: true, withdrawnAt: null } })) > 0;
  }

  /** Records the parental photo consent decision. Withdrawing also lists where the photo is still used. */
  async setConsent(id: string, granted: boolean, note: string) {
    if (!(await this.db.media.findFirst({ where: { id, deletedAt: null } }))) throw new NotFoundException();
    if (granted) {
      if (!(await this.hasConsent(id))) await this.db.consent.create({ data: { type: 'PHOTO_PUBLIC', granted: true, mediaId: id, textVersion: `admin-attested-v1: ${note}` } });
    } else {
      await this.db.consent.updateMany({ where: { mediaId: id, type: 'PHOTO_PUBLIC', withdrawnAt: null }, data: { withdrawnAt: new Date() } });
    }
    return { hasConsent: granted, usage: await this.usage(id) };
  }

  async usage(id: string) {
    const like = `%/${id}%`;
    const pages = await this.db.$queryRaw<{ key: string }[]>`SELECT DISTINCT p.key FROM "Section" s JOIN "Page" p ON p.id = s."pageId" WHERE p."deletedAt" IS NULL AND s.config::text LIKE ${like}`;
    const settings = await this.db.$queryRaw<{ key: string }[]>`SELECT key FROM "SiteSetting" WHERE value::text LIKE ${like}`;
    return { pages: pages.map((p) => p.key), settings: settings.map((s) => s.key) };
  }

  async remove(id: string) {
    const m = await this.db.media.findFirst({ where: { id, deletedAt: null } });
    if (!m) throw new NotFoundException();
    const usage = await this.usage(id);
    if (usage.pages.length || usage.settings.length) throw new ConflictException({ message: 'Image is still in use', usage });
    await this.integ.cloudinaryDestroy(m.storageKey, m.kind === 'DOCUMENT' ? 'raw' : m.kind === 'VIDEO' ? 'video' : 'image');
    await this.db.media.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  /** Publish gate: any photo flagged as showing a child must have a valid, un-withdrawn public-photo consent. */
  async assertPublishable(snapshot: unknown) {
    const ids = [...new Set([...JSON.stringify(snapshot).matchAll(MEDIA_ID_RE)].map((m) => m[1]))];
    if (!ids.length) return;
    const risky = await this.db.media.findMany({ where: { id: { in: ids }, showsChild: true, deletedAt: null }, select: { id: true } });
    const blocked: string[] = [];
    for (const r of risky) if (!(await this.hasConsent(r.id))) blocked.push(r.id);
    if (blocked.length) throw new BadRequestException(`Cannot publish: ${blocked.length} photo(s) show a child without recorded parental consent (media ids: ${blocked.join(', ')}). Record consent in Media, or remove them.`);
  }
}

import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../common/common.module';
import { decryptSecret, encryptSecret } from '../common/crypto';
import { NotificationsService } from '../common/notifications.service';

export const INTEGRATIONS_KEY = 'secret.integrations';

export interface IntegrationsStored {
  cloudinary: { enabled: boolean; cloudName: string; apiKey: string; apiSecretEnc: string; folder: string };
  resend: { enabled: boolean; apiKeyEnc: string; fromEmail: string; fromName: string; replyTo: string };
  google: { translateKeyEnc: string };
}
const EMPTY: IntegrationsStored = {
  cloudinary: { enabled: false, cloudName: '', apiKey: '', apiSecretEnc: '', folder: 'sevenoaks' },
  resend: { enabled: false, apiKeyEnc: '', fromEmail: '', fromName: 'Seven Oaks British Nursery', replyTo: '' },
  google: { translateKeyEnc: '' },
};

export interface IntegrationsInput {
  cloudinary?: { enabled?: boolean; cloudName?: string; apiKey?: string; apiSecret?: string; folder?: string };
  resend?: { enabled?: boolean; apiKey?: string; fromEmail?: string; fromName?: string; replyTo?: string };
  google?: { translateApiKey?: string; clearTranslateKey?: boolean };
}

const tail = (s: string) => (s ? `••••${s.slice(-4)}` : '');

@Injectable()
export class IntegrationsService {
  constructor(private db: PrismaService, private notes: NotificationsService) {}

  private async stored(): Promise<IntegrationsStored> {
    const row = await this.db.siteSetting.findUnique({ where: { key: INTEGRATIONS_KEY } });
    const v = (row?.value ?? {}) as Partial<IntegrationsStored>;
    return { cloudinary: { ...EMPTY.cloudinary, ...v.cloudinary }, resend: { ...EMPTY.resend, ...v.resend }, google: { ...EMPTY.google, ...v.google } };
  }

  /** What the browser may see: never the secrets themselves, only whether they are set and their last 4 characters. */
  async view() {
    const s = await this.stored();
    const sec = (enc: string) => { try { return enc ? decryptSecret(enc) : ''; } catch { return ''; } };
    return {
      cloudinary: {
        enabled: s.cloudinary.enabled, cloudName: s.cloudinary.cloudName, apiKey: s.cloudinary.apiKey, folder: s.cloudinary.folder,
        hasApiSecret: !!s.cloudinary.apiSecretEnc, apiSecretHint: tail(sec(s.cloudinary.apiSecretEnc)),
      },
      resend: {
        enabled: s.resend.enabled, fromEmail: s.resend.fromEmail, fromName: s.resend.fromName, replyTo: s.resend.replyTo,
        hasApiKey: !!s.resend.apiKeyEnc, apiKeyHint: tail(sec(s.resend.apiKeyEnc)),
      },
      google: { hasTranslateKey: !!s.google.translateKeyEnc, translateKeyHint: tail(sec(s.google.translateKeyEnc)) },
    };
  }

  /** Empty / omitted secret fields keep the stored secret. */
  async save(input: IntegrationsInput) {
    const cur = await this.stored();
    const next: IntegrationsStored = JSON.parse(JSON.stringify(cur));
    if (input.cloudinary) {
      const c = input.cloudinary;
      if (c.enabled !== undefined) next.cloudinary.enabled = c.enabled;
      if (c.cloudName !== undefined) next.cloudinary.cloudName = c.cloudName;
      if (c.apiKey !== undefined) next.cloudinary.apiKey = c.apiKey;
      if (c.folder !== undefined) next.cloudinary.folder = c.folder;
      if (c.apiSecret) next.cloudinary.apiSecretEnc = encryptSecret(c.apiSecret);
    }
    if (input.resend) {
      const r = input.resend;
      if (r.enabled !== undefined) next.resend.enabled = r.enabled;
      if (r.fromEmail !== undefined) next.resend.fromEmail = r.fromEmail;
      if (r.fromName !== undefined) next.resend.fromName = r.fromName;
      if (r.replyTo !== undefined) next.resend.replyTo = r.replyTo;
      if (r.apiKey) next.resend.apiKeyEnc = encryptSecret(r.apiKey);
    }
    if (input.google) {
      if (input.google.translateApiKey) next.google.translateKeyEnc = encryptSecret(input.google.translateApiKey);
      else if (input.google.clearTranslateKey) next.google.translateKeyEnc = '';
    }
    if (next.cloudinary.enabled && !(next.cloudinary.cloudName && next.cloudinary.apiKey && next.cloudinary.apiSecretEnc))
      throw new BadRequestException('Cloudinary needs a cloud name, API key and API secret before it can be enabled');
    if (next.resend.enabled && !(next.resend.apiKeyEnc && next.resend.fromEmail))
      throw new BadRequestException('Resend needs an API key and a From address before it can be enabled');
    await this.db.siteSetting.upsert({ where: { key: INTEGRATIONS_KEY }, update: { value: next as any }, create: { key: INTEGRATIONS_KEY, value: next as any } });
    return this.view();
  }

  // ───────── Cloudinary ─────────
  async cloudinary() {
    const c = (await this.stored()).cloudinary;
    if (!c.enabled || !c.cloudName || !c.apiKey || !c.apiSecretEnc)
      throw new ServiceUnavailableException('Image storage is not configured. Add your Cloudinary details in Admin → Integrations.');
    return { cloudName: c.cloudName, apiKey: c.apiKey, apiSecret: decryptSecret(c.apiSecretEnc), folder: c.folder || 'sevenoaks' };
  }
  async cloudinaryCloudName() {
    const c = (await this.stored()).cloudinary;
    return c.enabled ? c.cloudName : '';
  }

  /** Cloudinary signature: SHA-1 of the sorted "k=v&k=v" params (excluding file, api_key, resource_type, cloud_name) + api secret. */
  static sign(params: Record<string, string | number>, secret: string) {
    const str = Object.keys(params).filter((k) => params[k] !== '' && params[k] !== undefined).sort().map((k) => `${k}=${params[k]}`).join('&');
    return createHash('sha1').update(str + secret).digest('hex');
  }

  async cloudinaryUpload(buffer: Buffer, publicId: string, folder: string, opts: { resource?: 'image' | 'raw'; mime?: string; filename?: string } = {}) {
    const c = await this.cloudinary();
    const resource = opts.resource ?? 'image';
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder, public_id: publicId, timestamp, overwrite: 'false' };
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(buffer)], { type: opts.mime ?? 'image/webp' }), opts.filename ?? 'image.webp');
    for (const [k, v] of Object.entries(params)) form.set(k, String(v));
    form.set('api_key', c.apiKey);
    form.set('signature', IntegrationsService.sign(params, c.apiSecret));
    let res: Response;
    try { res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/${resource}/upload`, { method: 'POST', body: form }); }
    catch { throw new ServiceUnavailableException('Could not reach Cloudinary. Check the server’s internet connection and try again.'); }
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new BadRequestException(`Cloudinary rejected the upload: ${json?.error?.message ?? res.status}`);
    return { cloudName: c.cloudName, publicId: json.public_id as string, width: json.width as number, height: json.height as number, bytes: json.bytes as number };
  }

  /** Signed parameters so the browser can send a large video straight to Cloudinary (it never passes through our servers, so the web host's upload size limit does not apply). */
  async cloudinaryVideoSign(id: string) {
    const c = await this.cloudinary();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { allowed_formats: 'mp4,webm,mov', folder: c.folder, public_id: id, timestamp };
    return { uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/video/upload`, apiKey: c.apiKey, signature: IntegrationsService.sign(params, c.apiSecret), ...params };
  }
  async cloudinaryResource(publicId: string, resource: 'video' | 'image' = 'video') {
    const c = await this.cloudinary();
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/resources/${resource}/upload/${publicId.split('/').map(encodeURIComponent).join('/')}`, { headers: { authorization: `Basic ${Buffer.from(`${c.apiKey}:${c.apiSecret}`).toString('base64')}` } });
    if (!res.ok) return null;
    return { cloudName: c.cloudName, ...(await res.json() as any) };
  }

  async cloudinaryDestroy(publicId: string, resource: 'image' | 'raw' | 'video' = 'image') {
    const c = await this.cloudinary();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { public_id: publicId, timestamp, invalidate: 'true' };
    const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: c.apiKey, signature: IntegrationsService.sign(params, c.apiSecret) });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/${resource}/destroy`, { method: 'POST', body });
    if (!res.ok) throw new BadRequestException(`Cloudinary could not delete the file (${res.status})`);
  }

  async testCloudinary() {
    const c = await this.cloudinary();
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/usage`, {
      headers: { authorization: `Basic ${Buffer.from(`${c.apiKey}:${c.apiSecret}`).toString('base64')}` },
    });
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Cloudinary rejected these credentials. Check cloud name, API key and secret.' };
    if (!res.ok) return { ok: false, message: `Cloudinary responded ${res.status}` };
    return { ok: true, message: 'Connected to Cloudinary.' };
  }

  // ───────── Resend ─────────
  async resend() {
    const r = (await this.stored()).resend;
    if (!r.enabled || !r.apiKeyEnc || !r.fromEmail) return null;
    return { apiKey: decryptSecret(r.apiKeyEnc), from: r.fromName ? `${r.fromName.replace(/[<>"\r\n]/g, '')} <${r.fromEmail}>` : r.fromEmail, replyTo: r.replyTo };
  }

  // ───────── Google Cloud Translation (v2, API key) ─────────
  private async translateKey() {
    const enc = (await this.stored()).google.translateKeyEnc;
    if (!enc) throw new ServiceUnavailableException('Automatic translation is not set up. Add your Google Translate API key in Admin → Integrations.');
    return decryptSecret(enc);
  }

  // ───────── translation usage meter ─────────
  async quota() {
    const row = await this.db.siteSetting.findUnique({ where: { key: 'translate.quota' } });
    const q = (row?.value ?? {}) as any;
    return { monthlyLimit: Number(q.monthlyLimit) > 0 ? Number(q.monthlyLimit) : 500_000, pricePerMillion: Number(q.pricePerMillion) >= 0 && q.pricePerMillion !== undefined ? Number(q.pricePerMillion) : 20, blockAtLimit: q.blockAtLimit ?? false, freeChars: Number(q.freeChars) >= 0 && q.freeChars !== undefined ? Number(q.freeChars) : 500_000 };
  }
  async saveQuota(q: { monthlyLimit: number; pricePerMillion: number; freeChars: number; blockAtLimit: boolean }) {
    await this.db.siteSetting.upsert({ where: { key: 'translate.quota' }, update: { value: q }, create: { key: 'translate.quota', value: q } });
    return { ok: true };
  }
  private monthStart(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  private async charsSince(from: Date) {
    const a = await this.db.translateUsage.aggregate({ where: { createdAt: { gte: from }, ok: true }, _sum: { chars: true }, _count: true });
    return { chars: a._sum.chars ?? 0, requests: a._count };
  }
  async usage() {
    const q = await this.quota();
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(startDay.getTime() - 6 * 864e5);
    const [today, week, month, daily, history, last30] = await Promise.all([
      this.charsSince(startDay), this.charsSince(startWeek), this.charsSince(this.monthStart(now)),
      this.db.$queryRaw<{ day: string; chars: bigint; requests: bigint }[]>`SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, COALESCE(SUM(chars),0) AS chars, COUNT(*) AS requests FROM "TranslateUsage" WHERE ok = true AND "createdAt" >= ${new Date(startDay.getTime() - 29 * 864e5)} GROUP BY 1 ORDER BY 1`,
      this.db.translateUsage.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
      this.charsSince(new Date(startDay.getTime() - 29 * 864e5)),
    ]);
    const users = await this.db.user.findMany({ where: { id: { in: history.map((h) => h.userId).filter(Boolean) as string[] } }, select: { id: true, name: true } });
    const nm = new Map(users.map((u) => [u.id, u.name]));
    const billable = Math.max(0, month.chars - q.freeChars);
    return {
      quota: q, today, week, month: { ...month, pct: Math.min(100, Math.round((month.chars / q.monthlyLimit) * 1000) / 10), remaining: Math.max(0, q.monthlyLimit - month.chars), estimatedCost: Math.round((billable / 1_000_000) * q.pricePerMillion * 100) / 100 },
      last30,
      daily: daily.map((d) => ({ day: d.day, chars: Number(d.chars), requests: Number(d.requests) })),
      history: history.map((h) => ({ id: h.id, at: h.createdAt, chars: h.chars, texts: h.texts, ok: h.ok, error: h.error, user: h.userId ? nm.get(h.userId) ?? null : null })),
    };
  }
  private async alertQuota(monthChars: number) {
    const q = await this.quota();
    const pct = (monthChars / q.monthlyLimit) * 100;
    const ym = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    for (const t of [100, 90, 80]) {
      if (pct >= t) {
        await this.notes.notify({ type: 'translation', severity: t === 100 ? 'error' : 'warning', title: t === 100 ? 'Translation limit reached' : `Translation usage at ${t}%`, body: `${monthChars.toLocaleString()} of ${q.monthlyLimit.toLocaleString()} characters used this month.${t === 100 && q.blockAtLimit ? ' Automatic translation is paused until next month or until you raise the limit.' : ''}`, link: '/admin/translation', dedupeKey: `translate-quota-${t}-${ym}` });
        break;
      }
    }
  }

  async translate(texts: string[], source: 'en' | 'ar', target: 'en' | 'ar', userId?: string): Promise<string[]> {
    if (!texts.length) return [];
    const chars = texts.reduce((n, t) => n + t.length, 0);
    const key = await this.translateKey();
    const q = await this.quota();
    const used = (await this.charsSince(this.monthStart())).chars;
    if (q.blockAtLimit && used + chars > q.monthlyLimit) {
      await this.alertQuota(q.monthlyLimit);
      throw new BadRequestException(`Your monthly translation limit (${q.monthlyLimit.toLocaleString()} characters) is reached. Raise it in Admin → Translation usage, or type the Arabic by hand.`);
    }
    const fail = async (msg: string): Promise<never> => {
      await this.db.translateUsage.create({ data: { userId, chars, texts: texts.length, ok: false, error: msg.slice(0, 300) } }).catch(() => undefined);
      await this.notes.notify({ type: 'translation', severity: 'warning', title: 'Translation problem', body: msg, link: '/admin/translation', dedupeKey: `translate-fail-${new Date().toISOString().slice(0, 13)}` });
      throw new BadRequestException(msg);
    };
    let res: Response;
    try {
      res = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ q: texts, source, target, format: 'text' }),
      });
    } catch { return fail('Could not reach Google Translate. Check the server’s internet connection.'); }
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg: string = j?.error?.message ?? `HTTP ${res.status}`;
      if (res.status === 400 && /API key not valid/i.test(msg)) return fail('Google rejected the API key. Check that you copied it correctly.');
      if (res.status === 403) return fail('Google refused the request. Make sure the "Cloud Translation API" is enabled for this key\'s project and billing is active.');
      if (res.status === 429) return fail('Google says too many translations were requested. Wait a minute and try again.');
      return fail(`Google Translate error: ${msg}`);
    }
    const out: string[] = (j?.data?.translations ?? []).map((t: any) => String(t.translatedText ?? ''));
    if (out.length !== texts.length) return fail('Google returned an unexpected answer. Please try again.');
    await this.db.translateUsage.create({ data: { userId, chars, texts: texts.length, ok: true } });
    await this.alertQuota(used + chars);
    return out;
  }

  async testTranslate() {
    const [r] = await this.translate(['Welcome to our nursery'], 'en', 'ar');
    return { ok: true, message: `Connected. Test translation: ${r}` };
  }

  // ───────── brand logo for emails ─────────
  /** Email clients cannot show SVG or relative URLs, so only an https raster logo (Cloudinary is converted to PNG) is used. */
  async emailLogo(): Promise<string> {
    const row = await this.db.siteSetting.findUnique({ where: { key: 'public.branding' } });
    const url = String((row?.value as any)?.logoUrl ?? '');
    if (!url.startsWith('https://') || /\.svg(\?|$)/i.test(url)) return '';
    const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)f_auto,q_auto(?:,[^/]*)?\/(.+)$/);
    return m ? `${m[1]}f_png,q_auto,w_320/${m[2]}` : url;
  }
}

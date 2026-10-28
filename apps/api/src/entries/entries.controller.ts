import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit } from '../common/audit-context';
import { PrismaService, RevalidateService } from '../common/common.module';
import { AuthedRequest, Secured } from '../common/security';

const J = (v: unknown) => v as Prisma.InputJsonValue;
const BAD = /^\s*(javascript|data|vbscript):/i;
function safe(v: unknown): boolean {
  if (typeof v === 'string') return !BAD.test(v) && v.length <= 30000;
  if (Array.isArray(v)) return v.length <= 500 && v.every(safe);
  if (v && typeof v === 'object') return Object.values(v).every(safe);
  return true;
}
const i18n = z.record(z.string().max(30000)).refine((o) => Object.keys(o).every((k) => ['en', 'ar', 'arSrc'].includes(k)), 'Unknown language');
const i18nD = i18n.default({ en: '', ar: '' });
const rec = z.record(z.any()).refine(safe, 'Unsafe value');
const urlOk = z.string().max(600).regex(/^(https:\/\/\S+|\/[^\s/][^\s]*)?$/, 'Must be an https:// address or a /path');
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes').max(80);
const RESERVED = new Set(['admin', 'api', 'm', 'preview', 'gallery', 'en', 'ar', 'seed', 'sitemap', 'robots', 'llms']);
const KINDS = ['CATEGORY', 'GALLERY', 'DETAIL'] as const;

const saveSchema = z.object({
  kind: z.enum(KINDS),
  slug,
  group: z.union([slug, z.literal('')]).default(''),
  title: i18n.refine((o) => !!(o.en ?? '').trim(), 'An English title is required'),
  summary: i18nD, body: i18nD,
  cover: rec.nullable().default(null),
  items: z.array(z.object({ media: rec.default({}), caption: i18nD })).max(300).default([]),
  docs: z.array(z.object({ label: i18nD, url: urlOk, note: i18nD })).max(60).default([]),
  links: z.array(z.object({ label: i18nD, url: urlOk })).max(60).default([]),
  info: z.array(z.object({ label: i18nD, value: i18nD })).max(60).default([]),
  related: z.array(slug).max(12).default([]),
  // Detail pages only: the folder in the web address (/parents/uniform), the designed blocks and the banner look.
  path: slug.refine((v) => !RESERVED.has(v), 'This folder name is used by the website itself. Choose another.').default('info'),
  blocks: z.array(z.object({ type: z.string().regex(/^[a-z0-9-]{1,40}$/), config: rec.default({}), isVisible: z.boolean().default(true) })).max(80).default([]),
  design: rec.default({}),
  seo: z.object({ metaTitle: i18nD, metaDescription: i18nD, ogImageUrl: urlOk.default(''), noindex: z.boolean().default(false) }).default({}),
  isVisible: z.boolean().default(true),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishAt: z.string().datetime({ offset: true }).nullable().default(null),
});
const idSchema = z.string().cuid();
const kindQ = z.enum(KINDS);

const livePublic = (): Prisma.EntryWhereInput => ({ deletedAt: null, isVisible: true, status: 'PUBLISHED', OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] });

@Injectable()
export class EntriesService {
  constructor(private db: PrismaService, private rev: RevalidateService) {}

  private card(e: any) {
    const items = Array.isArray(e.items) ? e.items : [];
    const first = items.find((x: any) => x?.media?.url || x?.media?.videoUrl);
    return { id: e.id, kind: e.kind, slug: e.slug, group: e.group, path: e.path, title: e.title, summary: e.summary, cover: e.cover?.url || e.cover?.videoUrl ? e.cover : first?.media ?? null, count: items.length, videos: items.filter((x: any) => x?.media?.videoUrl).length };
  }

  // ───────── public ─────────
  async publicList(kind: (typeof KINDS)[number], group?: string, limit = 60) {
    const rows = await this.db.entry.findMany({ where: { ...livePublic(), kind, ...(group ? { group } : {}) }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: Math.min(limit, 200) });
    return rows.map((e) => this.card(e));
  }
  async publicOne(kind: (typeof KINDS)[number], s: string) {
    const e = await this.db.entry.findFirst({ where: { ...livePublic(), kind, slug: s } });
    if (!e) throw new NotFoundException();
    const rel = Array.isArray(e.related) ? (e.related as string[]) : [];
    let related = rel.length ? await this.db.entry.findMany({ where: { ...livePublic(), kind, slug: { in: rel, not: e.slug } } }) : [];
    if (!related.length && e.group) related = await this.db.entry.findMany({ where: { ...livePublic(), kind, group: e.group, slug: { not: e.slug } }, orderBy: [{ sortOrder: 'asc' }], take: 6 });
    const category = kind === 'GALLERY' && e.group ? await this.db.entry.findFirst({ where: { ...livePublic(), kind: 'CATEGORY', slug: e.group } }) : null;
    return { entry: this.full(e), related: related.map((r) => this.card(r)), category: category ? this.card(category) : null };
  }
  private full(e: any) { return { id: e.id, kind: e.kind, slug: e.slug, group: e.group, path: e.path, design: e.design ?? {}, blocks: (Array.isArray(e.blocks) ? e.blocks : []).filter((b: any) => b && b.isVisible !== false), title: e.title, summary: e.summary, body: e.body, cover: e.cover, items: e.items, docs: e.docs, links: e.links, info: e.info, seo: e.seo, updatedAt: e.updatedAt }; }
  async publicSitemap() {
    const rows = await this.db.entry.findMany({ where: { ...livePublic(), kind: { in: ['GALLERY', 'DETAIL', 'CATEGORY'] } }, select: { kind: true, slug: true, path: true, updatedAt: true, seo: true } });
    return rows.filter((r) => !(r.seo as any)?.noindex).map((r) => ({ kind: r.kind, slug: r.slug, path: r.path, lastmod: r.updatedAt }));
  }

  // ───────── admin ─────────
  async list(kind: (typeof KINDS)[number]) {
    const rows = await this.db.entry.findMany({ where: { kind, deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return rows.map((e) => ({ ...this.card(e), isVisible: e.isVisible, status: e.status, publishAt: e.publishAt, updatedAt: e.updatedAt, live: e.isVisible && e.status === 'PUBLISHED' && (!e.publishAt || e.publishAt <= new Date()) }));
  }
  async get(id: string) {
    const e = await this.db.entry.findFirst({ where: { id, deletedAt: null } });
    if (!e) throw new NotFoundException();
    return { ...e };
  }
  private canPublish(req: AuthedRequest) { const u = req.user; return !!u && (u.roles.includes('SUPER_ADMIN') || u.perms.includes('entry:publish')); }

  async create(d: z.infer<typeof saveSchema>, req: AuthedRequest) {
    if (await this.db.entry.findFirst({ where: { kind: d.kind, slug: d.slug, deletedAt: null } })) throw new ConflictException('Another one already uses this web address. Choose a different one.');
    await this.db.entry.deleteMany({ where: { kind: d.kind, slug: d.slug, deletedAt: { not: null } } }); // free the slug of a deleted item
    const max = await this.db.entry.aggregate({ where: { kind: d.kind }, _max: { sortOrder: true } });
    const can = this.canPublish(req);
    const e = await this.db.entry.create({ data: { ...this.data(d, can ? d.status : 'DRAFT', can ? d.publishAt : null), sortOrder: (max._max.sortOrder ?? 0) + 1 } });
    audit({ label: `${d.kind.toLowerCase()} “${(d.title as any).en}” created`, entity: 'entry', entityId: e.id, after: { slug: d.slug } });
    await this.rev.run(['content']);
    return { id: e.id };
  }
  private data(d: z.infer<typeof saveSchema>, status: 'DRAFT' | 'PUBLISHED', publishAt: string | null) {
    return {
      kind: d.kind, slug: d.slug, group: d.kind === 'GALLERY' ? d.group : d.group, title: J(d.title), summary: J(d.summary), body: J(d.body), cover: d.cover ? J(d.cover) : Prisma.JsonNull,
      items: J(d.items), docs: J(d.docs), links: J(d.links), info: J(d.info), related: J(d.related), path: d.kind === 'DETAIL' ? d.path : 'info', blocks: J(d.kind === 'DETAIL' ? d.blocks : []), design: J(d.design), seo: J(d.seo), isVisible: d.isVisible,
      status: status as any, publishAt: publishAt ? new Date(publishAt) : null,
    };
  }
  async update(id: string, d: z.infer<typeof saveSchema>, req: AuthedRequest) {
    const cur = await this.db.entry.findFirst({ where: { id, deletedAt: null } });
    if (!cur) throw new NotFoundException();
    if (cur.kind !== d.kind) throw new BadRequestException('The type of an item cannot be changed.');
    if (d.slug !== cur.slug && (await this.db.entry.findFirst({ where: { kind: d.kind, slug: d.slug, deletedAt: null, NOT: { id } } }))) throw new ConflictException('Another one already uses this web address. Choose a different one.');
    const can = this.canPublish(req);
    // People who may edit but not publish cannot change when or whether something goes live.
    const status = can ? d.status : (cur.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    const publishAt = can ? d.publishAt : cur.publishAt?.toISOString() ?? null;
    if (!can) d = { ...d, isVisible: cur.isVisible }; // showing or hiding is a publishing decision too
    audit({ label: `${d.kind.toLowerCase()} “${(d.title as any).en}” edited`, entity: 'entry', entityId: id, before: { title: cur.title, slug: cur.slug, status: cur.status, isVisible: cur.isVisible }, after: { title: d.title, slug: d.slug, status, isVisible: d.isVisible } });
    if (d.slug !== cur.slug && cur.kind === 'CATEGORY') await this.db.entry.updateMany({ where: { kind: 'GALLERY', group: cur.slug }, data: { group: d.slug } });
    await this.db.entry.update({ where: { id }, data: this.data(d, status as any, publishAt) });
    await this.rev.run(['content']);
    return { ok: true };
  }
  async setVisible(id: string, isVisible: boolean) {
    const e = await this.db.entry.update({ where: { id }, data: { isVisible } }).catch(() => { throw new NotFoundException(); });
    audit({ label: `${(e.title as any).en}: ${isVisible ? 'shown' : 'hidden'}`, entity: 'entry', entityId: id });
    await this.rev.run(['content']);
    return { ok: true };
  }
  async setPublished(id: string, publish: boolean) {
    const e = await this.db.entry.update({ where: { id }, data: { status: publish ? 'PUBLISHED' : 'DRAFT', ...(publish ? {} : { publishAt: null }) } }).catch(() => { throw new NotFoundException(); });
    audit({ label: `${(e.title as any).en}: ${publish ? 'published' : 'unpublished'}`, entity: 'entry', entityId: id, action: 'publish' });
    await this.rev.run(['content']);
    return { ok: true };
  }
  async reorder(kind: (typeof KINDS)[number], ids: string[]) {
    await this.db.$transaction(ids.map((id, n) => this.db.entry.updateMany({ where: { id, kind }, data: { sortOrder: n } })));
    audit({ label: `${kind.toLowerCase()} order changed`, entity: 'entry' });
    await this.rev.run(['content']);
    return { ok: true };
  }
  async duplicate(id: string) {
    const e = await this.db.entry.findFirst({ where: { id, deletedAt: null } });
    if (!e) throw new NotFoundException();
    let n = 2, s = `${e.slug}-copy`;
    while (await this.db.entry.findFirst({ where: { kind: e.kind, slug: s } })) s = `${e.slug}-copy-${n++}`;
    const t = e.title as any;
    const max = await this.db.entry.aggregate({ where: { kind: e.kind }, _max: { sortOrder: true } });
    const c = await this.db.entry.create({ data: { kind: e.kind, slug: s, group: e.group, title: J({ ...t, en: `${t.en} (copy)`, ar: t.ar ? `${t.ar} (نسخة)` : '' }), summary: J(e.summary), body: J(e.body), cover: e.cover ? J(e.cover) : Prisma.JsonNull, items: J(e.items), docs: J(e.docs), links: J(e.links), info: J(e.info), related: J(e.related), path: e.path, blocks: J(e.blocks), design: J(e.design), seo: J(e.seo), isVisible: false, status: 'DRAFT', sortOrder: (max._max.sortOrder ?? 0) + 1 } });
    audit({ label: `${e.kind.toLowerCase()} “${t.en}” duplicated`, entity: 'entry', entityId: c.id });
    return { id: c.id };
  }
  async remove(id: string) {
    const e = await this.db.entry.findFirst({ where: { id, deletedAt: null } });
    if (!e) throw new NotFoundException();
    if (e.kind === 'CATEGORY') { const n = await this.db.entry.count({ where: { kind: 'GALLERY', group: e.slug, deletedAt: null } }); if (n) throw new ConflictException(`${n} galleries still use this category. Move or delete them first.`); }
    await this.db.entry.update({ where: { id }, data: { deletedAt: new Date(), isVisible: false, slug: `${e.slug}~${Date.now().toString(36)}` } });
    audit({ label: `${e.kind.toLowerCase()} “${(e.title as any).en}” deleted`, entity: 'entry', entityId: id });
    await this.rev.run(['content']);
    return { ok: true };
  }
}

@Controller('public')
@Throttle({ default: { limit: 600, ttl: 60_000 } })
export class PublicEntriesController {
  constructor(private s: EntriesService) {}
  @Get('entries') list(@Query('kind') kind = 'GALLERY', @Query('group') group = '', @Query('limit') limit = '60') {
    return this.s.publicList(kindQ.parse(String(kind).toUpperCase()), slug.or(z.literal('')).parse(group), Math.max(1, Math.min(200, Number(limit) || 60)));
  }
  @Get('entry') one(@Query('kind') kind: string, @Query('slug') s: string) { return this.s.publicOne(kindQ.parse(String(kind).toUpperCase()), slug.parse(s)); }
  @Get('entries/sitemap') sitemap() { return this.s.publicSitemap(); }
}

@Controller('admin/entries')
export class AdminEntriesController {
  constructor(private s: EntriesService) {}
  @Get() @Secured('entry:read') list(@Query('kind') kind = 'GALLERY') { return this.s.list(kindQ.parse(String(kind).toUpperCase())); }
  @Get(':id') @Secured('entry:read') get(@Param('id') id: string) { return this.s.get(idSchema.parse(id)); }
  @Post() @HttpCode(201) @Secured('entry:create') create(@Body() b: unknown, @Req() req: AuthedRequest) { return this.s.create(saveSchema.parse(b), req); }
  @Put('reorder') @Secured('entry:update') reorder(@Body() b: unknown) { const d = z.object({ kind: z.enum(KINDS), ids: z.array(idSchema).max(500) }).parse(b); return this.s.reorder(d.kind, d.ids); }
  @Put(':id') @Secured('entry:update') update(@Param('id') id: string, @Body() b: unknown, @Req() req: AuthedRequest) { return this.s.update(idSchema.parse(id), saveSchema.parse(b), req); }
  @Put(':id/visible') @Secured('entry:publish') visible(@Param('id') id: string, @Body() b: unknown) { return this.s.setVisible(idSchema.parse(id), z.object({ isVisible: z.boolean() }).parse(b).isVisible); }
  @Post(':id/publish') @HttpCode(200) @Secured('entry:publish') publish(@Param('id') id: string) { return this.s.setPublished(idSchema.parse(id), true); }
  @Post(':id/unpublish') @HttpCode(200) @Secured('entry:publish') unpublish(@Param('id') id: string) { return this.s.setPublished(idSchema.parse(id), false); }
  @Post(':id/duplicate') @HttpCode(201) @Secured('entry:create') duplicate(@Param('id') id: string) { return this.s.duplicate(idSchema.parse(id)); }
  @Delete(':id') @Secured('entry:delete') remove(@Param('id') id: string) { return this.s.remove(idSchema.parse(id)); }
}

@Module({ controllers: [PublicEntriesController, AdminEntriesController], providers: [EntriesService], exports: [EntriesService] })
export class EntriesModule {}

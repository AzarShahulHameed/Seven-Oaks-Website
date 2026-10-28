import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { settingValidators } from './schemas';
import { MenuLocation, Prisma } from '@prisma/client';
import { PrismaService, RevalidateService } from '../common/common.module';
import { config } from '../config';
import { MediaService } from '../media/media.service';
import { audit } from '../common/audit-context';
import { NotificationsService } from '../common/notifications.service';

const J = (v: unknown) => v as Prisma.InputJsonValue;
type Seo = { slug: Record<string, string>; metaTitle?: any; metaDescription?: any; keywords?: any; noindex: boolean; canonical?: string | null; ogImageUrl?: string | null; jsonLd?: any };
const pathOf = (loc: string, slug: string) => `/${loc}${slug ? '/' + slug : ''}`;
const normPath = (p: string) => (p.trim().replace(/\/+$/, '') || '/');
type Snapshot = { title: any; seo: Seo; sections: { type: string; config: any; sortOrder: number; isVisible: boolean }[] };

@Injectable()
export class ContentService {
  constructor(private db: PrismaService, private rev: RevalidateService, private media: MediaService, private notes: NotificationsService) {}

  // ───────── public (read-only, published data only) ─────────
  async bootstrap() {
    const [theme, settings, menus] = await Promise.all([
      this.db.themeSetting.findFirst({ where: { isActive: true } }),
      this.db.siteSetting.findMany({ where: { key: { startsWith: 'public.' } } }),
      this.db.menu.findMany({ include: { items: { orderBy: { sortOrder: 'asc' } } } }),
    ]);
    return {
      theme: theme?.tokens ?? {},
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      menus: Object.fromEntries(menus.map((m) => [m.location, this.tree(m.items, true)])),
    };
  }

  private async published() {
    const rows = await this.db.pageVersion.findMany({
      where: { page: { status: 'PUBLISHED', deletedAt: null } },
      orderBy: [{ pageId: 'asc' }, { version: 'desc' }], distinct: ['pageId'], include: { page: { select: { key: true } } },
    });
    return rows.map((r) => ({ key: r.page.key, lastmod: r.createdAt, ...(r.snapshot as unknown as Snapshot) }));
  }

  async resolvePage(locale: string, slug: string) {
    const all = await this.published();
    const norm = slug.replace(/^\/+|\/+$/g, '');
    const hit = all.find((p) => (p.seo.slug[locale] ?? p.seo.slug.en ?? '') === norm);
    if (!hit) throw new NotFoundException();
    return {
      key: hit.key, title: hit.title, seo: hit.seo,
      alternates: hit.seo.slug,
      sections: hit.sections.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder).map((s, n) => ({ id: `${hit.key}-${n}`, type: s.type, config: s.config })),
    };
  }

  async sitemap() {
    return (await this.published()).filter((p) => !p.seo.noindex).map((p) => ({ key: p.key, slugs: p.seo.slug, lastmod: p.lastmod }));
  }

  // ───────── admin: theme & settings ─────────
  async getTheme() {
    return (await this.db.themeSetting.findFirst({ where: { isActive: true } }))?.tokens ?? {};
  }
  async setTheme(tokens: unknown) {
    const cur = await this.db.themeSetting.findFirst({ where: { isActive: true } });
    audit({ label: 'Colours and fonts', before: cur?.tokens ?? null, after: tokens });
    if (cur) await this.db.themeSetting.update({ where: { id: cur.id }, data: { tokens: J(tokens) } });
    else await this.db.themeSetting.create({ data: { isActive: true, draft: false, tokens: J(tokens) } });
    await this.rev.run(['bootstrap']);
    return { ok: true };
  }
  listSettings() {
    return this.db.siteSetting.findMany({ where: { NOT: { key: { startsWith: 'secret.' } } }, orderBy: { key: 'asc' } });
  }
  async setSetting(key: string, value: unknown) {
    if (!/^[a-z0-9._-]{1,80}$/.test(key) || key.startsWith('secret.')) throw new BadRequestException('Invalid key');
    const v = settingValidators[key];
    if (v) value = v.parse(value);
    const prev = await this.db.siteSetting.findUnique({ where: { key } });
    audit({ label: `Setting “${key}”`, entity: 'admin/settings', entityId: key, before: prev?.value ?? null, after: value });
    await this.db.siteSetting.upsert({ where: { key }, update: { value: J(value) }, create: { key, value: J(value) } });
    await this.rev.run(['bootstrap']);
    return { ok: true };
  }

  async siteLink() {
    const r = await this.rev.ping([]);
    return { ok: r.ok, reason: r.reason ?? null, webUrl: config.WEB_URL };
  }
  async siteRefresh() {
    const r = await this.rev.run(['bootstrap', 'content']);
    return { ok: r.ok, reason: r.reason ?? null };
  }

  // ───────── admin: menus ─────────
  private tree(items: any[], onlyVisible: boolean): any[] {
    const build = (parentId: string | null): any[] =>
      items
        .filter((i) => i.parentId === parentId && (!onlyVisible || i.isVisible))
        .map((i) => ({ label: i.label, href: i.externalUrl ?? '', isButton: i.isButton, isVisible: i.isVisible, children: build(i.id) }));
    return build(null);
  }
  async getMenu(location: MenuLocation) {
    const m = await this.db.menu.findUnique({ where: { location }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
    return { items: m ? this.tree(m.items, false) : [] };
  }
  async setMenu(location: MenuLocation, items: any[]) {
    await this.db.$transaction(async (tx) => {
      const menu = await tx.menu.upsert({ where: { location }, update: {}, create: { location } });
      await tx.menuItem.deleteMany({ where: { menuId: menu.id, parentId: { not: null } } });
      await tx.menuItem.deleteMany({ where: { menuId: menu.id } });
      const add = async (list: any[], parentId: string | null) => {
        for (const [n, it] of list.entries()) {
          const row = await tx.menuItem.create({
            data: { menuId: menu.id, parentId, label: J(it.label), externalUrl: it.href, isButton: it.isButton, isVisible: it.isVisible, sortOrder: n },
          });
          if (it.children?.length) await add(it.children, row.id);
        }
      };
      await add(items, null);
    });
    await this.rev.run(['bootstrap']);
    return { ok: true };
  }

  // ───────── admin: pages (draft rows → published snapshots) ─────────
  async listPages() {
    const pages = await this.db.page.findMany({ where: { deletedAt: null }, orderBy: { key: 'asc' }, include: { versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 } } });
    return pages.map((p) => ({ key: p.key, title: p.title, status: p.status, updatedAt: p.updatedAt, latestVersion: p.versions[0]?.version ?? 0 }));
  }

  async getPage(key: string) {
    const p = await this.db.page.findFirst({
      where: { key, deletedAt: null },
      include: { seo: true, sections: { orderBy: { sortOrder: 'asc' } }, versions: { select: { version: true, createdAt: true, note: true }, orderBy: { version: 'desc' }, take: 30 } },
    });
    if (!p) throw new NotFoundException();
    return {
      key: p.key, title: p.title, status: p.status,
      seo: {
        slug: p.seo?.slug ?? {}, metaTitle: p.seo?.metaTitle ?? { en: '', ar: '' }, metaDescription: p.seo?.metaDescription ?? { en: '', ar: '' }, keywords: (p.seo as any)?.keywords ?? { en: '', ar: '' }, noindex: p.seo?.noindex ?? false,
        canonical: p.seo?.canonical ?? '', ogImageUrl: p.seo?.ogImageUrl ?? '', jsonLd: p.seo?.jsonLd ?? null,
      },
      sections: p.sections.map((s) => ({ type: s.type, config: s.config, isVisible: s.isVisible })),
      versions: p.versions,
    };
  }

  async createPage(key: string, title: any) {
    if (await this.db.page.findUnique({ where: { key } })) throw new BadRequestException('Key already exists');
    await this.db.page.create({ data: { key, title: J(title), status: 'DRAFT', seo: { create: { slug: J({ en: key, ar: key }), metaTitle: J(title), metaDescription: J({ en: '', ar: '' }) } } } });
    return { ok: true };
  }

  private async replaceDraft(pageId: string, d: Snapshot) {
    await this.db.$transaction([
      this.db.page.update({ where: { id: pageId }, data: { title: J(d.title) } }),
      this.db.seoMeta.upsert({
        where: { pageId },
        update: { slug: J(d.seo.slug), metaTitle: J(d.seo.metaTitle ?? {}), metaDescription: J(d.seo.metaDescription ?? {}), keywords: J(d.seo.keywords ?? {}), noindex: d.seo.noindex, canonical: d.seo.canonical || null, ogImageUrl: d.seo.ogImageUrl || null, jsonLd: d.seo.jsonLd ? J(d.seo.jsonLd) : Prisma.DbNull },
        create: { pageId, slug: J(d.seo.slug), metaTitle: J(d.seo.metaTitle ?? {}), metaDescription: J(d.seo.metaDescription ?? {}), keywords: J(d.seo.keywords ?? {}), noindex: d.seo.noindex, canonical: d.seo.canonical || null, ogImageUrl: d.seo.ogImageUrl || null, jsonLd: d.seo.jsonLd ? J(d.seo.jsonLd) : Prisma.DbNull },
      }),
      this.db.section.deleteMany({ where: { pageId } }),
      this.db.section.createMany({ data: d.sections.map((s, n) => ({ pageId, type: s.type, config: J(s.config), sortOrder: n, isVisible: s.isVisible })) }),
    ]);
  }

  async savePage(key: string, dto: { title: any; seo: Seo; sections: any[] }) {
    const p = await this.db.page.findFirst({ where: { key, deletedAt: null } });
    if (!p) throw new NotFoundException();
    // Two pages may not share the same slug in the same locale.
    const others = await this.published();
    for (const [loc, s] of Object.entries(dto.seo.slug))
      if (others.some((o) => o.key !== key && (o.seo.slug[loc] ?? '') === s)) throw new BadRequestException(`Slug "${s}" (${loc}) is already used by another page`);
    const before = await this.getPage(key);
    audit({ label: `Page “${(before.title as any)?.en ?? key}”`, entity: 'admin/pages', entityId: key, before: { title: before.title, seo: before.seo, sections: before.sections }, after: { title: dto.title, seo: { ...before.seo, ...dto.seo }, sections: dto.sections } });
    await this.replaceDraft(p.id, dto as Snapshot);
    return { ok: true };
  }

  async publish(key: string, userId: string) {
    const p = await this.db.page.findFirst({ where: { key, deletedAt: null }, include: { seo: true, sections: { orderBy: { sortOrder: 'asc' } } } });
    if (!p) throw new NotFoundException();
    const last = await this.db.pageVersion.aggregate({ where: { pageId: p.id }, _max: { version: true } });
    const version = (last._max.version ?? 0) + 1;
    const snapshot: Snapshot = {
      title: p.title,
      seo: {
        slug: (p.seo?.slug as any) ?? {}, metaTitle: p.seo?.metaTitle, metaDescription: p.seo?.metaDescription, keywords: (p.seo as any)?.keywords, noindex: p.seo?.noindex ?? false,
        canonical: p.seo?.canonical ?? null, ogImageUrl: p.seo?.ogImageUrl ?? null, jsonLd: p.seo?.jsonLd ?? null,
      },
      sections: p.sections.map((s) => ({ type: s.type, config: s.config, sortOrder: s.sortOrder, isVisible: s.isVisible })),
    };
    await this.media.assertPublishable(snapshot); // blocks photos of children without recorded consent
    // If a published URL changed, keep old links and search rankings alive with automatic 301s.
    const prev = await this.db.pageVersion.findFirst({ where: { pageId: p.id }, orderBy: { version: 'desc' } });
    const moves: { from: string; to: string }[] = [];
    if (prev) {
      const old = ((prev.snapshot as any)?.seo?.slug ?? {}) as Record<string, string>;
      for (const loc of ['en', 'ar']) {
        const a = old[loc] ?? old.en ?? '';
        const b = snapshot.seo.slug[loc] ?? snapshot.seo.slug.en ?? '';
        if (a !== b && a !== '') moves.push({ from: pathOf(loc, a), to: pathOf(loc, b) });
      }
    }
    const redirectOps = moves.flatMap((m) => [
      this.db.redirect.deleteMany({ where: { fromPath: m.to } }), // the page lives here now
      this.db.redirect.updateMany({ where: { toPath: m.from }, data: { toPath: m.to } }), // collapse chains
      this.db.redirect.upsert({ where: { fromPath: m.from }, update: { toPath: m.to, statusCode: 301, isActive: true }, create: { fromPath: m.from, toPath: m.to, statusCode: 301 } }),
    ]);
    await this.db.$transaction([
      this.db.pageVersion.create({ data: { pageId: p.id, version, snapshot: J(snapshot), createdBy: userId } }),
      this.db.page.update({ where: { id: p.id }, data: { status: 'PUBLISHED' } }),
      ...redirectOps,
    ]);
    await this.rev.run();
    audit({ label: `Page “${(p.title as any)?.en ?? key}” (version ${version})`, entity: 'admin/pages', entityId: key });
    void this.notes.notify({ type: 'content', severity: 'success', title: `Page published: ${(p.title as any)?.en ?? key}`, body: `Version ${version} is now live.`, link: `/admin/pages/${key}` });
    return { version };
  }

  /** Takes a page off the website without deleting it. Publishing again puts it back. */
  async unpublish(key: string) {
    const p = await this.db.page.findFirst({ where: { key, deletedAt: null } });
    if (!p) throw new NotFoundException();
    if (p.isSystem && key === 'home') throw new BadRequestException('The home page cannot be taken offline.');
    await this.db.page.update({ where: { id: p.id }, data: { status: 'ARCHIVED' } });
    await this.rev.run();
    audit({ label: `Page “${(p.title as any)?.en ?? key}” taken offline`, entity: 'admin/pages', entityId: key });
    return { ok: true };
  }

  // ───────── SEO: overview + redirects ─────────
  async seoOverview() {
    const pages = await this.db.page.findMany({ where: { deletedAt: null }, orderBy: { key: 'asc' }, include: { seo: true } });
    return pages.map((p) => ({
      key: p.key, title: p.title, status: p.status, slug: p.seo?.slug ?? {}, metaTitle: p.seo?.metaTitle ?? {},
      metaDescription: p.seo?.metaDescription ?? {}, noindex: p.seo?.noindex ?? false, hasOgImage: !!p.seo?.ogImageUrl, keywords: (p.seo as any)?.keywords ?? {},
    }));
  }

  listRedirects() {
    return this.db.redirect.findMany({ orderBy: { fromPath: 'asc' }, take: 500 });
  }

  async saveRedirect(id: string | null, d: { fromPath: string; toPath: string; statusCode: number; isActive: boolean }) {
    const from = normPath(d.fromPath);
    const to = d.toPath.startsWith('/') ? normPath(d.toPath) : d.toPath;
    if (from === to) throw new BadRequestException('Source and target are the same');
    const back = await this.db.redirect.findFirst({ where: { fromPath: to, toPath: from, isActive: true } });
    if (back) throw new BadRequestException('This would create a redirect loop');
    const clash = await this.db.redirect.findUnique({ where: { fromPath: from } });
    if (clash && clash.id !== id) throw new BadRequestException('A redirect from this path already exists');
    const data = { fromPath: from, toPath: to, statusCode: d.statusCode, isActive: d.isActive };
    if (id) {
      if (!(await this.db.redirect.findUnique({ where: { id } }))) throw new NotFoundException();
      await this.db.redirect.update({ where: { id }, data });
    } else await this.db.redirect.create({ data });
    await this.rev.run(['content']);
    return { ok: true };
  }

  async deleteRedirect(id: string) {
    await this.db.redirect.deleteMany({ where: { id } });
    await this.rev.run(['content']);
    return { ok: true };
  }

  /** Public: used by the website when a URL has no page. */
  async lookupRedirect(path: string) {
    const r = await this.db.redirect.findFirst({ where: { fromPath: normPath(path), isActive: true } });
    if (!r) throw new NotFoundException();
    return { to: r.toPath, status: r.statusCode };
  }

  /** Restores an old version into the draft; the editor reviews it and publishes again. */
  async restore(key: string, version: number) {
    const p = await this.db.page.findFirst({ where: { key, deletedAt: null } });
    if (!p) throw new NotFoundException();
    const v = await this.db.pageVersion.findUnique({ where: { pageId_version: { pageId: p.id, version } } });
    if (!v) throw new NotFoundException();
    await this.replaceDraft(p.id, v.snapshot as unknown as Snapshot);
    return { ok: true };
  }
}

// Idempotent seed: creates only what is missing, never overwrites content edited in the admin dashboard.
import dotenv from 'dotenv';
import { resolve } from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { theme, settings, menus, homeSections, homeSeo, permissions, roles, i, withPhotos } from './content';
import { pages, keywords, ephatha } from './content-pages';
import { entrySeeds, toEntryData, detailEntries, toDetailData } from './content-entries';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });
const db = new PrismaClient();
const J = (v: unknown) => v as Prisma.InputJsonValue;
// `npm run db:seed -- --reset-content --yes-overwrite` replaces ALL page/menu/setting/theme content with the starter content (discards your edits).
const RESET = process.argv.includes('--reset-content');
// `npm run db:seed -- --update` is the SAFE way to receive new starter content: it never touches pages, staff, map, menus, settings or detail pages you have edited (see safeUpdate()).
const UPDATE = process.argv.includes('--update') && !RESET;
if (RESET && !process.argv.includes('--yes-overwrite')) { console.error('--reset-content overwrites every page, menu, setting and the theme with the starter content.\nAdd --yes-overwrite to confirm.'); process.exit(1); }

async function createPage(key: string, title: object, seoIn: any, sections: { type: string; config: object }[], isSystem = false) {
  const kw = keywords[key];
  const seo = { ...seoIn, keywords: kw ? i(kw[0], kw[1]) : i('', '') };
  const existing = await db.page.findUnique({ where: { key }, include: { versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 } } });
  if (existing && !RESET) return console.log(`page ${key}: exists, skipped`);
  const snapshot = { title, seo, sections: sections.map((s, n) => ({ ...s, sortOrder: n, isVisible: true })) };
  const seoData = { slug: J(seo.slug), metaTitle: J(seo.metaTitle), metaDescription: J(seo.metaDescription), keywords: J(seo.keywords), noindex: !!seo.noindex };
  if (existing) {
    await db.$transaction([
      db.page.update({ where: { id: existing.id }, data: { title: J(title), status: 'PUBLISHED', deletedAt: null } }),
      db.seoMeta.upsert({ where: { pageId: existing.id }, update: seoData, create: { pageId: existing.id, ...seoData } }),
      db.section.deleteMany({ where: { pageId: existing.id } }),
      db.section.createMany({ data: sections.map((s, n) => ({ pageId: existing.id, type: s.type, config: J(s.config), sortOrder: n, isVisible: true })) }),
      db.pageVersion.create({ data: { pageId: existing.id, version: (existing.versions[0]?.version ?? 0) + 1, note: 'Starter content reset', snapshot: J(snapshot) } }),
    ]);
    return console.log(`page ${key}: reset to starter content`);
  }
  const page = await db.page.create({
    data: {
      key, title: J(title), status: 'PUBLISHED', isSystem,
      seo: { create: seoData },
      sections: { create: sections.map((s, n) => ({ type: s.type, config: J(s.config), sortOrder: n, isVisible: true })) },
    },
  });
  await db.pageVersion.create({ data: { pageId: page.id, version: 1, note: 'Initial seed', snapshot: J(snapshot) } });
  console.log(`page ${key}: created`);
}

/** Brings pages you already have up to date WITHOUT overwriting your edits: only adds a missing block or fixes an untouched default. */
async function patchPage(key: string, note: string, fn: (secs: { id: string; type: string; config: any; sortOrder: number }[], api: { insertAt: (idx: number, type: string, config: object) => Promise<void>; update: (id: string, config: object) => Promise<void>; remove: (id: string) => Promise<void> }) => Promise<boolean>) {
  const page = await db.page.findUnique({ where: { key }, include: { sections: { orderBy: { sortOrder: 'asc' } }, versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 }, seo: true } });
  if (!page) return;
  let changed = false;
  const api = {
    insertAt: async (idx: number, type: string, config: object) => { await db.section.updateMany({ where: { pageId: page.id, sortOrder: { gte: idx } }, data: { sortOrder: { increment: 1 } } }); await db.section.create({ data: { pageId: page.id, type, config: J(config), sortOrder: idx, isVisible: true } }); changed = true; },
    update: async (id: string, config: object) => { await db.section.update({ where: { id }, data: { config: J(config) } }); changed = true; },
    remove: async (id: string) => { await db.section.delete({ where: { id } }); changed = true; },
  };
  await fn(page.sections.map((x) => ({ id: x.id, type: x.type, config: x.config as any, sortOrder: x.sortOrder })), api);
  if (!changed) return;
  const fresh = await db.section.findMany({ where: { pageId: page.id }, orderBy: { sortOrder: 'asc' } });
  await db.pageVersion.create({ data: { pageId: page.id, version: (page.versions[0]?.version ?? 0) + 1, note, snapshot: J({ title: page.title, seo: page.seo, sections: fresh.map((x, n) => ({ type: x.type, config: x.config, sortOrder: n, isVisible: x.isVisible })) }) } });
  console.log(`page ${key}: ${note}`);
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL, password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 12 chars)');

  for (const [resource, action] of permissions)
    await db.permission.upsert({ where: { resource_action: { resource, action } }, update: {}, create: { resource, action } });
  const allPerms = await db.permission.findMany();
  for (const r of roles) {
    const role = await db.role.upsert({ where: { key: r.key }, update: {}, create: { key: r.key, name: J(r.name) } });
    const wanted = r.perms === 'ALL' ? allPerms : allPerms.filter((p) => r.perms.includes(`${p.resource}:${p.action}`));
    // Roles only ever GAIN missing permissions; permissions you removed or changed are kept (reset mode restores the defaults).
    if (RESET) await db.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { notIn: wanted.map((p) => p.id) } } });
    await db.rolePermission.createMany({ data: wanted.map((p) => ({ roleId: role.id, permissionId: p.id })), skipDuplicates: true });
  }

  if (!(await db.user.findUnique({ where: { email: email.toLowerCase() } }))) {
    const sa = await db.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
    await db.user.create({
      data: { email: email.toLowerCase(), name: process.env.SEED_ADMIN_NAME ?? 'Administrator', passwordHash: await argon2.hash(password, { type: argon2.argon2id }), roles: { create: { roleId: sa.id } } },
    });
    console.log('super admin created');
  }

  const activeTheme = await db.themeSetting.findFirst({ where: { isActive: true } });
  if (!activeTheme) await db.themeSetting.create({ data: { isActive: true, draft: false, tokens: J(theme) } });
  else if (RESET) await db.themeSetting.update({ where: { id: activeTheme.id }, data: { tokens: J(theme) } });

  for (const [key, value] of Object.entries(settings))
    await db.siteSetting.upsert({ where: { key }, update: RESET ? { value: J(value) } : {}, create: { key, value: J(value) } });

  for (const [loc, items] of Object.entries(menus)) {
    const location = loc as 'HEADER' | 'FOOTER' | 'QUICK_LINKS';
    const menu = await db.menu.upsert({ where: { location }, update: {}, create: { location } });
    if (RESET) await db.menuItem.deleteMany({ where: { menuId: menu.id } });
    if ((await db.menuItem.count({ where: { menuId: menu.id } })) === 0)
      await db.menuItem.createMany({ data: items.map((m: any, n: number) => ({ menuId: menu.id, label: J(m.label), externalUrl: m.href, isButton: m.isButton, isVisible: m.isVisible, sortOrder: n })) });
  }

  // No made-up reviews are seeded: the website shows the reviews section only once real, approved reviews exist (Admin → Testimonials).
  // Placeholder reviews created by earlier versions of this seed are removed.
  await db.testimonial.deleteMany({ where: { source: 'sample' } });

  // Starter galleries / categories / detail pages: only when none exist yet (never overwrites what was edited in the admin dashboard).
  if (RESET) await db.entry.deleteMany({});
  if ((await db.entry.count()) === 0) {
    for (const [n, e] of entrySeeds.entries()) { const d = toEntryData(e, n); await db.entry.create({ data: { ...d, cover: d.cover ?? Prisma.JsonNull } as any }); }
    for (const [n, e] of detailEntries.entries()) { const d = toDetailData(e, n, entrySeeds.length); await db.entry.create({ data: { ...d, cover: d.cover ?? Prisma.JsonNull } as any }); }
    console.log(`${entrySeeds.length} starter galleries and categories and ${detailEntries.length} detail pages created`);
  }

  await createPage('home', i('Home', 'الرئيسية'), homeSeo, homeSections, true);
  for (const p of pages)
    await createPage(p.key, p.title, { slug: i(p.slug, p.slug), metaTitle: p.metaTitle, metaDescription: p.metaDescription, noindex: false }, p.sections);
  if (UPDATE) { await patches(); await safeUpdate(); } // one-time upgrades run only when you ask for them with --update
}

async function patches() {
  // Learning: the Ephatha partner block (editable in Admin → Pages → Learning)
  await patchPage('learning', 'Added the Ephatha partner block', async (secs, api) => {
    if (secs.some((x) => x.config?.key === 'ephatha')) return false;
    const cta = [...secs].reverse().find((x) => x.type === 'cta');
    await api.insertAt(cta ? cta.sortOrder : secs.length, ephatha.type, ephatha.config); return true;
  });
  // Gallery: cards that open each gallery's own page
  await patchPage('gallery', 'Added the galleries list', async (secs, api) => {
    if (secs.some((x) => x.type === 'entry-list')) return false;
    const g = pages.find((p) => p.key === 'gallery')!.sections.find((x) => x.type === 'entry-list')!;
    const old = secs.find((x) => x.type === 'photo-grid');
    if (old) await api.remove(old.id);
    await api.insertAt(Math.min(1, secs.length), g.type, g.config); return true;
  });
  // Parents: Quick Links open their own detail pages (only links still pointing to the default /parents)
  await patchPage('parents', 'Quick Links now open detail pages', async (secs, api) => {
    const ll = secs.find((x) => x.type === 'link-list'); if (!ll) return false;
    const want = pages.find((p) => p.key === 'parents')!.sections.find((x) => x.type === 'link-list')!.config.items as any[];
    let ch = false;
    const items = (ll.config.items ?? []).map((it: any, n: number) => { const w = want.find((x) => x.label?.en === it.label?.en); if (w && it.href === '/parents' && w.href !== '/parents') { ch = true; return { ...it, href: w.href }; } return it; });
    if (ch) await api.update(ll.id, { ...ll.config, items }); return ch;
  });
  // About Us: first leader shown large with a message (only if no one is flagged yet)
  await patchPage('about-us', 'Director featured with a message', async (secs, api) => {
    const tm = secs.find((x) => x.type === 'team'); const items = tm?.config?.items as any[] | undefined;
    if (!tm || !items?.length || items.some((x) => x.featured === true)) return false;
    const want = (pages.find((p) => p.key === 'about-us')!.sections.find((x) => x.type === 'team')!.config.items as any[])[0];
    if (items[0]?.name?.en !== want.name?.en) return false; // edited by the school: leave as is
    items[0] = { ...items[0], featured: true, message: want.message };
    await api.update(tm.id, { ...tm.config, items }); return true;
  });
  // Home: remove the old animated nature scene block only (never touches the hero layout you chose)
  await patchPage('home', 'Nature scene removed', async (secs, api) => {
    let ch = false;
    for (const x of secs) if (x.type === 'scenery') { await api.remove(x.id); ch = true; }
    return ch;
  });
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });

/** True when nobody has saved this page from the admin dashboard (every version was written by the seed). */
async function untouched(key: string) {
  const p = await db.page.findUnique({ where: { key }, include: { versions: { select: { createdBy: true } } } });
  return p ? p.versions.every((v) => !v.createdBy) : null; // null = page does not exist
}

/**
 * Safe update (`--update`): brings in the new starter content WITHOUT overwriting anything edited in the admin.
 *  - Pages that nobody edited are refreshed; edited pages (staff, map, contact...) are never touched.
 *  - Real photos are added to icon / feature items that have no photo (existing photos are kept).
 *  - Detail pages: missing ones are created; existing ones only receive the new designed blocks when they have none.
 *  - The theme is switched to the green look only if it still has the old blue default; custom colours are kept.
 */
async function safeUpdate() {
  console.log('--- safe update: edited content is left alone ---');
  const fresh = [{ key: 'home', title: i('Home', 'الرئيسية'), seo: homeSeo, sections: homeSections }, ...pages.map((p) => ({ key: p.key, title: p.title, seo: { slug: i(p.slug, p.slug), metaTitle: p.metaTitle, metaDescription: p.metaDescription, noindex: false }, sections: p.sections }))];
  for (const f of fresh) {
    const u = await untouched(f.key);
    if (u === null) continue;
    if (!u) { console.log(`page ${f.key}: edited in admin, kept as is`); continue; }
    const kw = keywords[f.key];
    const seo = { ...f.seo, keywords: kw ? i(kw[0], kw[1]) : i('', '') };
    const page = await db.page.findUniqueOrThrow({ where: { key: f.key }, include: { versions: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 } } });
    const seoData = { slug: J(seo.slug), metaTitle: J(seo.metaTitle), metaDescription: J(seo.metaDescription), keywords: J(seo.keywords), noindex: !!seo.noindex };
    await db.$transaction([
      db.page.update({ where: { id: page.id }, data: { title: J(f.title) } }),
      db.seoMeta.upsert({ where: { pageId: page.id }, update: seoData, create: { pageId: page.id, ...seoData } }),
      db.section.deleteMany({ where: { pageId: page.id } }),
      db.section.createMany({ data: f.sections.map((s: any, n: number) => ({ pageId: page.id, type: s.type, config: J(s.config), sortOrder: n, isVisible: true })) }),
      db.pageVersion.create({ data: { pageId: page.id, version: (page.versions[0]?.version ?? 0) + 1, note: 'Starter content updated', snapshot: J({ title: f.title, seo, sections: f.sections.map((s: any, n: number) => ({ ...s, sortOrder: n, isVisible: true })) }) } }),
    ]);
    console.log(`page ${f.key}: refreshed (it had no edits)`);
  }
  // Legal pages that do not exist yet are created by the normal seed above (createPage). Edited ones are untouched.

  // Photos for icon-style blocks: only items without a photo, on any page
  const PHOTO = ['icon-row', 'feature-grid', 'safety', 'steps'];
  for (const sec of await db.section.findMany({ where: { type: { in: PHOTO } }, include: { page: { select: { key: true } } } })) {
    const cfg = sec.config as any; const items: any[] = Array.isArray(cfg?.items) ? cfg.items : [];
    if (!items.length || items.every((x) => x?.image?.url)) continue;
    const withImg = withPhotos({ items: items.map((x) => ({ ...x })) }, sec.sortOrder).items;
    const next = items.map((x, n) => (x?.image?.url ? x : { ...x, image: withImg[n].image }));
    await db.section.update({ where: { id: sec.id }, data: { config: J({ ...cfg, items: next }) } });
    console.log(`page ${sec.page.key}: photos added to ${sec.type}`);
  }

  // Detail pages: create missing ones, give old plain ones the new designed blocks (never replaces blocks you made)
  const maxSort = (await db.entry.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
  for (const [n, e] of detailEntries.entries()) {
    const d = toDetailData(e, n, maxSort + 1);
    const ex = await db.entry.findFirst({ where: { kind: 'DETAIL', slug: d.slug } });
    if (!ex) { await db.entry.create({ data: { ...d, cover: d.cover ?? Prisma.JsonNull } as any }); console.log(`detail ${d.slug}: created`); continue; }
    const blocks = ex.blocks as any[];
    if (Array.isArray(blocks) && blocks.length === 0) {
      await db.entry.update({ where: { id: ex.id }, data: { blocks: J(d.blocks), design: J(d.design) } });
      console.log(`detail ${d.slug}: designed blocks added (your text and folder kept)`);
    } else console.log(`detail ${d.slug}: already designed or edited, kept`);
  }

  // Theme: blue default -> green only if never customised
  const t = await db.themeSetting.findFirst({ where: { isActive: true } });
  const colours = (t?.tokens as any)?.colors;
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(colours?.primary ?? ''));
  const isBlue = !!hex && parseInt(hex[3]!, 16) > parseInt(hex[1]!, 16) + 30 && parseInt(hex[3]!, 16) > parseInt(hex[2]!, 16) + 10;
  if (t && colours && isBlue) {
    await db.themeSetting.update({ where: { id: t.id }, data: { tokens: J(theme) } }); console.log('theme: switched to the green look');
  } else console.log('theme: kept (not blue, so left as you set it)');
}

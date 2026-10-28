import { Body, Controller, Delete, Get, HttpCode, Module, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { audit } from '../common/audit-context';
import { browserOf, clientIp, shapeIp } from '../common/client-ip';
import { PrismaService } from '../common/common.module';
import { Secured } from '../common/security';
import { config } from '../config';

const rid = z.string().regex(/^[a-z0-9]{12,32}$/);
const collectSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('v'), id: rid, sid: rid, path: z.string().max(300).regex(/^\/[^\s]*$/), ref: z.string().max(300).optional(), vid: rid.optional(), ns: z.boolean().optional() }),
  z.object({ t: z.literal('p'), id: rid, dur: z.number().int().min(0).max(14_400) }),
  z.object({ t: z.literal('h'), vid: rid, path: z.string().max(300).regex(/^\/[^\s]*$/).optional() }), // visitor said yes to analytics cookies
  z.object({ t: z.literal('x'), vid: rid }),                                                           // visitor withdrew: erase what we hold
]);

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed|monitor|curl|wget|python|node-fetch/i;
const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia|qwant|brave)\./i;
const SOCIAL = /(^|\.)(facebook|instagram|twitter|x|t|linkedin|whatsapp|wa|youtube|youtu|tiktok|snapchat|pinterest|reddit|threads)\.(com|co|me|be|net)$|^l\.facebook|^lm\.facebook/i;

const deviceOf = (ua = '') => (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop');
function sourceOf(ref?: string): { source: string; host: string | null } {
  if (ref === undefined) return { source: 'internal', host: null }; // later page of the same visit
  let host = '';
  try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch { /* not a URL */ }
  if (!host) return { source: 'direct', host: null };
  let own = '';
  try { own = new URL(config.WEB_URL).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  if (host === own) return { source: 'direct', host: null };
  return { source: SEARCH.test(host) ? 'search' : SOCIAL.test(host) ? 'social' : 'referral', host };
}

export interface VisitorSettings { enabled: boolean; ipMode: 'full' | 'masked' | 'off'; retentionDays: number }
export const VISITOR_DEFAULTS: VisitorSettings = { enabled: true, ipMode: 'full', retentionDays: 90 };
const visitorSettingsSchema = z.object({ enabled: z.boolean(), ipMode: z.enum(['full', 'masked', 'off']), retentionDays: z.number().int().min(7).max(730) });

/** Links a known browser to the email the person typed into a form. Called from the enquiry and newsletter forms. */
export async function identifyVisitor(db: PrismaService, vid: string | undefined, who: { email: string; name?: string }) {
  if (!vid || !/^[a-z0-9]{12,32}$/.test(vid)) return;
  await db.visitor.updateMany({ where: { id: vid }, data: { email: who.email.toLowerCase(), name: who.name?.slice(0, 100) || undefined, identifiedAt: new Date(), marketingOptIn: true } }).catch(() => undefined);
}

@Controller('public')
export class CollectController {
  constructor(private db: PrismaService) {}

  private async settings(): Promise<VisitorSettings> {
    const r = await this.db.siteSetting.findUnique({ where: { key: 'analytics.visitors' } });
    return { ...VISITOR_DEFAULTS, ...((r?.value as Partial<VisitorSettings>) ?? {}) };
  }

  /** Anonymous by default. Only when the visitor accepted analytics cookies does the browser also send a visitor id, and then the IP address is kept in the form chosen in Settings. Bots are ignored. */
  @Post('collect') @HttpCode(204) @Throttle({ default: { limit: 90, ttl: 60_000 } })
  async collect(@Body() body: unknown, @Req() req: Request) {
    const ua = req.headers['user-agent'] ?? '';
    if (BOT.test(ua)) return;
    const d = collectSchema.safeParse(body);
    if (!d.success) return;
    const cfg = await this.settings();

    if (d.data.t === 'x') {
      const vid = d.data.vid;
      await this.db.pageView.updateMany({ where: { vid }, data: { vid: null, ip: null } }).catch(() => undefined);
      await this.db.visitor.deleteMany({ where: { id: vid } }).catch(() => undefined);
      return;
    }
    const cc = String(req.headers['x-vercel-ip-country'] ?? req.headers['cf-ipcountry'] ?? req.headers['cloudfront-viewer-country'] ?? '').toUpperCase();
    const country = /^[A-Z]{2}$/.test(cc) && cc !== 'XX' ? cc : null;
    const ip = shapeIp(clientIp(req), cfg.ipMode);
    const known = cfg.enabled && 'vid' in d.data && d.data.vid ? d.data.vid : undefined;

    if (d.data.t === 'h') {
      if (!cfg.enabled) return;
      const lang = (d.data.path ?? '').match(/^\/(en|ar)\b/)?.[1] ?? 'en';
      await this.db.visitor.upsert({ where: { id: d.data.vid }, update: { lastSeenAt: new Date(), ip, country: country ?? undefined }, create: { id: d.data.vid, ip, country, device: deviceOf(ua), browser: browserOf(ua), locale: lang, visits: 1, pageViews: 0 } }).catch(() => undefined);
      return;
    }
    if (d.data.t === 'p') {
      await this.db.pageView.updateMany({ where: { id: d.data.id }, data: { durationSec: d.data.dur } }).catch(() => undefined);
      return;
    }
    const m = d.data.path.split(/[?#]/)[0].match(/^\/(en|ar)(\/.*)?$/);
    if (!m) return;
    const { source, host } = sourceOf(d.data.ref);
    const clean = (m[2] ?? '/').replace(/\/+$/, '') || '/';
    await this.db.pageView.create({
      data: { id: d.data.id, sid: d.data.sid, path: clean, locale: m[1], source, referrer: host, device: deviceOf(ua), country, ...(known ? { vid: known, ip } : {}) },
    }).catch(() => undefined);
    if (known) {
      const newSession = d.data.ns === true || d.data.ref !== undefined;
      await this.db.visitor.upsert({
        where: { id: known },
        update: { lastSeenAt: new Date(), pageViews: { increment: 1 }, lastPath: clean, ip, country: country ?? undefined, ...(newSession ? { visits: { increment: 1 } } : {}) },
        create: { id: known, ip, country, device: deviceOf(ua), browser: browserOf(ua), locale: m[1], source, pageViews: 1, lastPath: clean },
      }).catch(() => undefined);
    }
    if (Math.random() < 0.01) this.cleanup(cfg).catch(() => undefined);
  }

  private async cleanup(cfg: VisitorSettings) {
    await this.db.pageView.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 400 * 864e5) } } });
    const cut = new Date(Date.now() - cfg.retentionDays * 864e5);
    await this.db.pageView.updateMany({ where: { createdAt: { lt: cut }, ip: { not: null } }, data: { ip: null } });
    await this.db.visitor.updateMany({ where: { lastSeenAt: { lt: cut }, ip: { not: null } }, data: { ip: null } });
    await this.db.visitor.deleteMany({ where: { lastSeenAt: { lt: new Date(Date.now() - 400 * 864e5) }, email: null } });
  }
}

const statsQuery = z.object({ days: z.coerce.number().int().refine((n) => [1, 7, 30, 90].includes(n)).default(7), tz: z.string().regex(/^[A-Za-z_\/+-]{1,40}$/).default('UTC') });
const visitorsQuery = z.object({ q: z.string().max(80).default(''), filter: z.enum(['all', 'identified', 'anonymous']).default('all'), page: z.coerce.number().int().min(1).default(1), sort: z.enum(['recent', 'visits', 'pages']).default('recent') });
const csvCell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
const vidParam = z.string().regex(/^[a-z0-9]{12,32}$/);

@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private db: PrismaService) {}

  @Get() @Secured('analytics:read')
  async stats(@Query() q: unknown) {
    const { days, tz } = statsQuery.parse(q);
    const since = new Date(Date.now() - days * 864e5);
    const live = new Date(Date.now() - 5 * 60_000);
    const [tot, liveN, livePages, avg, series, pages, sources, referrers, devices, countries, locales] = await Promise.all([
      this.db.$queryRaw<{ views: number; visitors: number }[]>`SELECT COUNT(*)::int views, COUNT(DISTINCT sid)::int visitors FROM "PageView" WHERE "createdAt" >= ${since}`,
      this.db.$queryRaw<{ n: number }[]>`SELECT COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${live}`,
      this.db.$queryRaw<{ path: string; n: number }[]>`SELECT path, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${live} GROUP BY path ORDER BY n DESC LIMIT 5`,
      this.db.$queryRaw<{ s: number | null; pv: number | null }[]>`SELECT AVG(d)::int s, AVG(c)::float pv FROM (SELECT SUM("durationSec") d, COUNT(*) c FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY sid) t`,
      this.db.$queryRaw<{ day: string; views: number; visitors: number }[]>`SELECT to_char(("createdAt" AT TIME ZONE ${tz})::date, 'YYYY-MM-DD') AS day, COUNT(*)::int views, COUNT(DISTINCT sid)::int visitors FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
      this.db.$queryRaw<{ path: string; views: number; visitors: number; avg: number }[]>`SELECT path, COUNT(*)::int views, COUNT(DISTINCT sid)::int visitors, COALESCE(AVG(NULLIF("durationSec", 0)), 0)::int avg FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY path ORDER BY views DESC LIMIT 10`,
      this.db.$queryRaw<{ k: string; n: number }[]>`SELECT source k, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${since} AND source <> 'internal' GROUP BY source ORDER BY n DESC`,
      this.db.$queryRaw<{ k: string; n: number }[]>`SELECT referrer k, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${since} AND referrer IS NOT NULL GROUP BY referrer ORDER BY n DESC LIMIT 8`,
      this.db.$queryRaw<{ k: string; n: number }[]>`SELECT device k, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY device ORDER BY n DESC`,
      this.db.$queryRaw<{ k: string; n: number }[]>`SELECT country k, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${since} AND country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT 10`,
      this.db.$queryRaw<{ k: string; n: number }[]>`SELECT locale k, COUNT(DISTINCT sid)::int n FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY locale ORDER BY n DESC`,
    ]);
    const [known, identified] = await Promise.all([this.db.visitor.count({ where: { lastSeenAt: { gte: since } } }), this.db.visitor.count({ where: { lastSeenAt: { gte: since }, email: { not: null } } })]);
    return {
      days, views: tot[0]?.views ?? 0, visitors: tot[0]?.visitors ?? 0, liveVisitors: liveN[0]?.n ?? 0, livePages,
      avgSessionSec: avg[0]?.s ?? 0, pagesPerVisit: Math.round((avg[0]?.pv ?? 0) * 10) / 10,
      series, pages, sources, referrers, devices, countries, locales, knownVisitors: known, identifiedVisitors: identified,
    };
  }

  @Get('visitors') @Secured('visitor:read')
  async visitors(@Query() raw: unknown) {
    const q = visitorsQuery.parse(raw);
    const where: any = {
      ...(q.filter === 'identified' ? { email: { not: null } } : q.filter === 'anonymous' ? { email: null } : {}),
      ...(q.q ? { OR: [{ email: { contains: q.q, mode: 'insensitive' } }, { name: { contains: q.q, mode: 'insensitive' } }, { ip: { contains: q.q } }, { country: { equals: q.q.toUpperCase() } }] } : {}),
    };
    const orderBy = q.sort === 'visits' ? { visits: 'desc' as const } : q.sort === 'pages' ? { pageViews: 'desc' as const } : { lastSeenAt: 'desc' as const };
    const [rows, total, identified, optedOut, cfg] = await Promise.all([
      this.db.visitor.findMany({ where, orderBy, skip: (q.page - 1) * 30, take: 30 }),
      this.db.visitor.count({ where }),
      this.db.visitor.count({ where: { email: { not: null } } }),
      this.db.emailOptOut.findMany({ select: { email: true } }),
      this.db.siteSetting.findUnique({ where: { key: 'analytics.visitors' } }),
    ]);
    const out = new Set(optedOut.map((o) => o.email));
    return { total, page: q.page, pageSize: 30, identified, settings: { ...VISITOR_DEFAULTS, ...((cfg?.value as object) ?? {}) }, rows: rows.map((r) => ({ ...r, unsubscribed: !!r.email && out.has(r.email) })) };
  }

  @Get('visitors/:id') @Secured('visitor:read')
  async visitor(@Param('id') id: string) {
    const vid = vidParam.parse(id);
    const [v, views] = await Promise.all([this.db.visitor.findUnique({ where: { id: vid } }), this.db.pageView.findMany({ where: { vid }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, createdAt: true, path: true, locale: true, source: true, referrer: true, durationSec: true, ip: true } })]);
    return { visitor: v, views };
  }

  @Delete('visitors/:id') @Secured('visitor:delete')
  async erase(@Param('id') id: string) {
    const vid = vidParam.parse(id);
    audit({ label: 'Visitor record erased', entity: 'admin/visitors', entityId: vid });
    await this.db.pageView.updateMany({ where: { vid }, data: { vid: null, ip: null } });
    await this.db.visitor.deleteMany({ where: { id: vid } });
    return { ok: true };
  }

  @Get('visitors.csv') @Secured('visitor:read') @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async csv(@Res() res: Response) {
    const rows = await this.db.visitor.findMany({ orderBy: { lastSeenAt: 'desc' }, take: 20000 });
    const head = ['First seen', 'Last seen', 'IP address', 'Country', 'Device', 'Browser', 'Language', 'Visits', 'Pages viewed', 'Last page', 'Name', 'Email', 'Agreed to emails'];
    const lines = rows.map((r) => [r.firstSeenAt.toISOString(), r.lastSeenAt.toISOString(), r.ip, r.country, r.device, r.browser, r.locale, r.visits, r.pageViews, r.lastPath, r.name, r.email, r.marketingOptIn ? 'yes' : 'no'].map(csvCell).join(','));
    audit({ label: `Exported ${rows.length} visitors to CSV`, entity: 'admin/visitors', action: 'download' });
    res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', `attachment; filename="visitors-${new Date().toISOString().slice(0, 10)}.csv"`); res.setHeader('cache-control', 'no-store');
    res.send('﻿' + [head.map(csvCell).join(','), ...lines].join('\r\n'));
  }

  @Get('settings') @Secured('visitor:read')
  async getSettings() { const r = await this.db.siteSetting.findUnique({ where: { key: 'analytics.visitors' } }); return { ...VISITOR_DEFAULTS, ...((r?.value as object) ?? {}) }; }
  @Put('settings') @Secured('settings:update')
  async saveSettings(@Body() b: unknown) {
    const v = visitorSettingsSchema.parse(b);
    const prev = await this.db.siteSetting.findUnique({ where: { key: 'analytics.visitors' } });
    audit({ label: 'Visitor tracking settings', entity: 'admin/analytics', before: prev?.value ?? VISITOR_DEFAULTS, after: v });
    await this.db.siteSetting.upsert({ where: { key: 'analytics.visitors' }, update: { value: v }, create: { key: 'analytics.visitors', value: v } });
    if (v.ipMode === 'off') { await this.db.visitor.updateMany({ data: { ip: null } }); await this.db.pageView.updateMany({ where: { ip: { not: null } }, data: { ip: null } }); }
    return { ok: true };
  }
}

@Module({ controllers: [CollectController, AnalyticsController] })
export class AnalyticsModule {}

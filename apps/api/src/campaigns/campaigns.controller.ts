import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Logger, Module, NotFoundException, OnApplicationBootstrap, Param, Post, Put, Query, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { audit } from '../common/audit-context';
import { PrismaService } from '../common/common.module';
import { NotificationsService } from '../common/notifications.service';
import { AuthedRequest, Secured } from '../common/security';
import { UsageService } from '../common/usage.service';
import { config } from '../config';
import { designSchema } from '../integrations/email-design';
import { EmailTemplatesService } from '../integrations/email-templates.service';
import { MailService } from '../integrations/mail.service';

const i18n = z.object({ en: z.string().max(5000).default(''), ar: z.string().max(5000).default('') });
const vid = z.string().regex(/^[a-z0-9]{12,32}$/);
const audienceSchema = z.object({
  kind: z.enum(['leads', 'newsletter', 'visitors', 'all', 'selected']),
  status: z.array(z.enum(['NEW', 'CONTACTED', 'TOUR', 'OFFERED', 'ENROLLED', 'DECLINED'])).max(6).default([]),
  sinceDays: z.number().int().min(0).max(730).default(0),
  pagePrefix: z.string().max(100).regex(/^(\/[A-Za-z0-9\-\/]*)?$/, 'Use a page address such as /admissions').default(''),
  visitorIds: z.array(vid).max(1000).default([]),
  leadIds: z.array(z.string().cuid()).max(1000).default([]),
});
const contentSchema = z.object({
  subject: i18n, heading: i18n, body: i18n, buttonLabel: i18n,
  buttonUrl: z.string().trim().max(300).refine((v) => v === '' || /^https?:\/\//.test(v), 'The button link must start with https://').default(''),
  celebrate: z.boolean().default(false),
  design: designSchema.optional(),
});
const campaignSchema = z.object({ name: z.string().trim().min(2, 'Give the campaign a name').max(100), audience: audienceSchema, content: contentSchema });
type Audience = z.infer<typeof audienceSchema>;
type Content = z.infer<typeof contentSchema>;
const cuid = z.string().cuid();
const MAX_AUDIENCE = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (email: string) => createHmac('sha256', `unsub:${config.JWT_ACCESS_SECRET}`).update(email.toLowerCase()).digest('base64url').slice(0, 32);
export const unsubscribeUrl = (email: string) => `${config.WEB_URL.replace(/\/$/, '')}/api/public/unsubscribe?e=${b64(email.toLowerCase())}&t=${sign(email)}`;
function verify(e: string, t: string): string | null {
  let email = ''; try { email = Buffer.from(e, 'base64url').toString('utf8'); } catch { return null; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  const a = Buffer.from(sign(email)), b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b) ? email.toLowerCase() : null;
}

function needBothLanguages(c: Content) {
  const miss: string[] = [];
  for (const [k, label] of [['subject', 'Subject'], ['heading', 'Heading'], ['body', 'Message']] as const) {
    if (!c[k].en.trim()) miss.push(`${label} (English)`); if (!c[k].ar.trim()) miss.push(`${label} (Arabic)`);
  }
  if (!!c.buttonLabel.en.trim() !== !!c.buttonLabel.ar.trim()) miss.push('Button text in both languages');
  if (miss.length) throw new BadRequestException(`Please fill in: ${miss.join(', ')}. Every email is sent in the parent's own language, so both are needed.`);
}

@Injectable()
export class CampaignsService implements OnApplicationBootstrap {
  private log = new Logger('Campaigns');
  private running = new Set<string>();
  constructor(private db: PrismaService, private tpl: EmailTemplatesService, private mail: MailService, private notes: NotificationsService, private usage: UsageService) {}

  onApplicationBootstrap() { // a restart in the middle of a send picks up where it stopped
    setTimeout(async () => { try { for (const c of await this.db.campaign.findMany({ where: { status: 'SENDING' }, select: { id: true } })) void this.run(c.id); } catch { /* database not ready yet */ } }, 8000);
  }

  // ───────── who will receive it ─────────
  async resolve(a: Audience): Promise<{ email: string; name: string; locale: 'en' | 'ar'; from: string }[]> {
    const out = new Map<string, { email: string; name: string; locale: 'en' | 'ar'; from: string }>();
    const optOut = new Set((await this.db.emailOptOut.findMany({ select: { email: true } })).map((o) => o.email));
    const since = a.sinceDays ? new Date(Date.now() - a.sinceDays * 864e5) : undefined;
    const add = (email: string | null | undefined, name: string | null | undefined, locale: string | null | undefined, from: string) => {
      const e = (email ?? '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || e.endsWith('@invalid.local') || optOut.has(e) || out.has(e)) return;
      out.set(e, { email: e, name: (name ?? '').trim(), locale: locale === 'ar' ? 'ar' : 'en', from });
    };
    const k = a.kind;
    if (k === 'leads' || k === 'all') {
      const rows = await this.db.enquiry.findMany({ where: { deletedAt: null, consentAt: { not: null }, type: { not: 'NEWSLETTER' }, ...(a.status.length ? { status: { in: a.status } } : {}), ...(since ? { createdAt: { gte: since } } : {}) }, select: { email: true, name: true, locale: true }, take: 5000 });
      for (const r of rows) add(r.email, r.name, r.locale, 'Enquiry');
    }
    if (k === 'newsletter' || k === 'all') {
      const rows = await this.db.enquiry.findMany({ where: { deletedAt: null, consentAt: { not: null }, type: 'NEWSLETTER', ...(since ? { createdAt: { gte: since } } : {}) }, select: { email: true, name: true, locale: true }, take: 5000 });
      for (const r of rows) add(r.email, r.name, r.locale, 'Newsletter');
    }
    if (k === 'visitors' || k === 'all') {
      let ids: string[] | null = null;
      if (a.pagePrefix) {
        const like = `${a.pagePrefix.replace(/[%_\\]/g, '')}%`;
        ids = (await this.db.$queryRaw<{ vid: string }[]>`SELECT DISTINCT vid FROM "PageView" WHERE vid IS NOT NULL AND path LIKE ${like}`).map((x) => x.vid);
      }
      const rows = await this.db.visitor.findMany({ where: { email: { not: null }, marketingOptIn: true, ...(since ? { lastSeenAt: { gte: since } } : {}), ...(ids ? { id: { in: ids } } : {}) }, select: { email: true, name: true, locale: true }, take: 5000 });
      for (const r of rows) add(r.email, r.name, r.locale, 'Website visitor');
    }
    if (k === 'selected') {
      if (a.visitorIds.length) for (const r of await this.db.visitor.findMany({ where: { id: { in: a.visitorIds }, email: { not: null }, marketingOptIn: true }, select: { email: true, name: true, locale: true } })) add(r.email, r.name, r.locale, 'Website visitor');
      if (a.leadIds.length) for (const r of await this.db.enquiry.findMany({ where: { id: { in: a.leadIds }, deletedAt: null, consentAt: { not: null } }, select: { email: true, name: true, locale: true } })) add(r.email, r.name, r.locale, 'Enquiry');
    }
    return [...out.values()];
  }

  async audience(a: Audience) {
    const list = await this.resolve(a);
    return { count: list.length, tooMany: list.length > MAX_AUDIENCE, max: MAX_AUDIENCE, sample: list.slice(0, 8).map((r) => ({ email: r.email, name: r.name, from: r.from, locale: r.locale })), optedOut: await this.db.emailOptOut.count() };
  }

  // ───────── drafts ─────────
  async list() {
    const rows = await this.db.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map((r) => ({ id: r.id, name: r.name, status: r.status, total: r.total, sent: r.sent, failed: r.failed, skipped: r.skipped, createdAt: r.createdAt, finishedAt: r.finishedAt, createdByName: r.createdByName, subject: (r.content as any)?.subject?.en ?? '' }));
  }
  async get(id: string) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    const recipients = await this.db.campaignRecipient.findMany({ where: { campaignId: id }, orderBy: [{ status: 'asc' }, { email: 'asc' }], take: 300, select: { email: true, name: true, locale: true, status: true, error: true, sentAt: true } });
    return { ...c, recipients };
  }
  async create(d: z.infer<typeof campaignSchema>, actor: { sub: string }) {
    const u = await this.db.user.findUnique({ where: { id: actor.sub }, select: { name: true } });
    const c = await this.db.campaign.create({ data: { name: d.name, audience: d.audience as any, content: d.content as any, createdById: actor.sub, createdByName: u?.name ?? null } });
    audit({ label: `Campaign “${d.name}” created`, entity: 'admin/campaigns', entityId: c.id });
    return { id: c.id };
  }
  async update(id: string, d: z.infer<typeof campaignSchema>) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.status !== 'DRAFT') throw new BadRequestException('This campaign has already been sent. Duplicate it to send a new one.');
    audit({ label: `Campaign “${d.name}”`, entity: 'admin/campaigns', entityId: id, before: { name: c.name, audience: c.audience, content: c.content }, after: { name: d.name, audience: d.audience, content: d.content } });
    await this.db.campaign.update({ where: { id }, data: { name: d.name, audience: d.audience as any, content: d.content as any } });
    return { ok: true };
  }
  async remove(id: string) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.status === 'SENDING') throw new BadRequestException('This campaign is being sent right now. Wait until it finishes.');
    audit({ label: `Campaign “${c.name}” deleted`, entity: 'admin/campaigns', entityId: id });
    await this.db.campaign.delete({ where: { id } });
    return { ok: true };
  }
  async duplicate(id: string, actor: { sub: string }) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    return this.create({ name: `${c.name} (copy)`.slice(0, 100), audience: c.audience as any, content: c.content as any }, actor);
  }

  // ───────── preview & test ─────────
  private sample(locale: 'en' | 'ar') { return { name: locale === 'ar' ? 'سارة' : 'Sara', parentName: locale === 'ar' ? 'سارة' : 'Sara' }; }
  async preview(c: Content, locale: 'en' | 'ar', brand?: any) {
    return this.tpl.renderCampaign(c, locale, this.sample(locale), { unsubscribeUrl: '#unsubscribe', brand });
  }
  async test(c: Content, to: string, locale: 'en' | 'ar') {
    const r = await this.tpl.renderCampaign(c, locale, this.sample(locale), { unsubscribeUrl: unsubscribeUrl(to) });
    await this.mail.send({ to, subject: `[TEST] ${r.subject}`, html: r.html, text: r.text });
    return { ok: true };
  }

  // ───────── sending ─────────
  async send(id: string) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.status !== 'DRAFT' && c.status !== 'PAUSED') throw new BadRequestException('This campaign was already sent.');
    if (!(await this.mail.available())) throw new ServiceUnavailableException('Email is not set up yet. Add your Resend details in Admin → Integrations first.');
    needBothLanguages(contentSchema.parse(c.content));
    if (c.status === 'PAUSED') { await this.db.campaign.update({ where: { id }, data: { status: 'SENDING' } }); void this.run(id); return { ok: true, total: c.total }; }
    const list = await this.resolve(audienceSchema.parse(c.audience));
    if (!list.length) throw new BadRequestException('No one matches this audience. Only people who agreed to receive emails (and have not unsubscribed) are included.');
    if (list.length > MAX_AUDIENCE) throw new BadRequestException(`This audience has ${list.length} people. The limit is ${MAX_AUDIENCE} per campaign; narrow it down.`);
    const lim = (await this.usage.limits()).email;
    if (lim.dailyLimit) {
      const today = await this.usage.todayCount('email');
      if (today + list.length > lim.dailyLimit) throw new BadRequestException(`Your email plan allows ${lim.dailyLimit} emails a day. ${today} were already sent today and this campaign has ${list.length} people. Narrow the audience, send it tomorrow, or raise the limit in Admin → API usage if your plan allows more.`);
    }
    await this.db.campaignRecipient.createMany({ data: list.map((r) => ({ campaignId: id, email: r.email, name: r.name || null, locale: r.locale })), skipDuplicates: true });
    await this.db.campaign.update({ where: { id }, data: { status: 'SENDING', total: list.length, sent: 0, failed: 0, skipped: 0, startedAt: new Date() } });
    audit({ label: `Campaign “${c.name}” sent to ${list.length} people`, entity: 'admin/campaigns', entityId: id, action: 'send' });
    void this.run(id);
    return { ok: true, total: list.length };
  }

  private async finish(id: string, name: string) {
    const g = await this.db.campaignRecipient.groupBy({ by: ['status'], where: { campaignId: id }, _count: true });
    const n = (s: string) => g.find((x) => x.status === s)?._count ?? 0;
    const pending = n('PENDING');
    const status = pending ? 'PAUSED' : n('SENT') > 0 ? 'SENT' : 'FAILED';
    await this.db.campaign.update({ where: { id }, data: { sent: n('SENT'), failed: n('FAILED'), skipped: n('SKIPPED'), status, finishedAt: pending ? null : new Date() } });
    await this.notes.notify({ type: 'lead', severity: status === 'SENT' && !n('FAILED') ? 'success' : 'warning', title: status === 'PAUSED' ? `Campaign “${name}” paused` : `Campaign “${name}” finished`, body: `${n('SENT')} sent, ${n('FAILED')} failed, ${n('SKIPPED')} skipped${pending ? `, ${pending} still waiting (open the campaign and press Resume)` : ''}.`, link: `/admin/campaigns?open=${id}` });
  }

  async run(id: string) {
    if (this.running.has(id)) return;
    this.running.add(id);
    let name = '';
    try {
      const c = await this.db.campaign.findUnique({ where: { id } });
      if (!c) return;
      name = c.name;
      const content = contentSchema.parse(c.content);
      const brand = await this.tpl.brand();
      const opted = async (e: string) => !!(await this.db.emailOptOut.findUnique({ where: { email: e } }));
      for (;;) {
        const batch = await this.db.campaignRecipient.findMany({ where: { campaignId: id, status: 'PENDING' }, take: 25, orderBy: { email: 'asc' } });
        if (!batch.length) break;
        for (const r of batch) {
          if (await opted(r.email)) { await this.db.campaignRecipient.update({ where: { id: r.id }, data: { status: 'SKIPPED', error: 'Unsubscribed' } }); continue; }
          const loc = r.locale === 'ar' ? 'ar' : 'en';
          const first = (r.name ?? '').trim().split(/\s+/)[0] || (loc === 'ar' ? 'ولي الأمر' : 'there');
          const url = unsubscribeUrl(r.email);
          let lastErr = '', ok = false, stop = false;
          for (let attempt = 0; attempt < 3 && !ok; attempt++) {
            try {
              const m = await this.tpl.renderCampaign(content, loc, { name: first, parentName: first }, { unsubscribeUrl: url, brand });
              await this.mail.send({ to: r.email, subject: m.subject, html: m.html, text: m.text, headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
              ok = true;
            } catch (e: any) {
              lastErr = String(e?.message ?? e).slice(0, 300);
              if (e?.resendStatus === 429 && !/quota|daily|monthly/i.test(lastErr)) await sleep(2500 * (attempt + 1));
              else { if (/quota|daily|monthly|limit/i.test(lastErr)) stop = true; break; }
            }
          }
          await this.db.campaignRecipient.update({ where: { id: r.id }, data: ok ? { status: 'SENT', sentAt: new Date(), error: null } : { status: 'FAILED', error: lastErr } });
          await this.db.campaign.update({ where: { id }, data: ok ? { sent: { increment: 1 } } : { failed: { increment: 1 } } }).catch(() => undefined);
          if (stop) { // your email plan's limit was hit: stop cleanly instead of failing everyone
            await this.db.campaignRecipient.updateMany({ where: { campaignId: id, status: 'FAILED', error: lastErr }, data: { status: 'PENDING', error: null } });
            await this.finish(id, name);
            return;
          }
          await sleep(600);
        }
      }
      await this.finish(id, name);
    } catch (e) {
      this.log.error(`Campaign ${id} stopped: ${(e as Error).message}`);
      await this.db.campaign.update({ where: { id }, data: { status: 'PAUSED' } }).catch(() => undefined);
    } finally { this.running.delete(id); }
  }
}

const page = (title: string, inner: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#f4f6f2;margin:0;display:grid;place-items:center;min-height:100vh;padding:16px;color:#1f2a22}main{background:#fff;border-radius:16px;padding:28px;max-width:420px;box-shadow:0 10px 30px rgba(31,77,43,.12);text-align:center}h1{font-size:1.25rem;margin:0 0 10px}p{line-height:1.6;margin:8px 0}button{background:#1f4d2b;color:#fff;border:0;border-radius:10px;padding:12px 22px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:12px}</style></head><body><main>${inner}</main></body></html>`;

@Controller('public')
export class UnsubscribeController {
  constructor(private db: PrismaService) {}

  /** Shows a confirmation button. (A button, not an automatic action, because email scanners open links and would unsubscribe people by accident.) */
  @Get('unsubscribe') @Throttle({ default: { limit: 30, ttl: 60_000 } })
  show(@Query('e') e = '', @Query('t') t = '', @Res() res: Response) {
    const email = verify(String(e).slice(0, 400), String(t).slice(0, 80));
    res.setHeader('cache-control', 'no-store'); res.type('html');
    if (!email) return res.status(400).send(page('Link problem', '<h1>This link is not valid</h1><p>It may be incomplete. Please use the link in the email, or reply to the email and ask us to remove you.</p><p dir="rtl">الرابط غير صالح. يرجى استخدام الرابط في الرسالة أو الرد عليها لطلب إزالتك.</p>'));
    return res.send(page('Unsubscribe', `<h1>Stop these emails?</h1><p>${esc(email)}</p><form method="post" action="/api/public/unsubscribe?e=${esc(String(e))}&t=${esc(String(t))}"><button type="submit">Unsubscribe</button></form><p dir="rtl" style="margin-top:18px">هل تريد إيقاف هذه الرسائل؟ اضغط الزر أعلاه.</p>`));
  }

  /** Also used by mail apps' own "Unsubscribe" button (one-click). */
  @Post('unsubscribe') @HttpCode(200) @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async do(@Query('e') e = '', @Query('t') t = '', @Res() res: Response) {
    const email = verify(String(e).slice(0, 400), String(t).slice(0, 80));
    res.setHeader('cache-control', 'no-store'); res.type('html');
    if (!email) return res.status(400).send(page('Link problem', '<h1>This link is not valid</h1>'));
    await this.db.emailOptOut.upsert({ where: { email }, update: {}, create: { email, source: 'email-link' } });
    await this.db.visitor.updateMany({ where: { email }, data: { marketingOptIn: false } }).catch(() => undefined);
    return res.send(page('Unsubscribed', '<h1>You have been unsubscribed ✓</h1><p>You will not receive more of these emails from us.</p><p dir="rtl">تم إلغاء اشتراكك ✓ ولن تصلك المزيد من هذه الرسائل.</p>'));
  }
}

@Controller('admin/campaigns')
export class CampaignsController {
  constructor(private s: CampaignsService) {}
  @Get() @Secured('campaign:read') list() { return this.s.list(); }
  @Post('audience') @HttpCode(200) @Secured('campaign:read') @Throttle({ default: { limit: 60, ttl: 60_000 } }) audience(@Body() b: unknown) { return this.s.audience(audienceSchema.parse(b)); }
  @Post('preview') @HttpCode(200) @Secured('campaign:read') @Throttle({ default: { limit: 60, ttl: 60_000 } })
  preview(@Body() b: unknown) { const d = z.object({ content: contentSchema, locale: z.enum(['en', 'ar']).default('en') }).parse(b); return this.s.preview(d.content, d.locale); }
  @Post('test') @HttpCode(200) @Secured('campaign:send') @Throttle({ default: { limit: 8, ttl: 60_000 } })
  test(@Body() b: unknown) { const d = z.object({ content: contentSchema, locale: z.enum(['en', 'ar']).default('en'), to: z.string().email().max(254) }).parse(b); needBothLanguages(d.content); return this.s.test(d.content, d.to, d.locale); }
  @Get(':id') @Secured('campaign:read') get(@Param('id') id: string) { return this.s.get(cuid.parse(id)); }
  @Post() @HttpCode(201) @Secured('campaign:create') create(@Body() b: unknown, @Req() req: AuthedRequest) { return this.s.create(campaignSchema.parse(b), req.user!); }
  @Put(':id') @Secured('campaign:update') update(@Param('id') id: string, @Body() b: unknown) { return this.s.update(cuid.parse(id), campaignSchema.parse(b)); }
  @Post(':id/duplicate') @HttpCode(201) @Secured('campaign:create') duplicate(@Param('id') id: string, @Req() req: AuthedRequest) { return this.s.duplicate(cuid.parse(id), req.user!); }
  @Post(':id/send') @HttpCode(200) @Secured('campaign:send') @Throttle({ default: { limit: 6, ttl: 60_000 } }) send(@Param('id') id: string) { return this.s.send(cuid.parse(id)); }
  @Delete(':id') @Secured('campaign:delete') remove(@Param('id') id: string) { return this.s.remove(cuid.parse(id)); }
}

@Module({ controllers: [CampaignsController, UnsubscribeController], providers: [CampaignsService] })
export class CampaignsModule {}

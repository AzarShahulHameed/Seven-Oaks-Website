import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { identifyVisitor } from '../analytics/analytics.controller';
import { PrismaService, RevalidateService } from '../common/common.module';
import { audit } from '../common/audit-context';
import { NotificationsService } from '../common/notifications.service';
import { AuthedRequest, AuthGuard, Secured } from '../common/security';
import { config } from '../config';
import { EmailTemplatesService } from '../integrations/email-templates.service';

const i18nIn = z.object({ en: z.string().max(2000).default(''), ar: z.string().max(2000).default('') });
const clean = (s?: string | null) => (s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
const FIELD_RE = /^[^<>]*$/; // names and short answers never need angle brackets

/** Public form configuration lives in the `public.enquiryForm` setting; routing (private emails) in `enquiry.routing`. */
interface FormField { show: boolean; required: boolean }
interface FormConfig { enabled: boolean; programs: { value: string; label: { en: string; ar: string } }[]; fields: Record<string, FormField> }
const DEFAULT_FIELDS: Record<string, FormField> = { childName: { show: true, required: false }, phone: { show: true, required: true }, program: { show: true, required: false }, visitDate: { show: true, required: false }, childAge: { show: true, required: false }, preferredContact: { show: true, required: false }, message: { show: true, required: true } };

const enquirySchema = z.object({
  parentName: z.string().trim().min(2, 'Please enter your name').max(100).regex(FIELD_RE, 'Please remove < and > from your name'),
  email: z.string().trim().email('Please enter a valid email address').max(254),
  childName: z.string().trim().max(100).regex(FIELD_RE).optional().default(''),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, 'Phone may only contain digits, spaces, + ( ) -').optional().default(''),
  program: z.string().trim().max(80).optional().default(''),
  visitDate: z.string().trim().max(20).regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Choose a date').optional().default(''),
  childAge: z.string().trim().max(40).regex(FIELD_RE).optional().default(''),
  preferredContact: z.enum(['', 'phone', 'whatsapp', 'email']).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please tick the box to agree before sending' }) }),
  consentText: z.string().max(600).optional().default(''),
  locale: z.enum(['en', 'ar']).default('en'),
  page: z.string().max(300).optional().default(''),
  referrer: z.string().max(300).optional().default(''),
  hp: z.string().max(0).optional().default(''), // honeypot: real people leave it empty
  vid: z.string().regex(/^[a-z0-9]{12,32}$/).optional(), // known-visitor id, sent only when analytics cookies were accepted
});
const newsletterSchema = z.object({ email: z.string().trim().email('Please enter a valid email address').max(254), name: z.string().trim().max(100).regex(FIELD_RE).optional().default(''), consent: z.literal(true, { errorMap: () => ({ message: 'Please tick the box to agree before subscribing' }) }), locale: z.enum(['en', 'ar']).default('en'), page: z.string().max(300).optional().default(''), hp: z.string().max(0).optional().default(''), vid: z.string().regex(/^[a-z0-9]{12,32}$/).optional() });
const consentSchema = z.object({ cid: z.string().regex(/^[a-z0-9]{10,40}$/), analytics: z.boolean(), marketing: z.boolean(), version: z.string().max(20) });
const leadUpdate = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'TOUR', 'OFFERED', 'ENROLLED', 'DECLINED']).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  note: z.string().trim().max(1000).optional(),
});
const testimonialSchema = z.object({
  authorName: z.string().trim().min(1).max(100), childName: z.string().trim().max(100).optional().default(''),
  body: i18nIn, rating: z.number().int().min(1).max(5).nullable().default(5),
  imageUrl: z.string().trim().max(500).refine((v) => v === '' || /^(https:\/\/|\/)/.test(v), 'Image must be an https:// address').default(''),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'), featured: z.boolean().default(false),
  places: z.array(z.enum(['home', 'about', 'testimonials'])).max(3).default([]), sortOrder: z.number().int().min(0).max(9999).default(0),
});
const cuid = z.string().cuid();
const csvCell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; }; // blocks spreadsheet formula injection

@Injectable()
export class EngageService {
  constructor(private db: PrismaService, private tpl: EmailTemplatesService, private notes: NotificationsService, private rev: RevalidateService) {}

  private async setting<T>(key: string, fallback: T): Promise<T> { const r = await this.db.siteSetting.findUnique({ where: { key } }); return (r?.value as T) ?? fallback; }

  // ───────── public: enquiry form ─────────
  async submitEnquiry(d: z.infer<typeof enquirySchema>, ip?: string) {
    if (d.hp) return { ok: true }; // bots: pretend success
    const form = await this.setting<FormConfig>('public.enquiryForm', { enabled: true, programs: [], fields: DEFAULT_FIELDS });
    if (form.enabled === false) throw new BadRequestException('The enquiry form is switched off.');
    const f = { ...DEFAULT_FIELDS, ...(form.fields ?? {}) };
    const missing: string[] = [];
    const need: [string, string][] = [['childName', d.childName], ['phone', d.phone], ['program', d.program], ['visitDate', d.visitDate], ['childAge', d.childAge], ['preferredContact', d.preferredContact], ['message', d.message]];
    for (const [k, v] of need) if (f[k]?.show && f[k]?.required && !clean(v)) missing.push(k);
    if (missing.length) throw new BadRequestException({ statusCode: 400, message: 'Validation failed', issues: missing.map((m) => ({ path: m, message: 'This field is required' })) });
    const known = (form.programs ?? []).map((p) => p.value);
    if (d.program && known.length && !known.includes(d.program)) throw new BadRequestException('Please choose one of the listed programmes.');
    const routing = await this.setting<{ recipients?: string[]; rules?: { program: string; recipients?: string[]; assigneeEmail?: string }[]; autoReply?: boolean }>('enquiry.routing', {});
    const rule = (routing.rules ?? []).find((r) => r.program && r.program === d.program);
    let assigneeId: string | null = null;
    if (rule?.assigneeEmail) assigneeId = (await this.db.user.findFirst({ where: { email: rule.assigneeEmail.toLowerCase(), deletedAt: null, isActive: true }, select: { id: true } }))?.id ?? null;
    const row = await this.db.enquiry.create({
      data: {
        type: d.program || d.visitDate ? 'ADMISSION' : 'CONTACT', name: clean(d.parentName), email: d.email.toLowerCase(), phone: clean(d.phone) || null, message: clean(d.message) || null,
        childName: clean(d.childName) || null, childAge: clean(d.childAge) || null, interest: clean(d.program) || null, preferredContact: d.preferredContact || null, visitDate: d.visitDate || null,
        consentAt: new Date(), consentText: clean(d.consentText) || 'Agreed to be contacted about this enquiry', locale: d.locale, page: clean(d.page) || null, referrer: clean(d.referrer) || null, source: 'contact-form', assigneeId,
      },
    });
    await identifyVisitor(this.db, d.vid, { email: d.email, name: clean(d.parentName) });
    await this.db.consent.create({ data: { type: 'DATA_PROCESSING', granted: true, textVersion: `enquiry-form: ${clean(d.consentText).slice(0, 200)}`, ip } }).catch(() => undefined);
    const label = (form.programs ?? []).find((p) => p.value === d.program)?.label;
    const programName = label?.[d.locale] || label?.en || d.program || '-';
    const fallbackTo = String(((await this.setting<any>('public.contact', {})).email) ?? '');
    const to = [...new Set([...(rule?.recipients ?? []), ...(routing.recipients ?? [])].filter(Boolean))];
    if (!to.length && fallbackTo) to.push(fallbackTo);
    const vars = { parentName: clean(d.parentName), childName: clean(d.childName) || '-', email: d.email, phone: clean(d.phone) || '-', program: programName, visitDate: d.visitDate || '-', message: clean(d.message) || '-', link: `${config.WEB_URL.replace(/\/$/, '')}/admin/leads` };
    let sent = 0; for (const r of to) if (await this.tpl.send('enquiry-admin', r, vars, 'en')) sent++;
    if (routing.autoReply !== false) { const c = await this.setting<any>('public.contact', {}); await this.tpl.send('enquiry-reply', d.email, { parentName: vars.parentName, childName: clean(d.childName) || (d.locale === 'ar' ? 'طفلكم' : 'your child'), program: programName, phone: String(c.phone ?? '') }, d.locale); }
    await this.notes.notify({ type: 'enquiry', severity: 'success', title: `New enquiry from ${vars.parentName}`, body: `${programName}${d.visitDate ? ` · visit ${d.visitDate}` : ''}${sent ? '' : ' · email alert could not be sent'}`, link: `/admin/leads?open=${row.id}` });
    return { ok: true };
  }

  async subscribe(d: z.infer<typeof newsletterSchema>, ip?: string) {
    if (d.hp) return { ok: true };
    const email = d.email.toLowerCase();
    await identifyVisitor(this.db, d.vid, { email, name: clean(d.name) });
    const ex = await this.db.enquiry.findFirst({ where: { type: 'NEWSLETTER', email, deletedAt: null } });
    if (!ex) {
      await this.db.enquiry.create({ data: { type: 'NEWSLETTER', name: clean(d.name) || email.split('@')[0], email, consentAt: new Date(), consentText: 'Agreed to receive news and updates by email', locale: d.locale, page: clean(d.page) || null, source: 'newsletter-signup' } });
      await this.db.consent.create({ data: { type: 'MARKETING', granted: true, textVersion: 'newsletter-signup-v1', ip } }).catch(() => undefined);
      await this.notes.notify({ type: 'lead', severity: 'info', title: 'New email subscriber', body: email, link: '/admin/leads?type=NEWSLETTER' });
    }
    return { ok: true };
  }

  async logConsent(d: z.infer<typeof consentSchema>) {
    await this.db.consentLog.create({ data: { cid: d.cid, analytics: d.analytics, marketing: d.marketing, version: d.version } });
    return { ok: true };
  }

  async testimonials(place: string, locale: string) {
    const rows = await this.db.testimonial.findMany({ where: { deletedAt: null, status: 'PUBLISHED' }, orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }], take: 60 });
    return rows.filter((r) => ((r.places as string[] | null) ?? []).includes(place)).map((r) => ({ id: r.id, name: r.authorName, child: r.childName, body: r.body, rating: r.rating, imageUrl: r.imageUrl, featured: r.featured, locale }));
  }

  // ───────── admin: leads ─────────
  async leads(q: { status?: string; type?: string; q?: string; page: number; mine?: string }) {
    const where: any = { deletedAt: null, ...(q.status ? { status: q.status } : {}), ...(q.type ? { type: q.type } : {}) };
    if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q, mode: 'insensitive' } }, { phone: { contains: q.q } }, { childName: { contains: q.q, mode: 'insensitive' } }];
    const [rows, total, counts] = await Promise.all([
      this.db.enquiry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * 30, take: 30, include: { assignee: { select: { id: true, name: true, avatarUrl: true } } } }),
      this.db.enquiry.count({ where }),
      this.db.enquiry.groupBy({ by: ['status'], where: { deletedAt: null, type: { not: 'NEWSLETTER' } }, _count: true }),
    ]);
    const overdue = await this.db.enquiry.count({ where: { deletedAt: null, followUpAt: { lt: new Date() }, status: { in: ['NEW', 'CONTACTED', 'TOUR'] } } });
    return { total, page: q.page, pageSize: 30, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])), overdue, rows: rows.map((r) => ({ ...r, notes: r.notes ?? [] })) };
  }
  async updateLead(id: string, d: z.infer<typeof leadUpdate>, actor: { sub: string }) {
    const cur = await this.db.enquiry.findFirst({ where: { id, deletedAt: null } });
    if (!cur) throw new NotFoundException();
    const notes = Array.isArray(cur.notes) ? [...(cur.notes as any[])] : [];
    if (d.note) notes.push({ at: new Date().toISOString(), by: actor.sub, text: clean(d.note) });
    const data: any = { ...(d.status ? { status: d.status } : {}), ...(d.assigneeId !== undefined ? { assigneeId: d.assigneeId } : {}), ...(d.followUpAt !== undefined ? { followUpAt: d.followUpAt ? new Date(d.followUpAt) : null } : {}), ...(d.note ? { notes } : {}) };
    audit({ label: `Lead “${cur.name}”`, entity: 'admin/leads', entityId: id, before: { status: cur.status, assigneeId: cur.assigneeId, followUpAt: cur.followUpAt }, after: { status: data.status ?? cur.status, assigneeId: data.assigneeId ?? cur.assigneeId, followUpAt: data.followUpAt ?? cur.followUpAt, ...(d.note ? { note: d.note } : {}) } });
    await this.db.enquiry.update({ where: { id }, data });
    return { ok: true };
  }
  async deleteLead(id: string) {
    const r = await this.db.enquiry.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), name: 'Deleted', email: `deleted+${id}@invalid.local`, phone: null, message: null, childName: null } });
    if (!r.count) throw new NotFoundException();
    audit({ label: 'Lead deleted (personal data erased)', entity: 'admin/leads', entityId: id });
    return { ok: true };
  }
  async sendAdmissions(id: string) {
    const l = await this.db.enquiry.findFirst({ where: { id, deletedAt: null } });
    if (!l) throw new NotFoundException();
    const c = await this.setting<any>('public.contact', {});
    const loc = l.locale === 'ar' ? 'ar' : 'en';
    const ok = await this.tpl.send('admissions', l.email, { parentName: l.name, childName: l.childName || (loc === 'ar' ? 'طفلكم' : 'your child'), phone: String(c.phone ?? ''), link: `${config.WEB_URL.replace(/\/$/, '')}/${loc}/admissions` }, loc);
    if (!ok) throw new BadRequestException('The email could not be sent. Check Email settings in Integrations, and that the “Admissions information” template is switched on.');
    if (l.status === 'NEW') await this.db.enquiry.update({ where: { id }, data: { status: 'CONTACTED' } });
    return { ok: true };
  }
  assignees() { return this.db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, avatarUrl: true }, orderBy: { name: 'asc' }, take: 200 }); }
  async csv() {
    const rows = await this.db.enquiry.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20000, include: { assignee: { select: { name: true } } } });
    const head = ['Date', 'Type', 'Status', 'Parent name', 'Email', 'Phone', 'Child name', 'Child age', 'Programme', 'Preferred contact', 'Preferred visit', 'Message', 'Source', 'Page', 'Language', 'Consent given at', 'Assigned to', 'Follow-up'];
    const lines = rows.map((r) => [r.createdAt.toISOString(), r.type, r.status, r.name, r.email, r.phone, r.childName, r.childAge, r.interest, r.preferredContact, r.visitDate, r.message, r.source, r.page, r.locale, r.consentAt?.toISOString(), r.assignee?.name, r.followUpAt?.toISOString()].map(csvCell).join(','));
    audit({ label: `Exported ${rows.length} leads to CSV`, entity: 'admin/leads', action: 'download' });
    return '﻿' + [head.map(csvCell).join(','), ...lines].join('\r\n');
  }

  // ───────── admin: testimonials ─────────
  list() { return this.db.testimonial.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }); }
  async save(id: string | null, d: z.infer<typeof testimonialSchema>, actor: { sub: string }) {
    const data = { authorName: d.authorName, childName: d.childName || null, body: d.body as any, rating: d.rating, imageUrl: d.imageUrl || null, status: d.status, featured: d.featured, places: d.places as any, sortOrder: d.sortOrder, source: 'admin', approvedBy: d.status === 'PUBLISHED' ? actor.sub : null };
    if (id) { if (!(await this.db.testimonial.findFirst({ where: { id, deletedAt: null } }))) throw new NotFoundException(); await this.db.testimonial.update({ where: { id }, data }); }
    else id = (await this.db.testimonial.create({ data })).id;
    audit({ label: `Testimonial from ${d.authorName}`, entity: 'admin/testimonials', entityId: id });
    await this.rev.run(['content']);
    return { id };
  }
  async remove(id: string) { await this.db.testimonial.updateMany({ where: { id }, data: { deletedAt: new Date() } }); await this.rev.run(['content']); return { ok: true }; }

  async consentSummary() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const rows = await this.db.consentLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 5000 });
    const latest = new Map<string, (typeof rows)[number]>(); for (const r of rows) if (!latest.has(r.cid)) latest.set(r.cid, r);
    const v = [...latest.values()];
    return { days: 30, visitors: v.length, analytics: v.filter((x) => x.analytics).length, marketing: v.filter((x) => x.marketing).length, necessaryOnly: v.filter((x) => !x.analytics && !x.marketing).length, recent: rows.slice(0, 25).map((r) => ({ at: r.createdAt, analytics: r.analytics, marketing: r.marketing, version: r.version })) };
  }
}

@Controller('public')
export class EngagePublicController {
  constructor(private e: EngageService) {}
  @Post('enquiry') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  enquiry(@Body() b: unknown, @Req() req: AuthedRequest) { return this.e.submitEnquiry(enquirySchema.parse(b), req.ip); }
  @Post('newsletter') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  newsletter(@Body() b: unknown, @Req() req: AuthedRequest) { return this.e.subscribe(newsletterSchema.parse(b), req.ip); }
  @Post('consent') @HttpCode(204) @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async consent(@Body() b: unknown) { await this.e.logConsent(consentSchema.parse(b)); }
  @Get('testimonials') @Throttle({ default: { limit: 600, ttl: 60_000 } })
  testimonials(@Query('place') place = 'home', @Query('locale') locale = 'en') { return this.e.testimonials(z.enum(['home', 'about', 'testimonials']).parse(place), z.enum(['en', 'ar']).parse(locale)); }
}

@Controller('admin/leads')
export class LeadsController {
  constructor(private e: EngageService) {}
  @Get() @Secured('lead:read') list(@Query('status') status?: string, @Query('type') type?: string, @Query('q') q?: string, @Query('page') page = '1') {
    return this.e.leads({ status: z.enum(['NEW', 'CONTACTED', 'TOUR', 'OFFERED', 'ENROLLED', 'DECLINED']).optional().parse(status || undefined), type: z.enum(['GENERAL', 'ADMISSION', 'CONTACT', 'NEWSLETTER']).optional().parse(type || undefined), q: (q ?? '').slice(0, 80) || undefined, page: Math.max(1, parseInt(page, 10) || 1) });
  }
  @Get('assignees') @Secured('lead:read') assignees() { return this.e.assignees(); }
  @Get('export.csv') @Secured('lead:read') @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async export(@Res() res: Response) {
    const csv = await this.e.csv();
    res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`); res.setHeader('cache-control', 'no-store');
    res.send(csv);
  }
  @Put(':id') @Secured('lead:update') update(@Param('id') id: string, @Body() b: unknown, @Req() req: AuthedRequest) { return this.e.updateLead(cuid.parse(id), leadUpdate.parse(b), req.user!); }
  @Post(':id/send-admissions') @HttpCode(200) @Secured('lead:update') @Throttle({ default: { limit: 10, ttl: 60_000 } }) admissions(@Param('id') id: string) { return this.e.sendAdmissions(cuid.parse(id)); }
  @Delete(':id') @Secured('lead:delete') remove(@Param('id') id: string) { return this.e.deleteLead(cuid.parse(id)); }
}

@Controller('admin/testimonials')
export class TestimonialsController {
  constructor(private e: EngageService) {}
  @Get() @Secured('testimonial:read') list() { return this.e.list(); }
  @Post() @HttpCode(201) @Secured('testimonial:update') create(@Body() b: unknown, @Req() req: AuthedRequest) { return this.e.save(null, testimonialSchema.parse(b), req.user!); }
  @Put(':id') @Secured('testimonial:update') update(@Param('id') id: string, @Body() b: unknown, @Req() req: AuthedRequest) { return this.e.save(cuid.parse(id), testimonialSchema.parse(b), req.user!); }
  @Delete(':id') @Secured('testimonial:update') remove(@Param('id') id: string) { return this.e.remove(cuid.parse(id)); }
}

@Controller('admin/consents')
export class ConsentsController {
  constructor(private e: EngageService) {}
  @Get('summary') @Secured('settings:read') summary() { return this.e.consentSummary(); }
}

@Controller('admin/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private n: NotificationsService) {}
  @Get() list(@Req() req: AuthedRequest) { return this.n.list(req.user!.sub); }
  @Post('read') @HttpCode(200) async read(@Body() b: unknown, @Req() req: AuthedRequest) { const d = z.object({ ids: z.array(cuid).max(200).optional() }).parse(b ?? {}); await this.n.markRead(req.user!.sub, d.ids); return { ok: true }; }
  @Delete() async clear(@Req() req: AuthedRequest) { await this.n.clear(req.user!.sub); return { ok: true }; }
}

@Module({ controllers: [EngagePublicController, LeadsController, TestimonialsController, ConsentsController, NotificationsController], providers: [EngageService] })
export class EngageModule {}

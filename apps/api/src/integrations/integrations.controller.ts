import { Body, Controller, Get, HttpCode, Module, Param, Post, Put, Req } from '@nestjs/common';
import { Global } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AuthedRequest, Secured, SecuredAny } from '../common/security';
import { PrismaService } from '../common/common.module';
import { IntegrationsService } from './integrations.service';
import { MailService } from './mail.service';
import { EmailTemplatesService } from './email-templates.service';
import { PublicAssetsController, UsageController } from './public-assets.controller';

const cloudName = z.string().trim().regex(/^[a-zA-Z0-9_-]{2,60}$/, 'Cloud name: letters, numbers, - and _ only');
const schema = z.object({
  cloudinary: z.object({
    enabled: z.boolean().optional(),
    cloudName: cloudName.or(z.literal('')).optional(),
    apiKey: z.string().trim().regex(/^(\d{6,24})?$/, 'Cloudinary API key is digits only').optional(),
    apiSecret: z.string().trim().max(200).optional(),
    folder: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/i, 'Folder: letters, numbers, - and _').optional(),
  }).optional(),
  resend: z.object({
    enabled: z.boolean().optional(),
    apiKey: z.string().trim().regex(/^(re_[A-Za-z0-9_]{10,})?$/, 'Resend API keys start with re_').optional(),
    fromEmail: z.string().trim().email().or(z.literal('')).optional(),
    fromName: z.string().trim().max(80).optional(),
    replyTo: z.string().trim().email().or(z.literal('')).optional(),
  }).optional(),
  google: z.object({
    translateApiKey: z.string().trim().regex(/^(AIza[0-9A-Za-z_-]{30,60})?$/, 'Google API keys start with AIza').optional(),
    clearTranslateKey: z.boolean().optional(),
  }).optional(),
});
const translateSchema = z.object({
  texts: z.array(z.string().max(5000)).min(1).max(150),
  source: z.enum(['en', 'ar']).default('en'),
  target: z.enum(['en', 'ar']).default('ar'),
}).refine((d) => d.texts.reduce((n, t) => n + t.length, 0) <= 40_000, 'Too much text at once').refine((d) => d.source !== d.target, 'Source and target must differ');

@Controller('admin/integrations')
export class IntegrationsController {
  constructor(private s: IntegrationsService, private mail: MailService, private db: PrismaService) {}

  @Get() @Secured('integration:read')
  get() { return this.s.view(); }

  @Put() @Secured('integration:update')
  save(@Body() b: unknown) { return this.s.save(schema.parse(b)); }

  @Post('test-translate') @HttpCode(200) @Secured('integration:update') @Throttle({ default: { limit: 10, ttl: 60_000 } })
  testTranslate() { return this.s.testTranslate().catch((e) => ({ ok: false, message: e?.message ?? 'Failed' })); }

  @Post('test-cloudinary') @HttpCode(200) @Secured('integration:update') @Throttle({ default: { limit: 10, ttl: 60_000 } })
  testCloudinary() { return this.s.testCloudinary().catch((e) => ({ ok: false, message: e?.message ?? 'Failed' })); }

  /** Sends a real test email to the signed-in admin's own address. */
  @Post('test-resend') @HttpCode(200) @Secured('integration:update') @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async testResend(@Req() req: AuthedRequest) {
    const email = await this.db.user.findUnique({ where: { id: req.user!.sub }, select: { email: true } });
    const m = MailService.layout('Test email', 'Your Resend settings work. This message was sent from Admin → Integrations.', undefined, await this.mail.logo());
    try {
      await this.mail.send({ to: email!.email, subject: 'Seven Oaks: test email', ...m });
      return { ok: true, message: `Test email sent to ${email!.email}.` };
    } catch (e: any) {
      return { ok: false, message: e?.message ?? 'Failed' };
    }
  }
}

@Controller('admin/translate')
export class TranslateController {
  constructor(private s: IntegrationsService) {}
  @Post() @HttpCode(200) @SecuredAny('page:update', 'email:update', 'entry:update') @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async translate(@Body() b: unknown, @Req() req: AuthedRequest) {
    const d = translateSchema.parse(b);
    return { texts: await this.s.translate(d.texts, d.source, d.target, req.user!.sub) };
  }
}

const i18n = z.object({ en: z.string().max(5000).default(''), ar: z.string().max(5000).default('') });
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a colour like #1f4d2b');
const url = z.string().trim().max(300).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Must start with https://');
const sk = url.default('');
const brandSchema = z.object({
  headerBg: color, accent: color, buttonBg: color, buttonText: color, headingColor: color.default('#1f4d2b'), textColor: color.default('#1f2937'),
  showLogo: z.boolean(), logoUrl: z.string().trim().max(500).refine((v) => v === '' || /^https:\/\//.test(v), 'The logo must be an https:// picture').default(''),
  logoAlign: z.enum(['start', 'center', 'end']).default('start'), logoSize: z.enum(['small', 'medium', 'large']).default('medium'), logoOnWhite: z.boolean().default(true),
  fontFamily: z.enum(['arial', 'tahoma', 'verdana', 'trebuchet', 'georgia']).default('arial'), fontSize: z.number().int().min(14).max(19).default(16),
  footerText: i18n, address: i18n, phone: z.string().trim().max(40).regex(/^[0-9+()\-\s]*$/, 'Phone may only contain digits, spaces, + ( ) -').default(''), email: z.string().trim().max(120).refine((v) => v === '' || /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(v), 'Enter a valid email').default(''),
  social: z.object({ facebook: sk, instagram: sk, whatsapp: sk, youtube: sk, tiktok: sk, x: sk, linkedin: sk, snapchat: sk, website: sk }), socialStyle: z.enum(['brand', 'dark']).default('brand'),
});
const templateSchema = z.object({ subject: i18n, heading: i18n, body: i18n, buttonLabel: i18n, enabled: z.boolean() });
const previewSchema = z.object({ locale: z.enum(['en', 'ar']).default('en'), draft: templateSchema.partial().optional(), brand: brandSchema.optional() });
const testSchema = previewSchema.extend({ to: z.string().email().max(254) });
const quotaSchema = z.object({ monthlyLimit: z.number().int().min(1000).max(1_000_000_000), freeChars: z.number().int().min(0).max(1_000_000_000), pricePerMillion: z.number().min(0).max(1000), blockAtLimit: z.boolean() });

@Controller('admin/email')
export class EmailAdminController {
  constructor(private t: EmailTemplatesService) {}
  @Get('templates') @Secured('email:read') list() { return this.t.list().then(async (templates) => ({ templates, brand: await this.t.brand() })); }
  @Put('templates/:key') @Secured('email:update') save(@Param('key') k: string, @Body() b: unknown) { return this.t.save(k, templateSchema.parse(b) as any); }
  @Post('templates/:key/reset') @HttpCode(200) @Secured('email:update') reset(@Param('key') k: string) { return this.t.reset(k); }
  @Put('brand') @Secured('email:update') brand(@Body() b: unknown) { return this.t.saveBrand(brandSchema.parse(b) as any); }
  @Post('templates/:key/preview') @HttpCode(200) @Secured('email:read') @Throttle({ default: { limit: 60, ttl: 60_000 } })
  preview(@Param('key') k: string, @Body() b: unknown) { const d = previewSchema.parse(b); return this.t.preview(k, d.locale, d.draft as any, d.brand as any); }
  @Post('templates/:key/test') @HttpCode(200) @Secured('email:update') @Throttle({ default: { limit: 8, ttl: 60_000 } })
  test(@Param('key') k: string, @Body() b: unknown) { const d = testSchema.parse(b); return this.t.test(k, d.to, d.locale, d.draft as any, d.brand as any); }
}

@Controller('admin/translation')
export class TranslationUsageController {
  constructor(private s: IntegrationsService) {}
  @Get('usage') @Secured('integration:read') usage() { return this.s.usage(); }
  @Put('quota') @Secured('integration:update') quota(@Body() b: unknown) { return this.s.saveQuota(quotaSchema.parse(b)); }
}

@Global()
@Module({ controllers: [IntegrationsController, TranslateController, EmailAdminController, TranslationUsageController, PublicAssetsController, UsageController], providers: [IntegrationsService, MailService, EmailTemplatesService], exports: [IntegrationsService, MailService, EmailTemplatesService] })
export class IntegrationsModule {}

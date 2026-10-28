import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/common.module';
import { config } from '../config';
import { DEFAULT_BRAND, EmailBrand, FONTS, I18n, SOCIAL_KEYS, TEMPLATES, TemplateDef } from './email-templates';
import { bannerHtml, blocksHtml, blocksText, btnHtml, Design, mix, palette } from './email-design';
import { IntegrationsService } from './integrations.service';
import { MailService } from './mail.service';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const safeUrl = (u: string) => (/^(https?:\/\/|mailto:|tel:)/i.test(u.trim()) ? u.trim() : '');
export type Locale = 'en' | 'ar';
export interface TemplateData { subject: I18n; heading: I18n; body: I18n; buttonLabel: I18n; enabled: boolean }

@Injectable()
export class EmailTemplatesService {
  constructor(private db: PrismaService, private integ: IntegrationsService, private mail: MailService) {}

  def(key: string): TemplateDef { const d = TEMPLATES.find((t) => t.key === key); if (!d) throw new NotFoundException('Unknown template'); return d; }

  async brand(): Promise<EmailBrand> {
    const row = await this.db.siteSetting.findUnique({ where: { key: 'email.brand' } });
    const b = (row?.value ?? {}) as Partial<EmailBrand>;
    return { ...DEFAULT_BRAND, ...b, footerText: { ...DEFAULT_BRAND.footerText, ...(b.footerText ?? {}) }, address: { ...DEFAULT_BRAND.address, ...(b.address ?? {}) }, social: { ...DEFAULT_BRAND.social, ...(b.social ?? {}) } };
  }

  async data(key: string): Promise<TemplateData> {
    const d = this.def(key);
    const row = await this.db.emailTemplate.findUnique({ where: { key } });
    const pick = (a: any, b: I18n | undefined): I18n => ({ en: a?.en ?? b?.en ?? '', ar: a?.ar ?? b?.ar ?? '' });
    return { subject: pick(row?.subject, d.subject), heading: pick(row?.heading, d.heading), body: pick(row?.body, d.body), buttonLabel: pick(row?.buttonLabel, d.buttonLabel), enabled: row?.enabled ?? true };
  }

  async list() {
    const rows = await this.db.emailTemplate.findMany();
    const m = new Map(rows.map((r) => [r.key, r]));
    return Promise.all(TEMPLATES.map(async (d) => ({ key: d.key, name: d.name, description: d.description, hasButton: d.hasButton, vars: d.vars, customised: m.has(d.key), updatedAt: m.get(d.key)?.updatedAt ?? null, ...(await this.data(d.key)) })));
  }

  async save(key: string, t: TemplateData) {
    this.def(key);
    const data = { subject: t.subject as any, heading: t.heading as any, body: t.body as any, buttonLabel: t.buttonLabel as any, enabled: t.enabled };
    await this.db.emailTemplate.upsert({ where: { key }, update: data, create: { key, ...data } });
    return { ok: true };
  }
  async reset(key: string) { this.def(key); await this.db.emailTemplate.deleteMany({ where: { key } }); return { ok: true }; }

  async saveBrand(b: EmailBrand) {
    await this.db.siteSetting.upsert({ where: { key: 'email.brand' }, update: { value: b as unknown as Prisma.InputJsonValue }, create: { key: 'email.brand', value: b as unknown as Prisma.InputJsonValue } });
    return { ok: true };
  }

  /** Replaces {{name}} placeholders. Values are plain text; unknown placeholders are left visible so mistakes are noticed. */
  private fill(text: string, vars: Record<string, string>) { return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m)); }

  /** Minimal safe formatting: blank line = new paragraph, **bold**, a line starting with “# ” is a big highlighted line (codes). */
  private blocks(text: string, brand: EmailBrand, size = 16) {
    const bold = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    return text.split(/\n{2,}/).map((p) => {
      if (p.startsWith('# ')) return `<p style="margin:20px 0;text-align:center"><span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:700;color:${esc(brand.headingColor)};background:#f3f4f6;border-radius:10px;padding:12px 22px" dir="ltr">${esc(p.slice(2).trim())}</span></p>`;
      return `<p style="margin:0 0 16px;line-height:1.7;font-size:${size}px">${bold(p)}</p>`;
    }).join('');
  }

  /** Mixes a colour with white, for soft tinted bands (0 = the colour, 1 = white). */
  private tint(hex: string, amount: number) {
    const n = parseInt(hex.replace('#', ''), 16), f = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0');
    return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
  }
  iconUrl(name: string, hex: string) { return `${config.WEB_URL.replace(/\/$/, '')}/api/public/email-icon/${name}.png?c=${hex.replace('#', '').toLowerCase()}`; }

  private async frame(locale: Locale, t: TemplateData, vars: Record<string, string>, d: Pick<TemplateDef, 'hasButton'>, overrides?: { brand?: EmailBrand; logo?: string }, opts: { unsubscribeUrl?: string; celebrate?: boolean; design?: Design } = {}) {
    const brand0 = overrides?.brand ?? (await this.brand());
    const design = opts.design;
    const pal = palette(design, brand0);
    const brand: EmailBrand = { ...brand0, headerBg: pal.headerBg, accent: pal.accent, headingColor: pal.headingColor, textColor: pal.textColor, buttonBg: pal.buttonBg, buttonText: pal.buttonText };
    const logoRaw = brand.logoUrl && brand.logoUrl.startsWith('https://') ? brand.logoUrl : overrides?.logo ?? (await this.mail.logo());
    const logo = brand.showLogo ? logoRaw : '';
    const nurseryName = vars.nurseryName || (await this.nurseryName(locale));
    const all: Record<string, string> = { nurseryName, ...vars };
    const rtl = locale === 'ar', dir = rtl ? 'rtl' : 'ltr', align = rtl ? 'right' : 'left', opp = rtl ? 'left' : 'right';
    const heading = this.fill(t.heading[locale] || t.heading.en, all);
    const body = this.fill(t.body[locale] || t.body.en, all);
    const subject = this.fill(t.subject[locale] || t.subject.en, all);
    const btnLabel = this.fill(t.buttonLabel[locale] || t.buttonLabel.en, all);
    const link = safeUrl(all.link ?? '');
    const showBtn = d.hasButton && !!link && !!btnLabel;
    const font = design ? pal.font : (FONTS[brand.fontFamily] ?? FONTS.arial);
    const size = Math.min(19, Math.max(14, Number(design?.fontSize || brand.fontSize) || 16));
    const logoAlign = brand.logoAlign === 'center' ? 'center' : brand.logoAlign === 'end' ? opp : align;
    const logoH = { small: 32, medium: 44, large: 64 }[brand.logoSize] ?? 44;
    const iconHex = brand.socialStyle === 'dark' ? '374151' : brand.headerBg.replace('#', '');
    const label: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', whatsapp: 'WhatsApp', youtube: 'YouTube', tiktok: 'TikTok', x: 'X', linkedin: 'LinkedIn', snapchat: 'Snapchat', website: rtl ? 'الموقع' : 'Website' };
    const social = SOCIAL_KEYS.map((k) => [k, safeUrl(brand.social[k] ?? '')] as const).filter(([, u]) => u);
    const footer = this.fill(brand.footerText[locale] || brand.footerText.en, all);
    const addr = this.fill(brand.address[locale] || brand.address.en, all);
    const phone = brand.phone?.trim(), mail = brand.email?.trim();
    const mailOk = !!mail && /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(mail);
    const unsub = opts.unsubscribeUrl ? `<p style="margin:12px 0 0"><a href="${esc(opts.unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline">${rtl ? 'إلغاء الاشتراك من هذه الرسائل' : 'Unsubscribe from these emails'}</a></p>` : '';
    const confetti = opts.celebrate ? `<tr><td style="background:${this.tint(brand.accent, 0.82)};padding:10px 28px;text-align:center;font-size:22px;letter-spacing:10px;line-height:1.4" aria-hidden="true">🎉 ✨ 🌳 ✨ 🎉</td></tr>` : '';
    const fs = design?.footer?.style ?? 'light';
    const fBg = design?.footer?.bg || (fs === 'brand' ? brand.headerBg : fs === 'dark' ? '#111827' : '');
    const fCol = fBg ? '#e5e7eb' : (design && pal.cardBg !== '#ffffff' && pal.textColor ? mix(pal.textColor, pal.cardBg, 0.25) : '#6b7280');
    const fLink = fBg ? '#ffffff' : (fCol === '#6b7280' ? '#374151' : fCol);
    const showSoc = design?.footer?.showSocial !== false;
    const fNote = design?.footer?.note ? this.fill(design.footer.note[locale] || design.footer.note.en || '', all) : '';
    const cardBg = pal.cardBg, rad = design ? pal.radius : 14;
    const ctx = { locale, fill: (x: string) => this.fill(x, all), fmt: (x: string, sz: number) => this.blocks(x, brand, sz), size, p: pal, align, opp };
    const bAlt = design?.banner ? this.fill(design.banner.alt?.[locale] || design.banner.alt?.en || nurseryName, all) : '';
    const pos = design?.banner?.url ? design.banner.position : '';
    const bTop = pos === 'top' ? bannerHtml(design, ctx, bAlt) : '', bAfter = pos === 'afterHeading' ? bannerHtml(design, ctx, bAlt).replace(/^<tr><td style="/, '<div style="').replace(/<\/td><\/tr>$/, '</div>') : '', bBottom = pos === 'bottom' ? bannerHtml(design, ctx, bAlt) : '';
    const side = pos === 'sideStart' || pos === 'sideEnd';
    const sideImg = side ? bannerHtml(design, ctx, bAlt).replace(/^<tr><td style="[^"]*">/, '').replace(/<\/td><\/tr>$/, '').replace('width="100%"', 'width="220"').replace(/height:\d+px;/, 'height:auto;min-height:180px;') : '';
    const extra = design?.blocks?.length ? blocksHtml(design.blocks, ctx) : '';
    const hSize = design?.headingSize ?? 24, hAlign = design?.headingAlign === 'center' ? 'center' : align;
    const mainBtn = showBtn ? (design ? `<div style="margin:26px 0 8px;text-align:${design.button.align === 'center' ? 'center' : design.button.align === 'end' ? opp : align}">${btnHtml(btnLabel, link, design.button.align, ctx, design.button.fullWidth)}</div>` : `<p style="margin:26px 0 8px"><a href="${esc(link)}" style="display:inline-block;background:${esc(brand.buttonBg)};color:${esc(brand.buttonText)};padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700">${esc(btnLabel)}</a></p>`) + `<p style="font-size:12px;color:#6b7280;word-break:break-all">${rtl ? 'إذا لم يعمل الزر انسخ هذا الرابط:' : 'If the button does not work, copy this link:'} ${esc(link)}</p>` : '';
    const headBlock = `<h1 style="margin:0 0 18px;font-size:${hSize}px;line-height:1.3;text-align:${hAlign};color:${esc(brand.headingColor)}">${esc(heading)}</h1>${bAfter}${this.blocks(body, brand, size)}`;
    const mainCell = side ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${pos === 'sideStart' ? `<td class="so-col" width="220" valign="top" style="padding-${opp}:18px">${sideImg}</td>` : ''}<td class="so-col" valign="top">${headBlock}</td>${pos === 'sideEnd' ? `<td class="so-col" width="220" valign="top" style="padding-${align}:18px">${sideImg}</td>` : ''}</tr></table>` : headBlock;
    const html = `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title><style>@media only screen and (max-width:480px){.so-col{display:block!important;width:100%!important;padding:0 0 12px!important}}</style></head>
<body style="margin:0;padding:0;background:${esc(pal.pageBg)};font-family:${font};color:${esc(brand.textColor)}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${esc(pal.pageBg)}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${esc(cardBg)};border-radius:${rad}px;overflow:hidden">
<tr><td style="background:${esc(brand.headerBg)};padding:22px 28px;text-align:${logoAlign}">${logo.startsWith('https://') ? `<img src="${esc(logo)}" alt="${esc(nurseryName)}" height="${logoH}" style="height:${logoH}px;width:auto;border:0;display:inline-block;${brand.logoOnWhite ? 'background:#fff;border-radius:10px;padding:5px;' : ''}">` : `<span style="color:#fff;font-size:20px;font-weight:700">${esc(nurseryName)}</span>`}</td></tr>
<tr><td style="height:4px;background:${esc(brand.accent)};line-height:4px;font-size:0">&nbsp;</td></tr>${bTop}${confetti}
<tr><td style="padding:32px 28px 8px;text-align:${align};font-size:${size}px" dir="${dir}">${mainCell}${extra}${mainBtn}</td></tr>
${bBottom}<tr><td style="padding:22px 28px 28px;${fBg ? `background:${esc(fBg)};` : 'border-top:1px solid #e5e7eb;'}text-align:${align};font-size:12px;color:${fCol};line-height:1.7" dir="${dir}">
${social.length && showSoc ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px"><tr>${social.map(([k, u]) => `<td style="padding-${opp}:10px"><a href="${esc(u)}" style="text-decoration:none"><img src="${esc(this.iconUrl(k, iconHex))}" width="32" height="32" alt="${label[k]}" style="display:block;border:0;border-radius:16px;color:${esc(brand.headerBg)};font-size:11px"></a></td>`).join('')}</tr></table>` : ''}
${addr ? `<p style="margin:0 0 4px">${esc(addr).replace(/\n/g, '<br>')}</p>` : ''}${phone ? `<p style="margin:0 0 4px"><a href="tel:${esc(phone.replace(/[^+\d]/g, ''))}" style="color:${fLink};text-decoration:none" dir="ltr">${esc(phone)}</a></p>` : ''}${mailOk ? `<p style="margin:0 0 4px"><a href="mailto:${esc(mail!)}" style="color:${fLink};text-decoration:none">${esc(mail!)}</a></p>` : ''}<p style="margin:10px 0 0">${esc(footer)}</p>${fNote ? `<p style="margin:8px 0 0">${esc(fNote)}</p>` : ''}${unsub}</td></tr></table></td></tr></table></body></html>`;
    const text = `${heading}\n\n${body.replace(/\*\*/g, '').replace(/^# /gm, '')}${design?.blocks?.length ? `\n\n${blocksText(design.blocks, locale, (x) => this.fill(x, all))}` : ''}${showBtn ? `\n\n${btnLabel}: ${link}` : ''}\n\n${[addr, phone, mail].filter(Boolean).join('\n')}${addr || phone || mail ? '\n\n' : ''}${footer}${opts.unsubscribeUrl ? `\n\n${rtl ? 'إلغاء الاشتراك' : 'Unsubscribe'}: ${opts.unsubscribeUrl}` : ''}`;
    return { subject, html, text };
  }

  /** A one-off campaign email built from the same brand (logo, colours, footer) as every other email. */
  async renderCampaign(content: { subject: I18n; heading: I18n; body: I18n; buttonLabel: I18n; buttonUrl: string; celebrate: boolean; design?: Design }, locale: Locale, vars: Record<string, string>, opts: { unsubscribeUrl?: string; brand?: EmailBrand } = {}) {
    const t: TemplateData = { subject: content.subject, heading: content.heading, body: content.body, buttonLabel: content.buttonLabel, enabled: true };
    return this.frame(locale, t, { ...vars, link: vars.link || content.buttonUrl.replace(/\{lang\}/g, locale) }, { hasButton: true }, { brand: opts.brand }, { unsubscribeUrl: opts.unsubscribeUrl, celebrate: content.celebrate, design: content.design });
  }

  private async nurseryName(locale: Locale) {
    const r = await this.db.siteSetting.findUnique({ where: { key: 'public.site' } });
    const n = (r?.value as any)?.name;
    return n?.[locale] || n?.en || 'Seven Oaks British Nursery';
  }

  /** Real send: uses the saved template. Returns false if the template is switched off or mail is unavailable. */
  async send(key: string, to: string, vars: Record<string, string>, locale: Locale = 'en') {
    const d = this.def(key);
    const t = await this.data(key);
    if (!t.enabled) return false;
    const m = await this.frame(locale, t, vars, d);
    return this.mail.trySend({ to, ...m });
  }

  /** Like send() but reports the failure reason (used where the person needs to know, e.g. verification codes). */
  async sendOrThrow(key: string, to: string, vars: Record<string, string>, locale: Locale = 'en') {
    const d = this.def(key);
    const t = await this.data(key);
    const m = await this.frame(locale, t, vars, d);
    await this.mail.send({ to, ...m });
  }

  /** Renders any (even unsaved) draft with sample values, for the live preview. */
  async preview(key: string, locale: Locale, draft?: Partial<TemplateData>, brandDraft?: EmailBrand) {
    const d = this.def(key);
    const saved = await this.data(key);
    const t: TemplateData = { ...saved, ...(draft ?? {}) } as TemplateData;
    const vars = Object.fromEntries(d.vars.map((x) => [x.name, x.sample]));
    return this.frame(locale, t, vars, d, { brand: brandDraft });
  }

  async test(key: string, to: string, locale: Locale, draft?: Partial<TemplateData>, brandDraft?: EmailBrand) {
    const p = await this.preview(key, locale, draft, brandDraft);
    await this.mail.send({ to, subject: `[TEST] ${p.subject}`, html: p.html, text: p.text });
    return { ok: true };
  }

  adminBase() { return config.WEB_URL.replace(/\/$/, ''); }
  ensureEmail(e: string) { if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new BadRequestException('Enter a valid email address'); }
}

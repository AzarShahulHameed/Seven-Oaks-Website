// Visual design for campaign emails: colour themes, banner image and its position, typography, button style, footer style and
// dynamic content blocks (text, picture, button, highlight, feature columns, quote, divider, spacer). Pure data in, safe HTML out:
// every value is escaped, colours must be #rrggbb, links must be https://.
import { z } from 'zod';
import { EmailBrand, FONTS, I18n } from './email-templates';

const hex = z.string().regex(/^(#[0-9a-fA-F]{6})?$/, 'Use a colour such as #1f4d2b').default('');
const url = z.string().trim().max(500).refine((v) => v === '' || /^https:\/\//.test(v), 'Must start with https://').default('');
const text = z.object({ en: z.string().max(4000).default(''), ar: z.string().max(4000).default('') }).default({ en: '', ar: '' });

export const THEME_KEYS = ['brand', 'forest', 'sunshine', 'ocean', 'blossom', 'night'] as const;
export const THEMES: Record<string, { label: string; pageBg: string; cardBg: string; headerBg: string; accent: string; headingColor: string; textColor: string; buttonBg: string; buttonText: string }> = {
  brand: { label: 'My brand colours', pageBg: '#f3f4f6', cardBg: '#ffffff', headerBg: '', accent: '', headingColor: '', textColor: '', buttonBg: '', buttonText: '' },
  forest: { label: 'Oak forest', pageBg: '#eaf3e4', cardBg: '#ffffff', headerBg: '#1f4d2b', accent: '#c9a227', headingColor: '#1f4d2b', textColor: '#26332b', buttonBg: '#2f6b3a', buttonText: '#ffffff' },
  sunshine: { label: 'Sunshine', pageBg: '#fff5d6', cardBg: '#fffdf6', headerBg: '#f2a900', accent: '#e76f51', headingColor: '#7a4b00', textColor: '#3b2f1d', buttonBg: '#e76f51', buttonText: '#ffffff' },
  ocean: { label: 'Ocean', pageBg: '#e3f1fa', cardBg: '#ffffff', headerBg: '#1d6fa5', accent: '#62c4d9', headingColor: '#12486d', textColor: '#1f2f3d', buttonBg: '#1d6fa5', buttonText: '#ffffff' },
  blossom: { label: 'Blossom', pageBg: '#fdebf1', cardBg: '#ffffff', headerBg: '#d6577e', accent: '#f5b5c8', headingColor: '#8a2c4d', textColor: '#3d2630', buttonBg: '#d6577e', buttonText: '#ffffff' },
  night: { label: 'Bedtime story', pageBg: '#1b2236', cardBg: '#26304a', headerBg: '#101524', accent: '#ffd166', headingColor: '#ffd166', textColor: '#e6e9f2', buttonBg: '#ffd166', buttonText: '#1b2236' },
};

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), body: text }),
  z.object({ type: z.literal('image'), url, alt: text, link: url, align: z.enum(['start', 'center', 'end']).default('center'), width: z.number().int().min(20).max(100).default(100), rounded: z.boolean().default(true) }),
  z.object({ type: z.literal('button'), label: text, url, align: z.enum(['start', 'center', 'end']).default('center') }),
  z.object({ type: z.literal('callout'), title: text, body: text, bg: hex, emoji: z.string().max(8).default('') }),
  z.object({ type: z.literal('features'), items: z.array(z.object({ emoji: z.string().max(8).default(''), title: text, text })).max(4).default([]) }),
  z.object({ type: z.literal('quote'), body: text, author: text }),
  z.object({ type: z.literal('divider'), style: z.enum(['line', 'dots', 'leaves']).default('line') }),
  z.object({ type: z.literal('spacer'), height: z.number().int().min(8).max(80).default(24) }),
]);

export const designSchema = z.object({
  theme: z.enum(THEME_KEYS).default('brand'),
  pageBg: hex, cardBg: hex, headerBg: hex, accent: hex, headingColor: hex, textColor: hex, buttonBg: hex, buttonText: hex,
  fontFamily: z.enum(['', 'arial', 'tahoma', 'verdana', 'trebuchet', 'georgia']).default(''),
  fontSize: z.number().int().min(14).max(19).default(16),
  headingSize: z.number().int().min(20).max(40).default(26),
  headingAlign: z.enum(['start', 'center']).default('start'),
  corners: z.enum(['square', 'soft', 'round']).default('soft'),
  banner: z.object({
    url, alt: text, link: url,
    position: z.enum(['top', 'afterHeading', 'bottom', 'sideStart', 'sideEnd']).default('top'),
    height: z.enum(['short', 'medium', 'tall']).default('medium'),
    inset: z.boolean().default(false),
  }).default({}),
  button: z.object({ shape: z.enum(['square', 'soft', 'pill']).default('soft'), align: z.enum(['start', 'center', 'end']).default('start'), fullWidth: z.boolean().default(false) }).default({}),
  footer: z.object({ style: z.enum(['light', 'brand', 'dark']).default('light'), bg: hex, showSocial: z.boolean().default(true), note: text }).default({}),
  blocks: z.array(block).max(12).default([]),
});
export type Design = z.infer<typeof designSchema>;
export type Block = z.infer<typeof block>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const RADIUS = { square: 0, soft: 14, round: 28 } as const;
const BTN_RADIUS = { square: 0, soft: 10, pill: 999 } as const;
const BANNER_H = { short: 140, medium: 220, tall: 320 } as const;

export interface Palette { pageBg: string; cardBg: string; headerBg: string; accent: string; headingColor: string; textColor: string; buttonBg: string; buttonText: string; font: string; radius: number; btnRadius: number }

/** Picks the colours: the chosen theme, then any individual colour the editor changed, then the brand colours as the base. */
export function palette(d: Design | undefined, brand: EmailBrand): Palette {
  const th = THEMES[d?.theme ?? 'brand'] ?? THEMES.brand;
  const pick = (own: string | undefined, theme: string, fallback: string) => (own && own.trim() ? own : theme || fallback);
  return {
    pageBg: pick(d?.pageBg, th.pageBg, '#f3f4f6'), cardBg: pick(d?.cardBg, th.cardBg, '#ffffff'),
    headerBg: pick(d?.headerBg, th.headerBg, brand.headerBg), accent: pick(d?.accent, th.accent, brand.accent),
    headingColor: pick(d?.headingColor, th.headingColor, brand.headingColor), textColor: pick(d?.textColor, th.textColor, brand.textColor),
    buttonBg: pick(d?.buttonBg, th.buttonBg, brand.buttonBg), buttonText: pick(d?.buttonText, th.buttonText, brand.buttonText),
    font: FONTS[d?.fontFamily || brand.fontFamily] ?? FONTS.arial, radius: RADIUS[d?.corners ?? 'soft'], btnRadius: BTN_RADIUS[d?.button?.shape ?? 'soft'],
  };
}

/** Mixes two #rrggbb colours (0 = first, 1 = second): soft tints that suit any theme. */
function mix(a: string, b: string, amount: number) {
  const n = (h: string) => parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16), x = n(a), y = n(b);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - amount) + ((y >> s) & 255) * amount).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
export { mix };
const safe = (u: string) => (/^https:\/\//i.test((u ?? '').trim()) ? u.trim() : '');
const pickI = (v: I18n | undefined, loc: 'en' | 'ar') => (v?.[loc] || v?.en || '').toString();

export interface Ctx { locale: 'en' | 'ar'; fill: (s: string) => string; fmt: (s: string, size: number) => string; size: number; p: Palette; align: string; opp: string }
const jal = (a: 'start' | 'center' | 'end', c: Ctx) => (a === 'center' ? 'center' : a === 'end' ? c.opp : c.align);
const btnHtml = (label: string, link: string, a: 'start' | 'center' | 'end', c: Ctx, full = false) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" width="${full ? '100%' : 'auto'}" style="margin:${a === 'center' ? '0 auto' : '0'};${a === 'end' ? `margin-${c.align}:auto;` : ''}"><tr><td align="center" style="background:${esc(c.p.buttonBg)};border-radius:${c.p.btnRadius}px"><a href="${esc(link)}" style="display:block;padding:14px 28px;color:${esc(c.p.buttonText)};font-weight:700;text-decoration:none;border-radius:${c.p.btnRadius}px">${esc(label)}</a></td></tr></table>`;

export function bannerHtml(d: Design | undefined, c: Ctx, alt: string): string {
  const b = d?.banner; const src = safe(b?.url ?? ''); if (!b || !src) return '';
  const h = BANNER_H[b.height];
  const img = `<img src="${esc(src)}" alt="${esc(alt)}" width="100%" style="display:block;width:100%;height:${h}px;object-fit:cover;border:0;${b.inset ? `border-radius:${Math.min(c.p.radius, 18)}px;` : ''}">`;
  const link = safe(b.link);
  const inner = link ? `<a href="${esc(link)}" style="text-decoration:none">${img}</a>` : img;
  return b.inset ? `<tr><td style="padding:18px 28px 0">${inner}</td></tr>` : `<tr><td style="line-height:0;font-size:0">${inner}</td></tr>`;
}

export function blocksHtml(blocks: Block[], c: Ctx): string {
  const t = (v: I18n | undefined) => c.fill(pickI(v, c.locale));
  return blocks.map((b) => {
    switch (b.type) {
      case 'text': return c.fmt(t(b.body), c.size);
      case 'image': {
        const src = safe(b.url); if (!src) return '';
        const w = b.width, img = `<img src="${esc(src)}" alt="${esc(t(b.alt))}" width="${Math.round(536 * w / 100)}" style="display:inline-block;max-width:100%;width:${w}%;height:auto;border:0;${b.rounded ? `border-radius:${Math.min(c.p.radius, 18)}px;` : ''}">`;
        const l = safe(b.link);
        return `<p style="margin:0 0 18px;text-align:${jal(b.align, c)};line-height:0">${l ? `<a href="${esc(l)}">${img}</a>` : img}</p>`;
      }
      case 'button': {
        const l = safe(b.url), label = t(b.label); if (!l || !label) return '';
        return `<div style="margin:6px 0 20px;text-align:${jal(b.align, c)}">${btnHtml(label, l, b.align, c)}</div>`;
      }
      case 'callout': {
        const title = t(b.title), body = t(b.body); if (!title && !body) return '';
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background:${esc(b.bg || mix(c.p.accent, c.p.cardBg, 0.82))};border-${c.align}:5px solid ${esc(c.p.accent)};border-radius:${Math.min(c.p.radius, 14)}px;padding:16px 18px;text-align:${c.align}">${b.emoji ? `<span style="font-size:22px">${esc(b.emoji)}</span> ` : ''}${title ? `<strong style="color:${esc(c.p.headingColor)};font-size:${c.size + 2}px">${esc(title)}</strong>` : ''}${body ? `<div style="margin-top:6px">${c.fmt(body, c.size - 1)}</div>` : ''}</td></tr></table>`;
      }
      case 'features': {
        const items = b.items.filter((i) => t(i.title) || t(i.text)); if (!items.length) return '';
        const w = Math.floor(100 / items.length);
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>${items.map((i) => `<td class="so-col" valign="top" width="${w}%" style="padding:6px;text-align:center"><div style="font-size:30px;line-height:1.2">${esc(i.emoji)}</div><div style="font-weight:700;color:${esc(c.p.headingColor)};margin:4px 0">${esc(t(i.title))}</div><div style="font-size:${c.size - 2}px;line-height:1.5">${esc(t(i.text))}</div></td>`).join('')}</tr></table>`;
      }
      case 'quote': {
        const body = t(b.body); if (!body) return '';
        return `<blockquote style="margin:0 0 20px;padding:6px 18px;border-${c.align}:4px solid ${esc(c.p.accent)};font-style:italic;font-size:${c.size + 2}px;line-height:1.6">${esc(body)}${t(b.author) ? `<div style="font-style:normal;font-size:${c.size - 2}px;margin-top:6px;opacity:.8">— ${esc(t(b.author))}</div>` : ''}</blockquote>`;
      }
      case 'divider': return b.style === 'line' ? `<hr style="border:0;border-top:2px solid ${esc(c.p.accent)};margin:22px 0;opacity:.6">` : `<p style="margin:18px 0;text-align:center;letter-spacing:10px;color:${esc(c.p.accent)};font-size:18px" aria-hidden="true">${b.style === 'dots' ? '• • •' : '🍃 🌳 🍃'}</p>`;
      case 'spacer': return `<div style="height:${b.height}px;line-height:${b.height}px;font-size:0">&nbsp;</div>`;
    }
  }).join('');
}

export function blocksText(blocks: Block[], locale: 'en' | 'ar', fill: (s: string) => string): string {
  const t = (v: I18n | undefined) => fill(pickI(v, locale));
  return blocks.map((b) => {
    if (b.type === 'text') return t(b.body).replace(/\*\*/g, '');
    if (b.type === 'button') return safe(b.url) && t(b.label) ? `${t(b.label)}: ${b.url}` : '';
    if (b.type === 'callout') return [t(b.title), t(b.body)].filter(Boolean).join('\n');
    if (b.type === 'features') return b.items.map((i) => `${t(i.title)}: ${t(i.text)}`).join('\n');
    if (b.type === 'quote') return `“${t(b.body)}”${t(b.author) ? ` — ${t(b.author)}` : ''}`;
    return '';
  }).filter(Boolean).join('\n\n');
}
export { btnHtml };

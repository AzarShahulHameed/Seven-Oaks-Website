import { z } from 'zod';

const BAD_URL = /^\s*(javascript|data|vbscript):/i;
const FONT_HOSTS = ['https://fonts.googleapis.com/'];

/** Rejects script-ish URLs anywhere inside admin-supplied JSON (defence in depth; the web app also escapes + filters). */
function deepSafe(v: unknown): boolean {
  if (typeof v === 'string') return !BAD_URL.test(v) && v.length <= 20000;
  if (Array.isArray(v)) return v.length <= 500 && v.every(deepSafe);
  if (v && typeof v === 'object') return Object.values(v).every(deepSafe);
  return true;
}

/** Theme tokens end up inside a <style> tag, so values may not contain CSS/HTML control characters. */
function tokensSafe(v: unknown, key = ''): boolean {
  if (typeof v === 'string') {
    if (key === 'fontUrls') return FONT_HOSTS.some((h) => v.startsWith(h));
    return v.length <= 300 && !/[;{}<>\\]|url\(|@import|expression\(/i.test(v);
  }
  if (Array.isArray(v)) return v.length <= 20 && v.every((x) => tokensSafe(x, key));
  if (v && typeof v === 'object') return Object.entries(v).every(([k, x]) => tokensSafe(x, k));
  return typeof v === 'number' || typeof v === 'boolean';
}

const i18n = z.record(z.string().max(5000)).refine((o) => Object.keys(o).every((k) => ['en', 'ar', 'arSrc'].includes(k)));
const httpsOrEmpty = z.string().max(500).regex(/^(https:\/\/\S+)?$/, 'Must be an https:// URL');
const slug = z.string().max(120).regex(/^[\p{L}\p{N}\-\/]*$/u);

export const themeSchema = z.object({ tokens: z.record(z.any()).refine((t) => tokensSafe(t), 'Unsafe or invalid token value') });
export const settingSchema = z.object({ value: z.any().refine(deepSafe, 'Unsafe value') });

export const sectionSchema = z.object({
  type: z.string().regex(/^[a-z0-9-]{1,40}$/),
  config: z.record(z.any()).refine(deepSafe, 'Unsafe value in section'),
  isVisible: z.boolean().default(true),
});

export const pageSaveSchema = z.object({
  title: i18n,
  seo: z.object({
    slug: z.record(slug), metaTitle: i18n.optional(), metaDescription: i18n.optional(), keywords: i18n.optional(), noindex: z.boolean().default(false),
    canonical: httpsOrEmpty.nullable().optional(),
    ogImageUrl: httpsOrEmpty.nullable().optional(),
    jsonLd: z.record(z.any()).refine(deepSafe, 'Unsafe value in JSON-LD').refine((o) => JSON.stringify(o).length < 20000, 'JSON-LD too large').nullable().optional(),
  }),
  sections: z.array(sectionSchema).max(60),
});

export const pageCreateSchema = z.object({ key: z.string().regex(/^[a-z0-9-]{1,60}$/), title: i18n });

const menuItem: z.ZodType<any> = z.lazy(() =>
  z.object({
    label: i18n, href: z.string().max(500).refine((s) => !BAD_URL.test(s)), isButton: z.boolean().default(false), isVisible: z.boolean().default(true),
    children: z.array(menuItem).max(30).optional(),
  }),
);
export const menuSchema = z.object({ items: z.array(menuItem).max(50) });

const path = z.string().trim().max(300).regex(/^\/[^\s<>"'\\]*$/, 'Must start with / and contain no spaces');
const target = z.string().trim().max(500).refine((s) => /^\/[^\s<>"'\\]*$/.test(s) || /^https:\/\/[^\s<>"'\\]+$/.test(s), 'Target must be a /path or an https:// URL');
export const redirectSchema = z.object({
  fromPath: path.refine((p) => !/^\/(admin|api|_next)(\/|$)/.test(p) && p !== '/', 'This path cannot be redirected'),
  toPath: target,
  statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
  isActive: z.boolean().default(true),
});

/** Analytics IDs are injected into <script> code, so only exact ID formats are accepted. */
export const settingValidators: Record<string, z.ZodTypeAny> = {
  'public.analytics': z.object({
    enabled: z.boolean().default(true),
    gaId: z.string().regex(/^(G-[A-Z0-9]{4,14})?$/, 'GA4 ID looks like G-XXXXXXXXXX'),
    gtmId: z.string().regex(/^(GTM-[A-Z0-9]{4,10})?$/, 'GTM ID looks like GTM-XXXXXXX'),
    metaPixelId: z.string().regex(/^(\d{6,20})?$/, 'Pixel ID is digits only'),
    searchConsole: z.string().regex(/^[A-Za-z0-9_-]{0,100}$/, 'Paste only the code from the verification tag (letters, numbers, - and _)').default(''),
  }),
  'public.enquiryForm': z.object({
    enabled: z.boolean().default(true), submitLabel: i18n.default({}), consentText: i18n.default({}), successTitle: i18n.default({}), successText: i18n.default({}),
    programs: z.array(z.object({ value: z.string().regex(/^[a-z0-9-]{1,40}$/, 'Programme code: lowercase letters, numbers and -'), label: i18n })).max(30),
    fields: z.record(z.object({ show: z.boolean(), required: z.boolean() })),
  }),
  'enquiry.routing': z.object({
    recipients: z.array(z.string().email().max(254)).max(20).default([]),
    rules: z.array(z.object({ program: z.string().regex(/^[a-z0-9-]{1,40}$/), recipients: z.array(z.string().email().max(254)).max(20).default([]), assigneeEmail: z.string().email().max(254).or(z.literal('')).default('') })).max(30).default([]),
    autoReply: z.boolean().default(true),
  }),
  'public.newsletter': z.object({ enabled: z.boolean().default(true), title: i18n.default({}), text: i18n.default({}), consent: i18n.default({}), button: i18n.default({}) }),
  'public.legal': z.object({ links: z.array(z.object({ label: i18n, href: z.string().max(200).regex(/^(\/[\w\-\/]*|https:\/\/\S+)$/, 'Use a page path like /privacy-policy or an https:// address') })).max(12) }),
  'public.protection': z.object({
    enabled: z.boolean().default(true), blockHotlinking: z.boolean().default(true), allowedDomains: z.string().max(300).regex(/^[a-z0-9.\-:,\s]*$/i, 'Domains separated by spaces or commas').default(''),
    disableRightClick: z.boolean().default(true), disableDrag: z.boolean().default(true), blockSaveShortcut: z.boolean().default(false),
    watermark: z.object({ enabled: z.boolean().default(false), text: i18n.default({}) }).default({}),
  }),
  'public.cookies': z.object({
    enabled: z.boolean().default(true), version: z.string().max(20).default('1'), policyHref: z.string().max(200).default(''),
    text: i18n.default({}), accept: i18n.default({}), decline: i18n.default({}), policyLabel: i18n.default({}),
  }).passthrough(),
  'public.map': z.object({
    apiKey: z.string().regex(/^(AIza[0-9A-Za-z_-]{30,60})?$/, 'Google Maps keys start with AIza'),
    latitude: z.union([z.number().min(-90).max(90), z.literal('')]),
    longitude: z.union([z.number().min(-180).max(180), z.literal('')]),
    zoom: z.number().int().min(3).max(20).default(16),
    markerLabel: z.record(z.string().max(120)).default({}),
  }),
};

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');

/** Reads an {en, ar} value, falling back gracefully when a translation is missing. */
export function t(v: unknown, locale: string): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const pick = o[locale] || o.en || o.ar;
    return typeof pick === 'string' ? pick : '';
  }
  return '';
}

/** Allows only http(s), mailto, tel, relative and hash links. */
export function safeHref(href: unknown): string {
  if (typeof href !== 'string') return '';
  const h = href.trim();
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(h) ? h : '';
}

/** Prefixes internal links with the active locale and maps the page's per-locale slug when known. */
export function localHref(href: unknown, locale: string): string {
  const h = safeHref(href);
  if (!h) return '#';
  if (h.startsWith('/') && !h.startsWith('//')) return `/${locale}${h === '/' ? '' : h}`;
  return h;
}

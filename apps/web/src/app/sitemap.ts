import type { MetadataRoute } from 'next';
import { getEntrySitemap, getSitemap } from '@/lib/api';
import { locales } from '@/lib/i18n';

// Rendered per request (data is cached + tag-revalidated); never frozen at build time when the API may be unreachable.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  const [pages0, entries] = await Promise.all([getSitemap(), getEntrySitemap()]);
  const pages = pages0 ?? [];
  const url = (l: string, s: Record<string, string>) => `${site}/${l}${(s[l] ?? s.en ?? '') ? '/' + (s[l] ?? s.en) : ''}`;
  const ePath = (e: { kind: string; slug: string; path?: string }) => (e.kind === 'GALLERY' ? `gallery/${e.slug}` : e.kind === 'CATEGORY' ? `gallery/c/${e.slug}` : `${e.path || 'info'}/${e.slug}`);
  const extra: MetadataRoute.Sitemap = entries.flatMap((e) => locales.map((l) => ({ url: `${site}/${l}/${ePath(e)}`, lastModified: e.lastmod ? new Date(e.lastmod) : undefined, changeFrequency: 'monthly' as const, priority: 0.5, alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${site}/${x}/${ePath(e)}`])) } })));
  return [...pages.flatMap((p) => {
    const home = !(p.slugs.en ?? '');
    return locales.map((l) => ({
      url: url(l, p.slugs),
      lastModified: p.lastmod ? new Date(p.lastmod) : undefined,
      changeFrequency: home ? ('weekly' as const) : ('monthly' as const),
      priority: home ? 1 : 0.7,
      alternates: { languages: { ...Object.fromEntries(locales.map((x) => [x, url(x, p.slugs)])), 'x-default': url('en', p.slugs) } },
    }));
  }), ...extra];
}

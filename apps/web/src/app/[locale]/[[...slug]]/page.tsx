import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getBootstrap, getPage, getRedirect } from '@/lib/api';
import { isLocale, locales, t } from '@/lib/i18n';
import { buildJsonLd } from '@/lib/jsonld';
import { JsonLd } from '@/components/JsonLd';
import { Section } from '@/components/sections';
import { loadSectionData } from '@/lib/section-data';
import { EntryRoute, entryMetadata } from '@/components/entry-route';

type Props = { params: { locale: string; slug?: string[] } };
const slugOf = (p: Props['params']) => (p.slug ?? []).map((s) => decodeURIComponent(s)).join('/');
const siteUrl = () => (process.env.SITE_URL ?? '').replace(/\/$/, '');
const urlFor = (alt: Record<string, string>, l: string) => `${siteUrl()}/${l}${(alt[l] ?? alt.en ?? '') ? '/' + (alt[l] ?? alt.en) : ''}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const [page, b] = await Promise.all([getPage(params.locale, slugOf(params)), getBootstrap()]);
  if (!page) { const parts = slugOf(params).split('/'); return parts.length === 2 ? entryMetadata(params.locale, parts[0], parts[1]) : {}; }
  const site = siteUrl();
  const title = t(page.seo.metaTitle, params.locale) || t(page.title, params.locale);
  const description = t(page.seo.metaDescription, params.locale);
  const defaults = b?.settings['public.seoDefaults'] ?? {};
  const image = page.seo.ogImageUrl || defaults.defaultOgImage || undefined;
  const siteName = t(b?.settings['public.site']?.name, params.locale);
  return {
    metadataBase: site ? new URL(site) : undefined,
    title, description,
    keywords: t(page.seo.keywords, params.locale).split(',').map((k) => k.trim()).filter(Boolean).slice(0, 20) || undefined,
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: page.seo.canonical || urlFor(page.alternates, params.locale),
      languages: { ...Object.fromEntries(locales.map((l) => [l, urlFor(page.alternates, l)])), 'x-default': urlFor(page.alternates, 'en') },
    },
    openGraph: {
      title, description, siteName, type: 'website', url: urlFor(page.alternates, params.locale),
      locale: params.locale === 'ar' ? 'ar_AE' : 'en_AE', alternateLocale: params.locale === 'ar' ? 'en_AE' : 'ar_AE',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined, site: defaults.twitterHandle || undefined },
  };
}

export default async function Page({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const slug = slugOf(params);
  const [page, b] = await Promise.all([getPage(params.locale, slug), getBootstrap()]);
  if (!page) {
    // A detail page placed in a folder, e.g. /parents/uniform-and-belongings (the folder is chosen in Admin → Detail pages).
    const parts = slug.split('/');
    if (parts.length === 2 && /^[a-z0-9-]+$/.test(parts[1])) { const v = await EntryRoute({ locale: params.locale, folder: parts[0], slug: parts[1] }); if (v) return v; }
    // No page here: maybe an old URL that the SEO manager redirects (slug changes create these automatically).
    const r = await getRedirect(`/${params.locale}${slug ? '/' + slug : ''}`);
    if (r && (r.to.startsWith('/') || r.to.startsWith('https://')) && !r.to.startsWith('//')) {
      if (r.status === 301 || r.status === 308) permanentRedirect(r.to);
      redirect(r.to);
    }
    notFound();
  }
  const settings = b?.settings ?? {};
  const data = await loadSectionData(page.sections, params.locale);
  const ld = buildJsonLd({ page, locale: params.locale, settings, site: siteUrl(), pageUrl: urlFor(page.alternates, params.locale) });
  return (
    <main id="main">
      <JsonLd data={ld} />
      {page.sections.map((s, n) => <Section key={s.id} n={n} type={s.type} c={s.config} locale={params.locale} settings={settings} data={data} />)}
    </main>
  );
}

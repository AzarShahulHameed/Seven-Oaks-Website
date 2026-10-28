import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getBootstrap, getEntry, getPage } from '@/lib/api';
import { t } from '@/lib/i18n';
import { EntryView } from '@/components/entries';
import { Section } from '@/components/sections';
import { loadSectionData } from '@/lib/section-data';
import { JsonLd } from '@/components/JsonLd';

const plain = (v: string) => v.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#>]/g, '').trim();

const siteUrl = () => (process.env.SITE_URL ?? '').replace(/\/$/, '');
export const entryPath = (e: { path?: string; slug: string }) => `${e.path || 'info'}/${e.slug}`;

/** A detail page lives at /<folder>/<slug>. The folder is chosen in the admin; "info" is the default. */
export async function entryMetadata(locale: string, folder: string, slug: string): Promise<Metadata> {
  const [d, b] = await Promise.all([getEntry('DETAIL', slug), getBootstrap()]);
  if (!d) return {};
  const e = d.entry, l = locale, site = siteUrl(), p = entryPath(e);
  const brand = t(b?.settings['public.site']?.name, l) || 'Seven Oaks British Nursery';
  const title = t(e.seo?.metaTitle, l) || `${t(e.title, l)} | ${brand}`; const description = t(e.seo?.metaDescription, l) || t(e.summary, l);
  const image = e.seo?.ogImageUrl || e.cover?.url || b?.settings['public.seoDefaults']?.defaultOgImage || undefined;
  return { metadataBase: site ? new URL(site) : undefined, title, description, robots: e.seo?.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `${site}/${l}/${p}`, languages: { en: `${site}/en/${p}`, ar: `${site}/ar/${p}` } },
    openGraph: { title, description, type: 'article', images: image ? [{ url: image }] : undefined } };
}

/** Returns the page, or null when no detail page has this address (so the caller can try other things). */
export async function EntryRoute({ locale, folder, slug }: { locale: string; folder: string; slug: string }) {
  const d = await getEntry('DETAIL', slug);
  if (!d) return null;
  // Moved to another folder in the admin: send old links to the new address.
  if ((d.entry.path || 'info') !== folder) permanentRedirect(`/${locale}/${entryPath(d.entry)}`);
  const folderPage = await getPage(locale, d.entry.path || '');
  const parent = folderPage ? { label: t(d.entry.design?.parentLabel, locale) || t(folderPage.title, locale), href: `/${locale}/${d.entry.path}` } : null;
  const blocks = (d.entry.blocks ?? []).filter((b) => b.isVisible !== false);
  const [data, bs] = await Promise.all([loadSectionData(blocks.map((b) => ({ type: b.type, config: b.config })), locale), getBootstrap()]);
  const settings = bs?.settings ?? {};
  const site = siteUrl(), url = `${site}/${locale}/${entryPath(d.entry)}`, name = t(d.entry.title, locale);
  const crumbs = [{ name: t(settings['public.site']?.name, locale) || 'Home', url: `${site}/${locale}` }, ...(parent ? [{ name: parent.label, url: `${site}${parent.href}` }] : []), { name, url }];
  const faqs = blocks.filter((x) => x.type === 'faq').flatMap((x) => (x.config?.items ?? []) as any[]).filter((x) => t(x.q, locale) && t(x.a, locale));
  const ld: object[] = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name, description: t(d.entry.summary, locale), url, inLanguage: locale, ...(d.entry.cover?.url ? { primaryImageOfPage: d.entry.cover.url.startsWith('http') ? d.entry.cover.url : `${site}${d.entry.cover.url}` } : {}) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, n) => ({ '@type': 'ListItem', position: n + 1, name: c.name, item: c.url })) },
    ...(faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: locale, mainEntity: faqs.map((x) => ({ '@type': 'Question', name: t(x.q, locale), acceptedAnswer: { '@type': 'Answer', text: plain(t(x.a, locale)) } })) }] : []),
  ];
  return (
    <>
    <JsonLd data={ld} />
    <EntryView e={d.entry} related={d.related} category={d.category} locale={locale} parent={parent}>
      {blocks.map((s, n) => <Section key={n} n={n} type={s.type} c={s.config} locale={locale} settings={settings} data={data} />)}
    </EntryView>
    </>
  );
}
export { notFound };

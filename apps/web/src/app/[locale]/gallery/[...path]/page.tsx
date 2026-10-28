import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBootstrap, getEntries, getEntry } from '@/lib/api';
import { isLocale, t } from '@/lib/i18n';
import { Crumbs, EntryCards, EntryView } from '@/components/entries';
import { Em, Reveal } from '@/components/motion';
import { Wrap } from '@/components/section-kit';
import { Img } from '@/components/ui';

type Props = { params: { locale: string; path: string[] } };
const siteUrl = () => (process.env.SITE_URL ?? '').replace(/\/$/, '');

/** /gallery/<slug> is one gallery. /gallery/c/<category> is a category with its galleries. */
const parse = (path: string[]) => { const p = path.map(decodeURIComponent); return p[0] === 'c' && p.length === 2 ? { kind: 'CATEGORY' as const, slug: p[1] } : p.length === 1 ? { kind: 'GALLERY' as const, slug: p[0] } : null; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = parse(params.path); if (!r || !isLocale(params.locale)) return {};
  const [d, b] = await Promise.all([getEntry(r.kind, r.slug), getBootstrap()]);
  if (!d) return {};
  const e = d.entry, l = params.locale;
  const title = t(e.seo?.metaTitle, l) || t(e.title, l); const description = t(e.seo?.metaDescription, l) || t(e.summary, l);
  const image = e.seo?.ogImageUrl || e.cover?.url || b?.settings['public.seoDefaults']?.defaultOgImage || undefined;
  const site = siteUrl(); const path = r.kind === 'CATEGORY' ? `gallery/c/${e.slug}` : `gallery/${e.slug}`;
  return { metadataBase: site ? new URL(site) : undefined, title, description, robots: e.seo?.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `${site}/${l}/${path}`, languages: { en: `${site}/en/${path}`, ar: `${site}/ar/${path}` } },
    openGraph: { title, description, type: 'website', images: image ? [{ url: image }] : undefined } };
}

export default async function GalleryRoute({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const r = parse(params.path); if (!r) notFound();
  const d = await getEntry(r.kind, r.slug);
  if (!d) notFound();
  const locale = params.locale;
  if (r.kind === 'GALLERY') return <EntryView e={d.entry} related={d.related} category={d.category} locale={locale} />;
  const [galleries, cats] = await Promise.all([getEntries('GALLERY', r.slug, 100), getEntries('CATEGORY', '', 50)]);
  const ar = locale === 'ar';
  return (
    <main id="main">
      <section className="bg-gradient-to-b from-sage/70 to-canvas pb-6 pt-10 md:pt-14">
        <div className="mx-auto max-w-container px-4">
          <Crumbs locale={locale} trail={[{ label: ar ? 'المعرض' : 'Gallery', href: `/${locale}/gallery` }, { label: t(d.entry.title, locale) }]} />
          <Reveal><h1 className="text-h2 font-bold text-primary"><Em text={t(d.entry.title, locale)} /></h1><span aria-hidden className="mb-4 mt-3 block h-1 w-14 rounded-full bg-accent" />{t(d.entry.summary, locale) && <p className="max-w-2xl text-lg">{t(d.entry.summary, locale)}</p>}</Reveal>
          {cats.length > 1 && <ul className="mt-6 flex flex-wrap gap-2" aria-label={ar ? 'الفئات' : 'Categories'}>{cats.map((c) => <li key={c.id}><Link href={`/${locale}/gallery/c/${c.slug}`} aria-current={c.slug === r.slug ? 'page' : undefined} className={`inline-block rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${c.slug === r.slug ? 'border-primary bg-primary text-white' : 'border-primary/30 text-primary hover:border-primary'}`}>{t(c.title, locale)}</Link></li>)}</ul>}
        </div>
      </section>
      <Wrap className="!pt-8">
        {galleries.length ? <EntryCards entries={galleries} locale={locale} /> : <p className="rounded-card bg-sage/50 p-8 text-center">{ar ? 'لا توجد معارض في هذه الفئة بعد.' : 'There are no galleries in this category yet.'}</p>}
      </Wrap>
    </main>
  );
}

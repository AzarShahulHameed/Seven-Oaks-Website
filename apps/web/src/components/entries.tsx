import Link from 'next/link';
import { ArrowRight, ChevronRight, Download, ExternalLink, FileText, Images, Video } from 'lucide-react';
import type { EntryCard, EntryFull } from '@/lib/api';
import { localHref, safeHref, t } from '@/lib/i18n';
import { protectUrl } from '@/lib/protect';
import { RichBody } from '@/lib/richtext';
import { Img } from './ui';
import { MediaGrid, type LightItem } from './Lightbox';
import { Em, Item, Reveal, Stagger } from './motion';
import { Wrap } from './section-kit';
import { BackLink } from './BackLink';
import { Hills } from './nature';

const ar = (l: string) => l === 'ar';
export const entryHref = (e: Pick<EntryCard, 'kind' | 'slug'> & { path?: string }, locale: string) =>
  `/${locale}${e.kind === 'GALLERY' ? `/gallery/${e.slug}` : e.kind === 'CATEGORY' ? `/gallery/c/${e.slug}` : `/${e.path || 'info'}/${e.slug}`}`;

/** Cloudinary pictures are resized on the fly; anything else is used as it is. */
const sized = (u: string, w: number) => { const m = u.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)f_auto,q_auto\/(.+)$/); return protectUrl(m ? `${m[1]}f_auto,q_auto,w_${w}/${m[2]}` : u); };

export function toLight(items: EntryFull['items'], locale: string): LightItem[] {
  return (items ?? []).flatMap((it): LightItem[] => {
    const m = it?.media ?? {}; const caption = t(it?.caption, locale) || t(m.caption, locale); const alt = t(m.alt, locale) || caption;
    const video = safeHref(m.videoUrl), img = safeHref(m.url), poster = safeHref(m.videoPoster) || img;
    if (video) return [{ kind: 'video' as const, src: protectUrl(video), thumb: poster ? sized(poster, 700) : '', poster: poster ? sized(poster, 1400) : undefined, alt, caption }];
    if (img) return [{ kind: 'image' as const, src: sized(img, 1800), thumb: sized(img, 700), alt, caption }];
    return [];
  });
}

/** Cards that link to galleries, categories or detail pages. Used by the "Galleries / detail pages" block and the "Related" strip. */
export function EntryCards({ entries, locale, columns = 3, animation = 'rise', cta }: { entries: EntryCard[]; locale: string; columns?: number; animation?: 'rise' | 'zoom' | 'fade' | 'none'; cta?: string }) {
  const cols = columns === 4 ? 'lg:grid-cols-4' : columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  return (
    <Stagger className={`grid gap-5 sm:grid-cols-2 ${cols}`} gap={0.07}>
      {entries.map((e) => (
        <Item key={e.id} anim={animation}>
          <Link href={entryHref(e, locale)} className="group block h-full overflow-hidden rounded-card bg-surface shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-xl">
            <div className="relative aspect-[4/3] overflow-hidden bg-sage">
              <Img image={e.cover} locale={locale} fill sizes="(min-width:1024px) 33vw, 100vw" className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]" />
              {(e.count > 0 || e.videos > 0) && <span className="absolute bottom-2 start-2 flex gap-1.5 text-xs font-bold">
                {e.count - e.videos > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-primary"><Images className="h-3.5 w-3.5" />{e.count - e.videos}</span>}
                {e.videos > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-primary"><Video className="h-3.5 w-3.5" />{e.videos}</span>}
              </span>}
            </div>
            <div className="p-4">
              <h3 className="text-h5 font-bold text-primary">{t(e.title, locale)}</h3>
              {t(e.summary, locale) && <p className="mt-1 line-clamp-2 text-sm opacity-85">{t(e.summary, locale)}</p>}
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">{cta ?? (ar(locale) ? 'عرض' : 'View')}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
            </div>
          </Link>
        </Item>
      ))}
    </Stagger>
  );
}

const TXT = (l: string) => ar(l)
  ? { home: 'الرئيسية', gallery: 'المعرض', photos: 'الصور والفيديو', info: 'معلومات إضافية', docs: 'المستندات', links: 'روابط مفيدة', related: 'معارض ذات صلة', relatedInfo: 'صفحات ذات صلة', download: 'تنزيل', open: 'فتح', close: 'إغلاق', next: 'التالي', prev: 'السابق', of: 'من', back: 'العودة إلى المعرض', empty: 'لا توجد صور أو فيديوهات هنا بعد.' }
  : { home: 'Home', gallery: 'Gallery', photos: 'Photos & videos', info: 'Good to know', docs: 'Documents', links: 'Useful links', related: 'More galleries', relatedInfo: 'Related pages', download: 'Download', open: 'Open', close: 'Close', next: 'Next', prev: 'Previous', of: 'of', back: 'Back to the gallery', empty: 'There are no photos or videos here yet.' };

export function Crumbs({ locale, trail, light = false, className = 'mb-5' }: { locale: string; trail: { label: string; href?: string }[]; light?: boolean; className?: string }) {
  const x = TXT(locale);
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${light ? 'text-white' : ''} ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><Link href={`/${locale}`} className={`font-semibold ${light ? "text-white" : "text-primary"}`}>{x.home}</Link></li>
        {trail.map((c, n) => <li key={n} className="flex items-center gap-1.5"><ChevronRight aria-hidden className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" />{c.href ? <Link href={c.href} className={`font-semibold ${light ? "text-white" : "text-primary"}`}>{c.label}</Link> : <span aria-current="page" className="opacity-80">{c.label}</span>}</li>)}
      </ol>
    </nav>
  );
}

/** The page behind every gallery and every detail page: title, text, designed blocks, photos and videos, extra information, documents, links and related items. */
export function EntryView({ e, related, category, locale, parent, children }: { e: EntryFull; related: EntryCard[]; category: EntryCard | null; locale: string; parent?: { label: string; href: string } | null; children?: React.ReactNode }) {
  const x = TXT(locale);
  const isGallery = e.kind === 'GALLERY';
  const light = toLight(e.items, locale);
  const info = (e.info ?? []).filter((r) => t(r.label, locale) || t(r.value, locale));
  const docs = (e.docs ?? []).filter((d) => safeHref(d.url));
  const links = (e.links ?? []).filter((l) => safeHref(l.url));
  const body = t(e.body, locale);
  const hasCover = !!(e.cover?.url || e.cover?.videoUrl);
  const style = e.design?.style === 'banner' && hasCover ? 'banner' : e.design?.style === 'simple' || !hasCover ? 'simple' : 'split';
  const trail = isGallery
    ? [{ label: x.gallery, href: `/${locale}/gallery` }, ...(category ? [{ label: t(category.title, locale), href: entryHref(category, locale) }] : []), { label: t(e.title, locale) }]
    : [...(parent ? [{ label: parent.label, href: parent.href }] : []), { label: t(e.title, locale) }];
  const backHref = isGallery ? (category ? entryHref(category, locale) : `/${locale}/gallery`) : parent?.href ?? `/${locale}`;
  const backLabel = ar(locale) ? 'رجوع' : 'Back';
  const showBack = e.design?.showBack !== false;
  const badge = t(e.design?.badge, locale);
  const dark = style === 'banner';
  const title = <h1 className={`text-h1 font-bold ${dark ? 'text-white' : 'text-primary'}`}><Em text={t(e.title, locale)} /></h1>;
  const intro = <>
    {badge && <span className="mb-3 inline-block -rotate-2 rounded-full bg-accent px-4 py-1 text-sm font-bold text-white shadow-card">{badge}</span>}
    {title}
    <span aria-hidden className="mb-4 mt-3 block h-1.5 w-20 rounded-full bg-accent" />
    {t(e.summary, locale) && <p className={`text-lg ${dark ? 'text-white/90' : ''}`}>{t(e.summary, locale)}</p>}
    {isGallery && light.length > 0 && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm font-bold text-primary shadow-card"><Images className="h-4 w-4" />{light.filter((i) => i.kind === 'image').length} {ar(locale) ? 'صور' : 'photos'}{light.some((i) => i.kind === 'video') ? ` · ${light.filter((i) => i.kind === 'video').length} ${ar(locale) ? 'فيديو' : 'videos'}` : ''}</p>}
  </>;
  const bar = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Crumbs locale={locale} trail={trail} light={dark} className="!mb-0" />
      {showBack && <BackLink fallback={backHref} label={parent && !isGallery ? `${backLabel} · ${parent.label}` : backLabel} />}
    </div>
  );
  return (
    <main id="main">
      {style === 'banner' ? (
        <section className="relative isolate overflow-hidden bg-primary pb-16 pt-8 text-white md:pb-24">
          <Img image={e.cover} locale={locale} priority fill sizes="100vw" className="absolute inset-0 -z-20 h-full w-full" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/45 to-black/10 rtl:bg-gradient-to-l" />
          <div className="mx-auto max-w-container px-4">{bar}<Reveal className="max-w-2xl py-6 md:py-12">{intro}</Reveal></div>
          <Hills className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 text-canvas md:h-16" />
        </section>
      ) : (
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-sage to-canvas pb-12 pt-8 md:pb-16">
          <span aria-hidden className="so-dots absolute -top-6 end-6 -z-10 h-40 w-40 opacity-70" />
          <span aria-hidden className="so-blob-a absolute -bottom-16 -start-16 -z-10 h-56 w-56 bg-accent/25" />
          <span aria-hidden className="so-blob-b absolute -top-10 start-1/3 -z-10 h-32 w-32 bg-primary/10" />
          <div className="mx-auto max-w-container px-4">
            {bar}
            <div className={`grid items-center gap-8 ${style === 'split' ? 'md:grid-cols-[1.1fr_1fr]' : ''}`}>
              <Reveal>{intro}</Reveal>
              {style === 'split' && <Reveal x={30} y={0}>
                <div className="relative mx-auto max-w-lg">
                  <span aria-hidden className="so-blob-b absolute -bottom-4 -end-4 h-full w-full bg-accent/40" />
                  <div className="so-arch relative overflow-hidden border-4 border-white shadow-card"><Img image={e.cover} locale={locale} priority className="aspect-[4/5] w-full" /></div>
                </div>
              </Reveal>}
            </div>
          </div>
        </section>
      )}

      {body && <Wrap className="!pb-4 !pt-8"><div className="mx-auto max-w-3xl text-body"><Reveal><RichBody text={body} locale={locale} /></Reveal></div></Wrap>}

      {children}

      {(light.length > 0 || isGallery) && (
        <Wrap className="!pt-8">
          <h2 className="mb-5 text-h3 font-bold text-primary">{x.photos}</h2>
          {light.length ? <MediaGrid items={light} labels={{ close: x.close, next: x.next, prev: x.prev, of: x.of }} /> : <p className="rounded-card bg-sage/50 p-6 text-center">{x.empty}</p>}
        </Wrap>
      )}

      {info.length > 0 && (
        <Wrap className="!pt-6">
          <h2 className="mb-5 text-h3 font-bold text-primary">{x.info}</h2>
          <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {info.map((r, n) => <Item as="li" key={n}><div className="h-full rounded-card border-s-4 border-accent bg-surface p-4 shadow-card"><p className="text-sm font-bold uppercase tracking-wide text-primary/70">{t(r.label, locale)}</p><p className="mt-1 text-lg font-semibold">{t(r.value, locale)}</p></div></Item>)}
          </Stagger>
        </Wrap>
      )}

      {docs.length > 0 && (
        <Wrap className="!pt-6">
          <h2 className="mb-5 text-h3 font-bold text-primary">{x.docs}</h2>
          <Stagger as="ul" className="grid gap-3 md:grid-cols-2" gap={0.06}>
            {docs.map((d, n) => (
              <Item as="li" key={n}>
                <a href={safeHref(d.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-xl">
                  <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage text-primary"><FileText className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">{t(d.label, locale) || x.docs}</span>{t(d.note, locale) && <span className="block text-sm opacity-80">{t(d.note, locale)}</span>}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary"><Download className="h-4 w-4" />{x.download}</span>
                </a>
              </Item>
            ))}
          </Stagger>
        </Wrap>
      )}

      {links.length > 0 && (
        <Wrap className="!pt-6">
          <h2 className="mb-5 text-h3 font-bold text-primary">{x.links}</h2>
          <ul className="flex flex-wrap gap-3">
            {links.map((l, n) => { const h = safeHref(l.url); const internal = h.startsWith('/'); const cls = 'inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2 font-bold text-primary transition hover:bg-primary hover:text-white'; return <li key={n}>{internal ? <Link href={localHref(h, locale)} className={cls}>{t(l.label, locale) || h}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link> : <a href={h} target="_blank" rel="noopener noreferrer" className={cls}>{t(l.label, locale) || h}<ExternalLink className="h-4 w-4" /></a>}</li>; })}
          </ul>
        </Wrap>
      )}

      {related.length > 0 && (
        <Wrap className="bg-sage/40">
          <h2 className="mb-5 text-h3 font-bold text-primary">{isGallery ? x.related : x.relatedInfo}</h2>
          <EntryCards entries={related.slice(0, 6)} locale={locale} />
        </Wrap>
      )}
    </main>
  );
}

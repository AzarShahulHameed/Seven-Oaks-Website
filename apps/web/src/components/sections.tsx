import Link from 'next/link';
import { localHref, t } from '@/lib/i18n';
import { Btn, Icon, IconOrPhoto, Img, PLAY_BORDER } from './ui';
import { ClipReveal, CountUp, Em, Floaters, Item, ParallaxBg, QuoteCarousel, Reveal, SplitText, Stagger, Tilt } from './motion';
import { Bento, EnquirySection, HeroSplit, Safety, TrustBar } from './sections-extra';
import { Hills, Scenery } from './nature';
import { inline, RichBody } from '@/lib/richtext';
import { EntryCards } from './entries';
import { arr, Caption, Heading, HOVER_IMG, MapView, Rule, Script, Wrap, type P } from './section-kit';

function Hero({ c, locale, settings, data }: P) {
  if (c.layout === 'split') return <HeroSplit c={c} locale={locale} settings={settings} data={data} />;
  const big = c.size !== 'compact';
  const center = c.align === 'center';
  const ov = { light: 'from-black/30', medium: 'from-black/55', strong: 'from-black/75' }[String(c.overlay)] ?? 'from-black/55';
  return (
    <section className={`relative isolate overflow-hidden bg-primary text-white ${c.size === 'full' ? 'flex min-h-[88vh] items-center' : ''}`}>
      <ParallaxBg className="absolute inset-0 -z-20"><Img image={c.image} locale={locale} priority fill sizes="100vw" className="h-full w-full" /></ParallaxBg>
      <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${ov} to-transparent rtl:bg-gradient-to-l ${center ? '!bg-black/45 !bg-none !from-transparent' : ''}`} style={center ? { background: 'radial-gradient(ellipse at center, rgba(0,0,0,.35), rgba(0,0,0,.6))' } : undefined} />
      <Floaters />
      <Hills className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 text-canvas md:h-16" />
      <div className={`relative mx-auto w-full max-w-container px-4 ${big ? 'py-24 md:py-36' : 'py-14 md:py-20'}`}>
        <div className={`max-w-xl ${center ? 'mx-auto max-w-3xl text-center' : ''}`}>
          {t(c.eyebrow, locale) && <Reveal y={14}><p className="mb-3 text-sm font-bold tracking-[0.25em]">{t(c.eyebrow, locale)}</p></Reveal>}
          <SplitText immediate delay={0.12} text={t(c.title, locale)} className={big ? 'text-h1' : 'text-h2 md:text-h1'} />
          <Reveal delay={0.45}><p className="mt-5 text-lg">{t(c.text, locale)}</p></Reveal>
          <Reveal delay={0.65}><div className={`mt-8 flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>{arr(c.buttons).map((b, n) => <Btn key={n} b={b} locale={locale} />)}</div></Reveal>
          {t(c.location, locale) && <Reveal delay={0.8}><p className={`mt-6 flex items-center gap-2 ${center ? 'justify-center' : ''}`}><Icon name="pin" className="h-5 w-5" />{t(c.location, locale)}</p></Reveal>}
        </div>
        {t(c.script, locale) && <Reveal delay={0.9} className="absolute bottom-6 end-6 hidden md:block"><Script className="-rotate-6">{t(c.script, locale)}</Script></Reveal>}
      </div>
      {big && <span aria-hidden className="so-bob absolute bottom-4 start-1/2 hidden h-9 w-5 -translate-x-1/2 rounded-full border-2 border-white/70 md:block"><span className="mx-auto mt-1.5 block h-1.5 w-1 rounded-full bg-white" /></span>}
    </section>
  );
}

const SIDE = { small: ['md:grid-cols-[7fr_5fr]', 'md:grid-cols-[5fr_7fr]'], medium: ['md:grid-cols-2', 'md:grid-cols-2'], large: ['md:grid-cols-[5fr_7fr]', 'md:grid-cols-[7fr_5fr]'] } as const;
const HEIGHT: Record<string, string> = { short: 'h-56 md:h-64', normal: 'h-72 md:h-80', tall: 'h-80 md:h-[30rem]' };
const SHAPE: Record<string, string> = { rounded: 'rounded-card', arch: 'rounded-t-[999px] rounded-b-card', sharp: 'rounded-none' };

function TextImage({ c, locale }: P) {
  const left = (c.imagePosition ?? (c.reverse ? 'left' : 'right')) === 'left';
  const size = (c.imageSize in SIDE ? c.imageSize : 'medium') as keyof typeof SIDE;
  return (
    <Wrap>
      <div className={`grid items-center gap-10 ${SIDE[size][left ? 1 : 0]}`}>
        <div className={left ? 'md:order-2' : ''}>
          <Heading title={t(c.title, locale)} sub={t(c.subtitle, locale)} />
          <Stagger gap={0.12}>
            {arr(c.paragraphs).map((p, n) => <Item key={n}><p className="mt-4">{t(p, locale)}</p></Item>)}
            {arr(c.bullets).filter((b) => t(b, locale)).length > 0 && (
              <Item><ul className="mt-4 space-y-2">{arr(c.bullets).filter((b) => t(b, locale)).map((b, n) => (
                <li key={n} className="flex gap-2"><Icon name="leaf" className="mt-1 h-4 w-4 shrink-0 text-primary" />{t(b, locale)}</li>
              ))}</ul></Item>
            )}
          </Stagger>
          <Reveal delay={0.2} className="mt-6"><Btn b={c.button} locale={locale} /></Reveal>
        </div>
        <ClipReveal className={left ? 'md:order-1' : ''}>
          <figure className={`group relative overflow-hidden shadow-card ${SHAPE[c.imageStyle] ?? SHAPE.rounded}`}>
            <Img image={c.image} locale={locale} className={`${HEIGHT[c.imageHeight] ?? HEIGHT.normal} w-full ${HOVER_IMG}`} />
            {t(c.imageQuote, locale) && <Script className="absolute bottom-4 start-4 rounded bg-black/50 px-3 py-1 text-white backdrop-blur-sm">{t(c.imageQuote, locale)}</Script>}
            <Caption image={c.image} locale={locale} className="absolute inset-x-0 bottom-0 bg-black/55 text-white backdrop-blur-sm" />
          </figure>
        </ClipReveal>
      </div>
    </Wrap>
  );
}

function FeatureGrid({ c, locale }: P) {
  return (
    <Wrap>
      <Reveal>
        <div className="rounded-card bg-sage p-8 shadow-card">
          <h2 className="text-h2">{t(c.title, locale)}</h2><Rule />
          <Stagger className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {arr(c.items).map((it, n) => (
              <Item key={n} className="group rounded-card p-4 text-center transition duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-card">
                <span className="mx-auto block w-fit"><IconOrPhoto n={n} image={it.image} locale={locale} size="h-24 w-24" fallback={<span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary transition duration-500 group-hover:rotate-[360deg] group-hover:bg-primary group-hover:text-white"><Icon name={it.icon} className="h-7 w-7" /></span>} /></span>
                <h3 className="mt-3 text-h5 font-bold">{t(it.title, locale)}</h3>
                <p className="mt-1 text-sm">{t(it.text, locale)}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Reveal>
    </Wrap>
  );
}

function CardRow({ c, locale }: P) {
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} />
      <Reveal><Script className="-mt-2 text-primary">{t(c.subtitle, locale)}</Script></Reveal>
      <Stagger className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6" gap={0.07}>
        {arr(c.items).map((it, n) => (
          <Item key={n}>
            <Tilt className="group h-full overflow-hidden rounded-card bg-surface text-center shadow-card transition-shadow duration-300 hover:shadow-2xl">
              <div className="overflow-hidden"><Img image={it.image} locale={locale} className={`h-36 w-full ${HOVER_IMG}`} /></div>
              <div className="p-3"><h3 className="text-h5 font-bold">{t(it.title, locale)}</h3><p className="text-sm">{t(it.subtitle, locale)}</p></div>
            </Tilt>
          </Item>
        ))}
        <Item className="flex items-center justify-center"><Btn b={c.button} locale={locale} /></Item>
      </Stagger>
    </Wrap>
  );
}

function IconRow({ c, locale }: P) {
  return (
    <Wrap>
      <Reveal>
        <div className="rounded-card bg-sage p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-h2"><Em text={t(c.title, locale)} /></h2>
              <p className="font-bold">{t(c.subtitle, locale)}</p>
              <p className="mt-3 text-sm">{t(c.text, locale)}</p>
              <div className="mt-5"><Btn b={c.button} locale={locale} /></div>
            </div>
            <div>
              <Stagger as="ul" className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7" gap={0.06}>
                {arr(c.items).map((it, n) => (
                  <Item as="li" key={n} className="group text-center text-sm font-semibold">
                    <span className="mx-auto mb-2 block w-fit"><IconOrPhoto n={n} image={it.image} locale={locale} size="h-20 w-20" fallback={<span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-white transition duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/40"><Icon name={it.icon} className="h-6 w-6" /></span>} /></span>
                    {t(it.label, locale)}
                  </Item>
                ))}
              </Stagger>
              <Reveal delay={0.3}><Script className="mt-6 text-center text-primary">{t(c.tagline, locale)}</Script></Reveal>
            </div>
          </div>
        </div>
      </Reveal>
    </Wrap>
  );
}

const TILT = [-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5];
function PhotoGrid({ c, locale }: P) {
  const polaroid = c.style === 'polaroid';
  const anim = (['rise', 'zoom', 'fade', 'none'].includes(c.animation) ? c.animation : 'rise') as 'rise' | 'zoom' | 'fade' | 'none';
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} sub={undefined} />
      <Reveal><p className="-mt-2 mb-8">{t(c.subtitle, locale)}</p></Reveal>
      {polaroid ? (
        <Stagger className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3" gap={0.08}>
          {arr(c.items).map((it, n) => (
            <Item as="figure" anim={anim} key={n} className="group relative">
              <div className="so-tape relative bg-white p-2.5 pb-4 shadow-[0_10px_30px_rgba(0,0,0,.14)] transition duration-500 group-hover:!rotate-0 group-hover:scale-[1.04] group-hover:shadow-2xl" style={{ transform: `rotate(${TILT[n % TILT.length]}deg)` }}>
                <div className="overflow-hidden"><Img image={it.image} locale={locale} className={`aspect-[4/3] w-full ${HOVER_IMG}`} /></div>
                <figcaption className="mt-2 text-center font-script text-xl leading-none text-primary">{t(it.label, locale)}</figcaption>
              </div>
            </Item>
          ))}
        </Stagger>
      ) : (
        <Stagger className={`grid grid-cols-2 gap-3 ${Number(c.columns) === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`} gap={0.06}>
          {arr(c.items).map((it, n) => (
            <Item as="figure" anim={anim} key={n} className="group relative overflow-hidden rounded-card shadow-card">
              <Img image={it.image} locale={locale} className={`h-40 w-full md:h-48 ${HOVER_IMG}`} />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-1 bg-primary/95 px-3 py-1.5 text-sm font-semibold text-white transition duration-300 group-hover:translate-y-0">{t(it.label, locale)}</figcaption>
            </Item>
          ))}
        </Stagger>
      )}
      {c.button && <Reveal><div className="mt-10 text-center"><Btn b={c.button} locale={locale} /></div></Reveal>}
    </Wrap>
  );
}

function Banner({ c, locale }: P) {
  const left = c.imagePosition === 'left';
  return (
    <Wrap>
      <Reveal>
        <div className={`grid overflow-hidden rounded-card bg-sage shadow-card ${c.imageSize === 'large' ? (left ? 'md:grid-cols-[7fr_5fr]' : 'md:grid-cols-[5fr_7fr]') : 'md:grid-cols-2'}`}>
          <div className={`p-8 ${left ? 'md:order-2' : ''}`}>
            <h2 className="text-h2">{t(c.title, locale)}</h2>
            <p className="mt-1 text-h5 font-bold text-primary">{t(c.subtitle, locale)}</p>
            {arr(c.paragraphs).map((p, n) => <p key={n} className="mt-3 text-sm">{t(p, locale)}</p>)}
            <div className="mt-5"><Btn b={c.button} locale={locale} /></div>
          </div>
          <figure className={`group relative min-h-64 overflow-hidden ${left ? 'md:order-1' : ''}`}>
            <Img image={c.image} locale={locale} fill className={`absolute inset-0 h-full w-full ${HOVER_IMG}`} />
            <Script className="absolute end-4 top-4 -rotate-6 text-white drop-shadow">{t(c.script, locale)}</Script>
            <Caption image={c.image} locale={locale} className="absolute inset-x-0 bottom-0 bg-black/55 text-white" />
          </figure>
        </div>
      </Reveal>
    </Wrap>
  );
}

function LinkList({ c, locale }: P) {
  return (
    <Wrap>
      <Reveal>
        <div className="rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-h3">{t(c.title, locale)}</h2>
          <Stagger as="ul" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" gap={0.05}>
            {arr(c.items).map((it, n) => (
              <Item as="li" key={n}><Link href={localHref(it.href, locale)} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-sage hover:text-primary"><Icon name={it.icon} className="h-5 w-5 text-primary transition group-hover:scale-125" /><span className="transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">{t(it.label, locale)}</span></Link></Item>
            ))}
          </Stagger>
          <div className="mt-5"><Btn b={c.button} locale={locale} /></div>
        </div>
      </Reveal>
    </Wrap>
  );
}

function Testimonials({ c, locale, data }: P) {
  const managed = c.source === 'managed';
  const limit = Math.min(24, Math.max(1, Number(c.limit) || 9));
  const items = (managed
    ? arr(data?.testimonials?.[String(c.place || 'home')]).map((x) => ({ quote: t(x.body, locale), author: x.name, child: x.child ? (locale === 'ar' ? `والد/ة ${x.child}` : `parent of ${x.child}`) : '', rating: Number(x.rating) || 0, image: x.imageUrl || '' }))
    : arr(c.items).map((it) => ({ quote: t(it.quote, locale), author: t(it.author, locale), child: '', rating: Number(it.rating) || 0, image: '' }))
  ).filter((it) => it.quote).slice(0, limit);
  if (!items.length) return null; // hidden until approved reviews exist
  const grid = c.layout === 'grid';
  return (
    <Wrap className="overflow-hidden">
      <Heading center title={t(c.title, locale)} />
      {grid ? (
        <Stagger className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
          {items.map((it, n) => (
            <Item as="figure" key={n} className="relative rounded-card bg-surface p-6 shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
              <span aria-hidden className="absolute -top-4 start-6 grid h-9 w-9 place-items-center rounded-full bg-primary font-heading text-2xl leading-none text-white">“</span>
              {it.rating > 0 && <p className="mb-2 text-accent" aria-label={`${it.rating} / 5`}>{'★'.repeat(Math.min(5, it.rating))}</p>}
              <blockquote className="font-heading text-h5 leading-snug">{it.quote}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold">
                {it.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.image} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />}
                <span>{it.author}{it.child && <span className="block font-normal opacity-70">{it.child}</span>}</span>
              </figcaption>
            </Item>
          ))}
        </Stagger>
      ) : (
        <Reveal delay={0.1} className="pt-6"><QuoteCarousel items={items.map((it) => ({ ...it, child: it.child }))} /></Reveal>
      )}
      <div className="mt-8 text-center"><Btn b={c.link} locale={locale} /></div>
    </Wrap>
  );
}

function Cta({ c, locale, settings }: P) {
  const contact = settings['public.contact'] ?? {};
  const center = c.align === 'center';
  return (
    <section className="so-gradient relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-black/60 py-section text-white">
      <ParallaxBg className="absolute inset-0 -z-10 opacity-30" strength={10}><Img image={c.image} locale={locale} fill className="h-full w-full" /></ParallaxBg>
      <Floaters />
      <div className={`relative mx-auto grid max-w-container gap-8 px-4 ${c.showContact && !center ? 'md:grid-cols-[2fr_1fr]' : ''}`}>
        <div className={center ? 'mx-auto max-w-3xl text-center' : ''}>
          <SplitText as="h2" text={t(c.title, locale)} className="text-h2" />
          <Reveal delay={0.2}><p className={`mt-3 max-w-xl ${center ? 'mx-auto' : ''}`}>{t(c.text, locale)}</p></Reveal>
          <Reveal delay={0.35}><div className={`mt-6 flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>{arr(c.buttons).map((b, n) => <span key={n} className={n === 0 ? 'so-glow rounded-btn' : ''}><Btn b={b} locale={locale} /></span>)}</div></Reveal>
        </div>
        {c.showContact && (
          <Reveal delay={0.3} x={30} y={0}>
            <div className="space-y-2 overflow-hidden rounded-card bg-surface p-5 text-ink shadow-2xl">
              {t(contact.address, locale) && <p className="flex gap-2"><Icon name="pin" className="h-5 w-5 shrink-0 text-primary" />{t(contact.address, locale)}</p>}
              {contact.phone && <p className="flex gap-2"><Icon name="phone" className="h-5 w-5 text-primary" /><a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} dir="ltr">{contact.phone}</a></p>}
              {contact.email && <p className="flex gap-2"><Icon name="mail" className="h-5 w-5 text-primary" /><a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
              <div className="-mx-5 -mb-5 mt-3"><MapView settings={settings} locale={locale} className="h-44" /></div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function RichText({ c, locale }: P) {
  const bullets = arr(c.bullets).filter((b) => t(b, locale));
  return (
    <Wrap>
      <div className="mx-auto max-w-3xl">
        <Heading title={t(c.title, locale)} sub={t(c.subtitle, locale)} />
        <Stagger gap={0.08}>
          {arr(c.paragraphs).map((p, n) => <Item key={n}><p className="mt-4">{t(p, locale)}</p></Item>)}
          {bullets.length > 0 && <Item><ul className="mt-4 space-y-2">{bullets.map((b, n) => <li key={n} className="flex gap-2"><Icon name="leaf" className="mt-1 h-4 w-4 shrink-0 text-primary" />{t(b, locale)}</li>)}</ul></Item>}
        </Stagger>
      </div>
    </Wrap>
  );
}

function Faq({ c, locale }: P) {
  return (
    <Wrap>
      <div className="mx-auto max-w-3xl">
        <Heading title={t(c.title, locale)} sub={undefined} />
        {t(c.subtitle, locale) && <Reveal><p className="-mt-2">{t(c.subtitle, locale)}</p></Reveal>}
        <Stagger className="mt-6 space-y-3" gap={0.06}>
          {arr(c.items).filter((it) => t(it.q, locale)).map((it, n) => (
            <Item key={n}>
              <details className={`group rounded-card border-s-8 bg-surface p-4 shadow-card transition-shadow open:shadow-xl ${PLAY_BORDER[n % 4]}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">
                  {t(it.q, locale)}<span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage text-lg text-primary transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <RichBody text={t(it.a, locale)} locale={locale} className="mt-3" />
                {it.link?.href && t(it.link.label, locale) && <p className="mt-3"><Link href={localHref(it.link.href, locale)} className="inline-flex items-center gap-1.5 font-bold text-link underline decoration-2 underline-offset-4 hover:opacity-80">{t(it.link.label, locale)}<span aria-hidden className="rtl:rotate-180">→</span></Link></p>}
              </details>
            </Item>
          ))}
        </Stagger>
      </div>
    </Wrap>
  );
}

function Team({ c, locale }: P) {
  const all = arr(c.items);
  const anyFlag = all.some((x) => typeof x?.featured === 'boolean');
  // The Director (or whoever is marked "Featured") is shown first and larger, with a personal message.
  const isFeat = (x: any, n: number) => (anyFlag ? x?.featured === true : n === 0 && /director|principal|head|مدير|مديرة/i.test(`${t(x?.role, 'en')} ${t(x?.role, 'ar')} ${t(x?.name, 'en')} ${t(x?.name, 'ar')}`));
  const lead = all.find(isFeat);
  const rest = all.filter((x, n) => !isFeat(x, n));
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} />
      {t(c.subtitle, locale) ? <Reveal><p className="-mt-2 mb-10 max-w-2xl text-lg">{t(c.subtitle, locale)}</p></Reveal> : <div className="mb-8" />}
      {lead && (
        <Reveal>
          <article className={`mb-14 grid items-center gap-8 overflow-hidden rounded-card bg-sage p-6 shadow-card md:p-10 ${lead.image?.url || lead.image?.videoUrl ? 'md:grid-cols-[18rem_1fr]' : 'mx-auto max-w-4xl'}`}>
            {(lead.image?.url || lead.image?.videoUrl) && (
              <div className="mx-auto w-56 md:w-full">
                <div className="aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-card"><Img image={lead.image} locale={locale} fill className="h-full w-full" /></div>
              </div>
            )}
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-primary">{t(lead.role, locale)}</p>
              <h3 className="mt-1 text-h2">{t(lead.name, locale)}</h3>
              {t(lead.qualification, locale) && <p className="mt-2 inline-block rounded-full bg-surface px-3 py-0.5 text-xs font-bold text-primary">{t(lead.qualification, locale)}</p>}
              {(t(lead.message, locale) || t(lead.bio, locale)) && (
                <blockquote className="mt-5 border-s-4 border-accent ps-5 text-lg leading-relaxed">
                  {(t(lead.message, locale) || t(lead.bio, locale)).split(/\n{2,}/).map((para: string, k: number) => <p key={k} className={k ? 'mt-3' : ''}>{para}</p>)}
                </blockquote>
              )}
            </div>
          </article>
        </Reveal>
      )}
      {rest.length > 0 && <Stagger className="flex flex-wrap justify-center gap-x-10 gap-y-10" gap={0.1}>
        {rest.map((it, n) => (
          <Item key={n} className="group w-60 text-center">
            <div className="relative mx-auto w-48">
              <span aria-hidden className={`absolute -inset-2 -z-10 ${n % 2 ? 'so-blob-a bg-accent/25' : 'so-blob-b bg-sage'} transition duration-500 group-hover:rotate-12 group-hover:scale-105`} />
              <div className="so-arch aspect-[4/5] overflow-hidden bg-sage shadow-card"><Img image={it.image} locale={locale} fill className={`h-full w-full ${HOVER_IMG}`} /></div>
            </div>
            <h3 className="mt-5 text-h4 font-bold">{t(it.name, locale)}</h3>
            <p className="font-semibold text-primary">{t(it.role, locale)}</p>
            {t(it.qualification, locale) && <p className="mx-auto mt-2 inline-block rounded-full bg-sage px-3 py-0.5 text-xs font-bold text-primary">{t(it.qualification, locale)}</p>}
            <p className="mx-auto mt-2 max-w-xs text-sm">{t(it.bio, locale)}</p>
          </Item>
        ))}
      </Stagger>}
    </Wrap>
  );
}

function Partner({ c, locale }: P) {
  const about = arr(c.about).filter((p) => t(p, locale));
  const acts = arr(c.activities).filter((a) => t(a.title, locale));
  const media = arr(c.media).filter((m) => m?.image?.url || m?.image?.videoUrl);
  const contact = arr(c.contact).filter((l) => t(l.text, locale));
  const cards: [string, any][] = [[locale === 'ar' ? 'رؤيتنا' : 'Vision', c.vision], [locale === 'ar' ? 'رسالتنا' : 'Mission', c.mission]];
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} sub={t(c.subtitle, locale)} />
      <div className="grid items-start gap-8 md:grid-cols-[16rem_1fr]">
        {(c.logo?.url || c.logo?.videoUrl) && <Reveal><div className="overflow-hidden rounded-card bg-surface p-4 shadow-card"><Img image={c.logo} locale={locale} className="h-auto max-h-56 w-full object-contain" /></div></Reveal>}
        <div className={c.logo?.url || c.logo?.videoUrl ? '' : 'md:col-span-2'}>
          {about.map((p, n) => <Reveal key={n} delay={n * 0.05}><p className={n ? 'mt-4' : ''}>{t(p, locale)}</p></Reveal>)}
          {contact.length > 0 && <ul className="mt-4 space-y-1 text-sm">{contact.map((l, n) => <li key={n} className="flex gap-2"><Icon name={l.icon || 'pin'} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t(l.text, locale)}</li>)}</ul>}
          {c.button && <Reveal className="mt-6"><Btn b={c.button} locale={locale} /></Reveal>}
        </div>
      </div>
      {cards.some(([, v]) => t(v, locale)) && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {cards.filter(([, v]) => t(v, locale)).map(([label, v]) => (
            <Reveal key={label}><div className="h-full rounded-card bg-sage p-6 shadow-card"><h3 className="text-h4 font-bold text-primary">{label}</h3><p className="mt-2">{t(v, locale)}</p></div></Reveal>
          ))}
        </div>
      )}
      {acts.length > 0 && (
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
          {acts.map((a, n) => (
            <Item key={n}><div className="h-full rounded-card bg-surface p-5 shadow-card"><span className="grid h-11 w-11 place-items-center rounded-full bg-sage text-primary"><Icon name={a.icon} className="h-5 w-5" /></span><h3 className="mt-3 text-h5 font-bold">{t(a.title, locale)}</h3>{t(a.text, locale) && <p className="mt-1 text-sm">{t(a.text, locale)}</p>}</div></Item>
          ))}
        </Stagger>
      )}
      {media.length > 0 && (
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
          {media.map((m, n) => (
            <Item key={n}><figure className="relative overflow-hidden rounded-card shadow-card"><Img image={{ ...m.image, videoControls: m.image.videoUrl ? true : undefined }} locale={locale} className="aspect-[4/3] w-full object-cover" /><Caption image={m.image} locale={locale} /></figure></Item>
          ))}
        </Stagger>
      )}
    </Wrap>
  );
}

function Steps({ c, locale }: P) {
  const items = arr(c.items);
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} />
      <Reveal><p className="-mt-2 mb-10 max-w-2xl text-lg">{t(c.subtitle, locale)}</p></Reveal>
      <div className="relative">
        <svg aria-hidden className="absolute inset-x-6 top-5 hidden h-4 w-[calc(100%-3rem)] lg:block" preserveAspectRatio="none" viewBox="0 0 100 4"><path d="M0 2 C 10 0, 15 4, 25 2 S 40 0, 50 2 S 65 4, 75 2 S 90 0, 100 2" fill="none" stroke="var(--colors-accent)" strokeWidth="0.6" strokeDasharray="1.4 1.6" vectorEffect="non-scaling-stroke" /></svg>
        <Stagger as="ol" className={`relative grid gap-8 sm:grid-cols-2 ${items.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`} gap={0.14}>
          {items.map((it, n) => (
            <Item key={n} className="group relative">
              <span className="relative z-10 mb-4 grid h-11 w-11 place-items-center rounded-full bg-primary font-heading text-xl font-bold text-white shadow-lg ring-4 ring-canvas transition duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-black">{n + 1}</span>
              {it.image?.url && <div className="mb-3 overflow-hidden rounded-card border-4 border-white shadow-card transition duration-300 group-hover:-rotate-1 group-hover:scale-[1.03]"><Img image={it.image} locale={locale} className="aspect-[4/3] w-full" /></div>}
              <h3 className="text-h5 font-bold">{t(it.title, locale)}</h3>
              <p className="mt-1 text-sm">{t(it.text, locale)}</p>
            </Item>
          ))}
        </Stagger>
      </div>
    </Wrap>
  );
}

function Stats({ c, locale }: P) {
  return (
    <Wrap className="!py-6">
      {t(c.title, locale) && <Heading title={t(c.title, locale)} />}
      <Reveal>
        <ul className={`grid gap-4 rounded-card bg-primary p-8 text-center text-white shadow-card sm:grid-cols-2 ${arr(c.items).length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {arr(c.items).map((it, n) => (
            <li key={n}>
              <p className="font-heading text-h2 font-bold"><CountUp value={typeof it.value === 'string' ? it.value : t(it.value, locale)} /></p>
              <p className="mt-1 text-sm opacity-90">{t(it.label, locale)}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </Wrap>
  );
}

function ContactInfo({ c, locale, settings }: P) {
  const contact = settings['public.contact'] ?? {};
  const social = settings['public.social'] ?? {};
  const rows: [string, string, React.ReactNode][] = [
    ['pin', 'Address', t(contact.address, locale)],
    ['phone', 'Phone', contact.phone ? <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} dir="ltr">{contact.phone}</a> : ''],
    ['mail', 'Email', contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : ''],
    ['calendar', 'Opening hours', c.showHours === false ? '' : t(contact.hours, locale)],
  ];
  const wa = String(contact.whatsapp ?? '').replace(/[^\d]/g, '');
  const mapEl = c.showMap !== false ? <MapView settings={settings} locale={locale} className="h-full min-h-[20rem]" /> : null;
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} sub={undefined} />
      <Reveal><p className="-mt-2 mb-6">{t(c.text, locale)}</p></Reveal>
      <div className="grid gap-6 lg:grid-cols-2">
        <Stagger as="ul" className="space-y-4 rounded-card bg-surface p-6 shadow-card" gap={0.1}>
          {rows.filter(([, , v]) => v).map(([icon, label, v]) => (
            <Item as="li" key={label} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage text-primary"><Icon name={icon} className="h-5 w-5" /></span><div><p className="text-sm font-bold">{locale === 'ar' ? ({ Address: 'العنوان', Phone: 'الهاتف', Email: 'البريد الإلكتروني', 'Opening hours': 'ساعات الدوام' } as any)[label] : label}</p><p>{v}</p></div></Item>
          ))}
          {(wa || contact.directionsUrl || social.instagram || social.facebook) && (
            <Item as="li" className="flex flex-wrap gap-3 pt-2">
              {wa && <Btn b={{ label: { en: 'WhatsApp us', ar: 'راسلنا عبر واتساب' }, href: `https://wa.me/${wa}`, variant: 'primary' }} locale={locale} />}
              {contact.directionsUrl && <Btn b={{ label: { en: 'Get Directions', ar: 'احصل على الاتجاهات' }, href: contact.directionsUrl, variant: 'outline' }} locale={locale} />}
            </Item>
          )}
        </Stagger>
        <Reveal x={30} y={0} className="h-80 overflow-hidden rounded-card shadow-card lg:h-auto lg:min-h-[22rem]">
          {mapEl ?? <div className="grid h-full min-h-[20rem] place-items-center bg-sage p-6 text-center text-sm"><p>{locale === 'ar' ? 'أضف موقعك من لوحة التحكم ← الإعدادات ← الخريطة والاتجاهات.' : 'Add your location in Admin → Settings → Map & directions to show an interactive map here.'}</p></div>}
        </Reveal>
      </div>
    </Wrap>
  );
}

function Downloads({ c, locale }: P) {
  const ext = (u: string) => (String(u).split('?')[0].split('.').pop() || 'file').slice(0, 5).toUpperCase();
  return (
    <Wrap>
      <div className="mx-auto max-w-3xl">
        <Heading title={t(c.title, locale)} sub={undefined} />
        {t(c.subtitle, locale) && <Reveal><p className="-mt-2">{t(c.subtitle, locale)}</p></Reveal>}
        <Stagger as="ul" className="mt-6 space-y-3" gap={0.06}>
          {arr(c.items).filter((it) => it.url && /^https?:\/\//.test(it.url)).map((it, n) => (
            <Item as="li" key={n}>
              <a href={it.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-xl">
                <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage text-xs font-extrabold text-primary">{ext(it.url)}</span>
                <span className="min-w-0 flex-1"><span className="block font-bold">{t(it.label, locale) || (locale === 'ar' ? 'مستند' : 'Document')}</span>{t(it.text, locale) && <span className="block text-sm opacity-80">{t(it.text, locale)}</span>}</span>
                <span className="shrink-0 text-sm font-bold text-primary">{locale === 'ar' ? 'تنزيل' : 'Download'}</span>
              </a>
            </Item>
          ))}
        </Stagger>
      </div>
    </Wrap>
  );
}

/** Galleries, gallery categories or detail pages created in Admin, shown as cards that open their own page. */
export const entryKey = (c: any) => `${['GALLERY', 'CATEGORY', 'DETAIL'].includes(c?.kind) ? c.kind : 'GALLERY'}|${String(c?.group || '')}|${Math.max(1, Math.min(60, Number(c?.limit) || 12))}`;
function EntryList({ c, locale, data }: P) {
  const kind = ['GALLERY', 'CATEGORY', 'DETAIL'].includes(c.kind) ? c.kind : 'GALLERY';
  const got = data?.entries?.[entryKey(c)] ?? { list: [], cats: [] };
  const list = got.list;
  const cats = kind === 'GALLERY' && c.showCategories !== false ? got.cats : [];
  const ar = locale === 'ar';
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} sub={undefined} />
      {t(c.subtitle, locale) && <Reveal><p className="-mt-2 mb-6">{t(c.subtitle, locale)}</p></Reveal>}
      {cats.length > 0 && (
        <ul className="mb-6 flex flex-wrap gap-2" aria-label={ar ? 'الفئات' : 'Categories'}>
          {cats.map((k) => <li key={k.id}><Link href={`/${locale}/gallery/c/${k.slug}`} className="inline-block rounded-full border-2 border-primary/30 px-4 py-1.5 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary hover:text-white">{t(k.title, locale)}</Link></li>)}
        </ul>
      )}
      {list.length ? <EntryCards entries={list} locale={locale} columns={Number(c.columns) === 4 ? 4 : Number(c.columns) === 2 ? 2 : 3} animation={(['rise', 'zoom', 'fade', 'none'].includes(c.animation) ? c.animation : 'rise') as any} /> : <p className="rounded-card bg-sage/50 p-8 text-center">{ar ? 'سيظهر المحتوى هنا قريباً.' : 'Content will appear here soon.'}</p>}
      {c.button && <Reveal><div className="mt-10 text-center"><Btn b={c.button} locale={locale} /></div></Reveal>}
    </Wrap>
  );
}


/** Splits "a | b | c" lines into cells. Used by the Table block so timetables and lists can be edited as plain text in the admin. */
const cells = (line: string) => line.split('|').map((x) => x.trim());
function DataTable({ c, locale }: P) {
  const head = cells(t(c.header, locale) || t(c.header, 'en'));
  const rows = (t(c.rows, locale) || t(c.rows, 'en')).replace(/\r/g, '').split('\n').map((r) => r.trim()).filter(Boolean).map(cells);
  const cols = Math.max(head.filter(Boolean).length ? head.length : 0, ...rows.map((r) => r.length), 1);
  const style = ['striped', 'cards', 'plain'].includes(c.style) ? c.style : 'striped';
  const hasHead = head.some(Boolean);
  const ar = locale === 'ar';
  return (
    <Wrap>
      <div className="mx-auto max-w-4xl">
        {t(c.title, locale) && <Heading title={t(c.title, locale)} sub={t(c.subtitle, locale) || undefined} />}
        <Reveal>
          {style === 'cards' ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rows.map((r, n) => (
                <li key={n} className="group rounded-card border-s-8 border-accent bg-surface p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-h5 font-bold text-primary">{inline(r[0] ?? '', locale)}</p>
                  {r.slice(1).map((v, k) => v && <p key={k} className="mt-1 text-sm">{hasHead && head[k + 1] && <span className="me-1 font-bold opacity-70">{head[k + 1]}:</span>}{inline(v, locale)}</p>)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-card bg-surface shadow-card ring-1 ring-black/5">
              <table className="w-full min-w-[32rem] border-collapse text-start">
                {hasHead && <thead><tr className="bg-primary text-white">{Array.from({ length: cols }).map((_, k) => <th key={k} scope="col" className="px-4 py-3 text-start text-sm font-bold uppercase tracking-wide">{inline(head[k] ?? '', locale)}</th>)}</tr></thead>}
                <tbody>
                  {rows.map((r, n) => (
                    <tr key={n} className={`transition-colors hover:bg-accent/15 ${style === 'striped' && n % 2 ? 'bg-sage/50' : ''} ${style === 'plain' ? 'border-t border-black/10' : ''}`}>
                      {Array.from({ length: cols }).map((_, k) => k === 0
                        ? <th key={k} scope="row" className="px-4 py-3 text-start font-bold text-primary">{inline(r[k] ?? '', locale)}</th>
                        : <td key={k} className="px-4 py-3 align-top">{inline(r[k] ?? '', locale)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>
        {t(c.note, locale) && <p className="mt-3 text-sm opacity-80">{inline(t(c.note, locale), locale)}</p>}
        {rows.length === 0 && <p className="rounded-card bg-sage/60 p-5 text-center">{ar ? 'لا توجد بيانات بعد.' : 'Nothing to show yet.'}</p>}
      </div>
    </Wrap>
  );
}

const TONES: Record<string, { box: string; icon: string }> = {
  info: { box: 'bg-sage border-primary/30', icon: 'info' }, tip: { box: 'bg-accent/20 border-accent', icon: 'star' },
  warning: { box: 'bg-amber-50 border-amber-400', icon: 'shield' }, celebrate: { box: 'bg-pink-50 border-pink-300', icon: 'heart' },
};
function Callout({ c, locale }: P) {
  const tone = TONES[c.tone] ?? TONES.info;
  return (
    <Wrap className="!py-6">
      <Reveal>
        <div className={`mx-auto flex max-w-3xl gap-4 rounded-card border-2 border-dashed p-5 shadow-card ${tone.box}`}>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-card"><Icon name={c.icon || tone.icon} className="h-6 w-6" /></span>
          <div className="min-w-0">
            {t(c.title, locale) && <h3 className="text-h5 font-bold text-primary">{t(c.title, locale)}</h3>}
            <RichBody text={t(c.text, locale)} locale={locale} className="mt-1" />
            {c.button?.href && <div className="mt-3"><Btn b={c.button} locale={locale} /></div>}
          </div>
        </div>
      </Reveal>
    </Wrap>
  );
}

const REGISTRY: Record<string, (p: P) => React.ReactNode> = {
  hero: Hero, table: DataTable, callout: Callout, 'text-image': TextImage, 'feature-grid': FeatureGrid, 'card-row': CardRow, 'icon-row': IconRow,
  'photo-grid': PhotoGrid, banner: Banner, 'link-list': LinkList, testimonials: Testimonials, cta: Cta,
  'rich-text': RichText, faq: Faq, team: Team, partner: Partner, steps: Steps, stats: Stats, contact: ContactInfo,
  downloads: Downloads, 'entry-list': EntryList, scenery: ({ c, locale }) => <Scenery c={c} locale={locale} />, 'trust-bar': TrustBar, safety: Safety, bento: Bento, 'enquiry-form': EnquirySection,
};

export function Section({ type, ...p }: P & { type: string; n?: number }) {
  const C = REGISTRY[type];
  return C ? <>{C(p)}</> : null;
}

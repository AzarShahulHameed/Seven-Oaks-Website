import { t } from '@/lib/i18n';
import { Btn, Icon, IconOrPhoto, Img } from './ui';
import { EnquiryForm, type FormCfg } from './EnquiryForm';
import { ClipReveal, CountUp, Item, Reveal, SplitText, Stagger } from './motion';
import { arr, Heading, HOVER_IMG, MapView, Script, Wrap, type P } from './section-kit';
import { Em } from './motion';

/** Soft wavy edge used between sections. `className` sets the fill colour through text-*. */
export const Wave = ({ className = 'text-primary', flip = false }: { className?: string; flip?: boolean }) => (
  <svg aria-hidden viewBox="0 0 1440 70" preserveAspectRatio="none" className={`block h-8 w-full md:h-[70px] ${className} ${flip ? 'rotate-180' : ''}`}><path fill="currentColor" d="M0,36 C180,78 360,0 600,30 C840,60 1060,6 1250,28 C1340,38 1400,50 1440,42 L1440,70 L0,70 Z" /></svg>
);

/** Home hero: big friendly headline on the left, arch-shaped picture with floating notes on the right. */
export function HeroSplit({ c, locale }: P) {
  const chips = arr(c.chips).filter((x) => t(x.text, locale));
  const badges = arr(c.badges).filter((x) => t(x.title, locale));
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="so-blob-a absolute -end-24 -top-24 -z-10 h-[34rem] w-[34rem] bg-sage" />
      <div aria-hidden className="so-blob-b absolute -start-32 bottom-0 -z-10 h-72 w-72 bg-accent/20" />
      <div aria-hidden className="so-dots absolute start-6 top-24 -z-10 hidden h-32 w-48 md:block" />
      <div className="mx-auto grid max-w-container items-center gap-10 px-4 pb-28 pt-10 md:grid-cols-[1.05fr_.95fr] md:gap-6 md:pb-36 md:pt-16">
        <div>
          {t(c.eyebrow, locale) && <Reveal y={12}><p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-primary shadow-card"><Icon name="leaf" className="h-4 w-4" />{t(c.eyebrow, locale)}</p></Reveal>}
          <SplitText immediate delay={0.1} text={t(c.title, locale)} className="text-h1 leading-[1.05]" />
          <Reveal delay={0.4}><p className="mt-5 max-w-xl text-lg">{t(c.text, locale)}</p></Reveal>
          <Reveal delay={0.55}><div className="mt-8 flex flex-wrap gap-3">{arr(c.buttons).map((b, n) => <Btn key={n} b={{ ...b, variant: b.variant === 'light' ? 'primary' : b.variant === 'outline-light' ? 'outline' : b.variant }} locale={locale} />)}</div></Reveal>
          {chips.length > 0 && (
            <Reveal delay={0.7}>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                {chips.map((x, n) => <li key={n} className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary"><Icon name={x.icon} className="h-4 w-4" /></span>{t(x.text, locale)}</li>)}
              </ul>
            </Reveal>
          )}
        </div>
        <Reveal x={40} y={0} delay={0.2} className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-[88%] max-w-[26rem]">
            <div aria-hidden className="so-arch absolute -inset-3 rotate-3 border-2 border-dashed border-primary/30" />
            <div className="so-arch relative h-full w-full overflow-hidden bg-sage shadow-2xl"><Img image={c.image} locale={locale} priority fill sizes="(min-width:768px) 40vw, 90vw" className="h-full w-full" /></div>
            {c.image2?.url && (
              <div className="so-tape absolute -bottom-6 -start-6 w-[42%] -rotate-6 rounded-md bg-white p-2 pb-6 shadow-xl md:-start-14">
                <Img image={c.image2} locale={locale} className="aspect-square w-full rounded" />
                {t(c.script, locale) && <p className="absolute inset-x-0 bottom-0.5 text-center font-script text-lg leading-none text-primary">{t(c.script, locale)}</p>}
              </div>
            )}
            {badges[0] && (
              <div className="so-float absolute -end-4 top-10 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-xl md:-end-10" style={{ animationDuration: '8s' }}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/25 text-primary"><Icon name={badges[0].icon} className="h-5 w-5" /></span>
                <span className="text-sm leading-tight"><b className="block">{t(badges[0].title, locale)}</b><span className="opacity-75">{t(badges[0].text, locale)}</span></span>
              </div>
            )}
            {badges[1] && (
              <div className="so-float absolute -end-2 bottom-14 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-white shadow-xl md:-end-12" style={{ animationDuration: '10s', animationDelay: '-4s' }}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><Icon name={badges[1].icon} className="h-5 w-5" /></span>
                <span className="text-sm leading-tight"><b className="block">{t(badges[1].title, locale)}</b><span className="opacity-80">{t(badges[1].text, locale)}</span></span>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Row of numbers that build trust: years, ratio, qualifications... sits over the bottom edge of the hero. */
export function TrustBar({ c, locale }: P) {
  const items = arr(c.items).filter((x) => x.value);
  return (
    <section className="relative z-10 -mt-20 md:-mt-24">
      <div className="mx-auto max-w-container px-4">
        <Reveal>
          <ul className="grid grid-cols-2 gap-y-6 rounded-[1.75rem] bg-surface p-6 shadow-card ring-1 ring-black/5 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-black/10 rtl:lg:divide-x-reverse">
            {items.map((it, n) => {
              const v = typeof it.value === 'string' ? it.value : t(it.value, locale);
              return (
                <li key={n} className="flex flex-col items-center px-3 text-center">
                  <span className="mb-2 block"><IconOrPhoto image={it.image} locale={locale} size="h-16 w-16" fallback={<span className="grid h-11 w-11 place-items-center rounded-full bg-sage text-primary"><Icon name={it.icon} className="h-5 w-5" /></span>} /></span>
                  <p className="font-heading text-h3 font-bold leading-none text-primary" dir="ltr">{/[:/]/.test(v) ? v : <CountUp value={v} />}</p>
                  <p className="mt-1.5 text-xs font-semibold leading-snug opacity-80 sm:text-sm">{t(it.label, locale)}</p>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/** Dark, reassuring section about child safety and security. */
export function Safety({ c, locale }: P) {
  const badges = arr(c.badges).filter((b) => t(b, locale));
  return (
    <section className="so-dark relative isolate mt-section bg-primary text-white">
      <div className="absolute inset-x-0 -top-px -translate-y-full"><Wave className="text-primary" /></div>
      <div aria-hidden className="so-dots absolute inset-0 -z-10 opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1.4px, transparent 1.6px)' }} />
      <div className="mx-auto grid max-w-container items-center gap-12 px-4 py-14 md:grid-cols-[.9fr_1.1fr] md:py-20">
        <ClipReveal className="mx-auto w-full max-w-sm">
          <div className="so-arch relative aspect-[4/5] overflow-hidden bg-white/10 shadow-2xl ring-4 ring-white/15"><Img image={c.image} locale={locale} fill className="h-full w-full" /></div>
        </ClipReveal>
        <div>
          <Reveal><p className="mb-2 inline-flex items-center gap-2 text-sm font-bold tracking-[0.2em] opacity-90"><Icon name="shield" className="h-4 w-4" />{t(c.eyebrow, locale)}</p>
            <h2 className="text-h2"><Em text={t(c.title, locale)} /></h2>
            <p className="mt-3 max-w-xl text-lg opacity-90">{t(c.text, locale)}</p></Reveal>
          <Stagger as="ul" className="mt-8 grid gap-5 sm:grid-cols-2" gap={0.1}>
            {arr(c.items).map((it, n) => (
              <Item as="li" key={n} className="group flex gap-4 rounded-2xl bg-white/[.07] p-4 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[.12]">
                <IconOrPhoto image={it.image} locale={locale} size="h-16 w-16" fallback={<span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-black transition group-hover:rotate-6"><Icon name={it.icon} className="h-6 w-6" /></span>} />
                <span><b className="block text-lg leading-tight">{t(it.title, locale)}</b><span className="mt-1 block text-sm opacity-85">{t(it.text, locale)}</span></span>
              </Item>
            ))}
          </Stagger>
          {badges.length > 0 && <Reveal delay={0.2}><ul className="mt-6 flex flex-wrap gap-2">{badges.map((b, n) => <li key={n} className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold tracking-wide">✓ {t(b, locale)}</li>)}</ul></Reveal>}
          <Reveal delay={0.3}><div className="mt-7"><Btn b={c.button} locale={locale} className="!border-white !text-white hover:!bg-white hover:!text-primary" /></div></Reveal>
        </div>
      </div>
    </section>
  );
}

const BENTO = ['md:col-span-2 md:row-span-2', '', 'md:row-span-2', '', 'md:col-span-2', '', '', 'md:col-span-2'];

/** Facilities as an uneven mosaic instead of a uniform grid. */
export function Bento({ c, locale }: P) {
  const items = arr(c.items).slice(0, 8);
  return (
    <Wrap>
      <Heading title={t(c.title, locale)} />
      {t(c.subtitle, locale) && <Reveal><p className="-mt-2 mb-8 max-w-2xl text-lg">{t(c.subtitle, locale)}</p></Reveal>}
      <Stagger className="grid auto-rows-[10rem] grid-cols-2 gap-3 md:auto-rows-[11rem] md:grid-cols-4" gap={0.07}>
        {items.map((it, n) => (
          <Item key={n} as="figure" className={`group relative overflow-hidden rounded-[1.5rem] shadow-card ${BENTO[n] ?? ''}`}>
            <Img image={it.image} locale={locale} fill className={`absolute inset-0 h-full w-full ${HOVER_IMG}`} />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent opacity-80 transition group-hover:opacity-100" />
            <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white"><span className="block font-heading text-h5 font-bold leading-tight drop-shadow transition group-hover:-translate-y-1">{t(it.label, locale)}</span>{t(it.text, locale) && <span className="mt-0.5 block max-h-0 overflow-hidden text-sm opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">{t(it.text, locale)}</span>}</figcaption>
          </Item>
        ))}
      </Stagger>
    </Wrap>
  );
}

/** Contact CTA: enquiry form next to contact details and the map. */
export function EnquirySection({ c, locale, settings }: P) {
  const cfgRaw = settings['public.enquiryForm'] ?? {};
  const contact = settings['public.contact'] ?? {};
  const cookies = settings['public.cookies'] ?? {};
  void cookies;
  const cfg: FormCfg = {
    submitLabel: t(cfgRaw.submitLabel, locale), successTitle: t(cfgRaw.successTitle, locale), successText: t(cfgRaw.successText, locale), consentText: t(cfgRaw.consentText, locale),
    policyHref: `/${locale}/privacy-policy`, policyLabel: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
    programs: arr(cfgRaw.programs).map((p) => ({ value: String(p.value), label: t(p.label, locale) })), fields: cfgRaw.fields ?? {},
  };
  const wa = String(contact.whatsapp ?? '').replace(/[^\d]/g, '');
  if (cfgRaw.enabled === false) return null;
  return (
    <section id="enquire" className="relative isolate overflow-hidden py-section">
      <div aria-hidden className="so-blob-a absolute -start-40 top-10 -z-10 h-[30rem] w-[30rem] bg-sage" />
      <div className="mx-auto grid max-w-container gap-10 px-4 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <Reveal>
            <h2 className="text-h2"><Em text={t(c.title, locale)} /></h2>
            <p className="mt-3 text-lg">{t(c.text, locale)}</p>
          </Reveal>
          <Stagger as="ul" className="mt-6 space-y-4" gap={0.1}>
            {[['pin', t(contact.address, locale)], ['phone', contact.phone], ['mail', contact.email], ['calendar', t(contact.hours, locale)]].filter(([, v]) => v).map(([icon, v]) => (
              <Item as="li" key={String(icon)} className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white"><Icon name={String(icon)} className="h-5 w-5" /></span><span className="pt-2" dir={icon === 'phone' ? 'ltr' : undefined}>{String(v)}</span></Item>
            ))}
          </Stagger>
          {wa && <Reveal delay={0.2}><div className="mt-6"><Btn b={{ label: { en: 'Chat on WhatsApp', ar: 'راسلنا عبر واتساب' }, href: `https://wa.me/${wa}`, variant: 'outline' }} locale={locale} /></div></Reveal>}
          {c.showMap !== false && <Reveal delay={0.25} className="mt-6 overflow-hidden rounded-card shadow-card"><MapView settings={settings} locale={locale} className="h-56" /></Reveal>}
        </div>
        <Reveal x={30} y={0}><EnquiryForm cfg={cfg} locale={locale} /></Reveal>
      </div>
    </section>
  );
}

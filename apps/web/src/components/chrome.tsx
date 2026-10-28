import { Hills } from './nature';
import Link from 'next/link';
import type { Bootstrap } from '@/lib/api';
import { localHref, t } from '@/lib/i18n';
import { Btn, Icon } from './ui';
import { LangSwitch } from './LangSwitch';
import { MobileMenu, ScrollHeader } from './chrome-client';
import { Reveal } from './motion';
import { CookieSettingsLink } from './Tracking';
import { NewsletterForm } from './NewsletterForm';

type Item = Bootstrap['menus'][string][number];
const okUrl = (u: unknown): u is string => typeof u === 'string' && /^(https:\/\/|\/(?!\/))/.test(u);

/** The logo saved in Admin → Settings → Logo & icon. Used in the header and footer, so changing it there changes it everywhere. */
export function BrandLogo({ b, locale, on = 'light', className = 'h-12 sm:h-14 2xl:h-[4.5rem]' }: { b: Bootstrap; locale: string; on?: 'light' | 'dark'; className?: string }) {
  const brand = b.settings['public.branding'] ?? {};
  const name = t(b.settings['public.site']?.name, locale);
  const src = on === 'dark' && okUrl(brand.logoDarkUrl) ? brand.logoDarkUrl : okUrl(brand.logoUrl) ? brand.logoUrl : '';
  if (!src) return <span className="flex items-center gap-2 font-heading text-h4 font-bold"><Icon name="leaf" className="h-6 w-6" />{name}</span>;
  const chip = on === 'dark' && !okUrl(brand.logoDarkUrl);
  return (
    <span className={chip ? 'inline-block rounded-2xl bg-white px-4 py-3' : 'inline-block'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={t(brand.logoAlt, locale) || name} className={`${className} w-auto`} />
    </span>
  );
}

export function Header({ locale, b }: { locale: string; b: Bootstrap }) {
  const items: Item[] = b.menus.HEADER ?? [];
  const links = items.filter((i) => !i.isButton);
  const buttons = items.filter((i) => i.isButton);
  return (
    <ScrollHeader>
      <div className="so-hdr mx-auto flex max-w-[88rem] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center transition-transform duration-300 hover:scale-[1.03]"><BrandLogo b={b} locale={locale} /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-semibold xl:flex">
          {links.map((i, n) => (
            <Link key={n} href={localHref(i.href, locale)} className="group relative whitespace-nowrap px-3 py-2 transition-colors hover:text-primary">
              {t(i.label, locale)}
              <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {buttons.map((i, n) => <Btn key={n} b={{ label: i.label, href: i.href, variant: 'primary' }} locale={locale} className="hidden sm:inline-flex !py-2 whitespace-nowrap" />)}
          <LangSwitch locale={locale} />
          <MobileMenu items={items.map(() => '')} labels={items.map((i) => t(i.label, locale))} hrefs={items.map((i) => localHref(i.href, locale))} buttonLabel={locale === 'ar' ? 'القائمة' : 'Menu'} />
        </div>
      </div>
    </ScrollHeader>
  );
}

export function Announcement({ locale, b }: { locale: string; b: Bootstrap }) {
  const a = b.settings['public.announcement'];
  if (!a?.enabled || !t(a.text, locale)) return null;
  const inner = t(a.text, locale);
  return <div className="bg-accent px-4 py-2 text-center text-sm font-semibold text-black">{a.href ? <Link href={localHref(a.href, locale)}>{inner}</Link> : inner}</div>;
}

export function Footer({ locale, b }: { locale: string; b: Bootstrap }) {
  const site = b.settings['public.site'] ?? {};
  const social = b.settings['public.social'] ?? {};
  const contact = b.settings['public.contact'] ?? {};
  const links: Item[] = b.menus.FOOTER ?? [];
  const soc = [['Instagram', social.instagram], ['Facebook', social.facebook], ['WhatsApp', social.whatsappLink]].filter(([, u]) => typeof u === 'string' && u.startsWith('http'));
  const legal: { label: any; href: string }[] = Array.isArray(b.settings['public.legal']?.links) ? b.settings['public.legal'].links : [];
  const nl = b.settings['public.newsletter'] ?? {};
  const cookies = b.settings['public.cookies'] ?? {};
  const ar = locale === 'ar';
  return (
    <footer className="relative overflow-hidden bg-primary pb-10 pt-24 text-white md:pt-28">
      <Hills flip back="var(--colors-secondary)" className="pointer-events-none absolute inset-x-0 top-0 h-12 text-canvas md:h-16" />
      <div aria-hidden className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <Reveal className="relative mx-auto grid max-w-container gap-8 px-4 md:grid-cols-3">
        <div>
          <BrandLogo b={b} locale={locale} on="dark" className="h-16 md:h-[4.5rem]" />
          <p className="mt-3 font-script text-xl">{t(site.tagline, locale)}</p>
          {soc.length > 0 && (
            <ul className="mt-4 flex gap-4 text-sm">
              {soc.map(([n, u]) => <li key={n}><a href={u} rel="noopener noreferrer" target="_blank" className="font-semibold">{n}</a></li>)}
            </ul>
          )}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
          {links.map((i, n) => <Link key={n} href={localHref(i.href, locale)} className="transition hover:translate-x-1 rtl:hover:-translate-x-1">{t(i.label, locale)}</Link>)}
        </nav>
        <ul className="space-y-2 text-sm">
          {t(contact.address, locale) && <li className="flex gap-2"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" />{t(contact.address, locale)}</li>}
          {contact.phone && <li className="flex gap-2"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} dir="ltr">{contact.phone}</a></li>}
          {contact.email && <li className="flex gap-2"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
          {t(contact.hours, locale) && <li className="flex gap-2"><Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0" />{t(contact.hours, locale)}</li>}
        </ul>
      </Reveal>
      {nl.enabled && (
        <div className="relative mx-auto mt-10 max-w-container px-4"><div className="max-w-xl rounded-card bg-white/10 p-5">
          <NewsletterForm locale={locale} title={t(nl.title, locale) || (ar ? 'ابقوا على اطلاع' : 'Stay in touch')} text={t(nl.text, locale)} button={t(nl.button, locale) || (ar ? 'اشترك' : 'Subscribe')}
            consent={t(nl.consent, locale) || (ar ? 'أوافق على استلام الأخبار والتحديثات عبر البريد الإلكتروني. يمكنني إلغاء الاشتراك في أي وقت.' : 'I agree to receive news and updates by email. I can unsubscribe at any time.')}
            policyHref={cookies.policyHref ? localHref('/privacy-policy', locale) : localHref('/privacy-policy', locale)} policyLabel={ar ? 'سياسة الخصوصية' : 'Privacy Policy'} />
        </div></div>
      )}
      <div className="relative mx-auto mt-8 flex max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 text-xs opacity-90">
        <p>© {new Date().getFullYear()} {t(site.name, locale)}</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {legal.map((l, n) => <Link key={n} href={localHref(l.href, locale)} className="hover:opacity-80">{t(l.label, locale)}</Link>)}
          <CookieSettingsLink label={ar ? 'إعدادات الكوكيز' : 'Cookie settings'} />
        </nav>
      </div>
    </footer>
  );
}

export function WhatsAppButton({ locale, b }: { locale: string; b: Bootstrap }) {
  const f = b.settings['public.floatingWhatsapp'];
  const num = String(b.settings['public.contact']?.whatsapp ?? '').replace(/[^\d]/g, '');
  if (!f?.enabled || !num) return null;
  const href = `https://wa.me/${num}?text=${encodeURIComponent(t(f.message, locale))}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="so-glow fixed bottom-5 end-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110">
      <Icon name="message" className="h-7 w-7" />
    </a>
  );
}

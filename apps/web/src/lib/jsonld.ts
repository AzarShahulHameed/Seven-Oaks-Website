import type { PageData } from './api';
import { t } from './i18n';

const https = (v: unknown) => (typeof v === 'string' && v.startsWith('https://') ? v : undefined);

/** Removes empty strings / empty objects so Google doesn't see blank properties. */
function prune(v: any): any {
  if (Array.isArray(v)) { const a = v.map(prune).filter((x) => x !== undefined); return a.length ? a : undefined; }
  if (v && typeof v === 'object') {
    const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k.startsWith('@') ? x : prune(x)]).filter(([, x]) => x !== undefined));
    return Object.keys(o).some((k) => !k.startsWith('@')) ? o : undefined;
  }
  return v === '' || v == null ? undefined : v;
}

/** Everything is derived from admin-edited settings; the page's own JSON-LD (if any) is added as-is. */
export function buildJsonLd(opts: { page: PageData; locale: string; settings: Record<string, any>; site: string; pageUrl: string }): object[] {
  const { page, locale, settings, site, pageUrl } = opts;
  const sch = settings['public.schema'] ?? {};
  const contact = settings['public.contact'] ?? {};
  const brand = settings['public.branding'] ?? {};
  const social = settings['public.social'] ?? {};
  const name = t(settings['public.site']?.name, locale);
  const out: any[] = [];

  const orgId = `${site}/#organization`;
  const sameAs = Object.values(social).map(https).filter(Boolean);
  const desc = t(page.seo.metaDescription, locale);
  if (page.key === 'home') {
    const mp = settings['public.map'] ?? {};
    const useMap = mp.latitude !== '' && mp.latitude != null && mp.longitude !== '' && mp.longitude != null;
    const lat = Number(useMap ? mp.latitude : sch.latitude), lng = Number(useMap ? mp.longitude : sch.longitude);
    const programmes = (settings['public.enquiryForm']?.programs ?? []).map((p: any) => t(p.label, locale)).filter(Boolean);
    out.push(prune({
      '@context': 'https://schema.org',
      '@type': sch.type === 'ChildCare' ? ['ChildCare', 'LocalBusiness'] : ['Preschool', 'LocalBusiness'],
      '@id': orgId,
      name, url: `${site}/${locale}`, description: desc,
      logo: https(brand.logoUrl), image: https(page.seo.ogImageUrl) ?? https(settings['public.seoDefaults']?.defaultOgImage),
      telephone: contact.phone, email: contact.email,
      address: { '@type': 'PostalAddress', streetAddress: t(sch.streetAddress, locale), addressLocality: t(sch.locality, locale), addressRegion: t(sch.region, locale), addressCountry: sch.country || 'AE' },
      geo: (useMap || (sch.latitude !== '' && sch.longitude !== '')) && Number.isFinite(lat) && Number.isFinite(lng) ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } : undefined,
      hasMap: https(contact.directionsUrl),
      areaServed: t(sch.locality, locale) || undefined,
      availableLanguage: ['en', 'ar'],
      knowsAbout: ['Early Years Foundation Stage (EYFS)', 'Early childhood education', 'Learning through play'],
      openingHours: Array.isArray(sch.openingHours) ? sch.openingHours.filter((x: unknown) => typeof x === 'string' && x) : undefined,
      priceRange: sch.priceRange, inLanguage: locale,
      sameAs,
      ...(programmes.length ? { makesOffer: programmes.map((p: string) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: p, provider: { '@id': orgId } } })) } : {}),
    }));
    out.push(prune({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${site}/#website`, name, url: `${site}/${locale}`, inLanguage: locale, publisher: { '@id': orgId } }));
  } else {
    const type = page.key === 'about-us' ? 'AboutPage' : page.key === 'contact' ? 'ContactPage' : 'WebPage';
    out.push(prune({ '@context': 'https://schema.org', '@type': type, '@id': `${pageUrl}#webpage`, url: pageUrl, name: t(page.title, locale), description: desc, inLanguage: locale, isPartOf: { '@id': `${site}/#website` }, about: { '@id': orgId } }));
    out.push(prune({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name, item: `${site}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t(page.title, locale), item: pageUrl },
      ],
    }));
  }

  // AEO: every "Questions & answers" block becomes FAQPage markup, so search engines and AI assistants can quote the answers.
  const faq = page.sections.filter((x) => x.type === 'faq').flatMap((x) => (x.config?.items ?? []) as any[])
    .map((it) => ({ q: t(it.q, locale).trim(), a: t(it.a, locale).trim() })).filter((x) => x.q && x.a);
  if (faq.length) out.push({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: locale, mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });

  const custom = page.seo.jsonLd;
  if (custom && typeof custom === 'object') out.push({ '@context': 'https://schema.org', ...custom });
  return out.filter(Boolean);
}

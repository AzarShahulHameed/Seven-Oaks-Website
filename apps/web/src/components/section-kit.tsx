import { t } from '@/lib/i18n';
import { LiveMap } from './LiveMap';
import { Em, Reveal } from './motion';

export type P = { c: any; locale: string; settings: Record<string, any>; data?: { testimonials?: Record<string, any[]>; entries?: Record<string, { list: any[]; cats: any[] }> } };
export const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
export const Wrap = ({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-section ${className}`}><div className="mx-auto max-w-container px-4">{children}</div></section>
);
export const Script = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  children ? <p className={`font-script text-2xl ${className}`}>{children}</p> : null;
/** Small accent line under headings. */
export const Rule = ({ center = false }: { center?: boolean }) => <span aria-hidden className={`mb-3 block ${center ? 'mx-auto' : ''}`} />;
export const Heading = ({ title, sub, center = false, className = '' }: { title: string; sub?: string; center?: boolean; className?: string }) => (
  <Reveal className={`${center ? 'text-center' : ''} ${className}`}>
    <h2 className="text-h2"><Em text={title} /></h2>
    {sub && <p className="mt-1 text-h5 text-primary">{sub}</p>}
    <Rule center={center} />
  </Reveal>
);
export const Caption = ({ image, locale, className = '' }: { image: any; locale: string; className?: string }) => {
  const cap = t(image?.caption, locale);
  return cap ? <figcaption className={`px-4 py-2 text-sm opacity-80 ${className}`}>{cap}</figcaption> : null;
};
export const HOVER_IMG = 'transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]';

/** Map: interactive (lat/long + optional API key) → simple Google embed → saved embed link. */
export function MapView({ settings, locale, className = 'h-80' }: { settings: Record<string, any>; locale: string; className?: string }) {
  const mp = settings['public.map'] ?? {};
  const contact = settings['public.contact'] ?? {};
  const has = (v: unknown) => v !== '' && v != null && Number.isFinite(Number(v));
  if (has(mp.latitude) && has(mp.longitude)) {
    return <LiveMap lat={Number(mp.latitude)} lng={Number(mp.longitude)} zoom={Number(mp.zoom) || 16} apiKey={/^AIza[0-9A-Za-z_-]{30,60}$/.test(String(mp.apiKey ?? '')) ? mp.apiKey : undefined} label={t(mp.markerLabel, locale) || t(settings['public.site']?.name, locale)} className={className} locale={locale} />;
  }
  if (String(contact.mapEmbedUrl ?? '').startsWith('https://www.google.com/maps')) {
    return <iframe src={contact.mapEmbedUrl} title="Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className={`w-full border-0 ${className}`} />;
  }
  const addr = t(contact.address, locale) || t(contact.address, 'en');
  if (addr) return <iframe title="Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className={`w-full border-0 ${className}`} src={`https://www.google.com/maps?q=${encodeURIComponent(addr)}&z=16&output=embed`} />;
  return null;
}


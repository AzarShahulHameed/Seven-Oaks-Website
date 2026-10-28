import Link from 'next/link';
import {
  Activity, ArrowRight, Apple, Baby, Backpack, Bell, Bird, BookOpen, Bus, Cake, Camera, Clock, Droplets, Footprints, Info, Moon, Music, PartyPopper, Pencil, Puzzle, Rainbow, Rocket, School, Shirt, Smile, Sparkles, Star, Stethoscope, Sun, Trees, Trophy, Calculator, Calendar, FileText, Globe, Heart, HelpCircle, Leaf, Lightbulb, Mail, MapPin,
  MessageCircle, Palette, Phone, ShieldCheck, Sprout, User, Users, Utensils, type LucideIcon,
} from 'lucide-react';
import { localHref, safeHref, t } from '@/lib/i18n';
import { protectUrl } from '@/lib/protect';
import { SoundVideo } from '@/components/SoundVideo';

const ICONS: Record<string, LucideIcon> = {
  heart: Heart, sprout: Sprout, book: BookOpen, lightbulb: Lightbulb, users: Users, user: User, message: MessageCircle,
  activity: Activity, calculator: Calculator, globe: Globe, palette: Palette, calendar: Calendar, file: FileText,
  utensils: Utensils, shield: ShieldCheck, help: HelpCircle, phone: Phone, mail: Mail, pin: MapPin, leaf: Leaf,
  info: Info, star: Star, sun: Sun, moon: Moon, music: Music, smile: Smile, sparkles: Sparkles, bell: Bell, baby: Baby, party: PartyPopper,
  shirt: Shirt, cake: Cake, puzzle: Puzzle, trophy: Trophy, rocket: Rocket, camera: Camera, clock: Clock, bus: Bus, backpack: Backpack,
  pencil: Pencil, bird: Bird, rainbow: Rainbow, apple: Apple, footprints: Footprints, school: School, doctor: Stethoscope, water: Droplets, trees: Trees,
};
export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = ICONS[name ?? ''] ?? Leaf;
  return <C aria-hidden className={className} />;
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-btn text-btntext border-transparent hover:shadow-lg hover:shadow-black/20',
  outline: 'bg-transparent border-primary text-primary hover:bg-primary hover:text-white',
  'outline-light': 'bg-transparent border-white text-white hover:bg-white hover:text-primary',
  light: 'bg-surface text-primary border-surface hover:shadow-lg hover:shadow-black/20',
};

export function Btn({ b, locale, className = '' }: { b: any; locale: string; className?: string }) {
  const label = t(b?.label, locale);
  if (!label) return null;
  const href = localHref(b?.href, locale);
  const cls = `group relative inline-flex items-center gap-2 overflow-hidden rounded-btn border-2 px-6 py-3 text-btn font-bold uppercase tracking-wide transition duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${VARIANTS[b?.variant] ?? VARIANTS.primary} ${className}`;
  const inner = (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -start-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:start-[150%]" />
      <span className="relative">{label}</span>
      <ArrowRight aria-hidden className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </>
  );
  return href.startsWith('/') ? <Link href={href} className={cls}>{inner}</Link> : <a href={href} className={cls} rel="noopener noreferrer">{inner}</a>;
}

export type ImageData = { url?: string; alt?: any; caption?: any; focalX?: number; focalY?: number; fit?: string; ratio?: string; mobileUrl?: string; tabletUrl?: string; videoUrl?: string; videoPoster?: string; videoControls?: boolean; videoSound?: boolean };
const RATIOS: Record<string, string> = { '16/9': '16 / 9', '4/3': '4 / 3', '3/2': '3 / 2', '1/1': '1 / 1', '3/4': '3 / 4', '21/9': '21 / 9' };
const pct = (n: unknown) => { const v = Number(n); return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50; };

/** Picture with the placement chosen in the admin: focal point (which part stays visible when cropped), fit, shape and separate phone/tablet versions. */
export function Img({ image, locale, className = '', priority = false, fill = false, sizes = '(min-width: 1024px) 50vw, 100vw' }: { image?: ImageData; locale: string; className?: string; priority?: boolean; fill?: boolean; sizes?: string }) {
  const url = safeHref(image?.url);
  const video = safeHref(image?.videoUrl);
  if (video) {
    const poster = safeHref(image?.videoPoster) || url || undefined;
    const vs: React.CSSProperties = { objectPosition: `${pct(image?.focalX)}% ${pct(image?.focalY)}%`, objectFit: image?.fit === 'contain' ? 'contain' : 'cover' };
    if (!fill && image?.ratio && RATIOS[image.ratio]) { vs.aspectRatio = RATIOS[image.ratio]; vs.height = 'auto'; }
    const ctl = !!image?.videoControls;
    if (!ctl && image?.videoSound) return <SoundVideo src={protectUrl(video)} poster={poster ? protectUrl(poster) : undefined} label={t(image?.alt, locale)} className={className} style={vs} priority={priority} locale={locale} />;
    return <video src={protectUrl(video)} poster={poster ? protectUrl(poster) : undefined} aria-label={t(image?.alt, locale)} className={className} style={vs} muted={!ctl} loop={!ctl} autoPlay={!ctl} controls={ctl} playsInline preload={priority ? 'auto' : 'metadata'} />;
  }
  if (!url) return <div aria-hidden className={`bg-gradient-to-br from-sage to-canvas ${className}`} />;
  // Library images are Cloudinary URLs ending .../image/upload/f_auto,q_auto/<folder>/<id>; responsive widths are made by Cloudinary on the fly.
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)f_auto,q_auto\/(.+)$/);
  const srcSet = m ? [480, 960, 1600].map((w) => `${protectUrl(`${m[1]}f_auto,q_auto,w_${w}/${m[2]}`)} ${w}w`).join(', ') : undefined;
  const style: React.CSSProperties = { objectPosition: `${pct(image?.focalX)}% ${pct(image?.focalY)}%`, objectFit: image?.fit === 'contain' ? 'contain' : 'cover' };
  if (!fill && image?.ratio && RATIOS[image.ratio]) { style.aspectRatio = RATIOS[image.ratio]; style.height = 'auto'; }
  const mobile = safeHref(image?.mobileUrl), tablet = safeHref(image?.tabletUrl);
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={protectUrl(url)} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={t(image?.alt, locale)} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" style={style} className={className} />;
  return mobile || tablet ? (
    <picture>
      {mobile && <source media="(max-width: 639px)" srcSet={protectUrl(mobile)} />}
      {tablet && <source media="(max-width: 1023px)" srcSet={protectUrl(tablet)} />}
      {img}
    </picture>
  ) : img;
}

/** A real photo in a round frame when one was chosen in the admin; otherwise the icon (passed as `fallback`). */
/** Cycles the playful palette (editable in admin → Colours) so repeated tiles are not all one colour. */
export const PLAY_BORDER = ['border-sunny', 'border-sky', 'border-coral', 'border-berry'] as const;
export const PLAY_RING = ['ring-sunny', 'ring-sky', 'ring-coral', 'ring-berry'] as const;

export function IconOrPhoto({ image, locale, size = 'h-20 w-20', fallback, className = '', n = 0 }: { n?: number; image?: ImageData; locale: string; size?: string; fallback: React.ReactNode; className?: string }) {
  if (!image?.url && !image?.videoUrl) return <>{fallback}</>;
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full border-4 border-white shadow-card ring-4 ${PLAY_RING[n % 4]} transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:rotate-3 ${size} ${className}`}>
      <Img image={{ ...image, fit: 'cover' }} locale={locale} fill sizes="160px" className="absolute inset-0 h-full w-full" />
    </span>
  );
}

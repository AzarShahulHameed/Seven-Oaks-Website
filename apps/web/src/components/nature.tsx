// Hand-drawn nature illustrations used across the website: oak trees, leaves, acorns, birds, a cottage, clouds and rolling hills.
// Pure SVG (no images to load). Colours follow the theme chosen in Admin → Theme, so they always match the brand.
import { Btn } from './ui';
import { t } from '@/lib/i18n';
import { Em, Reveal } from './motion';

type C = { className?: string; style?: React.CSSProperties };
const GREEN = 'var(--colors-primary)';
const SAGE = 'var(--colors-secondary)';
const GOLD = 'var(--colors-accent)';
const WOOD = 'var(--colors-brown)';

export function Leaf({ className, style, color = GREEN }: C & { color?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className} style={style}>
      <path d="M6 34C4 16 16 5 35 5c1 19-9 31-27 29Z" fill={color} />
      <path d="M8 33C16 23 24 16 33 8" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
export function Cloud({ className, style }: C) {
  return (
    <svg viewBox="0 0 120 56" aria-hidden className={className} style={style}>
      <path d="M26 52a20 20 0 0 1-2-40 26 26 0 0 1 50-6 22 22 0 0 1 28 16 18 18 0 0 1-4 30Z" fill="#fff" fillOpacity=".92" />
    </svg>
  );
}
/** A friendly oak tree with a swaying crown. */
export function Oak({ className, style }: C) {
  return (
    <svg viewBox="0 0 240 280" aria-hidden className={className} style={style}>
      <path d="M104 276c4-30 4-60 0-92h32c-4 32-4 62 0 92Z" fill={WOOD} />
      <path d="M118 200c-18-12-30-24-38-40M122 214c18-10 32-22 42-40" stroke={WOOD} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M112 250c-8 0-14 4-22 8M130 252c8-2 14 0 22 6" stroke={WOOD} strokeWidth="5" strokeLinecap="round" fill="none" />
      <g style={{ transformOrigin: '120px 200px' }}>
        <circle cx="120" cy="86" r="62" fill={GREEN} />
        <circle cx="68" cy="124" r="48" fill={GREEN} />
        <circle cx="172" cy="124" r="48" fill={GREEN} />
        <circle cx="96" cy="64" r="34" fill="#fff" fillOpacity=".09" />
        <circle cx="150" cy="104" r="26" fill="#000" fillOpacity=".06" />
        <circle cx="60" cy="118" r="20" fill="#fff" fillOpacity=".08" />
        <circle cx="92" cy="110" r="5" fill={GOLD} /><circle cx="140" cy="70" r="5" fill={GOLD} /><circle cx="170" cy="130" r="5" fill={GOLD} /><circle cx="64" cy="140" r="5" fill={GOLD} />
      </g>
    </svg>
  );
}

/** A small cottage with a smoking chimney. */
export function Cottage({ className, style }: C) {
  return (
    <svg viewBox="0 0 200 170" aria-hidden className={className} style={style}>
      <rect x="138" y="22" width="18" height="40" fill={WOOD} />
      <g><circle cx="147" cy="14" r="7" fill="#fff" fillOpacity=".7" /><circle cx="155" cy="2" r="5" fill="#fff" fillOpacity=".5" /></g>
      <rect x="30" y="76" width="140" height="80" rx="4" fill="#fff6e3" />
      <path d="M16 82L100 20l84 62Z" fill="#c4553a" />
      <path d="M16 82L100 20l84 62" stroke="#a8432c" strokeWidth="4" strokeLinejoin="round" fill="none" />
      <rect x="84" y="108" width="32" height="48" rx="16 16 0 0" fill={WOOD} />
      <circle cx="108" cy="134" r="2.4" fill={GOLD} />
      <rect x="42" y="98" width="30" height="28" rx="3" fill="#bfe3f0" stroke={WOOD} strokeWidth="4" /><path d="M57 98v28M42 112h30" stroke={WOOD} strokeWidth="3" />
      <rect x="128" y="98" width="30" height="28" rx="3" fill="#bfe3f0" stroke={WOOD} strokeWidth="4" /><path d="M143 98v28M128 112h30" stroke={WOOD} strokeWidth="3" />
      <rect x="38" y="124" width="38" height="8" rx="3" fill={WOOD} /><rect x="124" y="124" width="38" height="8" rx="3" fill={WOOD} />
      <circle cx="46" cy="122" r="4" fill="#e07a5f" /><circle cx="56" cy="121" r="4" fill={GOLD} /><circle cx="132" cy="122" r="4" fill={GOLD} /><circle cx="144" cy="121" r="4" fill="#e07a5f" />
      <path d="M6 158h188" stroke={GREEN} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Rolling hills used as a soft divider. `className` sets height; colours follow `currentColor` (front) and the theme (back). */
export function Hills({ className = '', flip = false, back = SAGE }: { className?: string; flip?: boolean; back?: string }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`}>
      <path d="M0 70C140 20 280 20 440 58s300 40 470 4 340-50 530-8v74H0Z" fill={back} fillOpacity=".7" />
      <path d="M0 92c180-46 340-34 520-6s340 30 520-8c150-30 280-10 400 6v36H0Z" fill="currentColor" />
    </svg>
  );
}

const SKY: Record<string, string> = { day: 'from-[#bfe3f4] via-[#e6f4f7] to-canvas', sunrise: 'from-[#ffd9b8] via-[#fdeccf] to-canvas', dusk: 'from-[#a9b9e8] via-[#f3d7e1] to-canvas' };

/** Storybook landscape: sky, sun, drifting clouds, rolling hills, a big oak, a cottage and birds, with an editable heading and buttons. */
export function Scenery({ c, locale }: { c: any; locale: string }) {
  const sky = SKY[c.sky] ?? SKY.day;
  const on = (v: unknown) => v !== false;
  return (
    <section className={`relative isolate overflow-hidden bg-gradient-to-b ${sky}`}>
      {on(c.showSun) && <span aria-hidden className="absolute end-[10%] top-8 h-16 w-16 rounded-full bg-[#ffd166] shadow-[0_0_60px_20px_rgba(255,209,102,.55)] md:h-24 md:w-24" />}
      {on(c.showClouds) && (<>
        <Cloud className="absolute top-10 h-10 w-24 md:h-14 md:w-36" />
        <Cloud className="absolute top-28 h-8 w-20 opacity-80 md:h-12 md:w-28" />
        <Cloud className="absolute top-4 hidden h-10 w-28 opacity-70 md:block" />
      </>)}
      <div className="relative mx-auto max-w-container px-4 pb-52 pt-14 text-center md:pb-72 md:pt-20">
        <Reveal><h2 className="mx-auto max-w-3xl text-h1"><Em text={t(c.title, locale)} /></h2></Reveal>
        {t(c.text, locale) && <Reveal delay={0.15}><p className="mx-auto mt-4 max-w-2xl text-lg">{t(c.text, locale)}</p></Reveal>}
        {Array.isArray(c.buttons) && c.buttons.length > 0 && <Reveal delay={0.3}><div className="mt-7 flex flex-wrap justify-center gap-3">{c.buttons.map((b: any, n: number) => <Btn key={n} b={b} locale={locale} />)}</div></Reveal>}
      </div>
      {/* the landscape */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-52 md:h-72">
        <Hills className="absolute inset-x-0 bottom-0 h-40 text-primary md:h-56" back="var(--colors-secondary)" />
        {on(c.showTree) && <Oak className="absolute bottom-3 start-[4%] h-44 w-40 md:h-72 md:w-64" />}
        {on(c.showTree) && <Oak className="absolute bottom-2 start-[26%] hidden h-32 w-28 opacity-90 md:block md:h-44 md:w-40" />}
        {on(c.showHouse) && <Cottage className="absolute bottom-3 end-[6%] h-28 w-32 md:h-44 md:w-52" />}
        {on(c.showHouse) && <Oak className="absolute bottom-2 end-[24%] hidden h-36 w-32 md:block" />}
      </div>
    </section>
  );
}

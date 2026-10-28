'use client';
import { AnimatePresence, LazyMotion, MotionConfig, animate, domAnimation, m, useInView, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const; // soft "ease-out-expo": quick start, long gentle stop

/** Wraps the whole site: loads only the small animation feature set and respects "reduce motion" settings. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>;
}

/** Fades and slides content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 32, x = 0, className, as = 'div', once = false }: { children: ReactNode; delay?: number; y?: number; x?: number; className?: string; as?: 'div' | 'li' | 'section' | 'p' | 'span'; once?: boolean }) {
  const C: any = (m as any)[as];
  return (
    <C className={className} initial={{ opacity: 0, y, x }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={{ once, margin: '0px 0px -12% 0px' }} transition={{ duration: 0.8, ease: EASE, delay }}>
      {children}
    </C>
  );
}

const container = (gap: number, delay: number) => ({ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } });
const item = { hidden: { opacity: 0, y: 36, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: EASE } } };

/** Children marked <Item> appear one after another. */
export function Stagger({ children, className, gap = 0.09, delay = 0, as = 'div' }: { children: ReactNode; className?: string; gap?: number; delay?: number; as?: 'div' | 'ul' | 'ol' }) {
  const C: any = (m as any)[as];
  return <C className={className} variants={container(gap, delay)} initial="hidden" whileInView="show" viewport={{ once: false, margin: '0px 0px -10% 0px' }}>{children}</C>;
}
const ITEM_VARIANTS = {
  rise: item,
  zoom: { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.9, ease: EASE } } },
};
export type ItemAnim = keyof typeof ITEM_VARIANTS | 'none';
export function Item({ children, className, as = 'div', anim = 'rise' }: { children: ReactNode; className?: string; as?: 'div' | 'li' | 'figure' | 'blockquote'; anim?: ItemAnim }) {
  const C: any = (m as any)[as];
  return <C className={className} variants={anim === 'none' ? undefined : ITEM_VARIANTS[anim] ?? item}>{children}</C>;
}

/** Splits "plain *emphasised* plain" into words and remembers which ones were wrapped in asterisks. */
export function parseEm(text: string): { word: string; em: boolean }[] {
  const out: { word: string; em: boolean }[] = [];
  text.split(/(\*[^*]+\*)/).forEach((seg) => {
    const em = seg.length > 2 && seg.startsWith('*') && seg.endsWith('*');
    (em ? seg.slice(1, -1) : seg).split(/\s+/).filter(Boolean).forEach((word) => out.push({ word, em }));
  });
  return out;
}
/** Plain text with *emphasis* turned into a hand-underlined italic word (used in section headings). */
export function Em({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((seg, n) => (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*') ? <span key={n}>{seg.slice(1, -1)}</span> : <span key={n}>{seg}</span>))}</>;
}

/** Headline that rises word by word. Splits by whole words so Arabic letters stay joined. Words written *like this* get the highlight style. */
export function SplitText({ text, as = 'h1', className, delay = 0, immediate = false }: { text: string; as?: 'h1' | 'h2' | 'h3' | 'p'; className?: string; delay?: number; immediate?: boolean }) {
  const C: any = (m as any)[as];
  const words = parseEm(text);
  const v = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: delay } } };
  const w = { hidden: { y: '110%', rotate: 3 }, show: { y: '0%', rotate: 0, transition: { duration: 0.85, ease: EASE } } };
  return (
    <C className={className} aria-label={words.map((x) => x.word).join(' ')} variants={v} initial="hidden" {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: false } })}>
      {words.map(({ word, em }, n) => (
        <span key={n} aria-hidden className="inline-block overflow-hidden py-[0.12em] align-bottom" style={{ marginInlineEnd: '0.28em' }}>
          <m.span className={`inline-block will-change-transform ${em ? 'so-em' : ''}`} variants={w}>{word}</m.span>
        </span>
      ))}
    </C>
  );
}

/** Counts up to the number inside a value such as "500+", "12" or "98%". Anything without a number is shown as is. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const mt = value.match(/^([^\d-]*)(-?[\d][\d,]*(?:\.\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: '0px 0px -10% 0px' });
  const [shown, setShown] = useState(value); // real number first (no-JS / search engines see it), then it counts up each time it scrolls into view
  useEffect(() => {
    if (!mt || !inView) return;
    const target = parseFloat(mt[2].replace(/,/g, '')), dec = (mt[2].split('.')[1] ?? '').length, comma = mt[2].includes(',');
    const fmt = (n: number) => (comma ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec));
    const c = animate(0, target, { duration: 2, ease: EASE, onUpdate: (n) => setShown(`${mt[1]}${fmt(n)}${mt[3]}`) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);
  return <span ref={ref} className={className} dir="ltr" style={{ unicodeBidi: 'isolate' }}>{shown}</span>;
}

/** Background layer that drifts slower than the page while scrolling (depth effect) and eases in with a slow zoom. */
export function ParallaxBg({ children, className = '', strength = 14 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${strength}%`]);
  const s = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  return (
    <div ref={ref} className={`pointer-events-none overflow-hidden ${className}`}>
      <m.div className="h-full w-full" style={{ y, scale: s }} initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, ease: EASE }}>{children}</m.div>
    </div>
  );
}

/** Picture that is "uncovered" top to bottom when it scrolls into view. */
export function ClipReveal({ children, className = '', delay = 0, from = 'bottom' }: { children: ReactNode; className?: string; delay?: number; from?: 'bottom' | 'start' }) {
  const hidden = from === 'bottom' ? 'inset(0 0 100% 0 round 1.5rem)' : 'inset(0 100% 0 0 round 1.5rem)';
  return <m.div className={className} initial={{ clipPath: hidden, opacity: 0.6 }} whileInView={{ clipPath: 'inset(0 0 0% 0 round 0rem)', opacity: 1 }} viewport={{ once: false, margin: '0px 0px -10% 0px' }} transition={{ duration: 1.1, ease: EASE, delay }}>{children}</m.div>;
}

/** Decorations that slide a little against the mouse pointer inside their section. */
export function MouseParallax({ children, strength = 24, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  useEffect(() => {
    const el = host.current?.parentElement; if (!el || !window.matchMedia('(pointer:fine)').matches) return;
    const mv = (e: PointerEvent) => { const r = el.getBoundingClientRect(); x.set(((e.clientX - r.left) / r.width - 0.5) * strength); y.set(((e.clientY - r.top) / r.height - 0.5) * strength); };
    const lv = () => { x.set(0); y.set(0); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }, [strength, x, y]);
  return <div ref={host} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden><m.div className="h-full w-full" style={{ x, y }}>{children}</m.div></div>;
}

/** Card that tilts toward the pointer. Disabled on touch screens. */
export function Tilt({ children, className = '', max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  return (
    <m.div
      className={className} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2); rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2); }}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
    >{children}</m.div>
  );
}

/** Thin progress line at the top showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <m.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent rtl:origin-right" style={{ scaleX }} />;
}

/** Page content fades in after every navigation. Pure CSS so it also works before JavaScript has loaded. (Used by app/[locale]/template.tsx.) */
export function PageEnter({ children }: { children: ReactNode }) {
  return <div id="page-root" className="so-enter">{children}</div>;
}

/** Fades the page out (220 ms) before an internal link navigates, so pages never "jump". Honors modifier keys, new tabs and downloads. */
export function RouteTransitions() {
  const router = useRouter();
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.documentElement.classList.remove('is-leaving'); setBusy(false); }, [path]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const on = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.origin !== location.origin) return;
      const url = new URL(a.href);
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or #anchor
      if (/^\/(admin|api|preview)/.test(url.pathname)) return;
      e.preventDefault();
      document.documentElement.classList.add('is-leaving'); setBusy(true);
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), 210);
    };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, [router]);
  return <AnimatePresence>{busy && <m.div key="bar" aria-hidden className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-primary" initial={{ scaleX: 0 }} animate={{ scaleX: 0.85 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: EASE }} />}</AnimatePresence>;
}

/** One quote at a time, cross-fading, with dots. Pauses while the pointer is over it. */
export function QuoteCarousel({ items }: { items: { quote: string; author: string; rating: number; image?: string; child?: string }[] }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  useEffect(() => { if (pause || items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), 6500); return () => clearInterval(t); }, [pause, items.length]);
  const cur = items[i % items.length];
  return (
    <div onPointerEnter={() => setPause(true)} onPointerLeave={() => setPause(false)} onFocus={() => setPause(true)} onBlur={() => setPause(false)}>
      <div className="relative mx-auto min-h-[15rem] max-w-3xl rounded-card bg-surface p-8 text-center shadow-card md:p-12" aria-live="polite">
        <span aria-hidden className="absolute -top-6 start-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-primary font-heading text-4xl leading-none text-white rtl:translate-x-1/2">“</span>
        <AnimatePresence mode="wait">
          <m.figure key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.45, ease: EASE }}>
            <blockquote className="font-heading text-h4 leading-snug">{cur.quote}</blockquote>
            <figcaption className="mt-5 flex flex-col items-center gap-2 text-sm font-semibold">
              {cur.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cur.image} alt="" className="h-14 w-14 rounded-full object-cover ring-4 ring-sage" />}
              <span>{cur.author}{cur.child ? <span className="font-normal opacity-70"> · {cur.child}</span> : null}</span>
              {cur.rating > 0 && <span className="text-accent" aria-label={`${cur.rating} / 5`}>{'★'.repeat(Math.min(5, Math.max(0, cur.rating)))}</span>}
            </figcaption>
          </m.figure>
        </AnimatePresence>
      </div>
      {items.length > 1 && (
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Reviews">
          {items.map((_, n) => <button key={n} role="tab" aria-selected={n === i} aria-label={`Review ${n + 1}`} onClick={() => setI(n)} className={`h-2.5 rounded-full transition-all ${n === i ? 'w-8 bg-primary' : 'w-2.5 bg-primary/30 hover:bg-primary/60'}`} />)}
        </div>
      )}
    </div>
  );
}

/** Soft drifting shapes used as decoration behind hero and call-to-action sections. */
export function Floaters({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const c = tone === 'light' ? 'bg-white/20' : 'bg-primary/15';
  return (
    <MouseParallax strength={36}>
      <span className={`so-float absolute -start-10 top-[12%] h-44 w-44 rounded-full blur-2xl ${c}`} style={{ animationDuration: '11s' }} />
      <span className={`so-float absolute end-[8%] top-[18%] h-28 w-28 rounded-[40%_60%_55%_45%] ${c}`} style={{ animationDuration: '9s', animationDelay: '-3s' }} />
      <span className={`so-float absolute bottom-[14%] start-[42%] h-20 w-20 rounded-full ${c}`} style={{ animationDuration: '13s', animationDelay: '-6s' }} />
      <span className={`so-float absolute -bottom-10 end-[22%] h-52 w-52 rounded-full blur-3xl ${c}`} style={{ animationDuration: '15s', animationDelay: '-2s' }} />
    </MouseParallax>
  );
}

'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';

export type LightItem = { kind: 'image' | 'video'; src: string; thumb: string; poster?: string; alt: string; caption: string };

/** A tidy grid of photos and videos. Click one to see it large, then use the arrows, swipe or the keyboard to move through the set. */
export function MediaGrid({ items, labels, columns = 3 }: { items: LightItem[]; labels: { close: string; next: string; prev: string; of: string }; columns?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const back = useRef<HTMLButtonElement | null>(null);
  const touch = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); else if (e.key === 'ArrowRight') go(document.dir === 'rtl' ? -1 : 1); else if (e.key === 'ArrowLeft') go(document.dir === 'rtl' ? 1 : -1); };
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, go]);
  const cur = open === null ? null : items[open];
  const cols = columns === 4 ? 'lg:grid-cols-4' : columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  return (
    <>
      <ul className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${cols}`}>
        {items.map((it, n) => (
          <li key={n}>
            <button type="button" onClick={() => setOpen(n)} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-sage shadow-card ring-offset-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent" aria-label={it.caption || it.alt || `${n + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.thumb ? <img src={it.thumb} alt={it.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <span className="grid h-full w-full place-items-center bg-primary/10" />}
              {it.kind === 'video' && <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg transition group-hover:scale-110"><Play className="h-6 w-6 translate-x-0.5" fill="currentColor" /></span></span>}
              {it.caption && <span className="absolute inset-x-0 bottom-0 translate-y-1 bg-primary/90 px-3 py-1.5 text-start text-sm font-semibold text-white transition group-hover:translate-y-0">{it.caption}</span>}
            </button>
          </li>
        ))}
      </ul>
      {cur && mounted && createPortal(
        <div role="dialog" aria-modal="true" aria-label={cur.caption || cur.alt} className="fixed inset-0 z-[110] flex flex-col p-3 sm:p-6" style={{ backgroundColor: "rgba(0,0,0,0.94)" }} onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 60) go(d < 0 ? 1 : -1); }}>
          <div className="flex items-center justify-between text-white"><span className="text-sm tabular-nums opacity-80">{(open ?? 0) + 1} {labels.of} {items.length}</span>
            <button ref={back} autoFocus type="button" onClick={() => setOpen(null)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg ring-2 ring-white/60 hover:scale-110" aria-label={labels.close}><X className="h-6 w-6" /></button></div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="absolute start-0 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/30"><ChevronLeft className="h-6 w-6 rtl:rotate-180" /></button>
            {cur.kind === 'video'
              ? <video key={cur.src} src={cur.src} poster={cur.poster} controls autoPlay playsInline className="max-h-full max-w-full rounded-xl bg-black" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img key={cur.src} src={cur.src} alt={cur.alt} className="max-h-full max-w-full rounded-xl object-contain" />}
            <button type="button" onClick={() => go(1)} aria-label={labels.next} className="absolute end-0 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/30"><ChevronRight className="h-6 w-6 rtl:rotate-180" /></button>
          </div>
          {cur.caption && <p className="mt-3 text-center text-white">{cur.caption}</p>}
        </div>, document.body)}
    </>
  );
}

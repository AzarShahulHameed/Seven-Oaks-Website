'use client';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Buttery inertial scrolling (Lenis). Off for people who prefer reduced motion and on touch devices (native feels better there). */
export function SmoothScroll() {
  const ref = useRef<Lenis | null>(null);
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer:fine)').matches) return;
    const l = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    ref.current = l;
    let raf = 0;
    const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const hash = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]'); if (!a) return;
      const el = document.querySelector(a.getAttribute('href')!); if (el) { e.preventDefault(); l.scrollTo(el as HTMLElement, { offset: -80 }); }
    };
    document.addEventListener('click', hash);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('click', hash); l.destroy(); ref.current = null; };
  }, []);
  useEffect(() => { ref.current?.scrollTo(0, { immediate: true }); }, [path]);
  return null;
}

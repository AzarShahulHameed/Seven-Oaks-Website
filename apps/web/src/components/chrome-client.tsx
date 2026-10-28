'use client';
import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

/** Header that becomes a little more compact and gets a soft shadow once you scroll. */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const [s, setS] = useState(false);
  useEffect(() => { const f = () => setS(window.scrollY > 12); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return <header data-scrolled={s} className={`sticky top-0 z-40 bg-surface/95 backdrop-blur-md transition-all duration-300 ${s ? 'shadow-lg shadow-black/10' : 'shadow-sm'} [&_.so-hdr]:transition-all [&_.so-hdr]:duration-300 ${s ? '[&_.so-hdr]:!py-1.5' : ''}`}>{children}</header>;
}

/** Slide-in phone menu with links appearing one after another. */
export function MobileMenu({ items, labels, hrefs, buttonLabel }: { items: string[]; labels: string[]; hrefs: string[]; buttonLabel: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.documentElement.style.overflow = open ? 'hidden' : ''; return () => { document.documentElement.style.overflow = ''; }; }, [open]);
  return (
    <div className="xl:hidden">
      <button aria-label={buttonLabel} aria-expanded={open} onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-btn border border-primary/30 text-primary transition hover:bg-primary hover:text-white"><Menu className="h-5 w-5" /></button>
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <m.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={buttonLabel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <m.nav className="absolute inset-y-0 end-0 w-[80%] max-w-sm overflow-y-auto bg-surface p-6 shadow-2xl" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }} style={{ direction: 'inherit' }}>
              <button aria-label="Close" onClick={() => setOpen(false)} className="mb-4 ms-auto grid h-10 w-10 place-items-center rounded-full hover:bg-sage"><X className="h-5 w-5" /></button>
              <ul className="space-y-1">
                {items.map((_, n) => (
                  <m.li key={n} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + n * 0.045, duration: 0.4 }}>
                    <Link href={hrefs[n]} className="block rounded-lg px-3 py-3 text-lg font-semibold transition hover:bg-sage hover:text-primary">{labels[n]}</Link>
                  </m.li>
                ))}
              </ul>
            </m.nav>
          </m.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}

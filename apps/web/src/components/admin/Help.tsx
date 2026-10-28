'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Very short hints just repeat the label, so they are not shown: a help icon only appears when there is something genuinely worth explaining. */
const MIN_LENGTH = 48;

/**
 * A "?" bubble that explains a field on hover, focus or tap. The bubble is drawn on top of the whole page (never clipped or hidden behind
 * text, cards or sticky bars) and is kept inside the screen edges, flipping below the icon when there is no room above.
 */
export function Help({ text, align = 'center' }: { text: string; align?: 'left' | 'center' | 'right' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean; arrow: number } | null>(null);
  const btn = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const id = useId();
  void align;

  useEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const b = btn.current?.getBoundingClientRect(); const t = tip.current?.getBoundingClientRect();
      if (!b || !t) return;
      const m = 8, cx = b.left + b.width / 2;
      const left = Math.min(Math.max(m, cx - t.width / 2), window.innerWidth - t.width - m);
      const below = b.top - t.height - 12 < m;
      setPos({ left, top: below ? b.bottom + 10 : b.top - t.height - 10, below, arrow: Math.min(Math.max(12, cx - left), t.width - 12) });
    };
    place();
    const close = (e: Event) => { if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return; setOpen(false); };
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close); document.addEventListener('keydown', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); document.removeEventListener('keydown', close); };
  }, [open]);

  if (!text || text.length < MIN_LENGTH) return null;
  return (
    <span ref={btn} className="a-help" tabIndex={0} role="button" aria-label="Help" aria-describedby={open ? id : undefined} aria-expanded={open}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}>
      <span className="a-help-dot" aria-hidden>?</span>
      {open && typeof document !== 'undefined' && createPortal(
        <span ref={tip} id={id} role="tooltip" className="a-help-tip" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? 'visible' : 'hidden' }}>
          {text}
          <span aria-hidden className="a-help-arrow" style={{ left: pos?.arrow ?? 12, ...(pos?.below ? { top: -5, borderBottomColor: '#1b2a1f' } : { top: '100%', borderTopColor: '#1b2a1f' }) }} />
        </span>, document.body)}
    </span>
  );
}

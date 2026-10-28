'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * A looping video that starts silent (browsers block automatic sound) with a speaker button so visitors can switch the sound on.
 * The button is drawn on top of the whole page (not inside the video's own layer, where banners and overlays could cover it)
 * and follows the corner of the video while it is on screen, so it can always be clicked.
 */
export function SoundVideo({ src, poster, label, className, style, priority, locale }: { src: string; poster?: string; label?: string; className?: string; style?: React.CSSProperties; priority?: boolean; locale: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const ar = locale === 'ar';
  const SIZE = 44, GAP = 16;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0, visible = false;
    const place = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!visible) return setPos(null);
        const r = el.getBoundingClientRect();
        const bottom = Math.min(r.bottom, window.innerHeight);
        const top = Math.max(r.top, 0);
        const y = Math.max(top + GAP, bottom - SIZE - GAP);
        const x = ar ? Math.max(r.left, 0) + GAP : Math.min(r.right, window.innerWidth) - SIZE - GAP;
        setPos((p) => (p && Math.abs(p.top - y) < 1 && Math.abs(p.left - x) < 1 ? p : { top: y, left: x }));
      });
    };
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; place(); }, { threshold: [0, 0.15, 0.5, 1] });
    io.observe(el);
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return () => { io.disconnect(); window.removeEventListener('scroll', place); window.removeEventListener('resize', place); cancelAnimationFrame(raf); };
  }, [ar]);

  const toggle = (e: React.SyntheticEvent) => {
    e.preventDefault(); e.stopPropagation();
    const v = ref.current; if (!v) return;
    v.muted = !v.muted; if (!v.muted) v.volume = 1;
    setMuted(v.muted);
    if (!v.muted) void v.play().catch(() => undefined);
  };

  return (
    <>
      <video ref={ref} src={src} poster={poster} aria-label={label} className={className} style={style} muted loop autoPlay playsInline preload={priority ? 'auto' : 'metadata'} />
      {mounted && pos && createPortal(
        <button type="button" onClick={toggle} aria-pressed={!muted} aria-label={muted ? (ar ? 'تشغيل الصوت' : 'Turn sound on') : (ar ? 'كتم الصوت' : 'Turn sound off')}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: SIZE, height: SIZE, zIndex: 60, pointerEvents: 'auto' }}
          className="grid cursor-pointer place-items-center rounded-full bg-black/70 text-white shadow-lg ring-2 ring-white/70 backdrop-blur transition hover:scale-110 hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          {muted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
          <span className="sr-only">{muted ? (ar ? 'تشغيل الصوت' : 'Turn sound on') : (ar ? 'كتم الصوت' : 'Turn sound off')}</span>
        </button>,
        document.body,
      )}
    </>
  );
}

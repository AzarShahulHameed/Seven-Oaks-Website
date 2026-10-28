'use client';
import { useEffect, useRef, useState } from 'react';

const VIEW = 300; // size of the square crop window on screen
const OUT = 512;  // size of the finished picture

/** Drag to move, slide to zoom. Produces a square picture; nothing leaves the browser until the person presses Use. */
export function ImageCropper({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const [src, setSrc] = useState('');
  const img = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => { const u = URL.createObjectURL(file); setSrc(u); return () => URL.revokeObjectURL(u); }, [file]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onCancel(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onCancel]);

  const base = nat ? VIEW / Math.min(nat.w, nat.h) : 1; // scale at which the picture just covers the window
  const s = base * zoom;
  const clamp = (x: number, y: number, sc = s) => nat ? ({ x: Math.min(0, Math.max(VIEW - nat.w * sc, x)), y: Math.min(0, Math.max(VIEW - nat.h * sc, y)) }) : { x, y };

  const onLoad = () => {
    const el = img.current!; const n = { w: el.naturalWidth, h: el.naturalHeight };
    if (!n.w || !n.h) return setErr('This picture could not be read.');
    setNat(n); const b = VIEW / Math.min(n.w, n.h);
    setPos({ x: (VIEW - n.w * b) / 2, y: (VIEW - n.h * b) / 2 });
  };
  const changeZoom = (z: number) => {
    if (!nat) return;
    // keep the centre of the window fixed while zooming
    const cx = (VIEW / 2 - pos.x) / s, cy = (VIEW / 2 - pos.y) / s; const ns = base * z;
    setZoom(z); setPos(clamp(VIEW / 2 - cx * ns, VIEW / 2 - cy * ns, ns));
  };
  const done = () => {
    if (!nat || !img.current) return;
    const c = document.createElement('canvas'); c.width = OUT; c.height = OUT;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.current, -pos.x / s, -pos.y / s, VIEW / s, VIEW / s, 0, 0, OUT, OUT);
    c.toBlob((b) => (b ? onDone(b) : setErr('Could not prepare the picture.')), 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Crop your picture">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-bold">Crop your photo</h2>
        <p className="a-sub">Drag the picture to move it. Use the slider to zoom.</p>
        <div
          className="relative mx-auto mt-3 touch-none select-none overflow-hidden rounded-xl bg-slate-200"
          style={{ width: VIEW, height: VIEW, cursor: 'grab' }}
          onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y }; }}
          onPointerMove={(e) => { if (drag.current) setPos(clamp(drag.current.ox + e.clientX - drag.current.px, drag.current.oy + e.clientY - drag.current.py)); }}
          onPointerUp={() => { drag.current = null; }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img ref={img} src={src} alt="" draggable={false} onLoad={onLoad} onError={() => setErr('This file is not a picture we can read.')} style={{ position: 'absolute', left: 0, top: 0, maxWidth: 'none', width: nat ? nat.w : 'auto', height: nat ? nat.h : 'auto', transformOrigin: '0 0', transform: `translate(${pos.x}px, ${pos.y}px) scale(${s})`, opacity: nat ? 1 : 0 }} />}
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,.45)', borderRadius: '50%', clipPath: 'inset(0)' }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/90" aria-hidden />
        </div>
        <label className="mt-4 block text-sm font-semibold">Zoom
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="mt-1 w-full accent-[#1f4d2b]" />
        </label>
        {err && <p className="a-err" role="alert">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="a-btn" onClick={onCancel}>Cancel</button>
          <button className="a-btn a-btn-primary" disabled={!nat} onClick={done}>Use this photo</button>
        </div>
      </div>
    </div>
  );
}

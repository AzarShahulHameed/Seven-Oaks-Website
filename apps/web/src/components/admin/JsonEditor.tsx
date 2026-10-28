'use client';
import { useId, useState } from 'react';
import { MediaPicker } from './MediaPicker';

type J = any;
const isI18n = (v: J) =>
  v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => k === 'en' || k === 'ar');
const blank = (v: J): J =>
  typeof v === 'string' ? '' : typeof v === 'number' ? 0 : typeof v === 'boolean' ? false : Array.isArray(v) ? [] :
  v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : '';

const input = 'w-full rounded border border-slate-300 px-2 py-1.5 text-sm';
const btn = 'rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100';

/** Generic, schema-less editor: EN/AR pairs side by side, colour pickers, lists with reorder/add/remove. */
export function JsonEditor({ value, onChange, label }: { value: J; onChange: (v: J) => void; label?: string }) {
  const id = useId();
  const [picking, setPicking] = useState(false);
  const lab = label ? <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label> : null;

  if (isI18n(value)) {
    const missing = !value.en || !value.ar;
    return (
      <div>
        {lab}
        <div className="grid grid-cols-2 gap-2">
          <textarea id={id} rows={value.en?.length > 70 ? 3 : 1} placeholder="EN" className={input} value={value.en ?? ''} onChange={(e) => onChange({ ...value, en: e.target.value })} />
          <textarea rows={value.ar?.length > 70 ? 3 : 1} placeholder="AR" dir="rtl" lang="ar" className={input} value={value.ar ?? ''} onChange={(e) => onChange({ ...value, ar: e.target.value })} />
        </div>
        {missing && (value.en || value.ar) && <p className="mt-0.5 text-xs text-amber-600">Translation missing</p>}
      </div>
    );
  }
  if (typeof value === 'boolean')
    return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
  if (typeof value === 'number')
    return <div>{lab}<input id={id} type="number" className={input} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>;
  if (typeof value === 'string' || value == null) {
    const s = value ?? '';
    const isColor = /^#[0-9a-f]{6}$/i.test(s);
    return (
      <div>
        {lab}
        <div className="flex gap-2">
          {isColor && <input type="color" aria-label={`${label} colour`} value={s} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border" />}
          <input id={id} className={input} value={s} onChange={(e) => onChange(e.target.value)} />
          {/^(url|logoUrl|faviconUrl|ogImageUrl|defaultOgImage)$/.test(label ?? '') && <button type="button" className={btn} onClick={() => setPicking(true)}>Choose…</button>}
        </div>
        {picking && <MediaPicker onClose={() => setPicking(false)} onPick={(m) => { onChange(m.url); setPicking(false); }} />}
      </div>
    );
  }
  if (Array.isArray(value)) {
    const set = (i: number, v: J) => onChange(value.map((x, n) => (n === i ? v : x)));
    const move = (i: number, d: number) => {
      const j = i + d; if (j < 0 || j >= value.length) return;
      const c = [...value]; [c[i], c[j]] = [c[j], c[i]]; onChange(c);
    };
    return (
      <fieldset className="rounded border border-slate-200 p-2">
        {label && <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label} ({value.length})</legend>}
        <div className="space-y-2">
          {value.map((it, i) => (
            <div key={i} className="rounded bg-slate-50 p-2">
              <div className="mb-1 flex justify-end gap-1">
                <button type="button" className={btn} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button type="button" className={btn} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button type="button" className={btn} onClick={() => onChange(value.filter((_, n) => n !== i))} aria-label="Remove">✕</button>
              </div>
              <JsonEditor value={it} onChange={(v) => set(i, v)} label={`#${i + 1}`} />
            </div>
          ))}
        </div>
        {value.length > 0 && <button type="button" className={`${btn} mt-2`} onClick={() => onChange([...value, blank(value[value.length - 1])])}>+ Add</button>}
      </fieldset>
    );
  }
  return (
    <fieldset className="space-y-2 rounded border border-slate-200 p-2">
      {label && <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</legend>}
      {Object.entries(value).map(([k, v]) => (
        <JsonEditor key={k} label={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </fieldset>
  );
}

'use client';
import { useState } from 'react';

type I = { en?: string; ar?: string } | undefined;
const pick = (v: I, l: 'en' | 'ar') => (v?.[l] ?? '').trim();

/** Approximate Google result snippet with length guidance (titles ≈ 60 chars, descriptions ≈ 160). */
export function SerpPreview({ title, metaTitle, metaDescription, slug }: { title: I; metaTitle: I; metaDescription: I; slug: I }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(['en', 'ar'] as const).map((l) => {
        const tt = pick(metaTitle, l) || pick(title, l);
        const dd = pick(metaDescription, l);
        const path = `/${l}${pick(slug, l) ? '/' + pick(slug, l) : ''}`;
        return (
          <div key={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="rounded border bg-white p-3">
            <p className="truncate text-xs text-slate-500" dir="ltr">{path}</p>
            <p className="text-lg leading-snug text-blue-800">{tt || <em className="text-slate-400">No title</em>}</p>
            <p className="text-sm text-slate-700">{dd || <em className="text-slate-400">No description ({l.toUpperCase()})</em>}</p>
            <p className="mt-1 text-xs" dir="ltr">
              <span className={tt.length === 0 || tt.length > 60 ? 'text-red-600' : 'text-emerald-700'}>Title {tt.length}/60</span>{' · '}
              <span className={dd.length < 70 || dd.length > 160 ? 'text-amber-600' : 'text-emerald-700'}>Description {dd.length}/160 (aim 70–160)</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Free-form JSON-LD (schema.org) editor; only valid JSON objects are passed up. */
export function JsonLdField({ value, onChange }: { value: Record<string, any> | null | undefined; onChange: (v: Record<string, any> | null) => void }) {
  const [text, setText] = useState(value ? JSON.stringify(value, null, 2) : '');
  const [err, setErr] = useState('');
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Extra JSON-LD (optional)</label>
      <textarea
        rows={6} spellCheck={false} dir="ltr" value={text} placeholder='{"@type": "FAQPage", "mainEntity": [ ... ]}'
        className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
        onChange={(e) => {
          const v = e.target.value; setText(v);
          if (!v.trim()) { setErr(''); return onChange(null); }
          try {
            const o = JSON.parse(v);
            if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('Must be a JSON object');
            setErr(''); onChange(o);
          } catch (x) { setErr((x as Error).message); }
        }}
      />
      {err ? <p className="text-xs text-red-600">Not saved: {err}</p> : <p className="text-xs text-slate-500">Added to this page on top of the automatic Organization / Breadcrumb data. “@context” is added for you.</p>}
    </div>
  );
}

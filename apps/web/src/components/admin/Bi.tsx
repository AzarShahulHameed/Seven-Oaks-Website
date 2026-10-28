'use client';
import { useRef, useState } from 'react';
import { Help } from './Help';

export type I = { en: string; ar: string };

/** One text in English and Arabic, with a language switch and clickable {{placeholders}}. Missing languages are marked in red. */
export function Bi({ label, help, value, onChange, rows, vars }: { label: string; help?: string; value: I; onChange: (v: I) => void; rows?: number; vars?: string[] }) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const insert = (n: string) => { const el = ref.current; const t = `{{${n}}}`; const s = el?.selectionStart ?? value[lang].length; const e = el?.selectionEnd ?? s; onChange({ ...value, [lang]: value[lang].slice(0, s) + t + value[lang].slice(e) }); setTimeout(() => el?.focus(), 0); };
  const common = { className: 'a-input', dir: lang === 'ar' ? 'rtl' : 'ltr', value: value[lang], onChange: (e: any) => onChange({ ...value, [lang]: e.target.value }), 'aria-invalid': !value[lang].trim() } as const;
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2"><span className="a-label !mb-0">{label}{help && <Help text={help} align="left" />}</span>
        <div className="ms-auto flex overflow-hidden rounded-lg border border-slate-300 text-xs font-bold">{(['en', 'ar'] as const).map((l) => <button key={l} type="button" onClick={() => setLang(l)} className={`px-2.5 py-1 ${lang === l ? 'bg-[#1f4d2b] text-white' : 'bg-white'} ${!value[l].trim() ? 'text-red-600' : ''}`}>{l === 'en' ? 'English' : 'العربية'}{!value[l].trim() && ' •'}</button>)}</div></div>
      {rows ? <textarea ref={ref as any} rows={rows} {...common} /> : <input ref={ref as any} {...common} />}
      {vars && vars.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{vars.map((n) => <button key={n} type="button" onClick={() => insert(n)} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] hover:bg-emerald-100" title="Insert at the cursor">{`{{${n}}}`}</button>)}</div>}
      {!value[lang === 'en' ? 'ar' : 'en'].trim() && <p className="a-warn">The {lang === 'en' ? 'Arabic' : 'English'} version is missing.</p>}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { Skel } from './Skeleton';

const DEVICES = [['desktop', 'Computer', Monitor, 640], ['tablet', 'Tablet', Tablet, 520], ['mobile', 'Phone', Smartphone, 375]] as const;

/** A large pop-up showing exactly how the email looks in a mail app, in English or Arabic, on a computer, tablet or phone. */
export function EmailPreviewModal({ title = 'Email preview', load, onClose }: { title?: string; load: (locale: 'en' | 'ar') => Promise<{ subject: string; html: string }>; onClose: () => void }) {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [device, setDevice] = useState<(typeof DEVICES)[number][0]>('desktop');
  const [r, setR] = useState<{ subject: string; html: string } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { let dead = false; setR(null); setErr(''); load(locale).then((x) => !dead && setR(x)).catch((e) => !dead && setErr(e?.message ?? 'Could not build the preview.')); return () => { dead = true; }; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [locale]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  const w = DEVICES.find((d) => d[0] === device)![3];
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900/90" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-white">
        <strong className="text-sm">{title}</strong>
        <div className="flex gap-1">{DEVICES.map(([k, label, Icon]) => <button key={k} onClick={() => setDevice(k)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${device === k ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span></button>)}</div>
        <div className="flex gap-1">{(['en', 'ar'] as const).map((l) => <button key={l} onClick={() => setLocale(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${locale === l ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>{l === 'en' ? 'English' : 'العربية'}</button>)}</div>
        <span className="hidden text-xs text-white/60 lg:inline">Sample details are filled in. Nothing is sent.</span>
        <button className="ms-auto rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close preview" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6">
        <div className="mx-auto" style={{ width: w, maxWidth: '100%' }}>
          <p className="mb-2 truncate rounded-lg bg-white px-3 py-2 text-sm shadow"><span className="text-slate-500">Subject: </span><strong>{r?.subject ?? '…'}</strong></p>
          {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          {!r && !err && <Skel className="h-[70vh] w-full" />}
          {r && <iframe title="Email preview" sandbox="" srcDoc={r.html} className="block h-[calc(100vh-9rem)] w-full rounded-xl bg-white shadow-2xl" />}
        </div>
      </div>
    </div>
  );
}

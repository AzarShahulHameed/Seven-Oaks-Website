'use client';
import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';

const DEVICES = [['desktop', 'Computer', Monitor, '100%'], ['tablet', 'Tablet', Tablet, '820px'], ['mobile', 'Phone', Smartphone, '390px']] as const;

/** Shows the unsaved draft exactly as visitors will see it, at computer, tablet and phone widths, in English or Arabic. */
export function PreviewModal({ page, entry, onClose }: { pageKey: string; page: any; entry?: any; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number][0]>('desktop');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [ready, setReady] = useState(false);

  const send = () => frame.current?.contentWindow?.postMessage({ type: 'so-preview', page, entry, locale }, location.origin);
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.type === 'so-preview-ready') { setReady(true); send(); } };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, entry, locale]);
  useEffect(() => { if (ready) send(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, entry, locale, ready]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-800" role="dialog" aria-modal="true" aria-label="Preview">
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 px-4 py-2 text-white">
        <strong className="text-sm">Preview (your unsaved draft)</strong>
        <div className="flex gap-1">
          {DEVICES.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setDevice(k)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${device === k ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['en', 'ar'] as const).map((l) => <button key={l} onClick={() => setLocale(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${locale === l ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>{l === 'en' ? 'English' : 'العربية'}</button>)}
        </div>
        <span className="hidden text-xs text-white/60 md:inline">Links are switched off here. Nothing is saved or published.</span>
        <button className="ms-auto rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close preview" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-4">
        <iframe ref={frame} src="/preview" title="Page preview" className="h-full rounded-lg bg-white shadow-2xl transition-[width] duration-300" style={{ width: DEVICES.find((d) => d[0] === device)![3], maxWidth: '100%' }} />
      </div>
    </div>
  );
}

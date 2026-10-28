'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { adminFetch, describeError } from '@/lib/admin-api';
import { ACCEPT_IMAGES, ACCEPT_VIDEO, MAX_VIDEO_MB, isVideoFile, precheck, uploadFile, uploadVideo } from '@/lib/upload';
import { Help } from './Help';
import { useToast } from './Toast';

export type MediaItem = {
  id: string; kind?: 'IMAGE' | 'VIDEO' | 'DOCUMENT'; posterUrl?: string; url: string; thumbUrl: string; folder: string; width: number; height: number; sizeBytes: number;
  altText: { en: string; ar: string }; showsChild: boolean; hasConsent: boolean;
};

/** Modal image chooser used by every image field: pick from the library or upload a new photo without leaving the page. */
export function MediaPicker({ onPick, onClose, onPickMany, allowVideo = false, initialTab = 'IMAGE' }: { initialTab?: 'IMAGE' | 'VIDEO'; onPick?: (m: MediaItem) => void; onClose: () => void; /** Show a Videos tab (for fields that can play a video instead of a photo). */ allowVideo?: boolean; /** When given, several photos can be ticked or uploaded at once. */ onPickMany?: (m: MediaItem[]) => void }) {
  const multi = !!onPickMany;
  const [tab, setTab] = useState<'IMAGE' | 'VIDEO'>(allowVideo ? initialTab : 'IMAGE');
  const vid = tab === 'VIDEO';
  const [sel, setSel] = useState<MediaItem[]>([]);
  const toggle = (m: MediaItem) => setSel((l) => (l.some((x) => x.id === m.id) ? l.filter((x) => x.id !== m.id) : [...l, m]));
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState({ en: '', ar: '' });
  const [child, setChild] = useState(false);

  const load = () => adminFetch(`/admin/media?kind=${tab}`).then(async (r) => (r.ok ? setItems(await r.json()) : setErr(await describeError(r))));
  useEffect(() => { setItems(null); load(); /* eslint-disable-next-line */ }, [tab]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const [pct, setPct] = useState(0);
  async function upload() {
    const files = [...(file.current?.files ?? [])];
    if (!files.length) return toast.warn('Choose a photo from your computer first.');
    for (const f of files) { if (vid ? !isVideoFile(f) : false) return toast.error(`“${f.name}” is not a video.`); const bad = vid ? precheck(f) : precheck(f, true); if (bad) return toast.error(bad); }
    setBusy(true); setPct(0);
    const done: MediaItem[] = [];
    for (const [i, f] of files.entries()) {
      const fd = new FormData();
      fd.set('file', f); fd.set('altEn', alt.en); fd.set('altAr', alt.ar); fd.set('showsChild', child ? 'true' : 'false');
      const prog = (p: number) => setPct(Math.round(((i + p / 100) / files.length) * 100));
      const r = (vid ? await uploadVideo(f, { altEn: alt.en, altAr: alt.ar, showsChild: child }, prog).promise : await uploadFile<MediaItem>('/api/admin/media', fd, prog).promise) as { ok: true; data: MediaItem } | { ok: false; error: string };
      if (r.ok) done.push(r.data); else toast.error(`${f.name}: ${r.error}`);
    }
    setBusy(false);
    if (!done.length) return;
    toast.success(done.length === 1 ? 'Photo uploaded' : `${done.length} photos uploaded`);
    if (multi) { setSel((l) => [...l, ...done]); load(); if (file.current) file.current.value = ''; } else onPick?.(done[0]);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose image" className="a-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">{allowVideo ? 'Choose a photo or video' : 'Choose a photo'}</h2><button onClick={onClose} className="a-btn a-btn-sm" aria-label="Close"><X className="h-4 w-4" /></button></div>

        {allowVideo && <div className="mb-3 flex gap-2" role="tablist">{(['IMAGE', 'VIDEO'] as const).map((k) => <button key={k} role="tab" aria-selected={tab === k} className={`a-btn ${tab === k ? 'a-btn-primary' : ''}`} onClick={() => { setTab(k); setSel([]); }}>{k === 'IMAGE' ? 'Photos' : 'Videos'}</button>)}</div>}
        <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="a-label"><Upload className="h-4 w-4" />Upload {vid ? 'a new video' : multi ? 'new photos (you can choose several)' : 'a new photo'}<Help text={vid ? `MP4, WebM or MOV up to ${MAX_VIDEO_MB} MB. It goes straight to your Cloudinary account and may take a few minutes. Short clips (under 30 seconds) load fastest.` : 'JPG, PNG, WebP, AVIF or GIF up to 10 MB. It is resized, location data is removed and it is stored in your Cloudinary account.'} align="left" /></p>
          <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <input ref={file} type="file" multiple={multi} accept={vid ? ACCEPT_VIDEO : ACCEPT_IMAGES} className="text-sm" />
            <input className="a-input" placeholder="Description (English)" value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} />
            <input className="a-input" dir="rtl" placeholder="الوصف (العربية)" value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} />
            <button className="a-btn a-btn-primary" disabled={busy} onClick={upload}>{busy ? `Uploading ${pct}%` : multi ? 'Upload (and tick)' : 'Upload & use'}</button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} />This photo shows a child <Help text="Photos of children can only be published after you record the parent's written consent in Media." align="left" /></label>
        </div>

        {err && <p className="a-err mb-2" role="alert">{err}</p>}
        {items?.length === 0 && <p className="text-sm text-slate-500">{vid ? 'No videos yet. Upload your first one above.' : 'No photos in the library yet. Upload your first one above.'}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(items ?? []).map((m) => (
            <button key={m.id} onClick={() => (multi ? toggle(m) : onPick?.(m))} aria-pressed={multi ? sel.some((x) => x.id === m.id) : undefined} className={`relative rounded-lg border p-1 text-start hover:ring-2 hover:ring-[#1f4d2b] ${sel.some((x) => x.id === m.id) ? 'border-[#1f4d2b] ring-2 ring-[#1f4d2b]' : 'border-slate-200'}`}>
              {multi && sel.some((x) => x.id === m.id) && <span className="absolute end-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#1f4d2b] text-xs font-bold text-white">{sel.findIndex((x) => x.id === m.id) + 1}</span>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbUrl} alt={m.altText.en} className="h-24 w-full rounded object-cover" />
              {m.showsChild && <span className={`mt-1 block text-xs ${m.hasConsent ? 'text-emerald-700' : 'text-red-600'}`}>{m.hasConsent ? 'Child · consent ✓' : 'Child · NO consent'}</span>}
            </button>
          ))}
        </div>
        {multi && <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex items-center gap-3 border-t bg-white px-5 py-3"><span className="text-sm text-slate-600">{sel.length ? `${sel.length} selected (numbers show the order)` : 'Tick the photos you want, in the order you want them.'}</span><button className="a-btn ms-auto" onClick={onClose}>Cancel</button><button className="a-btn a-btn-primary" disabled={!sel.length} onClick={() => onPickMany!(sel)}>Use {sel.length || ''} photo{sel.length === 1 ? '' : 's'}</button></div>}
      </div>
    </div>
  );
}

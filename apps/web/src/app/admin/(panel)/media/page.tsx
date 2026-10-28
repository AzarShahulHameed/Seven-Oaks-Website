'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, LayoutTemplate, Trash2, Upload, X } from 'lucide-react';
import { PlaceOnPage } from '@/components/admin/PlaceOnPage';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { Help } from '@/components/admin/Help';
import type { MediaItem } from '@/components/admin/MediaPicker';
import { SkelGallery } from '@/components/admin/Skeleton';
import { ACCEPT, MAX_MB, MAX_VIDEO_MB, isVideoFile, precheck, uploadFile, uploadVideo } from '@/lib/upload';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

type Where = { pages: string[]; settings: string[] };
function Card({ m, reload, sel, onSel, onUse, where }: { m: MediaItem; reload: () => void; sel: boolean; onSel: () => void; onUse: () => void; where?: Where }) {
  const toast = useToast();
  const { confirm, prompt } = useDialogs();
  const [alt, setAlt] = useState(m.altText);
  const altDirty = alt.en !== m.altText.en || alt.ar !== m.altText.ar;
  useDirtyFlag(altDirty);
  const call = async (fn: () => Promise<Response>, ok: string) => { const r = await fn(); if (r.ok) { toast.success(ok); reload(); } else toast.error(await describeError(r)); return r; };
  return (
    <div className="a-card flex flex-col !p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="relative"><img src={m.thumbUrl} alt={m.altText.en} className="h-36 w-full rounded-lg object-cover" />
        <label className="absolute start-2 top-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-bold shadow"><input type="checkbox" checked={sel} onChange={onSel} />Select</label></div>
      <p className={`mt-1 text-xs ${where && (where.pages.length || where.settings.length) ? 'text-emerald-700' : 'text-slate-500'}`}>{where ? (where.pages.length || where.settings.length ? `Used on: ${[...where.pages, ...where.settings].join(', ')}` : 'Not used on the website yet') : 'Checking where it is used…'}</p>
      <p className="mt-1 text-xs text-slate-500">{m.width}×{m.height} · {(m.sizeBytes / 1024).toFixed(0)} KB</p>
      <input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} placeholder="Description (English)" aria-label="Description in English" className="a-input mt-2" />
      <input value={alt.ar} dir="rtl" onChange={(e) => setAlt({ ...alt, ar: e.target.value })} placeholder="الوصف (العربية)" aria-label="Description in Arabic" className="a-input mt-1" />
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={m.showsChild} onChange={(e) => call(() => adminFetch(`/admin/media/${m.id}`, { method: 'PUT', ...jsonBody({ showsChild: e.target.checked }) }), e.target.checked ? 'Marked as showing a child' : 'No longer marked as showing a child')} />
        Shows a child <Help text="Tick if a child can be recognised. These photos cannot be published until you record the parent's written consent." align="left" />
      </label>
      {m.showsChild && <p className={`text-xs ${m.hasConsent ? 'text-emerald-700' : 'text-red-600'}`}>{m.hasConsent ? 'Parent consent recorded' : 'No consent yet: this photo cannot be published'}</p>}
      <div className="mt-auto flex flex-wrap gap-1 pt-2">
        {altDirty && <button className="a-btn a-btn-sm a-btn-primary" onClick={() => call(() => adminFetch(`/admin/media/${m.id}`, { method: 'PUT', ...jsonBody({ altText: alt }) }), 'Description saved')}>Save description</button>}
        <button className="a-btn a-btn-sm a-btn-primary" onClick={onUse}><LayoutTemplate className="h-3.5 w-3.5" />Use on website</button>
        <button className="a-btn a-btn-sm" onClick={() => { navigator.clipboard?.writeText(m.url); toast.info('Picture address copied.'); }}>Copy address</button>
        {m.showsChild && !m.hasConsent && (
          <button className="a-btn a-btn-sm" onClick={async () => {
            const note = await prompt({ title: 'Record parent consent', message: 'Confirm you hold the parent’s written permission to publish this photo.', label: 'Who gave consent and where is the signed form kept?', placeholder: 'e.g. Parent of A., form #123', confirmLabel: 'Record consent' });
            if (note) call(() => adminFetch(`/admin/media/${m.id}/consent`, { method: 'POST', ...jsonBody({ granted: true, note }) }), 'Consent recorded');
          }}>Record consent</button>
        )}
        {m.showsChild && m.hasConsent && (
          <button className="a-btn a-btn-sm" onClick={async () => {
            if (!(await confirm({ title: 'Withdraw consent?', message: 'You must then remove this photo from every page that uses it.', confirmLabel: 'Withdraw consent', danger: true }))) return;
            const r = await adminFetch(`/admin/media/${m.id}/consent`, { method: 'POST', ...jsonBody({ granted: false }) });
            if (r.ok) { const j = await r.json(); toast.warn(`Consent withdrawn. Remove the photo from: ${[...j.usage.pages, ...j.usage.settings].join(', ') || 'nowhere (it is not in use)'}.`); reload(); } else toast.error(await describeError(r));
          }}>Withdraw consent</button>
        )}
        <button className="a-btn a-btn-sm a-btn-danger" onClick={async () => {
          if (await confirm({ title: 'Delete this photo?', message: 'It is removed permanently from your library and from Cloudinary. This cannot be undone.', confirmLabel: 'Delete photo', danger: true }))
            call(() => adminFetch(`/admin/media/${m.id}`, { method: 'DELETE' }), 'Photo deleted');
        }}>Delete</button>
      </div>
    </div>
  );
}

type Job = { id: number; name: string; pct: number; state: 'wait' | 'up' | 'done' | 'err'; error?: string; cancel?: () => void };
const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function DocCard({ m, reload, sel, onSel, onUse, where }: { m: MediaItem & { filename?: string; mime?: string }; reload: () => void; sel: boolean; onSel: () => void; onUse: () => void; where?: Where }) {
  const toast = useToast(); const { confirm } = useDialogs();
  return (
    <div className="a-card flex items-center gap-3 !p-3">
      <input type="checkbox" checked={sel} onChange={onSel} aria-label="Select document" />
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><FileText className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold" title={m.filename}>{m.filename || 'Document'}</p><p className="text-xs text-slate-500">{(m.mime ?? '').split('/').pop()?.replace(/^vnd\..*\./, '').toUpperCase()} · {fmtSize(m.sizeBytes)}</p><p className={`text-xs ${where && (where.pages.length || where.settings.length) ? 'text-emerald-700' : 'text-slate-500'}`}>{where ? (where.pages.length || where.settings.length ? `Used on: ${[...where.pages, ...where.settings].join(', ')}` : 'Not on the website yet. Use “Use on website”.') : ''}</p></div>
      <button className="a-btn a-btn-sm a-btn-primary" onClick={onUse}><LayoutTemplate className="h-3.5 w-3.5" />Use on website</button>
      <a className="a-btn a-btn-sm" href={m.url} target="_blank" rel="noopener noreferrer">Open</a>
      <button className="a-btn a-btn-sm" onClick={() => { navigator.clipboard?.writeText(m.url); toast.info('Link copied.'); }}>Copy link</button>
      <button className="a-btn a-btn-sm a-btn-danger" onClick={async () => { if (!(await confirm({ title: 'Delete this document?', message: 'It is removed permanently. Links to it will stop working.', confirmLabel: 'Delete', danger: true }))) return; const r = await adminFetch(`/admin/media/${m.id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); reload(); } else toast.error(await describeError(r)); }} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function MediaPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('IMAGE');
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [blocked, setBlocked] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [alt, setAlt] = useState({ en: '', ar: '' }); const [child, setChild] = useState(false); const [drag, setDrag] = useState(false);
  const pick = useRef<HTMLInputElement>(null); const seq = useRef(0);
  const [selIds, setSelIds] = useState<string[]>([]); const [place, setPlace] = useState<MediaItem[] | null>(null); const [usage, setUsage] = useState<Record<string, Where>>({});
  const dlg = useDialogs(); const confirmDel = () => dlg.confirm({ title: 'Delete this video?', message: 'It is removed permanently from your library and from Cloudinary. Pages that use it will show the photo, or nothing.', confirmLabel: 'Delete video', danger: true });
  const toggleSel = (id: string) => setSelIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const load = (k = tab) => adminFetch(`/admin/media?kind=${k}`).then(async (r) => { if (r.ok) { setItems(await r.json()); setBlocked(''); } else { const m = await describeError(r); setBlocked(m); setItems([]); } });
  useEffect(() => { setSelIds([]); setUsage({}); }, [tab]);
  useEffect(() => { (items ?? []).forEach((m) => { if (usage[m.id]) return; adminFetch(`/admin/media/${m.id}/usage`).then(async (r) => { if (r.ok) { const j = await r.json(); setUsage((u) => ({ ...u, [m.id]: { pages: [], settings: [], ...j } })); } }); }); /* eslint-disable-next-line */ }, [items]);
  useEffect(() => { setItems(null); load(tab); /* eslint-disable-next-line */ }, [tab]);
  const upd = (id: number, p: Partial<Job>) => setJobs((l) => l.map((j) => (j.id === id ? { ...j, ...p } : j)));

  async function start(files: File[]) {
    if (!files.length) return;
    for (const f of files) {
      const id = ++seq.current; const bad = precheck(f);
      setJobs((l) => [...l, { id, name: f.name, pct: 0, state: bad ? 'err' : 'wait', error: bad || undefined }]);
      if (bad) { toast.error(bad); continue; }
      const fd = new FormData(); fd.set('file', f); fd.set('altEn', alt.en); fd.set('altAr', alt.ar); fd.set('showsChild', child ? 'true' : 'false');
      const up = isVideoFile(f) ? uploadVideo(f, { altEn: alt.en, altAr: alt.ar, showsChild: child }, (pct) => upd(id, { pct, state: 'up' })) : uploadFile('/api/admin/media', fd, (pct) => upd(id, { pct, state: 'up' }));
      upd(id, { state: 'up', cancel: up.cancel });
      const r = await up.promise;
      if (r.ok) { upd(id, { state: 'done', pct: 100 }); setTimeout(() => setJobs((l) => l.filter((j) => j.id !== id)), 2500); } else { upd(id, { state: 'err', error: r.error }); toast.error(`${f.name}: ${r.error}`); }
    }
    load();
  }

  return (
    <div className="space-y-6">
      <PageBar title="Photos & documents" help="Your library. Upload photos, banners, team portraits and PDFs or Office documents here, or straight from any picture field in a page. They are stored in Cloudinary." />
      {blocked && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{blocked}</div>}
      <div className="a-card space-y-3">
        <h2><Upload className="h-4 w-4" />Upload<Help text={`Photos: JPG, PNG, WebP, AVIF or GIF. Documents: PDF, Word, Excel or PowerPoint. Up to ${MAX_MB} MB each. Photos are resized and location data is removed. The file’s real contents are checked, not just its name.`} align="left" /></h2>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); start([...e.dataTransfer.files]); }}
          className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? 'border-[#1f4d2b] bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`} onClick={() => pick.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick.current?.click()}>
          <Upload className="mb-2 h-7 w-7 text-slate-400" /><p className="font-semibold">Drop files here or click to choose</p><p className="text-xs text-slate-500">JPG · PNG · WebP · AVIF · GIF · PDF · DOCX · XLSX · PPTX — up to {MAX_MB} MB each. You can choose several at once.</p>
          <input ref={pick} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => { start([...(e.target.files ?? [])]); e.target.value = ''; }} />
        </div>
        <div className="grid gap-2 md:grid-cols-2"><input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} placeholder="Description for new photos (English)" className="a-input" /><input dir="rtl" value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} placeholder="الوصف للصور الجديدة (العربية)" className="a-input" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} />These photos show a child <Help text="Photos of children can only be published after you record the parent's written consent." align="left" /></label>
        {jobs.length > 0 && (
          <ul className="space-y-2" aria-live="polite">{jobs.map((j) => (
            <li key={j.id} className="rounded-lg border border-slate-200 p-2.5 text-sm">
              <div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate font-semibold">{j.name}</span>
                {j.state === 'done' && <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Uploaded</span>}
                {j.state === 'err' && <button className="rounded p-1 hover:bg-slate-100" onClick={() => setJobs((l) => l.filter((x) => x.id !== j.id))} aria-label="Dismiss"><X className="h-4 w-4" /></button>}
                {j.state === 'up' && <><span className="tabular-nums text-slate-500">{j.pct}%</span><button className="a-btn a-btn-sm" onClick={() => j.cancel?.()}>Cancel</button></>}
                {j.state === 'wait' && <span className="text-slate-400">Waiting…</span>}</div>
              {(j.state === 'up' || j.state === 'wait') && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={j.pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#1f4d2b] transition-all" style={{ width: `${j.pct}%` }} /></div>}
              {j.state === 'err' && <p className="mt-1 flex items-start gap-1.5 text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{j.error}</p>}
            </li>))}</ul>
        )}
      </div>
      <div className="flex gap-2" role="tablist">{([['IMAGE', 'Photos'], ['VIDEO', 'Videos'], ['DOCUMENT', 'Documents']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`a-btn ${tab === k ? 'a-btn-primary' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {selIds.length > 0 && <div className="a-sticky-bar flex flex-wrap items-center gap-2"><strong>{selIds.length} selected</strong><button className="a-btn a-btn-primary" onClick={() => setPlace((items ?? []).filter((m) => selIds.includes(m.id)))}><LayoutTemplate className="h-4 w-4" />Use selected on the website</button><button className="a-btn" onClick={() => setSelIds([])}>Clear</button></div>}
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-950">{tab === 'IMAGE' ? 'Photos here are your library. They only show on the website once they are placed on a page. Press “Use on website”, choose the page and where it goes, preview it, then save.' : 'Documents (prospectus, fee sheet, forms) become a “Documents to download” list on the page you choose.'}</p>
      {!items && <SkelGallery n={tab === 'IMAGE' ? 6 : 3} />}
      {items?.length === 0 && !blocked && <p className="text-slate-500">{tab === 'IMAGE' ? 'No photos yet. Upload your first one above.' : tab === 'VIDEO' ? 'No videos yet. Upload an MP4, WebM or MOV above.' : 'No documents yet. Upload a PDF or Office file above.'}</p>}
      {items && tab === 'VIDEO' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((m) => (
        <div key={m.id} className="a-card flex flex-col !p-3">
          <video src={m.url} poster={(m as any).posterUrl || m.thumbUrl} controls preload="none" className="h-40 w-full rounded-lg bg-black object-cover" />
          <p className="mt-1 text-xs text-slate-500">{fmtSize(m.sizeBytes)} · {m.width ? `${m.width}×${m.height}` : 'video'}</p>
          <p className={`text-xs ${usage[m.id] && (usage[m.id].pages.length || usage[m.id].settings.length) ? 'text-emerald-700' : 'text-slate-500'}`}>{usage[m.id] ? (usage[m.id].pages.length || usage[m.id].settings.length ? `Used on: ${[...usage[m.id].pages, ...usage[m.id].settings].join(', ')}` : 'Not used on the website yet') : ''}</p>
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            <button className="a-btn a-btn-sm" onClick={() => { navigator.clipboard?.writeText(m.url); toast.info('Video address copied.'); }}>Copy address</button>
            <button className="a-btn a-btn-sm a-btn-danger" onClick={async () => { if (!(await confirmDel())) return; const r = await adminFetch(`/admin/media/${m.id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Video deleted'); load(); } else toast.error(await describeError(r)); }}>Delete</button>
          </div>
        </div>))}</div>}
      {items && tab === 'IMAGE' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((m) => <Card key={m.id} m={m} reload={load} sel={selIds.includes(m.id)} onSel={() => toggleSel(m.id)} onUse={() => setPlace([m])} where={usage[m.id]} />)}</div>}
      {items && tab === 'DOCUMENT' && <div className="space-y-2">{items.map((m) => <DocCard key={m.id} m={m as any} reload={load} sel={selIds.includes(m.id)} onSel={() => toggleSel(m.id)} onUse={() => setPlace([m])} where={usage[m.id]} />)}</div>}
      {place && <PlaceOnPage items={place} kind={tab === 'DOCUMENT' ? 'DOCUMENT' : 'IMAGE'} onClose={() => { setPlace(null); setUsage({}); load(); }} />}
    </div>
  );
}

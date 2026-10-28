'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { adminFetch, describeError } from '@/lib/admin-api';
import { MAX_MB, precheck, uploadFile } from '@/lib/upload';
import { useToast } from './Toast';

type Doc = { id: string; url: string; filename?: string; mime?: string; sizeBytes: number };
const kb = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Choose a document (PDF, Word, Excel, PowerPoint) from the library, or upload a new one without leaving the page. */
export function DocPicker({ onPick, onClose }: { onPick: (d: Doc) => void; onClose: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<Doc[] | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [pct, setPct] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const load = () => adminFetch('/admin/media?kind=DOCUMENT').then(async (r) => (r.ok ? setItems(await r.json()) : setErr(await describeError(r))));
  useEffect(() => { load(); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  async function upload() {
    const f = file.current?.files?.[0]; if (!f) return toast.warn('Choose a file from your computer first.');
    const bad = precheck(f); if (bad) return toast.error(bad);
    if (!/\.(pdf|docx|xlsx|pptx)$/i.test(f.name)) return toast.error('Documents must be PDF, DOCX, XLSX or PPTX.');
    const fd = new FormData(); fd.set('file', f); fd.set('altEn', ''); fd.set('altAr', ''); fd.set('showsChild', 'false');
    setBusy(true); setPct(0);
    const r = await uploadFile<Doc>('/api/admin/media', fd, setPct).promise; setBusy(false);
    if (r.ok) { toast.success('Document uploaded'); onPick(r.data); } else toast.error(r.error);
  }
  return (
    <div role="dialog" aria-modal="true" aria-label="Choose a document" className="a-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Choose a document</h2><button onClick={onClose} className="a-btn a-btn-sm" aria-label="Close"><X className="h-4 w-4" /></button></div>
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="a-label"><Upload className="h-4 w-4" />Upload a new document</p>
          <div className="flex flex-wrap items-center gap-2"><input ref={file} type="file" accept=".pdf,.docx,.xlsx,.pptx" className="min-w-0 flex-1 text-sm" /><button className="a-btn a-btn-primary" disabled={busy} onClick={upload}>{busy ? `Uploading ${pct}%` : 'Upload & use'}</button></div>
          <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel or PowerPoint, up to {MAX_MB} MB.</p>
        </div>
        {err && <p className="a-err" role="alert">{err}</p>}
        {items?.length === 0 && <p className="text-sm text-slate-500">No documents in the library yet.</p>}
        <ul className="space-y-2">{(items ?? []).map((d) => (
          <li key={d.id}><button type="button" onClick={() => onPick(d)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-start hover:border-[#1f4d2b] hover:bg-slate-50"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100"><FileText className="h-5 w-5 text-slate-600" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{d.filename || 'Document'}</span><span className="text-xs text-slate-500">{kb(d.sizeBytes)}</span></span></button></li>
        ))}</ul>
      </div>
    </div>
  );
}

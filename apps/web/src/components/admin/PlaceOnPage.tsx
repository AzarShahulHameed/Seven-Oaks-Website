'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { SECTION_SCHEMAS } from '@/lib/admin-schemas';
import type { MediaItem } from './MediaPicker';
import { PreviewModal } from './PreviewModal';
import { Skel } from './Skeleton';
import { useToast } from './Toast';

type Sec = { type: string; config: any; isVisible: boolean };
type PageData = { key: string; title: { en: string; ar: string }; seo: any; sections: Sec[] };
type Doc = MediaItem & { filename?: string };

const TITLES = { photo: { en: 'Photo gallery', ar: 'معرض الصور' }, docs: { en: 'Documents to download', ar: 'مستندات للتنزيل' } };

/** Puts chosen photos or documents onto a page without opening the page editor: pick the page and place, preview the result, then save. */
export function PlaceOnPage({ items, kind, onClose }: { items: (MediaItem | Doc)[]; kind: 'IMAGE' | 'DOCUMENT'; onClose: () => void }) {
  const toast = useToast();
  const type = kind === 'IMAGE' ? 'photo-grid' : 'downloads';
  const [pages, setPages] = useState<{ key: string; title: any; status: string }[] | null>(null);
  const [pageKey, setPageKey] = useState('');
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [target, setTarget] = useState(0); // index of the existing section
  const [after, setAfter] = useState(-1); // -1 = end of page
  const [title, setTitle] = useState(kind === 'IMAGE' ? TITLES.photo : TITLES.docs);
  const [columns, setColumns] = useState('3'); const [style, setStyle] = useState(''); const [animation, setAnimation] = useState('rise');
  const [preview, setPreview] = useState(false); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState<null | { published: boolean }>(null);

  useEffect(() => { adminFetch('/admin/pages').then(async (r) => (r.ok ? setPages(await r.json()) : setErr(await describeError(r)))); }, []);
  useEffect(() => {
    if (!pageKey) { setPage(null); return; }
    setLoading(true); setPage(null);
    adminFetch(`/admin/pages/${pageKey}`).then(async (r) => { if (r.ok) { const j = await r.json(); setPage(j); setErr(''); setMode(j.sections.some((s: Sec) => s.type === type) ? 'existing' : 'new'); setTarget(Math.max(0, j.sections.findIndex((s: Sec) => s.type === type))); } else setErr(await describeError(r)); setLoading(false); });
  }, [pageKey, type]);

  const newItems = useMemo(() => items.map((m: any) => kind === 'IMAGE'
    ? { label: { en: m.altText?.en ?? '', ar: m.altText?.ar ?? '' }, image: { url: m.url, alt: { en: m.altText?.en ?? '', ar: m.altText?.ar ?? '' }, focalX: 50, focalY: 50, fit: 'cover' } }
    : { label: { en: m.filename ?? 'Document', ar: m.filename ?? 'مستند' }, text: { en: '', ar: '' }, url: m.url }), [items, kind]);

  const existing = page?.sections.map((s, n) => ({ s, n })).filter((x) => x.s.type === type) ?? [];
  const result = useMemo(() => {
    if (!page) return null;
    const sections = page.sections.map((s) => ({ ...s, config: JSON.parse(JSON.stringify(s.config)) }));
    if (mode === 'existing' && sections[target]?.type === type) {
      const c = sections[target].config; c.items = [...(c.items ?? []), ...newItems];
      if (kind === 'IMAGE') { c.animation = animation; }
    } else {
      const config: any = kind === 'IMAGE' ? { title, subtitle: { en: '', ar: '' }, columns, style, animation, items: newItems } : { title, subtitle: { en: '', ar: '' }, items: newItems };
      sections.splice(after < 0 ? sections.length : after + 1, 0, { type, config, isVisible: true });
    }
    return { title: page.title, seo: page.seo, sections };
  }, [page, mode, target, after, title, columns, style, animation, newItems, type, kind]);

  const arMissing = kind === 'IMAGE' ? newItems.some((i: any) => !i.label.ar.trim() || !i.label.en.trim()) : false;

  async function apply(publish: boolean) {
    if (!result) return; setBusy(publish ? 'pub' : 'save'); setErr('');
    const r = await adminFetch(`/admin/pages/${pageKey}`, { method: 'PUT', ...jsonBody(result) });
    if (!r.ok) { setErr(await describeError(r)); setBusy(''); return; }
    let published = false;
    if (publish) { const p = await adminFetch(`/admin/pages/${pageKey}/publish`, { method: 'POST' }); if (p.ok) published = true; else { setErr(`Saved as a draft, but it could not be published: ${await describeError(p)}`); } }
    setBusy(''); setDone({ published }); toast.success(published ? 'Placed and published' : 'Placed in the page draft');
  }

  const sectionLabel = (s: Sec, n: number) => `${n + 1}. ${SECTION_SCHEMAS[s.type]?.label ?? s.type}${s.config?.title?.en ? ` — ${s.config.title.en}` : ''}`;
  return (
    <div role="dialog" aria-modal="true" aria-label="Use on the website" className="a-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Use on the website</h2><button onClick={onClose} className="a-btn a-btn-sm" aria-label="Close"><X className="h-4 w-4" /></button></div>
        <div className="mb-4 flex flex-wrap gap-2">{items.slice(0, 8).map((m) => kind === 'IMAGE' /* eslint-disable-next-line @next/next/no-img-element */ ? <img key={m.id} src={m.thumbUrl} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <span key={m.id} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">{(m as Doc).filename ?? 'Document'}</span>)}{items.length > 8 && <span className="self-center text-sm text-slate-500">+{items.length - 8} more</span>}</div>

        {done ? (
          <div className="space-y-3"><p className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{done.published ? 'Done. It is live on the website now.' : 'Done. It is saved in the page draft. Visitors will see it after you publish the page.'}</p>
            {err && <p className="a-err" role="alert">{err}</p>}
            <div className="flex gap-2"><Link className="a-btn a-btn-primary" href={`/admin/pages/${pageKey}`}>Open the page to fine-tune</Link><button className="a-btn" onClick={onClose}>Close</button></div></div>
        ) : (
          <div className="space-y-4">
            <label className="block"><span className="a-label">1. Which page?</span>
              <select className="a-input" value={pageKey} onChange={(e) => setPageKey(e.target.value)}><option value="">Choose a page…</option>{(pages ?? []).map((p) => <option key={p.key} value={p.key}>{p.title?.en || p.key} ({p.status === 'PUBLISHED' ? 'live' : 'draft'})</option>)}</select></label>
            {loading && <Skel className="h-24" />}
            {page && (<>
              <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3"><legend className="a-label px-1">2. Where on the page?</legend>
                {existing.length > 0 && <label className="flex items-start gap-2 text-sm"><input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} className="mt-1" /><span className="flex-1"><b>Add to a {kind === 'IMAGE' ? 'gallery' : 'documents list'} that is already on this page</b>
                  {mode === 'existing' && <select className="a-input mt-1" value={target} onChange={(e) => setTarget(Number(e.target.value))}>{existing.map(({ s, n }) => <option key={n} value={n}>{sectionLabel(s, n)}</option>)}</select>}</span></label>}
                <label className="flex items-start gap-2 text-sm"><input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} className="mt-1" /><span className="flex-1"><b>Create a new {kind === 'IMAGE' ? 'photo gallery' : 'documents list'} section</b>
                  {mode === 'new' && <select className="a-input mt-1" value={after} onChange={(e) => setAfter(Number(e.target.value))}><option value={-1}>At the end of the page</option>{page.sections.map((s, n) => <option key={n} value={n}>After: {sectionLabel(s, n)}</option>)}</select>}</span></label>
              </fieldset>
              {(mode === 'new' || kind === 'IMAGE') && (
                <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="a-label px-1">3. How should it look?</legend>
                  {mode === 'new' && <div className="grid gap-2 sm:grid-cols-2"><label><span className="a-label">Heading (English)</span><input className="a-input" value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} /></label><label><span className="a-label">Heading (Arabic)</span><input className="a-input" dir="rtl" value={title.ar} onChange={(e) => setTitle({ ...title, ar: e.target.value })} /></label></div>}
                  {kind === 'IMAGE' && <div className="grid gap-2 sm:grid-cols-3">
                    {mode === 'new' && <label><span className="a-label">Per row</span><select className="a-input" value={columns} onChange={(e) => setColumns(e.target.value)}><option value="3">3 pictures</option><option value="4">4 pictures</option></select></label>}
                    {mode === 'new' && <label><span className="a-label">Style</span><select className="a-input" value={style} onChange={(e) => setStyle(e.target.value)}><option value="">Plain rounded</option><option value="polaroid">Pinned prints</option></select></label>}
                    <label><span className="a-label">Animation</span><select className="a-input" value={animation} onChange={(e) => setAnimation(e.target.value)}><option value="rise">Rise in one by one</option><option value="zoom">Zoom in</option><option value="fade">Fade in</option><option value="none">None</option></select></label></div>}
                  {arMissing && <p className="a-warn">Some photos have no description in both languages. Captions will be blank until you add them (Photos page, or edit the page).</p>}
                </fieldset>)}
              {err && <p className="a-err" role="alert">{err}</p>}
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <button className="a-btn" onClick={() => setPreview(true)} disabled={!result}><Eye className="h-4 w-4" />Preview on the page</button>
                <button className="a-btn a-btn-primary ms-auto" disabled={!result || !!busy} onClick={() => apply(false)}>{busy === 'save' ? 'Saving…' : 'Save to draft'}</button>
                <button className="a-btn" disabled={!result || !!busy} onClick={() => apply(true)}>{busy === 'pub' ? 'Publishing…' : 'Save & publish'}</button>
              </div>
              <p className="text-xs text-slate-500">Nothing changes until you save. Photos of children can only go live if parent consent is recorded.</p>
            </>)}
            {!page && err && <p className="a-err" role="alert">{err}</p>}
          </div>
        )}
      </div>
      {preview && result && <PreviewModal pageKey={pageKey} page={result} onClose={() => setPreview(false)} />}
    </div>
  );
}

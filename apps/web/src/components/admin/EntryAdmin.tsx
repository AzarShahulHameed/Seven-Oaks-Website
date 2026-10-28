'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, Copy, Eye, EyeOff, ExternalLink, Images, Plus, Trash2, Video } from 'lucide-react';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { blankEntry, entryFields, KIND_INFO, slugify, type Kind } from '@/lib/entry-fields';
import { PageBar } from './AdminShell';
import { useDialogs } from './Dialogs';
import { IncompleteGate, useDraft } from './Dirty';
import { SchemaForm, validate, warnings } from './Fields';
import { BlocksEditor, blockProblems } from './BlocksEditor';
import { PreviewModal } from './PreviewModal';
import { SkelRows } from './Skeleton';
import { useToast } from './Toast';

type Card = { id: string; slug: string; group: string; path?: string; title: any; summary: any; cover: any; count: number; videos: number; isVisible: boolean; status: string; publishAt: string | null; updatedAt: string; live: boolean };
type Me = { roles: string[]; perms: string[] };
function useCan() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { adminFetch('/auth/me').then(async (r) => r.ok && setMe(await r.json())); }, []);
  return (p: string) => !!me && (me.roles.includes('SUPER_ADMIN') || me.perms.includes(p));
}
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const thumb = (c: any) => c?.videoPoster || c?.url || '';

function Status({ e }: { e: Card }) {
  if (e.status !== 'PUBLISHED') return <span className="a-badge">Draft</span>;
  if (!e.isVisible) return <span className="a-badge a-badge-warn">Hidden</span>;
  if (e.publishAt && new Date(e.publishAt) > new Date()) return <span className="a-badge a-badge-warn"><CalendarClock className="me-1 inline h-3 w-3" />Goes live {when(e.publishAt)}</span>;
  return <span className="a-badge a-badge-ok">Live</span>;
}

// ───────────────────────── list ─────────────────────────
export function EntryListScreen({ kind }: { kind: Kind }) {
  const info = KIND_INFO[kind];
  const toast = useToast(); const { confirm } = useDialogs(); const can = useCan();
  const [rows, setRows] = useState<Card[] | null>(null); const [err, setErr] = useState('');
  const [cats, setCats] = useState<{ slug: string; title: any }[]>([]); const [cat, setCat] = useState('all');
  const load = useCallback(async () => {
    const r = await adminFetch(`/admin/entries?kind=${kind}`);
    if (r.ok) { setRows(await r.json()); setErr(''); } else setErr(await describeError(r));
    if (kind === 'GALLERY') { const c = await adminFetch('/admin/entries?kind=CATEGORY'); if (c.ok) setCats(await c.json()); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);
  const catName = (slug: string) => cats.find((c) => c.slug === slug)?.title?.en || slug;
  const shown = useMemo(() => (rows ?? []).filter((r) => cat === 'all' || r.group === (cat === 'none' ? '' : cat)), [rows, cat]);
  const call = async (p: Promise<Response>, ok: string) => { const r = await p; if (r.ok) { toast.success(ok); load(); } else toast.error(await describeError(r)); };
  const move = async (id: string, d: number) => {
    const ids = (rows ?? []).map((r) => r.id); const i = ids.indexOf(id), j = i + d; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setRows((rows ?? []).slice().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)));
    const r = await adminFetch('/admin/entries/reorder', { method: 'PUT', ...jsonBody({ kind, ids }) });
    if (!r.ok) { toast.error(await describeError(r)); load(); }
  };
  const del = async (e: Card) => { if (await confirm({ title: `Delete “${e.title?.en}”?`, message: `It is removed from the website straight away. This cannot be undone. If you only want to hide it for now, use Hide.`, confirmLabel: 'Delete', danger: true })) call(adminFetch(`/admin/entries/${e.id}`, { method: 'DELETE' }), 'Deleted'); };

  return (
    <div className="space-y-4">
      <PageBar title={info.plural} help={info.blurb}>
        {can('entry:create') && <Link href={`${info.base}/new`} className="a-btn a-btn-primary"><Plus className="h-4 w-4" />Add {info.single}</Link>}
      </PageBar>
      <p className="text-sm text-slate-600">{info.blurb}</p>
      {kind === 'GALLERY' && cats.length > 0 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {[['all', 'All'], ...cats.map((c) => [c.slug, c.title?.en] as const), ['none', 'No category']].map(([k, l]) => <button key={k} role="tab" aria-selected={cat === k} onClick={() => setCat(k)} className={`a-btn a-btn-sm ${cat === k ? 'a-btn-primary' : ''}`}>{l}</button>)}
        </div>
      )}
      {err && <p className="a-err" role="alert">{err}</p>}
      {!rows && !err && <SkelRows rows={5} />}
      {rows && shown.length === 0 && <div className="a-card text-center text-slate-600"><p>Nothing here yet.</p>{can('entry:create') && <Link href={`${info.base}/new`} className="a-btn a-btn-primary mt-3"><Plus className="h-4 w-4" />Add your first {info.single}</Link>}</div>}
      <ul className="space-y-2">
        {shown.map((e, n) => (
          <li key={e.id} className="a-card flex flex-wrap items-center gap-3 !p-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">{thumb(e.cover) /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={thumb(e.cover)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-300"><Images className="h-6 w-6" /></div>}</div>
            <div className="min-w-0 flex-1 basis-56">
              <Link href={`${info.base}/${e.id}`} className="block truncate font-bold hover:underline">{e.title?.en || '(untitled)'}</Link>
              <p className="truncate text-xs text-slate-500" dir="ltr">/{kind === 'DETAIL' ? (e.path || 'info') : info.liveBase}/{e.slug}{kind === 'GALLERY' && e.group ? ` · ${catName(e.group)}` : ''}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><Status e={e} />{kind !== 'CATEGORY' && <><span className="inline-flex items-center gap-1 text-slate-500"><Images className="h-3.5 w-3.5" />{e.count - e.videos}</span><span className="inline-flex items-center gap-1 text-slate-500"><Video className="h-3.5 w-3.5" />{e.videos}</span></>}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {can('entry:update') && <>
                <button className="a-btn a-btn-sm" disabled={n === 0 || cat !== 'all'} aria-label="Move up" onClick={() => move(e.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button className="a-btn a-btn-sm" disabled={n === shown.length - 1 || cat !== 'all'} aria-label="Move down" onClick={() => move(e.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                {can('entry:publish') && <button className="a-btn a-btn-sm" onClick={() => call(adminFetch(`/admin/entries/${e.id}/visible`, { method: 'PUT', ...jsonBody({ isVisible: !e.isVisible }) }), e.isVisible ? 'Hidden from the website' : 'Shown on the website')}>{e.isVisible ? <><EyeOff className="h-3.5 w-3.5" />Hide</> : <><Eye className="h-3.5 w-3.5" />Show</>}</button>}
              </>}
              {e.live && <a className="a-btn a-btn-sm" href={`/en/${kind === 'DETAIL' ? (e.path || 'info') : info.liveBase}/${e.slug}`} target="_blank" rel="noopener noreferrer" aria-label="View on the website"><ExternalLink className="h-3.5 w-3.5" /></a>}
              {can('entry:create') && <button className="a-btn a-btn-sm" aria-label="Duplicate" title="Duplicate" onClick={() => call(adminFetch(`/admin/entries/${e.id}/duplicate`, { method: 'POST' }), 'Duplicated as a hidden draft')}><Copy className="h-3.5 w-3.5" /></button>}
              <Link href={`${info.base}/${e.id}`} className="a-btn a-btn-sm a-btn-primary">Edit</Link>
              {can('entry:delete') && <button className="a-btn a-btn-sm a-btn-danger" aria-label="Delete" onClick={() => del(e)}><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          </li>
        ))}
      </ul>
      {kind === 'GALLERY' && rows && rows.length > 0 && cat !== 'all' && <p className="text-xs text-slate-500">Reordering works on the full list. Choose “All” to move items.</p>}
    </div>
  );
}

// ───────────────────────── editor ─────────────────────────
type Doc = ReturnType<typeof blankEntry> & { id?: string };
const toLocal = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

export function EntryEditorScreen({ kind, id }: { kind: Kind; id: string }) {
  const info = KIND_INFO[kind]; const isNew = id === 'new';
  const router = useRouter(); const toast = useToast(); const can = useCan();
  const d = useDraft<Doc>(`${info.draftKey}:${id}`);
  const [cats, setCats] = useState<[string, string][]>([]); const [folders, setFolders] = useState<[string, string][]>([]); const [missing, setMissing] = useState('');
  const [busy, setBusy] = useState(false); const [show, setShow] = useState(false); const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [when_, setWhen] = useState<'draft' | 'now' | 'later'>('draft');

  useEffect(() => { if (kind === 'GALLERY') adminFetch('/admin/entries?kind=CATEGORY').then(async (r) => r.ok && setCats((await r.json()).map((c: any) => [c.slug, c.title?.en || c.slug]))); }, [kind]);
  useEffect(() => { if (kind === 'DETAIL') adminFetch('/admin/pages').then(async (r) => r.ok && setFolders((await r.json()).filter((p: any) => p.key !== 'home' && !/policy|terms|data-/.test(p.key)).map((p: any) => [p.key, `${p.title?.en || p.key}  →  /${p.key}/…`]))); }, [kind]);
  useEffect(() => {
    (async () => {
      if (isNew) { d.load(blankEntry(kind) as Doc); return; }
      const r = await adminFetch(`/admin/entries/${id}`);
      if (!r.ok) return setMissing(await describeError(r));
      const e = await r.json();
      const doc: Doc = { ...blankEntry(kind), ...e, cover: e.cover ?? blankEntry(kind).cover, design: { ...blankEntry(kind).design, ...(e.design ?? {}) }, blocks: e.blocks ?? [], seo: { ...blankEntry(kind).seo, ...(e.seo ?? {}) }, publishAt: e.publishAt };
      d.load(doc);
      setWhen(e.status === 'PUBLISHED' ? (e.publishAt && new Date(e.publishAt) > new Date() ? 'later' : 'now') : 'draft');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind]);

  const curPath = (d.value as any)?.path as string | undefined;
  // A folder whose page no longer exists must stay selectable so saving never silently changes the address.
  const fields = useMemo(() => entryFields(kind, cats, curPath && curPath !== 'info' && !folders.some((f) => f[0] === curPath) ? [...folders, [curPath, `${curPath}  →  /${curPath}/…`]] : folders), [kind, cats, folders, curPath]);
  const v = d.value;
  if (missing) return <div className="a-card"><p className="a-err">{missing}</p><Link href={info.base} className="a-btn mt-3">Back</Link></div>;
  if (!v) return <p>Loading…</p>;

  const errors = validate(fields, v); const warns = warnings(fields, v);
  const bp = blockProblems((v as any).blocks ?? []);
  const problems = Object.keys(errors).length + bp.count;
  const incomplete = d.dirty && (Object.keys(warns).some((k) => /missing/i.test(warns[k]) && !k.includes('.alt')) || bp.warns.some((w) => Object.keys(w).some((k) => /missing/i.test(w[k]) && !k.includes('.alt'))));
  const set = (nv: Doc) => {
    if (!slugTouched && nv.title?.en !== v.title?.en) nv = { ...nv, slug: slugify(nv.title.en) };
    if (nv.slug !== v.slug) setSlugTouched(true);
    d.setValue(nv);
  };
  const canPub = can('entry:publish');

  const save = async (after: 'stay' | 'list') => {
    if (problems) { toast.error(`Not saved: please fix ${problems} problem${problems > 1 ? 's' : ''} marked in red.`); setShow(true); setTimeout(() => document.querySelector('[aria-invalid="true"], .a-err')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100); return; }
    if (when_ === 'later' && !v.publishAt) { toast.error('Choose the date and time to go live.'); return; }
    setBusy(true);
    const body = { ...v, status: when_ === 'draft' ? 'DRAFT' : 'PUBLISHED', publishAt: when_ === 'later' && v.publishAt ? new Date(v.publishAt).toISOString() : null, cover: (v.cover as any)?.url || (v.cover as any)?.videoUrl ? v.cover : null };
    delete (body as any).id; delete (body as any).createdAt; delete (body as any).updatedAt; delete (body as any).deletedAt; delete (body as any).sortOrder;
    const r = isNew ? await adminFetch('/admin/entries', { method: 'POST', ...jsonBody(body) }) : await adminFetch(`/admin/entries/${id}`, { method: 'PUT', ...jsonBody(body) });
    setBusy(false);
    if (!r.ok) { toast.error(await describeError(r)); return; }
    const j = await r.json().catch(() => ({}));
    d.markSaved();
    toast.success(when_ === 'draft' ? 'Saved as a draft. Visitors cannot see it.' : when_ === 'later' ? 'Saved. It will go live at the time you chose.' : 'Saved. It is live on the website.');
    if (after === 'list') router.push(info.base); else if (isNew && j.id) router.replace(`${info.base}/${j.id}`);
  };

  const previewDoc = { ...v, id: id, kind, items: v.items ?? [], docs: v.docs ?? [], links: v.links ?? [], info: v.info ?? [] };
  return (
    <div className="space-y-4">
      <IncompleteGate on={incomplete} />
      <PageBar title={isNew ? `New ${info.single}` : v.title?.en || `Edit ${info.single}`} help={info.blurb}>
        <Link href={info.base} className="a-btn">Back</Link>
        {kind !== 'CATEGORY' && <button className="a-btn" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Preview</button>}
        <button className="a-btn a-btn-primary" disabled={busy || (!isNew && !can('entry:update')) || (isNew && !can('entry:create'))} onClick={() => save('stay')}>{busy ? 'Saving…' : 'Save'}</button>
      </PageBar>
      {d.pending && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm" role="status">
          <b>You have unsaved work from {new Date(d.pending.at).toLocaleString()}.</b>
          <button className="a-btn a-btn-sm a-btn-primary" onClick={d.restore}>Restore it</button><button className="a-btn a-btn-sm" onClick={d.discardPending}>Discard it</button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
        <div className="a-card">
          <SchemaForm fields={fields} value={v} onChange={(nv) => set(nv)} errors={show || !isNew ? errors : Object.fromEntries(Object.entries(errors).filter(([k]) => !['title', 'slug'].includes(k) || !!v.title?.en))} warns={warns} />
        </div>
        {kind === 'DETAIL' && <div className="a-card"><BlocksEditor value={(v as any).blocks ?? []} onChange={(blocks) => set({ ...v, blocks } as Doc)} showErrors={show || !isNew} /></div>}
        </div>
        <aside className="a-card h-fit space-y-4 lg:sticky lg:top-24">
          <h2 className="!mb-0">Publishing</h2>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" disabled={!canPub} checked={v.isVisible} onChange={(e) => set({ ...v, isVisible: e.target.checked })} />Show on the website<span className="sr-only"> (untick to hide without deleting)</span></label>
          <fieldset className="space-y-2" disabled={!canPub}>
            <legend className="a-label">When should it go live?</legend>
            {([['draft', 'Keep as a draft'], ['now', 'Publish now'], ['later', 'Schedule for later']] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="when" checked={when_ === k} onChange={() => setWhen(k)} />{l}</label>)}
            {when_ === 'later' && <input type="datetime-local" className="a-input" value={toLocal(v.publishAt)} min={toLocal(new Date().toISOString())} onChange={(e) => set({ ...v, publishAt: e.target.value ? new Date(e.target.value).toISOString() : null })} aria-label="Go-live date and time" />}
          </fieldset>
          {!canPub && <p className="text-xs text-slate-500">Your role can edit but not publish. Ask an Admin to publish it.</p>}
          <button className="a-btn a-btn-primary w-full justify-center" disabled={busy} onClick={() => save('list')}>{busy ? 'Saving…' : 'Save and close'}</button>
          {!isNew && <p className="text-xs text-slate-500">Last saved {when((v as any).updatedAt ?? new Date().toISOString())}</p>}
        </aside>
      </div>
      {preview && <PreviewModal pageKey="entry" page={{ title: v.title, seo: {}, sections: [] }} entry={previewDoc} onClose={() => setPreview(false)} />}
    </div>
  );
}

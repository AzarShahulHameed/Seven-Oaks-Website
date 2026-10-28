'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/admin/Brand';
import { useDialogs } from '@/components/admin/Dialogs';
import { useDirtyFlag, useIncompleteFlag } from '@/components/admin/Dirty';
import { blankFor, SchemaForm, validate, warnings, type FieldDef } from '@/components/admin/Fields';
import { SkelRows } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

const FIELDS: FieldDef[] = [
  { k: 'authorName', label: 'Parent name', type: 'text', required: true, max: 100, help: 'How the name appears under the quote, e.g. “Sara A.” or “Parent of an FS1 child”. Use a first name or initial to protect privacy.' },
  { k: 'childName', label: 'Child name (optional)', type: 'text', max: 100, help: 'Shown only if filled in. Use a first name only, and only with the parent’s permission.' },
  { k: 'body', label: 'Review', type: 'i18n', multiline: true, required: true, max: 600, help: 'The parent’s own words. English and Arabic are both required before you can save.' },
  { k: 'rating', label: 'Stars (1–5)', type: 'number', min: 1, max: 5 },
  { k: 'imageUrl', label: 'Parent photo (optional)', type: 'imageurl', help: 'Choose from your photo library. Only with the parent’s permission.' },
];
const PLACES: [string, string][] = [['home', 'Home page'], ['about', 'About page'], ['testimonials', 'Testimonials page']];
const STATUS: [string, string, string][] = [['DRAFT', 'Pending approval', 'bg-amber-100 text-amber-800'], ['PUBLISHED', 'Approved & shown', 'bg-emerald-100 text-emerald-800'], ['ARCHIVED', 'Hidden', 'bg-slate-200 text-slate-700']];
const blank = () => ({ ...blankFor(FIELDS), rating: 5, status: 'DRAFT', featured: false, places: ['testimonials'], sortOrder: 0 });

export default function TestimonialsAdmin() {
  const toast = useToast(); const dlg = useDialogs();
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const [edit, setEdit] = useState<any>(null); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('');
  const load = () => adminFetch('/admin/testimonials').then(async (r) => (r.ok ? setRows(await r.json()) : setErr(await describeError(r))));
  useEffect(() => { load(); }, []);

  const errs = useMemo(() => (edit ? validate(FIELDS, edit) : {}), [edit]);
  const warns = useMemo(() => (edit ? warnings(FIELDS, edit) : {}), [edit]);
  const missingAr = !!edit && (!String(edit.body?.en ?? '').trim() || !String(edit.body?.ar ?? '').trim());
  useDirtyFlag(!!edit); useIncompleteFlag(!!edit && (missingAr || Object.keys(warns).length > 0));
  const canSave = !!edit && !Object.keys(errs).length && !Object.keys(warns).length && !missingAr && !busy;

  const quick = async (row: any, patch: any, msg: string) => { // optimistic
    const prev = rows; setRows((l) => l && l.map((x) => (x.id === row.id ? { ...x, ...patch } : x)));
    const r = await adminFetch(`/admin/testimonials/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, ...patch, childName: row.childName ?? '', imageUrl: row.imageUrl ?? '', places: patch.places ?? row.places ?? [] }) });
    if (r.ok) toast.success(msg); else { setRows(prev); toast.error(await describeError(r)); }
  };
  const save = async () => {
    setBusy(true);
    const body = { authorName: edit.authorName, childName: edit.childName ?? '', body: edit.body, rating: Number(edit.rating) || 5, imageUrl: edit.imageUrl ?? '', status: edit.status, featured: !!edit.featured, places: edit.places ?? [], sortOrder: Number(edit.sortOrder) || 0 };
    const r = await adminFetch(edit.id ? `/admin/testimonials/${edit.id}` : '/admin/testimonials', { method: edit.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) { toast.success(edit.id ? 'Testimonial saved' : 'Testimonial added'); setEdit(null); load(); } else toast.error(await describeError(r));
  };
  const remove = async (row: any) => {
    if (!(await dlg.confirm({ title: 'Delete this testimonial?', message: `The review from ${row.authorName} will be removed from the website.`, confirmLabel: 'Delete', danger: true }))) return;
    const prev = rows; setRows((l) => l && l.filter((x) => x.id !== row.id));
    const r = await adminFetch(`/admin/testimonials/${row.id}`, { method: 'DELETE' });
    if (r.ok) toast.success('Deleted'); else { setRows(prev); toast.error(await describeError(r)); }
  };
  const close = async () => { if (!edit) return; if (await dlg.confirm({ title: 'Close without saving?', message: 'Your changes to this testimonial will be lost.', confirmLabel: 'Close', danger: true })) setEdit(null); };
  const shown = (rows ?? []).filter((r) => !filter || r.status === filter);

  return (
    <div className="space-y-4">
      <PageBar title="Testimonials" help="Add parent reviews, approve them, feature the best ones and choose which pages show them. Only publish genuine reviews you have permission to use."><button className="a-btn a-btn-primary" onClick={() => setEdit(blank())}><Plus className="h-4 w-4" />Add testimonial</button></PageBar>
      <div className="flex flex-wrap gap-2">{[['', 'All'], ...STATUS.map(([k, l]) => [k, l])].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`a-btn a-btn-sm ${filter === k ? 'a-btn-primary' : ''}`}>{l}{rows && k ? ` (${rows.filter((r) => r.status === k).length})` : ''}</button>)}</div>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!rows && !err && <SkelRows rows={4} avatar />}
      {rows && (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((r) => {
            const st = STATUS.find((x) => x[0] === r.status)!;
            return (
              <article key={r.id} className="a-card flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Avatar url={r.imageUrl} name={r.authorName} size={44} />
                  <div className="min-w-0 flex-1"><p className="font-bold">{r.authorName}{r.featured && <Star className="ms-1.5 inline h-4 w-4 fill-amber-400 text-amber-400" aria-label="Featured" />}</p><p className="text-xs text-slate-500">{r.childName ? `Parent of ${r.childName} · ` : ''}{'★'.repeat(r.rating ?? 0)}</p></div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st[2]}`}>{st[1]}</span>
                </div>
                <p className="line-clamp-4 text-sm text-slate-700">“{r.body?.en || r.body?.ar}”</p>
                <p className="text-xs text-slate-500">Shown on: {(r.places ?? []).length ? (r.places as string[]).map((p) => PLACES.find((x) => x[0] === p)?.[1] ?? p).join(', ') : 'nowhere yet'}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {r.status !== 'PUBLISHED' && <button className="a-btn a-btn-sm a-btn-primary" onClick={() => quick(r, { status: 'PUBLISHED' }, 'Approved')}><Check className="h-3.5 w-3.5" />Approve</button>}
                  {r.status === 'PUBLISHED' && <button className="a-btn a-btn-sm" onClick={() => quick(r, { status: 'ARCHIVED' }, 'Hidden from the website')}><EyeOff className="h-3.5 w-3.5" />Hide</button>}
                  <button className="a-btn a-btn-sm" onClick={() => quick(r, { featured: !r.featured }, r.featured ? 'Removed from featured' : 'Featured')}><Star className="h-3.5 w-3.5" />{r.featured ? 'Unfeature' : 'Feature'}</button>
                  <button className="a-btn a-btn-sm" onClick={() => setEdit({ ...r, childName: r.childName ?? '', imageUrl: r.imageUrl ?? '', places: r.places ?? [] })}><Pencil className="h-3.5 w-3.5" />Edit</button>
                  <button className="a-btn a-btn-sm a-btn-danger ms-auto" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            );
          })}
          {!shown.length && <p className="a-card md:col-span-2 text-center text-slate-500">No testimonials here. Add the first one.</p>}
        </div>
      )}

      {edit && (
        <div className="a-modal-bg" role="dialog" aria-modal="true" aria-label="Testimonial">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center"><h2 className="text-lg font-bold">{edit.id ? 'Edit testimonial' : 'Add testimonial'}</h2><button className="a-btn a-btn-sm ms-auto" onClick={close} aria-label="Close"><X className="h-4 w-4" /></button></div>
            <SchemaForm fields={FIELDS} value={edit} onChange={setEdit} errors={errs} warns={warns} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label><span className="a-label">Approval</span><select className="a-input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" checked={!!edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} />Featured (shown first)</label>
              <fieldset className="sm:col-span-2"><legend className="a-label">Show on</legend><div className="flex flex-wrap gap-4">{PLACES.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(edit.places ?? []).includes(k)} onChange={(e) => setEdit({ ...edit, places: e.target.checked ? [...(edit.places ?? []), k] : (edit.places ?? []).filter((x: string) => x !== k) })} />{l}</label>)}</div><p className="mt-1 text-xs text-slate-500">A review only appears when it is approved and a page is ticked. Each page’s “Parent reviews” block must be set to use managed reviews.</p></fieldset>
            </div>
            {missingAr && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Both the English and the Arabic review are needed before you can save. Use the Translate button beside the Arabic box, then check it.</p>}
            {!missingAr && Object.keys(warns).length > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">The Arabic is out of date with the English. Update it to save.</p>}
            <div className="mt-5 flex justify-end gap-2"><button className="a-btn" onClick={close}>Cancel</button><button className="a-btn a-btn-primary" disabled={!canSave} onClick={save}>{busy ? 'Saving…' : 'Save testimonial'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

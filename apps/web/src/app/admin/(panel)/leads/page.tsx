'use client';
import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Download, Mail, MessageSquarePlus, Phone, Search, Trash2, X } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/admin/Brand';
import { useDialogs } from '@/components/admin/Dialogs';
import { SkelRows } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

const STATUSES: [string, string, string][] = [['NEW', 'New', 'bg-sky-100 text-sky-800'], ['CONTACTED', 'Contacted', 'bg-violet-100 text-violet-800'], ['TOUR', 'Tour booked', 'bg-amber-100 text-amber-800'], ['OFFERED', 'Place offered', 'bg-teal-100 text-teal-800'], ['ENROLLED', 'Enrolled', 'bg-emerald-100 text-emerald-800'], ['DECLINED', 'Not proceeding', 'bg-slate-200 text-slate-700']];
const TYPES: [string, string][] = [['', 'All types'], ['ADMISSION', 'Admissions'], ['GENERAL', 'General'], ['CONTACT', 'Contact'], ['NEWSLETTER', 'Newsletter']];
const label = (s: string) => STATUSES.find((x) => x[0] === s)?.[1] ?? s;
const tone = (s: string) => STATUSES.find((x) => x[0] === s)?.[2] ?? '';
const dt = (d: string) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function LeadsPage() {
  const toast = useToast(); const dlg = useDialogs();
  const [status, setStatus] = useState(''); const [type, setType] = useState(''); const [q, setQ] = useState(''); const [qq, setQq] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null); const [err, setErr] = useState(''); const [sel, setSel] = useState<any>(null); const [staff, setStaff] = useState<any[]>([]); const [note, setNote] = useState('');
  useEffect(() => { const t = setTimeout(() => { setQ(qq); setPage(1); }, 350); return () => clearTimeout(t); }, [qq]);
  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page) }); if (status) p.set('status', status); if (type) p.set('type', type); if (q) p.set('q', q);
    return adminFetch(`/admin/leads?${p}`).then(async (r) => { if (r.ok) { setData(await r.json()); setErr(''); } else setErr(await describeError(r)); });
  }, [page, status, type, q]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { adminFetch('/admin/leads/assignees').then(async (r) => r.ok && setStaff(await r.json())); }, []);

  // Optimistic update: change the screen at once, roll back with a message if the server refuses.
  const patch = async (row: any, body: any, optimistic: any, ok = 'Saved') => {
    const prev = row; const next = { ...row, ...optimistic };
    setData((d: any) => d && { ...d, rows: d.rows.map((r: any) => (r.id === row.id ? next : r)) }); setSel((s: any) => (s?.id === row.id ? next : s));
    const r = await adminFetch(`/admin/leads/${row.id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (r.ok) { toast.success(ok); if (body.note) { setNote(''); load(); } }
    else { toast.error(await describeError(r)); setData((d: any) => d && { ...d, rows: d.rows.map((x: any) => (x.id === row.id ? prev : x)) }); setSel((s: any) => (s?.id === row.id ? prev : s)); }
  };
  const remove = async (row: any) => {
    if (!(await dlg.confirm({ title: `Erase ${row.name}?`, message: 'This permanently erases this person’s personal details (data-protection erasure). It cannot be undone.', confirmLabel: 'Erase', danger: true }))) return;
    const r = await adminFetch(`/admin/leads/${row.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Erased'); setSel(null); load(); } else toast.error(await describeError(r));
  };
  const admissions = async (row: any) => {
    const r = await adminFetch(`/admin/leads/${row.id}/send-admissions`, { method: 'POST' });
    if (r.ok) toast.success(`Admissions information sent to ${row.email}`); else toast.error(await describeError(r));
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <PageBar title="Enquiries & leads" help="Everyone who sent an enquiry or signed up. Details are collected only with their ticked consent.">
        <a className="a-btn" href="/api/admin/leads/export.csv" download><Download className="h-4 w-4" />Export CSV</a>
      </PageBar>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map(([k, l, c]) => (
          <button key={k} onClick={() => { setStatus(status === k ? '' : k); setPage(1); }} className={`a-card !p-3 text-start transition ${status === k ? 'ring-2 ring-[#1f4d2b]' : ''}`}>
            <p className="text-2xl font-bold">{data ? data.counts?.[k] ?? 0 : <span className="so-shimmer inline-block h-7 w-8 rounded" />}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${c}`}>{l}</span>
          </button>
        ))}
      </div>
      {data?.overdue > 0 && <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"><CalendarClock className="me-1.5 inline h-4 w-4" />{data.overdue} follow-up{data.overdue > 1 ? 's are' : ' is'} overdue.</p>}
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-slate-400" /><input className="a-input !ps-9" placeholder="Search name, email, phone or child…" value={qq} onChange={(e) => setQq(e.target.value)} aria-label="Search" /></label>
        <select className="a-input !w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Type">{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {(status || type || q) && <button className="a-btn" onClick={() => { setStatus(''); setType(''); setQq(''); }}><X className="h-4 w-4" />Clear filters</button>}
      </div>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!data && !err && <SkelRows rows={7} avatar />}
      {data && (
        <div className="a-card !p-0 overflow-x-auto">
          <table className="a-table min-w-[720px]">
            <thead><tr><th className="p-2">Parent</th><th className="p-2">Interest</th><th className="p-2">Source</th><th className="p-2">Status</th><th className="p-2">Assigned</th><th className="p-2">Received</th></tr></thead>
            <tbody>
              {data.rows.map((r: any) => (
                <tr key={r.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => setSel(r)}>
                  <td className="p-2"><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></td>
                  <td className="p-2 text-sm">{r.interest || '—'}{r.childName && <span className="block text-xs text-slate-500">{r.childName}{r.childAge ? `, ${r.childAge}` : ''}</span>}</td>
                  <td className="p-2 text-xs text-slate-600">{r.type?.toLowerCase()}{r.source ? ` · ${r.source}` : ''}</td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <select className={`rounded-full border-0 px-2 py-1 text-xs font-bold ${tone(r.status)}`} value={r.status} onChange={(e) => patch(r, { status: e.target.value }, { status: e.target.value }, 'Status updated')} aria-label={`Status for ${r.name}`}>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  </td>
                  <td className="p-2 text-xs">{r.assignee ? <span className="flex items-center gap-1.5"><Avatar url={r.assignee.avatarUrl} name={r.assignee.name} size={20} />{r.assignee.name}</span> : <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="whitespace-nowrap p-2 text-xs text-slate-600">{dt(r.createdAt)}{r.followUpAt && new Date(r.followUpAt) < new Date() && !['ENROLLED', 'DECLINED'].includes(r.status) && <span className="ms-1 font-bold text-red-600">· overdue</span>}</td>
                </tr>
              ))}
              {!data.rows.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No enquiries match. New ones from the website appear here and in your notifications.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <div className="flex items-center gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="a-btn a-btn-sm">Previous</button><span>Page {page} of {pages} · {data.total} total</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="a-btn a-btn-sm">Next</button></div>}

      {sel && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Enquiry from ${sel.name}`}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setSel(null)} />
          <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b p-5"><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold">{sel.name}</h2><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone(sel.status)}`}>{label(sel.status)}</span></div><button onClick={() => setSel(null)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="space-y-5 p-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <a className="a-btn a-btn-sm" href={`mailto:${sel.email}`}><Mail className="h-3.5 w-3.5" />{sel.email}</a>
                {sel.phone && <a className="a-btn a-btn-sm" href={`tel:${sel.phone}`}><Phone className="h-3.5 w-3.5" />{sel.phone}</a>}
                {sel.type !== 'NEWSLETTER' && <button className="a-btn a-btn-sm" onClick={() => admissions(sel)}>Send admissions info</button>}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {([['Child', sel.childName], ['Child age', sel.childAge], ['Programme', sel.interest], ['Preferred contact', sel.preferredContact], ['Preferred visit', sel.visitDate], ['Language', sel.locale], ['Source', sel.source], ['Page', sel.page], ['Consent given', sel.consentAt ? dt(sel.consentAt) : 'Not recorded']] as [string, string][]).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs font-semibold text-slate-500">{k}</dt><dd className="break-words">{v}</dd></div>)}
              </dl>
              {sel.message && <div><p className="text-xs font-semibold text-slate-500">Message</p><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{sel.message}</p></div>}
              <div className="grid grid-cols-2 gap-3">
                <label><span className="a-label">Status</span><select className="a-input" value={sel.status} onChange={(e) => patch(sel, { status: e.target.value }, { status: e.target.value }, 'Status updated')}>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label><span className="a-label">Assigned to</span><select className="a-input" value={sel.assigneeId ?? ''} onChange={(e) => { const u = staff.find((x) => x.id === e.target.value); patch(sel, { assigneeId: e.target.value || null }, { assigneeId: e.target.value || null, assignee: u ?? null }, 'Assigned'); }}><option value="">Unassigned</option>{staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
                <label className="col-span-2"><span className="a-label">Follow up on</span><input type="datetime-local" className="a-input" value={sel.followUpAt ? new Date(new Date(sel.followUpAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => patch(sel, { followUpAt: e.target.value ? new Date(e.target.value).toISOString() : null }, { followUpAt: e.target.value ? new Date(e.target.value).toISOString() : null }, 'Follow-up saved')} /></label>
              </div>
              <div>
                <p className="a-label">Notes</p>
                <ul className="mb-2 space-y-2">{(sel.notes ?? []).map((n: any, k: number) => <li key={k} className="rounded-lg bg-slate-50 p-2.5"><p className="whitespace-pre-wrap">{n.text}</p><p className="mt-1 text-[11px] text-slate-500">{dt(n.at)}</p></li>)}{!(sel.notes ?? []).length && <li className="text-slate-400">No notes yet.</li>}</ul>
                <div className="flex gap-2"><textarea className="a-input" rows={2} placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /><button className="a-btn a-btn-primary self-end" disabled={!note.trim()} onClick={() => patch(sel, { note }, {}, 'Note added')}><MessageSquarePlus className="h-4 w-4" /></button></div>
              </div>
              <button className="a-btn a-btn-danger" onClick={() => remove(sel)}><Trash2 className="h-4 w-4" />Erase this person’s data</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

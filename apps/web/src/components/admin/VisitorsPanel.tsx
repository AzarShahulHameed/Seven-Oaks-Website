'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Download, Mail, Monitor, Search, ShieldCheck, Smartphone, Tablet, Trash2, X } from 'lucide-react';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { useDialogs } from './Dialogs';
import { Help } from './Help';
import { SkelRows } from './Skeleton';
import { useToast } from './Toast';

type V = { id: string; firstSeenAt: string; lastSeenAt: string; ip: string | null; country: string | null; device: string; browser: string | null; locale: string; visits: number; pageViews: number; lastPath: string | null; email: string | null; name: string | null; marketingOptIn: boolean; unsubscribed: boolean };
type Cfg = { enabled: boolean; ipMode: 'full' | 'masked' | 'off'; retentionDays: number };
const dt = (d: string) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const DevIcon = ({ d }: { d: string }) => (d === 'mobile' ? <Smartphone className="h-4 w-4" /> : d === 'tablet' ? <Tablet className="h-4 w-4" /> : <Monitor className="h-4 w-4" />);
const mmss = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;

/** Everyone who accepted analytics cookies: IP address, device, pages viewed and, once they sent an enquiry, their email. */
export function VisitorsPanel() {
  const toast = useToast(); const dlg = useDialogs(); const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'identified' | 'anonymous'>('all'); const [sort, setSort] = useState<'recent' | 'visits' | 'pages'>('recent');
  const [qq, setQq] = useState(''); const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null); const [err, setErr] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set()); const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null); const [cfg, setCfg] = useState<Cfg | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setQ(qq); setPage(1); }, 350); return () => clearTimeout(t); }, [qq]);
  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), filter, sort }); if (q) p.set('q', q);
    return adminFetch(`/admin/analytics/visitors?${p}`).then(async (r) => { if (r.ok) { const j = await r.json(); setData(j); setCfg((c) => c ?? j.settings); setErr(''); } else setErr(await describeError(r)); });
  }, [page, filter, sort, q]);
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (!open) { setDetail(null); return; }
    adminFetch(`/admin/analytics/visitors/${open}`).then(async (r) => (r.ok ? setDetail(await r.json()) : toast.error(await describeError(r))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const saveCfg = async () => {
    if (!cfg) return; setBusy(true);
    const r = await adminFetch('/admin/analytics/settings', { method: 'PUT', ...jsonBody(cfg) });
    setBusy(false); if (r.ok) { toast.success('Visitor tracking settings saved'); load(); } else toast.error(await describeError(r));
  };
  const erase = async (v: V) => {
    if (!(await dlg.confirm({ title: 'Erase this visitor?', message: 'Their IP address, email link and page history are removed from the visitor log. Their enquiry (if any) stays in Enquiries & leads.', confirmLabel: 'Erase', danger: true }))) return;
    const r = await adminFetch(`/admin/analytics/visitors/${v.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Visitor erased'); setOpen(null); load(); } else toast.error(await describeError(r));
  };
  const followUp = (ids: string[]) => {
    try { sessionStorage.setItem('so-campaign-audience', JSON.stringify({ kind: 'selected', visitorIds: ids })); } catch { /* ignore */ }
    router.push('/admin/campaigns?new=1');
  };
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const rows: V[] = data?.rows ?? [];
  const mailable = rows.filter((r) => r.email && r.marketingOptIn && !r.unsubscribed);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const selMailable = [...sel].filter((id) => mailable.some((r) => r.id === id));

  return (
    <div className="space-y-4">
      <div className="a-card space-y-3">
        <h2><ShieldCheck className="h-4 w-4" />Visitor tracking<Help text="Only people who press “Accept” on the cookie banner appear here. Everyone else is still counted in the charts, but anonymously, with no IP address." align="left" /></h2>
        <p className="a-sub !mb-0">Shows who is looking at the website: IP address, country, device and pages viewed. If a visitor later sends an enquiry or joins the newsletter, their email is linked to their visits so your marketing team can follow up.</p>
        {cfg && (
          <div className="a-cols"><div className="a-cols-grid a-cols-grid-3">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />Keep a visitor log</label>
            <label><span className="a-label">IP address<Help text="Full: the whole address. Hidden last part: 203.0.113.0 (still shows the area, safer for privacy). Do not keep: no address is stored." align="left" /></span>
              <select className="a-input" value={cfg.ipMode} onChange={(e) => setCfg({ ...cfg, ipMode: e.target.value as Cfg['ipMode'] })}><option value="full">Keep the full address</option><option value="masked">Hide the last part</option><option value="off">Do not keep it</option></select></label>
            <label><span className="a-label">Delete IP addresses after<Help text="IP addresses are removed automatically after this many days. The visit counts and email links stay." align="left" /></span>
              <div className="flex items-center gap-2"><input type="number" min={7} max={730} className="a-input !w-24" value={cfg.retentionDays} onChange={(e) => setCfg({ ...cfg, retentionDays: Math.max(7, Math.min(730, Number(e.target.value) || 90)) })} /><span className="text-sm text-slate-600">days</span></div></label>
          </div></div>
        )}
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">An IP address counts as personal data. The cookie banner tells visitors this before they accept, and your Privacy Policy should say it too (Admin → Legal &amp; privacy). Local laws differ, so have your lawyer confirm the wording.</p>
        <button className="a-btn a-btn-primary" disabled={busy} onClick={saveCfg}>{busy ? 'Saving…' : 'Save tracking settings'}</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="a-card"><p className="a-label">People in the log</p><p className="text-3xl font-extrabold tabular-nums">{data ? data.total.toLocaleString() : '–'}</p><p className="a-hint">for the current filter</p></div>
        <div className="a-card"><p className="a-label">With an email<Help text="Visitors who sent an enquiry, tour request or newsletter sign-up after accepting cookies." align="left" /></p><p className="text-3xl font-extrabold tabular-nums">{data ? data.identified.toLocaleString() : '–'}</p></div>
        <div className="a-card"><p className="a-label">Can be emailed now</p><p className="text-3xl font-extrabold tabular-nums">{data ? mailable.length : '–'}</p><p className="a-hint">on this page, agreed and not unsubscribed</p></div>
      </div>

      <div className="a-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1"><Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-slate-400" /><input className="a-input !ps-9" placeholder="Search by email, name, IP or country code" value={qq} onChange={(e) => setQq(e.target.value)} aria-label="Search visitors" /></div>
          <div className="flex rounded-xl border border-slate-300 bg-white p-0.5" role="group" aria-label="Filter">{([['all', 'Everyone'], ['identified', 'With email'], ['anonymous', 'No email']] as const).map(([k, l]) => <button key={k} onClick={() => { setFilter(k); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === k ? 'bg-[#1f4d2b] text-white' : 'hover:bg-slate-100'}`}>{l}</button>)}</div>
          <select className="a-input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort"><option value="recent">Most recent</option><option value="visits">Most visits</option><option value="pages">Most pages viewed</option></select>
          <a className="a-btn" href="/api/admin/analytics/visitors.csv"><Download className="h-4 w-4" />CSV</a>
        </div>
        {selMailable.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm"><b>{selMailable.length} selected</b><button className="a-btn a-btn-primary a-btn-sm" onClick={() => followUp(selMailable)}><Mail className="h-4 w-4" />Send a follow-up email</button><button className="a-btn a-btn-sm" onClick={() => setSel(new Set())}>Clear</button></div>
        )}
        {err && <p className="a-err" role="alert">{err}</p>}
        {!data && !err && <SkelRows rows={6} />}
        {data && rows.length === 0 && <p className="py-6 text-center text-slate-500">{data.total === 0 && filter === 'all' && !q ? 'No visitors in the log yet. People appear here after they press Accept on the cookie banner and open a page.' : 'No one matches this filter.'}</p>}
        {rows.length > 0 && (
          <div className="a-scroll-x"><table className="a-table min-w-[56rem]">
            <thead><tr><th className="w-8" /><th>Last seen</th><th>Visitor</th><th>IP address</th><th>Country</th><th>Device</th><th className="text-end">Visits</th><th className="text-end">Pages</th><th>Emails</th></tr></thead>
            <tbody>{rows.map((v) => {
              const can = !!v.email && v.marketingOptIn && !v.unsubscribed;
              return (
                <tr key={v.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(v.id)}>
                  <td onClick={(e) => e.stopPropagation()}>{can && <input type="checkbox" aria-label={`Select ${v.email}`} checked={sel.has(v.id)} onChange={() => toggle(v.id)} />}</td>
                  <td className="whitespace-nowrap">{dt(v.lastSeenAt)}</td>
                  <td>{v.email ? <><b className="block">{v.name || v.email.split('@')[0]}</b><span className="text-xs text-slate-500" dir="ltr">{v.email}</span></> : <span className="text-slate-500">Anonymous visitor</span>}</td>
                  <td className="font-mono text-xs" dir="ltr">{v.ip ?? '–'}</td>
                  <td>{v.country ?? '–'}</td>
                  <td><span className="inline-flex items-center gap-1.5"><DevIcon d={v.device} /><span className="text-xs">{v.browser ?? v.device}</span></span></td>
                  <td className="text-end tabular-nums">{v.visits}</td><td className="text-end tabular-nums">{v.pageViews}</td>
                  <td>{!v.email ? '–' : v.unsubscribed ? <span className="a-badge a-badge-bad">Unsubscribed</span> : v.marketingOptIn ? <span className="a-badge a-badge-ok">Agreed</span> : <span className="a-badge">No</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
        {pages > 1 && <div className="flex items-center justify-center gap-3 text-sm"><button className="a-btn a-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="a-btn a-btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Visitor details" onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Visitor details</h2><button className="a-btn a-btn-sm" aria-label="Close" onClick={() => setOpen(null)}><X className="h-4 w-4" /></button></div>
            {!detail ? <SkelRows rows={5} /> : !detail.visitor ? <p className="text-slate-500">This visitor no longer exists.</p> : (
              <div className="space-y-4 text-sm">
                <dl className="grid grid-cols-[8rem_1fr] gap-y-1.5">
                  <dt className="text-slate-500">Name</dt><dd>{detail.visitor.name || '–'}</dd>
                  <dt className="text-slate-500">Email</dt><dd dir="ltr" className="text-start">{detail.visitor.email || 'Not known'}</dd>
                  <dt className="text-slate-500">IP address</dt><dd className="font-mono" dir="ltr">{detail.visitor.ip || '–'}</dd>
                  <dt className="text-slate-500">Country</dt><dd>{detail.visitor.country || '–'}</dd>
                  <dt className="text-slate-500">Device</dt><dd>{detail.visitor.browser || detail.visitor.device}</dd>
                  <dt className="text-slate-500">Language</dt><dd>{detail.visitor.locale === 'ar' ? 'Arabic' : 'English'}</dd>
                  <dt className="text-slate-500">First seen</dt><dd>{dt(detail.visitor.firstSeenAt)}</dd>
                  <dt className="text-slate-500">Last seen</dt><dd>{dt(detail.visitor.lastSeenAt)}</dd>
                  <dt className="text-slate-500">Visits / pages</dt><dd>{detail.visitor.visits} / {detail.visitor.pageViews}</dd>
                  <dt className="text-slate-500">Agreed to emails</dt><dd>{detail.visitor.marketingOptIn ? 'Yes (ticked the box on a form)' : 'No'}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  {detail.visitor.email && detail.visitor.marketingOptIn && <button className="a-btn a-btn-primary a-btn-sm" onClick={() => followUp([detail.visitor.id])}><Mail className="h-4 w-4" />Send follow-up email</button>}
                  <button className="a-btn a-btn-danger a-btn-sm" onClick={() => erase(detail.visitor)}><Trash2 className="h-4 w-4" />Erase visitor</button>
                </div>
                <div><h3 className="mb-2 font-bold">Pages viewed (latest 100)</h3>
                  <ol className="space-y-1.5 border-s-2 border-slate-200 ps-3">{detail.views.map((v: any) => (
                    <li key={v.id}><span className="font-mono text-xs" dir="ltr">{v.path}</span><span className="ms-2 text-xs text-slate-500">{v.locale.toUpperCase()} · {dt(v.createdAt)}{v.durationSec ? ` · ${mmss(v.durationSec)}` : ''}</span></li>
                  ))}{detail.views.length === 0 && <li className="text-slate-500">No page history.</li>}</ol></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

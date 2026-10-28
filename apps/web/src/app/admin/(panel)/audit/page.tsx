'use client';
import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download, LogIn, LogOut, Pencil, Plus, Rocket, ShieldAlert, Trash2, Upload, Languages, EyeOff, RotateCcw } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/admin/Brand';
import { SkelRows } from '@/components/admin/Skeleton';
import { adminFetch, describeError } from '@/lib/admin-api';

const VERB: Record<string, { text: string; icon: any; tone: string }> = {
  create: { text: 'created', icon: Plus, tone: 'bg-emerald-100 text-emerald-700' }, update: { text: 'updated', icon: Pencil, tone: 'bg-sky-100 text-sky-700' },
  delete: { text: 'deleted', icon: Trash2, tone: 'bg-red-100 text-red-700' }, publish: { text: 'published', icon: Rocket, tone: 'bg-emerald-100 text-emerald-700' },
  unpublish: { text: 'unpublished', icon: EyeOff, tone: 'bg-amber-100 text-amber-800' }, restore: { text: 'restored', icon: RotateCcw, tone: 'bg-amber-100 text-amber-800' },
  translate: { text: 'translated', icon: Languages, tone: 'bg-violet-100 text-violet-700' }, upload: { text: 'uploaded', icon: Upload, tone: 'bg-sky-100 text-sky-700' },
  download: { text: 'downloaded', icon: Download, tone: 'bg-slate-100 text-slate-700' }, login: { text: 'signed in', icon: LogIn, tone: 'bg-slate-100 text-slate-700' },
  logout: { text: 'signed out', icon: LogOut, tone: 'bg-slate-100 text-slate-700' }, security: { text: 'changed a security setting:', icon: ShieldAlert, tone: 'bg-red-100 text-red-700' },
};
const FILTERS: [string, string][] = [['', 'All actions'], ['login', 'Sign in'], ['logout', 'Sign out'], ['create', 'Create'], ['update', 'Update'], ['delete', 'Delete'], ['publish', 'Publish'], ['upload', 'Upload'], ['download', 'Download'], ['translate', 'Translation'], ['security', 'Security']];

const show = (v: any) => (v === undefined || v === null || v === '' ? '—' : typeof v === 'string' ? v : JSON.stringify(v, null, 1));
const sentence = (r: any) => {
  const d = r.diff as any; const label = d?.label || r.entity;
  return { v: VERB[r.action] ?? { text: r.action, icon: Pencil, tone: 'bg-slate-100 text-slate-700' }, label };
};

export default function AuditPage() {
  const [tab, setTab] = useState<'audit' | 'logins'>('audit');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setData(null); setErr('');
    adminFetch(`/admin/audit${tab === 'logins' ? '/logins' : ''}?page=${page}${action && tab === 'audit' ? `&action=${action}` : ''}`).then(async (r) => (r.ok ? setData(await r.json()) : setErr(await describeError(r))));
  }, [tab, page, action]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <div className="space-y-4">
      <PageBar title="Activity log" help="A permanent record of who did what and when, with the old and new values. Passwords and secrets are never recorded." />
      <div className="flex flex-wrap items-center gap-2">
        {(['audit', 'logins'] as const).map((t) => <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`a-btn ${tab === t ? 'a-btn-primary' : ''}`}>{t === 'audit' ? 'Everything done' : 'Sign-in attempts'}</button>)}
        {tab === 'audit' && <select className="a-input !w-auto ms-auto" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Filter by action">{FILTERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
      </div>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!data && !err && <SkelRows rows={8} avatar />}
      {data && tab === 'audit' && (
        <div className="a-card !p-0 divide-y divide-slate-100">
          {data.rows.map((r: any) => {
            const { v, label } = sentence(r); const at = new Date(r.at); const ch: any[] = r.diff?.changes ?? [];
            const has = ch.length > 0;
            return (
              <Fragment key={r.id}>
                <div className="flex items-start gap-3 p-3">
                  <Avatar url={r.actorAvatar} name={r.actorName ?? r.actor ?? '?'} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><strong>{r.actorName ?? r.actor ?? 'System'}</strong>{r.actorRole && <span className="ms-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{r.actorRole}</span>} {v.text}{!['login', 'logout'].includes(r.action) && <> <strong>{label}</strong></>}</p>
                    <p className="text-xs text-slate-500">{at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} on {at.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}{r.ip ? ` · ${r.ip}` : ''}</p>
                  </div>
                  <span className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${v.tone}`}><v.icon className="h-3.5 w-3.5" />{r.action}</span>
                  {has && <button onClick={() => setOpen(open === r.id ? null : r.id)} className="a-btn a-btn-sm" aria-expanded={open === r.id}>{open === r.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}Details</button>}
                </div>
                {has && open === r.id && (
                  <div className="overflow-x-auto bg-slate-50 px-4 py-3">
                    <table className="w-full text-xs"><thead><tr className="text-start text-slate-500"><th className="p-1.5 text-start">Field</th><th className="p-1.5 text-start">Before</th><th className="p-1.5 text-start">After</th></tr></thead>
                      <tbody>{ch.slice(0, 40).map((c, n) => <tr key={n} className="border-t border-slate-200 align-top"><td className="p-1.5 font-mono">{c.path}</td><td className="max-w-xs whitespace-pre-wrap break-words p-1.5 text-red-700">{show(c.before)}</td><td className="max-w-xs whitespace-pre-wrap break-words p-1.5 text-emerald-700">{show(c.after)}</td></tr>)}</tbody></table>
                    {ch.length > 40 && <p className="mt-1 text-xs text-slate-500">…and {ch.length - 40} more changes.</p>}
                  </div>
                )}
              </Fragment>
            );
          })}
          {!data.rows.length && <p className="p-6 text-center text-sm text-slate-500">Nothing here yet.</p>}
        </div>
      )}
      {data && tab === 'logins' && (
        <div className="a-card !p-0 overflow-x-auto">
          <table className="a-table"><thead><tr><th className="p-2">When</th><th className="p-2">Email</th><th className="p-2">Result</th><th className="p-2">Browser</th><th className="p-2">IP</th></tr></thead>
            <tbody>{data.rows.map((r: any) => <tr key={r.id} className="border-t"><td className="whitespace-nowrap p-2">{new Date(r.at).toLocaleString()}</td><td className="p-2">{r.email}</td><td className={`p-2 font-semibold ${r.success ? 'text-emerald-700' : 'text-red-600'}`}>{r.success ? 'Success' : 'Failed'}</td><td className="max-w-xs truncate p-2" title={r.userAgent}>{r.userAgent}</td><td className="p-2">{r.ip}</td></tr>)}
              {!data.rows.length && <tr><td className="p-4 text-slate-500" colSpan={5}>Nothing here yet.</td></tr>}</tbody></table>
        </div>
      )}
      {data && <div className="flex items-center gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="a-btn a-btn-sm">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="a-btn a-btn-sm">Next</button></div>}
    </div>
  );
}

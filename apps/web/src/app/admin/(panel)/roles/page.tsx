'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Minus, ShieldCheck, X } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { SkelRows } from '@/components/admin/Skeleton';
import { adminFetch, describeError } from '@/lib/admin-api';

type Matrix = { columns: string[]; areas: { key: string; label: string; cells: Record<string, string> }[]; roles: { key: string; name: { en: string }; all: boolean; perms: string[]; brief: { summary: string; can: string[]; cannot: string[] } | null }[] };
const LETTER: Record<string, string> = { View: 'V', Create: 'C', Edit: 'E', Delete: 'D', Publish: 'P', Configure: 'K' };

export default function RolesPage() {
  const [m, setM] = useState<Matrix | null>(null); const [err, setErr] = useState(''); const [sel, setSel] = useState('ADMIN'); const [view, setView] = useState<'role' | 'compare'>('role');
  useEffect(() => { adminFetch('/admin/users/roles/matrix').then(async (r) => (r.ok ? setM(await r.json()) : setErr(await describeError(r)))); }, []);
  if (err) return <p className="a-err" role="alert">{err}</p>;
  if (!m) return <SkelRows rows={6} />;
  const has = (r: Matrix['roles'][number], p?: string) => !!p && (r.all || r.perms.includes(p));
  const role = m.roles.find((r) => r.key === sel) ?? m.roles[0];
  return (
    <div className="space-y-4">
      <PageBar title="Roles & permissions" help="What each role can do. This table is read straight from the server, so it always shows what is really enforced.">
        <Link href="/admin/users" className="a-btn">Back to users</Link>
      </PageBar>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === 'role'} className={`a-btn a-btn-sm ${view === 'role' ? 'a-btn-primary' : ''}`} onClick={() => setView('role')}>One role</button>
        <button role="tab" aria-selected={view === 'compare'} className={`a-btn a-btn-sm ${view === 'compare' ? 'a-btn-primary' : ''}`} onClick={() => setView('compare')}>Compare all roles</button>
      </div>

      {view === 'role' && (<>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Role">
          {m.roles.map((r) => <button key={r.key} role="tab" aria-selected={sel === r.key} onClick={() => setSel(r.key)} className={`a-btn a-btn-sm ${sel === r.key ? 'a-btn-primary' : ''}`}>{r.name?.en ?? r.key}</button>)}
        </div>
        <section className="a-card space-y-3">
          <h2 className="!mb-0"><ShieldCheck className="h-4 w-4" />{role.name?.en ?? role.key}</h2>
          {role.brief && <p>{role.brief.summary}</p>}
          {role.brief && (role.brief.can.length > 0 || role.brief.cannot.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><h3 className="a-label">Can</h3><ul className="space-y-1 text-sm">{role.brief.can.map((c) => <li key={c} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{c}</li>)}{role.brief.can.length === 0 && <li className="text-slate-500">Nothing in the dashboard.</li>}</ul></div>
              <div><h3 className="a-label">Cannot</h3><ul className="space-y-1 text-sm">{role.brief.cannot.map((c) => <li key={c} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{c}</li>)}</ul></div>
            </div>
          )}
        </section>
        <div className="a-card overflow-x-auto !p-0">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Permissions of {role.name?.en}</caption>
            <thead><tr className="border-b bg-slate-50 text-start"><th scope="col" className="p-3 text-start">Area</th>{m.columns.map((c) => <th key={c} scope="col" className="p-3 text-center">{c}</th>)}</tr></thead>
            <tbody>{m.areas.map((a) => (
              <tr key={a.key} className="border-b last:border-0">
                <th scope="row" className="p-3 text-start font-semibold">{a.label}</th>
                {m.columns.map((c) => { const p = a.cells[c]; const on = has(role, p); return (
                  <td key={c} className="p-3 text-center">{!p ? <span aria-label="Not applicable" className="text-slate-300">·</span> : on ? <><Check aria-hidden className="mx-auto h-4 w-4 text-emerald-600" /><span className="sr-only">Allowed</span></> : <><Minus aria-hidden className="mx-auto h-4 w-4 text-slate-300" /><span className="sr-only">Not allowed</span></>}</td>
                ); })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}

      {view === 'compare' && (
        <div className="a-card overflow-x-auto !p-0">
          <table className="w-full min-w-[56rem] text-sm">
            <caption className="sr-only">Permissions of every role</caption>
            <thead><tr className="border-b bg-slate-50"><th scope="col" className="p-3 text-start">Area</th>{m.roles.filter((r) => r.brief?.can.length || r.all).map((r) => <th key={r.key} scope="col" className="p-3 text-center">{r.name?.en ?? r.key}</th>)}</tr></thead>
            <tbody>{m.areas.map((a) => (
              <tr key={a.key} className="border-b last:border-0">
                <th scope="row" className="p-3 text-start font-semibold">{a.label}</th>
                {m.roles.filter((r) => r.brief?.can.length || r.all).map((r) => {
                  const on = m.columns.filter((c) => has(r, a.cells[c]));
                  return <td key={r.key} className="p-3 text-center" title={on.length ? on.join(', ') : 'No access'}>{on.length ? <span className="inline-flex gap-0.5 font-mono text-xs font-bold text-emerald-700">{on.map((c) => <span key={c} className="rounded bg-emerald-50 px-1">{LETTER[c]}</span>)}</span> : <Minus aria-label="No access" className="mx-auto h-4 w-4 text-slate-300" />}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
          <p className="border-t p-3 text-xs text-slate-600">V = View · C = Create · E = Edit · D = Delete · P = Publish or send · K = Configure. Teacher and Parent are reserved for future use and have no dashboard access.</p>
        </div>
      )}
    </div>
  );
}

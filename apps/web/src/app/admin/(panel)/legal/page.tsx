'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, EyeOff, Pencil, Rocket } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { SkelCard, SkelRows } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

const LEGAL: [string, string, string][] = [
  ['privacy-policy', 'Privacy Policy', 'What personal data you collect, why, and how people can use their rights.'],
  ['cookie-policy', 'Cookie Policy', 'The cookies the site uses and how visitors can change their choice.'],
  ['terms-and-conditions', 'Terms & Conditions', 'The rules for using the website and your service.'],
  ['data-protection', 'Data Protection Policy', 'How you keep children’s and parents’ data secure.'],
  ['data-retention', 'Data Retention Policy', 'How long each kind of data is kept and when it is deleted.'],
];
const STATE: Record<string, [string, string]> = { PUBLISHED: ['Published', 'bg-emerald-100 text-emerald-800'], ARCHIVED: ['Unpublished', 'bg-slate-200 text-slate-700'], DRAFT: ['Draft, never published', 'bg-amber-100 text-amber-800'] };

export default function LegalAdmin() {
  const toast = useToast(); const dlg = useDialogs();
  const [pages, setPages] = useState<any[] | null>(null); const [cons, setCons] = useState<any>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState('');
  const load = () => adminFetch('/admin/pages').then(async (r) => (r.ok ? setPages(await r.json()) : setErr(await describeError(r))));
  useEffect(() => { load(); adminFetch('/admin/consents/summary').then(async (r) => r.ok && setCons(await r.json())); }, []);
  const act = async (key: string, what: 'publish' | 'unpublish') => {
    if (what === 'unpublish' && !(await dlg.confirm({ title: 'Unpublish this page?', message: 'Visitors will no longer be able to open it, and the footer link will lead to a “not found” page until you publish again.', confirmLabel: 'Unpublish', danger: true }))) return;
    setBusy(key + what);
    const r = await adminFetch(`/admin/pages/${key}/${what}`, { method: 'POST' }); setBusy('');
    if (r.ok) { toast.success(what === 'publish' ? 'Published' : 'Unpublished'); load(); } else toast.error(await describeError(r));
  };
  const pct = (n: number) => (cons?.visitors ? Math.round((n / cons.visitors) * 100) : 0);
  return (
    <div className="space-y-4">
      <PageBar title="Legal & privacy" help="Edit your policies, publish or unpublish them, and see what cookie choices visitors have made." />
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><strong>Important:</strong> the starter wording is a template, not legal advice. Have each policy reviewed by a legal adviser who knows UAE data-protection law (Federal Decree-Law No. 45 of 2021) before you publish it.</p>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!pages && !err && <SkelRows rows={5} />}
      {pages && (
        <div className="a-card !p-0 divide-y divide-slate-100">
          {LEGAL.map(([key, name, desc]) => {
            const p = pages.find((x) => x.key === key); const st = p ? STATE[p.status] ?? [p.status, ''] : ['Not created yet', 'bg-red-100 text-red-700'];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-[220px] flex-1"><p className="font-bold">{name}</p><p className="text-sm text-slate-500">{desc}</p>{p && <p className="mt-1 text-xs text-slate-400">Version {p.latestVersion} · edited {new Date(p.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>}</div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st[1]}`}>{st[0]}</span>
                {p && (<div className="flex flex-wrap gap-1.5">
                  <Link className="a-btn a-btn-sm" href={`/admin/pages/${key}`}><Pencil className="h-3.5 w-3.5" />Edit & versions</Link>
                  {p.status === 'PUBLISHED' && <a className="a-btn a-btn-sm" href={`/en/${key}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" />View</a>}
                  {p.status === 'PUBLISHED' ? <button className="a-btn a-btn-sm" disabled={!!busy} onClick={() => act(key, 'unpublish')}><EyeOff className="h-3.5 w-3.5" />Unpublish</button> : <button className="a-btn a-btn-sm a-btn-primary" disabled={!!busy} onClick={() => act(key, 'publish')}><Rocket className="h-3.5 w-3.5" />Publish</button>}
                </div>)}
              </div>
            );
          })}
        </div>
      )}
      <div className="a-card">
        <h2 className="a-h2">Cookie consent (last 30 days)</h2>
        {!cons ? <SkelCard lines={2} /> : (<>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">{[['Visitors who chose', cons.visitors, ''], ['Accepted analytics', cons.analytics, `${pct(cons.analytics)}%`], ['Accepted marketing', cons.marketing, `${pct(cons.marketing)}%`], ['Necessary only', cons.necessaryOnly, `${pct(cons.necessaryOnly)}%`]].map(([l, v, s]) => <div key={l as string} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{l}</p><p className="text-2xl font-bold">{v}<span className="ms-1 text-sm font-medium text-slate-500">{s}</span></p></div>)}</div>
          <div className="mt-4 overflow-x-auto"><table className="a-table text-sm"><thead><tr><th className="p-2">When</th><th className="p-2">Visitor (anonymous ID)</th><th className="p-2">Analytics</th><th className="p-2">Marketing</th><th className="p-2">Banner version</th></tr></thead>
            <tbody>{cons.recent.map((r: any, k: number) => <tr key={k} className="border-t"><td className="whitespace-nowrap p-2">{new Date(r.at).toLocaleString()}</td><td className="p-2 font-mono text-xs">{String(r.cid).slice(0, 8)}…</td><td className="p-2">{r.analytics ? '✓' : '—'}</td><td className="p-2">{r.marketing ? '✓' : '—'}</td><td className="p-2">{r.version}</td></tr>)}{!cons.recent.length && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No choices recorded yet.</td></tr>}</tbody></table></div>
          <p className="mt-3 text-xs text-slate-500">Each choice is stored with an anonymous random ID, never a name or email, so you can show when consent was given. Change banner wording and categories in <Link className="underline" href="/admin/settings">Settings → Cookie banner</Link>. Raising its “version” asks everyone to choose again.</p>
        </>)}
      </div>
    </div>
  );
}

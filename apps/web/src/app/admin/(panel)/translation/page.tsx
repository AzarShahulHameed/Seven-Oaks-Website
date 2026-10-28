'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { Help } from '@/components/admin/Help';
import { SkelCard, SkelRows, SkelTiles } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

const n = (v: number) => v.toLocaleString();
type Q = { monthlyLimit: number; freeChars: number; pricePerMillion: number; blockAtLimit: boolean };

export default function TranslationUsage() {
  const toast = useToast();
  const [d, setD] = useState<any>(null); const [err, setErr] = useState(''); const [q, setQ] = useState<Q | null>(null); const [busy, setBusy] = useState(false);
  const load = () => adminFetch('/admin/translation/usage').then(async (r) => { if (r.ok) { const j = await r.json(); setD(j); setQ(j.quota); } else setErr(await describeError(r)); });
  useEffect(() => { load(); }, []);
  const dirty = !!(d && q && JSON.stringify(q) !== JSON.stringify(d.quota)); useDirtyFlag(dirty);
  const save = async () => {
    if (!q) return; setBusy(true);
    const r = await adminFetch('/admin/translation/quota', { method: 'PUT', body: JSON.stringify(q) }); setBusy(false);
    if (r.ok) { toast.success('Limits saved'); load(); } else toast.error(await describeError(r));
  };
  if (err) return <p className="a-err" role="alert">{err}</p>;
  if (!d || !q) return <div className="space-y-4"><SkelTiles /><SkelCard lines={4} /><SkelRows rows={5} /></div>;
  const pct = d.month.pct as number; const tone = pct >= 100 ? '#d92d20' : pct >= 90 ? '#f04438' : pct >= 80 ? '#f79009' : '#12b76a';
  const max = Math.max(1, ...d.daily.map((x: any) => x.chars));
  return (
    <div className="space-y-4">
      <PageBar title="Translation usage" help="Google Translate is billed by characters. This shows what you have used this month, what is left and the estimated cost. You are warned at 80%, 90% and 100%." />
      {pct >= 80 && <div role="alert" className="flex items-start gap-3 rounded-xl p-4 text-sm font-semibold" style={{ background: pct >= 100 ? '#fef3f2' : '#fffaeb', color: pct >= 100 ? '#b42318' : '#93370d' }}><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{pct >= 100 ? `You have reached your monthly limit (${n(q.monthlyLimit)} characters).${q.blockAtLimit ? ' Translation is paused until next month or until you raise the limit.' : ' Translation still works, but extra characters may cost money.'}` : `You have used ${pct}% of this month’s limit. ${n(d.month.remaining)} characters remain.`}</div>}

      <div className="a-card">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-1"><p className="text-3xl font-bold">{n(d.month.chars)}<span className="ms-2 text-base font-medium text-slate-500">of {n(q.monthlyLimit)} characters this month</span></p><p className="text-sm text-slate-500">{n(d.month.remaining)} remaining</p></div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly usage"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(1.5, Math.min(100, pct))}%`, background: tone }} /></div>
        <div className="relative mt-1 h-4 text-[11px] text-slate-400">{[80, 90, 100].map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t === 100 ? 98 : t}%` }}>{t}%</span>)}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[['Today', n(d.today.chars), `${n(d.today.requests)} requests`], ['Last 7 days', n(d.week.chars), `${n(d.week.requests)} requests`], ['This month', n(d.month.chars), `${n(d.month.requests)} requests`], ['Estimated cost this month', `$${d.month.estimatedCost.toFixed(2)}`, `after ${n(q.freeChars)} free characters`]].map(([l, v, s]) => <div key={l} className="a-card"><p className="text-xs font-semibold text-slate-500">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p><p className="text-xs text-slate-500">{s}</p></div>)}
      </div>

      <div className="a-card">
        <h2 className="a-h2">Daily usage (last 30 days)</h2>
        {d.daily.length ? (
          <div className="mt-3 flex h-40 items-end gap-1" role="img" aria-label="Characters translated per day">
            {d.daily.map((x: any) => <div key={x.day} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t bg-emerald-600/80 transition group-hover:bg-emerald-700" style={{ height: `${Math.max(3, (x.chars / max) * 100)}%` }} /><span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[11px] text-white group-hover:block">{x.day}: {n(x.chars)}</span></div>)}
          </div>
        ) : <p className="py-8 text-center text-sm text-slate-500">No translations yet.</p>}
      </div>

      <div className="a-card">
        <h2 className="a-h2">Limits & alerts<Help text="Set these from your Google Cloud billing. The percentages are measured against “Monthly limit”." align="left" /></h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label><span className="a-label">Monthly limit (characters)</span><input type="number" min={1000} className="a-input" value={q.monthlyLimit} onChange={(e) => setQ({ ...q, monthlyLimit: Number(e.target.value) })} /></label>
          <label><span className="a-label">Free characters per month</span><input type="number" min={0} className="a-input" value={q.freeChars} onChange={(e) => setQ({ ...q, freeChars: Number(e.target.value) })} /></label>
          <label><span className="a-label">Price per 1 million characters ($)</span><input type="number" min={0} step="0.5" className="a-input" value={q.pricePerMillion} onChange={(e) => setQ({ ...q, pricePerMillion: Number(e.target.value) })} /></label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={q.blockAtLimit} onChange={(e) => setQ({ ...q, blockAtLimit: e.target.checked })} />Stop translating when the limit is reached</label>
        <p className="mt-1 text-xs text-slate-500">Alerts appear in the notification bell at 80%, 90% and 100%, and once per level each month. Figures count only what this website sent to Google, so check Google Cloud for the official bill.</p>
        <div className="mt-3"><button className="a-btn a-btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save limits'}</button></div>
      </div>

      <div className="a-card !p-0 overflow-x-auto">
        <h2 className="a-h2 p-4 !mb-0">Recent translations</h2>
        <table className="a-table"><thead><tr><th className="p-2">When</th><th className="p-2">Who</th><th className="p-2">Characters</th><th className="p-2">Texts</th><th className="p-2">Result</th></tr></thead>
          <tbody>{d.history.map((h: any) => <tr key={h.id} className="border-t"><td className="whitespace-nowrap p-2">{new Date(h.at).toLocaleString()}</td><td className="p-2">{h.user ?? '—'}</td><td className="p-2">{n(h.chars)}</td><td className="p-2">{h.texts}</td><td className="p-2">{h.ok ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />OK</span> : <span className="inline-flex items-center gap-1 text-red-600" title={h.error}><XCircle className="h-4 w-4" />Failed{h.error ? `: ${h.error}` : ''}</span>}</td></tr>)}
            {!d.history.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nothing yet.</td></tr>}</tbody></table>
      </div>
    </div>
  );
}

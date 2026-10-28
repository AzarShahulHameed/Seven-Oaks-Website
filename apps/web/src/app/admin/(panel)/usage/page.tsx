'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Gauge, KeyRound, Mail, Map as MapIcon } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { Help } from '@/components/admin/Help';
import { SkelCard } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

type P = { label: string; unit: string; freeMonthly: number; dailyLimit: number; pricePer1000: number; note: string; used: number; today: number; pct: number; remaining: number; estimatedCost: number; daily: { day: string; count: number }[] };
const tone = (pct: number) => (pct >= 100 ? { bar: '#d92d20', badge: 'a-badge a-badge-bad', word: 'Limit reached' } : pct >= 90 ? { bar: '#f04438', badge: 'a-badge a-badge-bad', word: 'Almost out' } : pct >= 80 ? { bar: '#f79009', badge: 'a-badge a-badge-warn', word: 'Getting high' } : { bar: '#2f6b3a', badge: 'a-badge a-badge-ok', word: 'On track' });

function Meter({ p, k, icon: Icon, onSaved }: { p: P; k: 'maps' | 'email'; icon: any; onSaved: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ freeMonthly: p.freeMonthly, dailyLimit: p.dailyLimit, pricePer1000: p.pricePer1000 });
  const dirty = v.freeMonthly !== p.freeMonthly || v.dailyLimit !== p.dailyLimit || v.pricePer1000 !== p.pricePer1000;
  useDirtyFlag(dirty);
  const t = tone(p.pct); const max = Math.max(1, ...p.daily.map((d) => d.count));
  const save = async () => {
    const r = await adminFetch('/admin/usage/limits', { method: 'PUT', ...jsonBody({ [k]: v, ...(k === 'maps' ? {} : {}) }) });
    if (r.ok) { toast.success('Allowance saved'); onSaved(); } else toast.error(await describeError(r));
  };
  return (
    <section className="a-card space-y-3">
      <div className="flex flex-wrap items-center gap-2"><h2 className="!mb-0 flex items-center gap-2"><Icon className="h-4 w-4" />{p.label}</h2><span className={t.badge}>{t.word}</span><span className="ms-auto text-sm text-slate-500">this month</span></div>
      <div><div className="flex items-end justify-between gap-2"><p className="text-3xl font-extrabold tabular-nums">{p.used.toLocaleString()}<span className="ms-1 text-base font-semibold text-slate-500">of {p.freeMonthly.toLocaleString()} {p.unit}</span></p><p className="text-lg font-bold tabular-nums">{p.pct}%</p></div>
        <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(p.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.label} used`}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, p.pct)}%`, background: t.bar }} />{[80, 90].map((m) => <span key={m} className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${m}%` }} />)}</div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>0</span><span>80%</span><span>90%</span><span>100%</span></div></div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-slate-500">Today</dt><dd className="font-bold tabular-nums">{p.today.toLocaleString()}{p.dailyLimit ? ` / ${p.dailyLimit}` : ''}</dd></div>
        <div><dt className="text-slate-500">Left in free allowance</dt><dd className="font-bold tabular-nums">{p.remaining.toLocaleString()}</dd></div>
        <div><dt className="text-slate-500">Estimated extra cost</dt><dd className="font-bold tabular-nums">{p.pricePer1000 ? `US$ ${p.estimatedCost.toFixed(2)}` : 'Fixed plan'}</dd></div>
        <div><dt className="text-slate-500">Alerts</dt><dd className="font-bold">80%, 90%, 100%</dd></div>
      </dl>
      <div><p className="a-label">Last 30 days</p><div className="flex h-16 items-end gap-0.5" role="img" aria-label="Daily usage, last 30 days">{p.daily.map((d) => <div key={d.day} title={`${d.day}: ${d.count}`} className="min-h-[2px] flex-1 rounded-t bg-[#2f6b3a]/70 hover:bg-[#2f6b3a]" style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }} />)}</div></div>
      <details className="rounded-xl bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-bold">Change the allowance</summary>
        <p className="mt-2 text-xs text-slate-600">{p.note}</p>
        <div className="a-cols mt-2"><div className="a-cols-grid a-cols-grid-3">
          <label><span className="a-label">Free per month<Help text="The number your plan includes before it costs money or stops. Alerts are based on this." align="left" /></span><input type="number" min={0} className="a-input" value={v.freeMonthly} onChange={(e) => setV({ ...v, freeMonthly: Math.max(0, Number(e.target.value) || 0) })} /></label>
          <label><span className="a-label">Daily limit (0 = none)</span><input type="number" min={0} className="a-input" value={v.dailyLimit} onChange={(e) => setV({ ...v, dailyLimit: Math.max(0, Number(e.target.value) || 0) })} /></label>
          <label><span className="a-label">Price per 1,000 after the free part (US$)</span><input type="number" min={0} step="0.01" className="a-input" value={v.pricePer1000} onChange={(e) => setV({ ...v, pricePer1000: Math.max(0, Number(e.target.value) || 0) })} /></label>
        </div></div>
        <button className="a-btn a-btn-primary mt-3" disabled={!dirty} onClick={save}>Save allowance</button></details>
    </section>
  );
}

export default function UsagePage() {
  const [d, setD] = useState<{ maps: P; email: P } | null>(null); const [err, setErr] = useState('');
  const [tr, setTr] = useState<any>(null);
  const load = useCallback(() => adminFetch('/admin/usage').then(async (r) => { if (r.ok) { setD(await r.json()); setErr(''); } else setErr(await describeError(r)); }), []);
  useEffect(() => { load(); adminFetch('/admin/translation/usage').then(async (r) => r.ok && setTr(await r.json())); }, [load]);
  return (
    <div className="space-y-4">
      <PageBar title="API usage & billing" help="How much of each paid or limited service you have used this month, so there are no surprise bills." />
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">These meters are counted by your own website, so they are a close guide, not an invoice. Google’s and Resend’s own billing pages are always the final word: <a className="underline" href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer">Google Cloud Billing</a> · <a className="underline" href="https://resend.com/settings/usage" target="_blank" rel="noopener noreferrer">Resend usage</a>. You are notified (the bell) at 80%, 90% and 100%.</p>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!d && !err && <><SkelCard lines={5} /><SkelCard lines={5} /></>}
      {d && <div className="grid gap-4 xl:grid-cols-2"><Meter p={d.maps} k="maps" icon={MapIcon} onSaved={load} /><Meter p={d.email} k="email" icon={Mail} onSaved={load} /></div>}
      {tr && (() => { const pct = tr.month?.pct ?? 0; const t = tone(pct); return (
        <section className="a-card"><div className="flex flex-wrap items-center gap-2"><h2 className="!mb-0 flex items-center gap-2"><Gauge className="h-4 w-4" />Google Translate</h2><span className={t.badge}>{t.word}</span><Link href="/admin/translation" className="a-btn a-btn-sm ms-auto">Open translation usage</Link></div>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{(tr.month?.chars ?? 0).toLocaleString()}<span className="ms-1 text-base font-semibold text-slate-500">of {tr.quota?.monthlyLimit?.toLocaleString()} characters ({pct}%)</span></p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: t.bar }} /></div></section>); })()}

      <section className="a-card space-y-3">
        <h2><KeyRound className="h-4 w-4" />One Google key for everything? Please don’t</h2>
        <p className="text-sm text-slate-700">In Google Cloud you <i>can</i> switch on many APIs for one key, but it is safer to use <b>one key for each job</b>:</p>
        <div className="a-cols"><div className="a-cols-grid">
          <div className="rounded-xl border border-slate-200 p-3 text-sm"><b>Browser key (the map)</b><ul className="ms-4 mt-1 list-disc text-slate-700"><li>Goes in Settings → Map. Visitors’ browsers can see it.</li><li>Enable only <b>Maps JavaScript API</b>.</li><li>Restrict it to <b>HTTP referrers</b>: your website address(es).</li></ul></div>
          <div className="rounded-xl border border-slate-200 p-3 text-sm"><b>Server key (translation)</b><ul className="ms-4 mt-1 list-disc text-slate-700"><li>Goes in Integrations. Stored encrypted; never shown to visitors.</li><li>Enable only <b>Cloud Translation API</b>.</li><li>Restrict it to that API (and to your server’s IP addresses if you can).</li></ul></div>
        </div></div>
        <p className="text-sm text-slate-700"><b>What goes wrong with one combined key:</b> the map key is public, so anyone can copy it from your page. If that same key also allows Translation, a stranger could use your translation quota and you would pay the bill. A restricted browser key can do nothing except load your map. Separate keys also let you see, limit and rotate each cost on its own.</p>
        <p className="text-xs text-slate-500">A key was pasted into a screenshot while we were building this. If you ever share a key in a chat or screenshot, treat it as public: restrict it as above, or delete it in Google Cloud and create a new one.</p>
      </section>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Help } from '@/components/admin/Help';
import { VisitorsPanel } from '@/components/admin/VisitorsPanel';
import { adminFetch, describeError } from '@/lib/admin-api';

type Row = { k: string; n: number };
type Stats = {
  days: number; views: number; visitors: number; liveVisitors: number; livePages: { path: string; n: number }[]; avgSessionSec: number; pagesPerVisit: number;
  series: { day: string; views: number; visitors: number }[]; pages: { path: string; views: number; visitors: number; avg: number }[];
  sources: Row[]; referrers: Row[]; devices: Row[]; countries: Row[]; locales: Row[];
};
const RANGES: [number, string][] = [[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days']];
const mmss = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`);
const SOURCE_NAME: Record<string, string> = { direct: 'Direct (typed or bookmarked)', search: 'Search engines', social: 'Social media', referral: 'Other websites' };
const DEVICE_NAME: Record<string, string> = { desktop: 'Computer', mobile: 'Phone', tablet: 'Tablet' };
const LANG_NAME: Record<string, string> = { en: 'English', ar: 'العربية (Arabic)' };

function Bars({ rows, label, empty = 'No data yet' }: { rows: Row[]; label?: (k: string) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n)); const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.k} className="text-sm">
          <div className="mb-0.5 flex justify-between gap-2"><span className="truncate">{label ? label(r.k) : r.k}</span><span className="shrink-0 tabular-nums text-slate-600">{r.n.toLocaleString()} <span className="text-slate-400">({Math.round((r.n / total) * 100)}%)</span></span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2f6b3a] transition-all duration-700" style={{ width: `${(r.n / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Chart({ series, days }: { series: Stats['series']; days: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = useMemo(() => {
    const map = new Map(series.map((s) => [s.day, s]));
    const out: { day: string; views: number; visitors: number }[] = [];
    const n = days === 1 ? 1 : days;
    for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); const k = d.toLocaleDateString('en-CA'); out.push(map.get(k) ?? { day: k, views: 0, visitors: 0 }); }
    return out;
  }, [series, days]);
  const W = 640, H = 200, P = { l: 34, r: 10, t: 12, b: 24 };
  const max = Math.max(4, ...pts.map((p) => p.views)); const top = Math.ceil(max / 4) * 4;
  const x = (i: number) => P.l + (pts.length === 1 ? (W - P.l - P.r) / 2 : (i / (pts.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - v / top) * (H - P.t - P.b);
  const line = (k: 'views' | 'visitors') => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const area = `${line('views')} L${x(pts.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const h = hover !== null ? pts[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Page views and visitors per day" onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (pts.length - 1))))); }}>
        {[0, 1, 2, 3, 4].map((g) => <g key={g}><line x1={P.l} x2={W - P.r} y1={y((top / 4) * g)} y2={y((top / 4) * g)} stroke="#e5e9e3" /><text x={P.l - 6} y={y((top / 4) * g) + 4} fontSize="10" textAnchor="end" fill="#7a867d">{Math.round((top / 4) * g)}</text></g>)}
        <path d={area} fill="#2f6b3a" opacity=".12" />
        <path d={line('views')} fill="none" stroke="#2f6b3a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={line('visitors')} fill="none" stroke="#c9a227" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="5 4" />
        {pts.map((p, i) => (i % Math.ceil(pts.length / 7) === 0 || i === pts.length - 1) && <text key={p.day} x={x(i)} y={H - 6} fontSize="10" textAnchor={i === pts.length - 1 && pts.length > 1 ? 'end' : i === 0 && pts.length > 1 ? 'start' : 'middle'} fill="#7a867d">{new Date(p.day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</text>)}
        {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#94a39a" /><circle cx={x(hover)} cy={y(pts[hover].views)} r="4" fill="#2f6b3a" /><circle cx={x(hover)} cy={y(pts[hover].visitors)} r="4" fill="#c9a227" /></>}
      </svg>
      {h && <div className="pointer-events-none absolute top-1 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg" style={{ left: `${Math.min(75, Math.max(0, (x(hover!) / W) * 100 - 8))}%` }}><b>{new Date(h.day + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</b><br />{h.views} page views · {h.visitors} visitors</div>}
      <div className="mt-1 flex gap-4 text-xs text-slate-600"><span><i className="me-1 inline-block h-2 w-4 rounded bg-[#2f6b3a]" />Page views</span><span><i className="me-1 inline-block h-0 w-4 border-t-2 border-dashed border-[#c9a227] align-middle" />Visitors</span></div>
    </div>
  );
}

const PageSkeletonLite = () => <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <div key={n} className="a-card"><div className="so-shimmer h-4 w-20 rounded" /><div className="so-shimmer mt-3 h-8 w-24 rounded" /></div>)}</div>;

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [cfg, setCfg] = useState<{ ga: boolean; gtm: boolean; gsc: boolean } | null>(null);
  const [tab, setTab] = useState<'overview' | 'visitors'>('overview');
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const load = () => adminFetch(`/admin/analytics?days=${days}&tz=${encodeURIComponent(tz)}`).then(async (r) => { if (r.ok) { setS(await r.json()); setErr(''); } else setErr(await describeError(r)); });
  useEffect(() => { setS(null); load(); /* eslint-disable-next-line */ }, [days]);
  useEffect(() => { const t = setInterval(load, 30_000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [days]);
  useEffect(() => { adminFetch('/admin/settings').then(async (r) => { if (!r.ok) return; const rows: any[] = await r.json(); const a = rows.find((x) => x.key === 'public.analytics')?.value ?? {}; setCfg({ ga: !!a.gaId, gtm: !!a.gtmId, gsc: !!a.searchConsole }); }); }, []);
  const country = useMemo(() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } }, []);

  return (
    <div className="space-y-6">
      <PageBar title="Analytics" help="Who visits your website, what they look at and where they come from.">
        <div className="flex rounded-xl border border-slate-300 bg-white p-0.5" role="group" aria-label="Time range">
          {RANGES.map(([d, l]) => <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${days === d ? 'bg-[#1f4d2b] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{l}</button>)}
        </div>
      </PageBar>
      <div className="flex gap-2" role="tablist">{([['overview', 'Overview'], ['visitors', 'Visitors (IP & email)']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`a-btn ${tab === k ? 'a-btn-primary' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'visitors' && <VisitorsPanel />}
      {tab === 'overview' && err && <p className="a-err" role="alert">{err}</p>}
      {tab === 'overview' && !s && !err && <PageSkeletonLite />}
      {tab === 'overview' && s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="a-card"><p className="a-label">Live now<Help text="People who had a page of your site open in the last 5 minutes. Updates every 30 seconds." align="left" /></p><p className="flex items-center gap-2 text-3xl font-extrabold"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" /></span>{s.liveVisitors}</p></div>
            <div className="a-card"><p className="a-label">Visitors<Help text="Different people (browser tabs) who visited in this period. A person who comes back in a new tab counts again." align="left" /></p><p className="text-3xl font-extrabold tabular-nums">{s.visitors.toLocaleString()}</p></div>
            <div className="a-card"><p className="a-label">Page views<Help text="Every page opened. One visitor looking at three pages makes three page views." align="left" /></p><p className="text-3xl font-extrabold tabular-nums">{s.views.toLocaleString()}</p><p className="text-xs text-slate-500">{s.pagesPerVisit || 0} pages per visit</p></div>
            <div className="a-card"><p className="a-label">Time on site<Help text="Average time a visitor spends on the site per visit, counting only while the page is visible." align="left" /></p><p className="text-3xl font-extrabold tabular-nums">{mmss(s.avgSessionSec)}</p></div>
          </div>

          <div className="a-card"><h2>Visits over time</h2><div className="mt-3"><Chart series={s.series} days={s.days} /></div>{s.views === 0 && <p className="a-hint mt-2">No visits recorded yet. They appear within seconds of someone opening your website (not the admin).</p>}</div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="a-card"><h2>Most viewed pages</h2>
              {s.pages.length ? <table className="a-table mt-2"><thead><tr><th>Page</th><th className="text-end">Views</th><th className="text-end">Visitors</th><th className="text-end">Avg time</th></tr></thead><tbody>{s.pages.map((p) => <tr key={p.path}><td className="max-w-[14rem] truncate" dir="ltr" title={p.path}>{p.path}</td><td className="text-end tabular-nums">{p.views}</td><td className="text-end tabular-nums">{p.visitors}</td><td className="text-end tabular-nums">{p.avg ? mmss(p.avg) : '–'}</td></tr>)}</tbody></table> : <p className="mt-2 text-sm text-slate-500">No data yet</p>}
            </div>
            <div className="a-card"><h2>Live: pages being viewed now</h2>
              {s.livePages.length ? <ul className="mt-2 space-y-1 text-sm">{s.livePages.map((p) => <li key={p.path} className="flex justify-between" dir="ltr"><span>{p.path}</span><b>{p.n}</b></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Nobody is on the site right now.</p>}
            </div>
            <div className="a-card"><h2>Where visitors come from<Help text="Search engines = Google, Bing and similar. Social = Facebook, Instagram, WhatsApp and similar. Direct = typed the address, used a bookmark or the app hid the source." align="left" /></h2><div className="mt-3"><Bars rows={s.sources} label={(k) => SOURCE_NAME[k] ?? k} /></div>
              {s.referrers.length > 0 && <><h3 className="mb-2 mt-5 text-sm font-bold text-slate-600">Top referring sites</h3><Bars rows={s.referrers} /></>}</div>
            <div className="a-card"><h2>Devices</h2><div className="mt-3"><Bars rows={s.devices} label={(k) => DEVICE_NAME[k] ?? k} /></div>
              <h3 className="mb-2 mt-5 text-sm font-bold text-slate-600">Language of the page</h3><Bars rows={s.locales} label={(k) => LANG_NAME[k] ?? k} /></div>
            <div className="a-card lg:col-span-2"><h2>Countries<Help text="Taken from your hosting provider when it supplies the visitor’s country (Vercel, Cloudflare). Only the country is recorded, never the IP address." align="left" /></h2><div className="mt-3"><Bars rows={s.countries} label={(k) => country?.of(k) ?? k} empty="No country data yet. It appears once your hosting provider supplies it (Vercel does automatically)." /></div></div>
          </div>
        </>
      )}

      {tab === 'overview' && <details className="a-card"><summary className="cursor-pointer text-base font-bold">Optional: Google Analytics &amp; Search Console <span className="a-badge ms-2">not needed</span></summary>
      <div className="mt-3 space-y-3">
        <h2>Google Analytics &amp; Search Console<Help text="Optional extras. They give Google’s own, deeper reports (and, for Search Console, which searches bring people to you)." align="left" /></h2>
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          <li className="rounded-xl border border-slate-200 p-3"><p className="font-bold">Google Analytics 4 {cfg ? (cfg.ga || cfg.gtm ? <span className="a-badge a-badge-ok">Connected</span> : <span className="a-badge a-badge-warn">Not connected</span>) : null}</p>
            <p className="mt-1 text-slate-600">Add your measurement ID (G-…) in Settings → Analytics. Visitors who accept cookies are then also counted by Google, and you can open the full reports in Google Analytics.</p>
            <div className="mt-2 flex flex-wrap gap-2"><Link href="/admin/settings#public.analytics" className="a-btn a-btn-sm">Open settings</Link><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="a-btn a-btn-sm"><ExternalLink className="h-3.5 w-3.5" />Google Analytics</a></div></li>
          <li className="rounded-xl border border-slate-200 p-3"><p className="font-bold">Google Search Console {cfg ? (cfg.gsc ? <span className="a-badge a-badge-ok">Verification added</span> : <span className="a-badge a-badge-warn">Not verified</span>) : null}</p>
            <p className="mt-1 text-slate-600">1) Add your site in Search Console and choose “HTML tag”. 2) Paste the code in Settings → Analytics. 3) Press Verify in Google. 4) Submit your sitemap: <code dir="ltr">/sitemap.xml</code>.</p>
            <div className="mt-2 flex flex-wrap gap-2"><Link href="/admin/settings#public.analytics" className="a-btn a-btn-sm">Open settings</Link><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="a-btn a-btn-sm"><ExternalLink className="h-3.5 w-3.5" />Search Console</a></div></li>
        </ul>
        <p className="a-hint">Your website already collects its own statistics, so you do not need Google. The overview above is anonymous. Only people who accept analytics cookies appear under Visitors, with their IP address. Visitors who set “Do Not Track” are not counted, and neither are search-engine robots.</p>
      </div></details>}
    </div>
  );
}

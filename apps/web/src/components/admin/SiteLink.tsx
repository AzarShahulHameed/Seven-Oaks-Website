'use client';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react';
import { adminFetch, describeError } from '@/lib/admin-api';
import { useToast } from './Toast';

/** Shows whether the API can tell the live website to refresh after you save. When this is broken, saved changes only appear after the site's cache expires (up to 5 minutes). */
export function SiteLinkStatus({ compact = false }: { compact?: boolean }) {
  const toast = useToast();
  const [s, setS] = useState<{ ok: boolean; reason: string | null; webUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const check = useCallback(async () => { setBusy(true); const r = await adminFetch('/admin/site-link'); setBusy(false); if (r.ok) setS(await r.json()); }, []);
  useEffect(() => { check(); }, [check]);
  const refresh = async () => {
    setBusy(true); const r = await adminFetch('/admin/site-refresh', { method: 'POST' }); setBusy(false);
    if (!r.ok) return toast.error(await describeError(r));
    const j = await r.json(); if (j.ok) toast.success('The website was told to refresh. Reload the public page to see the latest.'); else toast.warn(j.reason ?? 'The website could not be refreshed.'); check();
  };
  if (!s) return null;
  if (s.ok && compact) return null;
  return (
    <div className={`flex flex-wrap items-start gap-3 rounded-xl border p-3 text-sm ${s.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`} role={s.ok ? 'status' : 'alert'}>
      {s.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{s.ok ? 'Live website connected' : 'The live website cannot be refreshed'}</p>
        <p className="text-slate-700">{s.ok ? 'Changes you save go live within a few seconds.' : <>Your changes are saved, but the public website keeps showing the old version for up to 5 minutes. <b>{s.reason}</b></>}</p>
        {!s.ok && <p className="mt-1 text-xs text-slate-600">Fix: in your <code>.env</code> (local) or on Render and Vercel, <code>REVALIDATE_SECRET</code> must be the same text on both the API and the website, and <code>WEB_URL</code> on the API must be the website’s address ({s.webUrl}). Restart both after changing it.</p>}
      </div>
      <div className="flex gap-2"><button className="a-btn a-btn-sm" disabled={busy} onClick={check}>Check again</button><button className="a-btn a-btn-sm" disabled={busy} onClick={refresh}><RefreshCw className="h-3.5 w-3.5" />Refresh website now</button></div>
    </div>
  );
}

type Result = { ok: boolean; reason?: 'auth' | 'network' | 'timeout' | 'reload' };
function testMapsKey(key: string): Promise<Result> {
  const w = window as any;
  return new Promise((resolve) => {
    if (w.google?.maps) return resolve({ ok: false, reason: 'reload' });
    let done = false; const cb = `__soMapTest${Date.now()}`;
    const finish = (r: Result) => { if (done) return; done = true; delete w[cb]; resolve(r); };
    w.gm_authFailure = () => finish({ ok: false, reason: 'auth' });
    w[cb] = () => { try { const el = document.createElement('div'); el.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:200px'; document.body.appendChild(el); new w.google.maps.Map(el, { center: { lat: 25.3, lng: 55.4 }, zoom: 5 }); setTimeout(() => { finish({ ok: true }); el.remove(); }, 3000); } catch { finish({ ok: false, reason: 'auth' }); } };
    const s = document.createElement('script'); s.async = true; s.onerror = () => finish({ ok: false, reason: 'network' });
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&loading=async&v=weekly`; document.head.appendChild(s);
    setTimeout(() => finish({ ok: false, reason: 'timeout' }), 15000);
  });
}

/** Loads Google Maps with the key typed above and says in plain words whether Google accepts it. */
export function MapKeyTest({ apiKey }: { apiKey: string }) {
  const [busy, setBusy] = useState(false); const [r, setR] = useState<Result | null>(null);
  const valid = /^AIza[0-9A-Za-z_-]{30,60}$/.test(apiKey);
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2"><button type="button" className="a-btn a-btn-sm" disabled={busy || !valid} onClick={async () => { setBusy(true); setR(null); setR(await testMapsKey(apiKey)); setBusy(false); }}>{busy ? 'Asking Google…' : 'Test this key with Google'}</button><span className="text-xs text-slate-500">{valid ? 'Uses the key currently typed in the box (even if not saved yet).' : 'Type a key that starts with AIza first.'}</span></div>
      {r?.ok && <p className="mt-2 font-semibold text-emerald-700">✓ Google accepted this key. Press Save below. If the live site still shows a plain map, use “Refresh website now” at the top of this page.</p>}
      {r && !r.ok && r.reason === 'reload' && <p className="mt-2 text-amber-800">Google Maps is already loaded on this page. Reload the page (F5), then test the new key.</p>}
      {r && !r.ok && r.reason === 'network' && <p className="mt-2 text-red-700">The browser could not reach Google Maps. Check your internet connection or an ad blocker.</p>}
      {r && !r.ok && r.reason === 'timeout' && <p className="mt-2 text-red-700">Google did not answer in time. Try again.</p>}
      {r && !r.ok && r.reason === 'auth' && (
        <div className="mt-2 text-red-700"><p className="font-semibold">Google rejected this key. The usual reasons, in order:</p>
          <ol className="ms-5 mt-1 list-decimal space-y-0.5 text-slate-700">
            <li>The <b>Maps JavaScript API</b> is not enabled. Google Cloud → APIs &amp; Services → Library → “Maps JavaScript API” → Enable.</li>
            <li><b>Billing is not switched on</b> for that Google Cloud project. Maps needs a billing account, even though the first 10,000 map loads a month are free.</li>
            <li>The key is <b>restricted to websites</b> and this address is not in the list. Under Application restrictions → HTTP referrers add <code dir="ltr">{typeof location !== 'undefined' ? `${location.origin}/*` : ''}</code> and your real domain, such as <code dir="ltr">https://www.yourschool.ae/*</code>.</li>
            <li>The key was copied incompletely (it should be about 39 characters).</li>
          </ol><p className="mt-1 text-xs text-slate-600">Changes in Google Cloud can take up to 5 minutes to apply.</p></div>
      )}
    </div>
  );
}

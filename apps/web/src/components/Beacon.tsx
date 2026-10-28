'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { forgetVisitorId, knownVisitorId } from '@/lib/visitor';

const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-6); };
const post = (body: object) => {
  const data = JSON.stringify(body);
  try { if (navigator.sendBeacon?.('/api/public/collect', new Blob([data], { type: 'application/json' }))) return; } catch { /* fall through */ }
  fetch('/api/public/collect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: data, keepalive: true }).catch(() => undefined);
};

/** Visit counter for Admin → Analytics. By default it is anonymous: page address, a random per-tab id, time on page. Only when the visitor has accepted analytics cookies does it also send a visitor id, which lets the server keep the IP address and, if the person later fills in a form, link their email. Honors "Do Not Track". */
export function Beacon() {
  const path = usePathname();
  const cur = useRef<{ id: string; shown: number; since: number | null } | null>(null);

  const flush = () => {
    const c = cur.current; if (!c) return;
    const total = c.shown + (c.since ? Date.now() - c.since : 0);
    if (total >= 1000) post({ t: 'p', id: c.id, dur: Math.min(14_400, Math.round(total / 1000)) });
  };

  useEffect(() => {
    if (navigator.doNotTrack === '1' || !path) return;
    flush();
    let sid = '', first = false;
    try { sid = sessionStorage.getItem('so_sid') ?? ''; if (!sid) { sid = rid(); sessionStorage.setItem('so_sid', sid); first = true; } } catch { sid = rid(); first = true; }
    const id = rid();
    cur.current = { id, shown: 0, since: document.visibilityState === 'visible' ? Date.now() : null };
    const vid = knownVisitorId(true);
    post({ t: 'v', id, sid, path, ...(vid ? { vid } : {}), ...(first ? { ref: document.referrer.slice(0, 300), ns: true } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => { // the visitor just changed their cookie choice
    const on = (e: Event) => {
      if (navigator.doNotTrack === '1') return;
      if ((e as CustomEvent).detail?.analytics) { const vid = knownVisitorId(true); if (vid) post({ t: 'h', vid, path: location.pathname }); }
      else { const old = forgetVisitorId(); if (old) post({ t: 'x', vid: old }); }
    };
    window.addEventListener('so-consent', on);
    return () => window.removeEventListener('so-consent', on);
  }, []);

  useEffect(() => {
    const vis = () => { const c = cur.current; if (!c) return; if (document.visibilityState === 'hidden') { if (c.since) { c.shown += Date.now() - c.since; c.since = null; } flush(); } else c.since = Date.now(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('pagehide', flush); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

'use client';
// Browser → same-origin /api/* (proxied to Render). Transparently refreshes the 15-minute access token.
const NETWORK_ERROR = 'Cannot reach the server. Check your internet connection and try again.';

let refreshing: Promise<boolean> | null = null;
const PUBLIC_AUTH = /^\/auth\/(login|login\/2fa|refresh|logout|forgot|reset)$/;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/**
 * One refresh at a time (many requests failing together must not each rotate the token).
 * A slow or sleeping server is NOT a sign-out: only a clear "no" from the server (401) ends the session; network errors are retried.
 */
function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    for (let i = 0; i < 4; i++) {
      try {
        const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
        if (r.ok) { lastRefresh = Date.now(); return true; }
        if (r.status === 401 || r.status === 403) return false;
      } catch { /* offline or server waking up: try again */ }
      await wait(1500 * (i + 1));
    }
    return false;
  })().finally(() => { setTimeout(() => { refreshing = null; }, 1500); });
  return refreshing;
}
let lastRefresh = Date.now();
/** Keeps a working person signed in: renews quietly while the tab is in use, and again when they return to it. */
export function startSessionKeeper() {
  if (typeof window === 'undefined') return () => {};
  const tick = () => { if (document.visibilityState === 'visible' && Date.now() - lastRefresh > 8 * 60_000) refreshOnce(); };
  const id = window.setInterval(tick, 60_000);
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('focus', tick);
  return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const run = () =>
    fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(init.headers ?? {}) } });
  try {
    let res = await run();
    if (res.status === 401 && !PUBLIC_AUTH.test(path)) {
      let ok = await refreshOnce();
      if (!ok) { res = await run(); ok = res.status !== 401; } // another tab may have refreshed a moment ago
      else res = await run();
      if (!ok && res.status === 401 && typeof window !== 'undefined' && (window as any).__soSignedIn) {
        // Do not throw the page away: ask the person to sign in again in place so unsaved work survives.
        window.dispatchEvent(new CustomEvent('so-session-expired'));
        await new Promise<void>((resolve) => { const h = () => { window.removeEventListener('so-session-back', h); resolve(); }; window.addEventListener('so-session-back', h); });
        res = await run();
      }
    }
    const why = typeof window !== 'undefined' && (init.method ?? 'GET') !== 'GET' ? res.headers.get('x-site-refresh') : null;
    if (why) window.dispatchEvent(new CustomEvent('so-site-refresh-failed', { detail: decodeURIComponent(why) }));
    return res;
  } catch {
    return new Response(JSON.stringify({ message: NETWORK_ERROR }), { status: 599, headers: { 'content-type': 'application/json' } });
  }
}

export const jsonBody = (b: unknown): RequestInit => ({ body: JSON.stringify(b) });

const words = (p: string) => p.replace(/\.\d+/g, '').split('.').pop()!.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/** Turns any failed API response into one plain-language sentence that says what went wrong and why. */
export async function describeError(res: Response): Promise<string> {
  const j: any = await res.clone().json().catch(() => ({}));
  const msg = typeof j.message === 'string' ? j.message : Array.isArray(j.message) ? j.message.join(', ') : '';
  if (res.status === 599) return NETWORK_ERROR;
  if (res.status === 400 && Array.isArray(j.issues) && j.issues.length)
    return 'Please fix this and try again: ' + j.issues.slice(0, 4).map((x: any) => `${words(x.path || 'value')}: ${x.message}`).join('; ');
  if (res.status === 409 && j.usage) return `${msg || 'This item is in use'}. Used in: ${[...(j.usage.pages ?? []), ...(j.usage.settings ?? [])].join(', ')}.`;
  if (msg && res.status < 500) return msg;
  switch (res.status) {
    case 401: return 'Your session has expired. Please sign in again.';
    case 403: return 'You do not have permission to do this. Ask an administrator for access.';
    case 404: return 'This item was not found. It may have been removed.';
    case 413: return 'The file is too large. Please choose a smaller one (maximum 10 MB).';
    case 429: return 'Too many requests. Please wait a minute and try again.';
    case 503: return msg || 'This service is not set up yet. Check Admin → Integrations.';
    default: return res.status >= 500 ? 'Something went wrong on the server. Please try again. If it keeps happening, contact your developer.' : msg || `Request failed (${res.status}).`;
  }
}

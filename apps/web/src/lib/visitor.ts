/** Visitor id used by Admin → Analytics → Visitors. It exists only for people who accepted analytics cookies. */
const CONSENT = 'so_cookie_consent_v2', VID = 'so_vid';

export function analyticsAllowed(): boolean {
  try { return !!JSON.parse(localStorage.getItem(CONSENT) ?? 'null')?.analytics && navigator.doNotTrack !== '1'; } catch { return false; }
}
export function knownVisitorId(create = false): string | undefined {
  try {
    if (!analyticsAllowed()) return undefined;
    let v = localStorage.getItem(VID) ?? '';
    if (!/^[a-z0-9]{12,32}$/.test(v)) {
      if (!create) return undefined;
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      v = Array.from(a, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-6);
      localStorage.setItem(VID, v);
    }
    return v;
  } catch { return undefined; }
}
export function forgetVisitorId(): string | undefined {
  try { const v = localStorage.getItem(VID) ?? undefined; localStorage.removeItem(VID); return v && /^[a-z0-9]{12,32}$/.test(v) ? v : undefined; } catch { return undefined; }
}

import { AsyncLocalStorage } from 'async_hooks';

/** Per-request scratch space so any service can describe what it changed (before/after) for the activity log. */
export interface AuditCtx { label?: string; entity?: string; entityId?: string; action?: string; before?: unknown; after?: unknown; skip?: boolean; refresh?: { ok: boolean; reason?: string } }
export const auditStore = new AsyncLocalStorage<AuditCtx>();
export const audit = (c: AuditCtx) => { const s = auditStore.getStore(); if (s) Object.assign(s, c); };

const clip = (v: unknown) => (typeof v === 'string' ? (v.length > 240 ? v.slice(0, 240) + '…' : v) : v);
const SECRET = /pass|token|secret|hash|code|api_?key|ticket|signature|totp/i;

/** Flattens two JSON values and lists only the leaves that changed. Used to show "before → after" in the activity log. */
export function diffJson(before: unknown, after: unknown, max = 40): { path: string; before: unknown; after: unknown }[] {
  const out: { path: string; before: unknown; after: unknown }[] = [];
  const walk = (a: any, b: any, path: string) => {
    if (out.length >= max) return;
    if (a === b) return;
    const isObj = (x: any) => x && typeof x === 'object';
    if (isObj(a) && isObj(b) && Array.isArray(a) === Array.isArray(b)) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const k of keys) walk(a[k], b[k], path ? `${path}.${k}` : k);
      return;
    }
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const hide = SECRET.test(path);
    out.push({ path, before: hide ? '[redacted]' : clip(isObj(a) ? JSON.stringify(a).slice(0, 240) : a), after: hide ? '[redacted]' : clip(isObj(b) ? JSON.stringify(b).slice(0, 240) : b) });
  };
  walk(before, after, '');
  return out;
}

'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { describeError } from '@/lib/admin-api';

type Kind = 'success' | 'error' | 'warn' | 'info';
type T = { id: number; kind: Kind; text: string };
type Api = { show: (kind: Kind, text: string) => void; success: (t: string) => void; error: (t: string) => void; warn: (t: string) => void; info: (t: string) => void };
const Ctx = createContext<Api | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const n = useRef(0);
  const drop = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const show = useCallback((kind: Kind, text: string) => {
    const id = ++n.current;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
    setTimeout(() => drop(id), kind === 'error' ? 10000 : kind === 'warn' ? 7000 : 4500);
  }, [drop]);
  const api = useMemo<Api>(() => ({ show, success: (t) => show('success', t), error: (t) => show('error', t), warn: (t) => show('warn', t), info: (t) => show('info', t) }), [show]);
  useEffect(() => { // saved, but the live website could not be told to refresh
    const on = (e: Event) => show('warn', `Saved, but the live website could not be refreshed, so visitors may see the old version for up to 5 minutes. ${(e as CustomEvent).detail ?? ''}`);
    window.addEventListener('so-site-refresh-failed', on);
    return () => window.removeEventListener('so-site-refresh-failed', on);
  }, [show]);
  const Icon = { success: CheckCircle2, error: XCircle, warn: TriangleAlert, info: Info };
  const color = { success: '#12b76a', error: '#f04438', warn: '#f79009', info: '#2e90fa' };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed end-4 top-16 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className="a-toast pointer-events-auto" data-kind={t.kind} role={t.kind === 'error' ? 'alert' : 'status'}>
              <I className="mt-0.5 h-5 w-5 shrink-0" style={{ color: color[t.kind] }} aria-hidden />
              <p className="flex-1">{t.text}</p>
              <button onClick={() => drop(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('ToastProvider missing');
  return c;
};

/**
 * Runs an API call and always tells the user the result with a popup:
 * green on success, red with the reason on failure. Returns the original Response.
 * Kept under the old name so older screens work unchanged.
 */
export function useSave() {
  const toast = useToast();
  const run = useCallback(async (fn: () => Promise<Response>, ok = 'Saved ✓') => {
    const res = await fn();
    if (res.ok) { if (ok) toast.success(ok.replace(/ ?✓$/, '')); } else toast.error(await describeError(res));
    return res;
  }, [toast]);
  return { msg: '', run };
}

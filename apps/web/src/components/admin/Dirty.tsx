'use client';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useDialogs } from './Dialogs';

type Api = { dirty: boolean; incomplete: boolean; setFlag: (key: string, on: boolean) => void; setIncomplete: (key: string, on: boolean) => void; guard: (go: () => void) => Promise<void> };
const Ctx = createContext<Api | null>(null);

/**
 * Stops people from losing work: while any form on screen has unsaved changes,
 * clicking a link, using Back, closing the tab or signing out asks first.
 */
export function DirtyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { confirm } = useDialogs();
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [inc, setInc] = useState<Set<string>>(new Set());
  const incRef = useRef(false);
  incRef.current = inc.size > 0;
  const setIncomplete = useCallback((key: string, on: boolean) => setInc((s) => { if (on === s.has(key)) return s; const n = new Set(s); on ? n.add(key) : n.delete(key); return n; }), []);
  const dirty = keys.size > 0;
  const ref = useRef(false);
  const sentinel = useRef(false);
  ref.current = dirty;

  const setFlag = useCallback((key: string, on: boolean) => setKeys((s) => {
    if (on === s.has(key)) return s;
    const n = new Set(s); on ? n.add(key) : n.delete(key); return n;
  }), []);

  const ask = useCallback(() => confirm({
    title: incRef.current ? 'Arabic translation is missing' : 'You have unsaved changes',
    message: incRef.current ? 'The Arabic and English versions do not match yet, so your changes cannot be saved. If you leave now they will be lost. Stay and finish the translation instead?' : 'You have changes that are not saved yet. Page edits keep a safety copy on this device (you can resume from the dashboard), but other screens do not. Leave now?',
    confirmLabel: 'Leave', cancelLabel: 'Stay and save', danger: true,
  }), [confirm]);

  const guard = useCallback(async (go: () => void) => {
    if (!ref.current || (await ask())) { setKeys(new Set()); ref.current = false; go(); }
  }, [ask]);

  // Tab close / refresh
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (ref.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  // Links inside the admin (sidebar, header, in-page links)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault(); e.stopPropagation();
      guard(() => router.push(u.pathname + u.search + u.hash));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [guard, router]);

  // Browser Back button: park an extra history entry while dirty so Back can be intercepted.
  useEffect(() => {
    if (dirty && !sentinel.current) { history.pushState({ ...(history.state ?? {}), soGuard: 1 }, '', location.href); sentinel.current = true; }
  }, [dirty]);
  useEffect(() => {
    const onPop = async (e: PopStateEvent) => {
      if (!ref.current || !sentinel.current) return;
      e.stopImmediatePropagation();
      if (await ask()) { setKeys(new Set()); ref.current = false; sentinel.current = false; history.back(); }
      else history.pushState({ ...(history.state ?? {}), soGuard: 1 }, '', location.href);
    };
    window.addEventListener('popstate', onPop, true);
    return () => window.removeEventListener('popstate', onPop, true);
  }, [ask]);

  const api = useMemo(() => ({ dirty, incomplete: inc.size > 0, setFlag, setIncomplete, guard }), [dirty, inc, setFlag, setIncomplete, guard]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useDirtyGuard = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('DirtyProvider missing');
  return c;
};

/** Call with true while a form has unsaved edits. Automatically cleared when the screen closes. */
export function useDirtyFlag(on: boolean) {
  const id = useId();
  const { setFlag } = useDirtyGuard();
  useEffect(() => { setFlag(id, on); }, [id, on, setFlag]);
  useEffect(() => () => setFlag(id, false), [id, setFlag]);
}

/** Call with true while English and Arabic text do not match. Leaving then warns that the translation is missing. */
export function useIncompleteFlag(on: boolean) {
  const id = useId();
  const { setIncomplete } = useDirtyGuard();
  useEffect(() => { setIncomplete(id, on); }, [id, on, setIncomplete]);
  useEffect(() => () => setIncomplete(id, false), [id, setIncomplete]);
}

/** Holds editable data and knows whether it differs from what is saved. With a storeKey it also keeps a safety copy in this browser, so work survives a sign-out, crash or closed tab. */
export function useDraft<T>(storeKey?: string) {
  const [value, setValue] = useState<T | null>(null);
  const [pending, setPending] = useState<{ value: T; at: number } | null>(null);
  const base = useRef('');
  const k = storeKey ? `so-draft:${storeKey}` : '';
  const read = () => { try { return k ? JSON.parse(localStorage.getItem(k) || 'null') : null; } catch { return null; } };
  const clear = () => { try { if (k) localStorage.removeItem(k); } catch { /* storage unavailable */ } };
  const load = useCallback((v: T) => {
    base.current = JSON.stringify(v); setValue(v);
    const s = read(); if (s && JSON.stringify(s.value) !== base.current) setPending(s); else clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  const markSaved = useCallback(() => { base.current = JSON.stringify(value); clear(); setValue((v) => (v === null ? v : { ...(v as any) })); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value, k]);
  const dirty = value !== null && JSON.stringify(value) !== base.current;
  useDirtyFlag(dirty);
  useEffect(() => {
    if (!k || !dirty) return;
    const t = setTimeout(() => { try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), value })); } catch { /* storage full or blocked */ } }, 800);
    return () => clearTimeout(t);
  }, [k, dirty, value]);
  const restore = () => { if (pending) setValue(pending.value); setPending(null); };
  const discardPending = () => { clear(); setPending(null); };
  return { value, setValue: setValue as React.Dispatch<React.SetStateAction<T | null>>, load, markSaved, dirty, pending, restore, discardPending };
}

/** Component form of useIncompleteFlag, usable after early returns. */
export function IncompleteGate({ on }: { on: boolean }) { useIncompleteFlag(on); return null; }

'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Tone = 'primary' | 'danger' | 'plain';
type Action = { id: string; label: string; tone?: Tone };
type Req = { title: string; message?: string; actions: Action[]; input?: { label: string; placeholder?: string; required?: boolean }; resolve: (v: { id: string; value: string } | null) => void };
type Api = {
  confirm: (o: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;
  prompt: (o: { title: string; message?: string; label: string; placeholder?: string; confirmLabel?: string }) => Promise<string | null>;
};
const Ctx = createContext<Api | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Req | null>(null);
  const [val, setVal] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const ask = useCallback((r: Omit<Req, 'resolve'>) => new Promise<{ id: string; value: string } | null>((resolve) => { setVal(''); setReq({ ...r, resolve }); }), []);
  const close = (v: { id: string; value: string } | null) => { req?.resolve(v); setReq(null); };

  useEffect(() => {
    if (!req) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,button[data-primary]')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { req.resolve(null); setReq(null); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [req]);

  const api: Api = {
    confirm: async (o) => (await ask({ title: o.title, message: o.message, actions: [{ id: 'no', label: o.cancelLabel ?? 'Cancel', tone: 'plain' }, { id: 'yes', label: o.confirmLabel ?? 'Confirm', tone: o.danger ? 'danger' : 'primary' }] }))?.id === 'yes',
    prompt: async (o) => {
      const r = await ask({ title: o.title, message: o.message, input: { label: o.label, placeholder: o.placeholder, required: true }, actions: [{ id: 'no', label: 'Cancel', tone: 'plain' }, { id: 'yes', label: o.confirmLabel ?? 'OK', tone: 'primary' }] });
      return r?.id === 'yes' ? r.value.trim() : null;
    },
  };
  const cls = (t?: Tone) => (t === 'danger' ? 'a-btn a-btn-solid-danger' : t === 'primary' ? 'a-btn a-btn-primary' : 'a-btn');
  return (
    <Ctx.Provider value={api}>
      {children}
      {req && (
        <div className="a-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
          <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="a-dlg-t" className="a-modal">
            <h2 id="a-dlg-t" className="text-lg font-bold">{req.title}</h2>
            {req.message && <p className="mt-2 text-sm text-slate-600">{req.message}</p>}
            {req.input && (
              <label className="mt-4 block">
                <span className="a-label">{req.input.label}</span>
                <input className="a-input" value={val} placeholder={req.input.placeholder} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && val.trim() && close({ id: 'yes', value: val })} />
              </label>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {req.actions.map((a) => (
                <button key={a.id} data-primary={a.tone !== 'plain' ? '' : undefined} className={cls(a.tone)} disabled={a.id === 'yes' && !!req.input?.required && !val.trim()} onClick={() => close({ id: a.id, value: val })}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useDialogs = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('DialogProvider missing');
  return c;
};

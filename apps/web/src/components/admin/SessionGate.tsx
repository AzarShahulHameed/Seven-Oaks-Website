'use client';
import { useEffect, useState } from 'react';
import { adminFetch, jsonBody } from '@/lib/admin-api';

/** Shown on top of the page when the sign-in has ended, so nothing the person typed is lost. Signing in again continues exactly where they were. */
export function SessionGate({ email }: { email: string }) {
  const [open, setOpen] = useState(false); const [ticket, setTicket] = useState(''); const [trust, setTrust] = useState({ can: false, days: 30 });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [tick, setTick] = useState(0);
  useEffect(() => { const h = () => setOpen(true); window.addEventListener('so-session-expired', h); return () => window.removeEventListener('so-session-expired', h); }, []);
  if (!open) return null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const r = ticket ? await adminFetch('/auth/login/2fa', { method: 'POST', ...jsonBody({ ticket, code: f.get('code'), trust: f.get('trust') === 'on' }) }) : await adminFetch('/auth/login', { method: 'POST', ...jsonBody({ email, password: f.get('password') }) });
    setBusy(false);
    if (!r.ok) { setErr(r.status === 429 ? 'Too many attempts. Wait a minute.' : ticket ? 'That code is not correct.' : 'That password is not correct.'); return; }
    const d = await r.json().catch(() => ({}));
    if (d.status === '2fa') { setTicket(d.ticket); setTrust({ can: !!d.canTrust, days: d.trustDays ?? 30 }); setTick((n) => n + 1); return; }
    setOpen(false); setTicket(''); window.dispatchEvent(new CustomEvent('so-session-back'));
  }
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/70 p-4" role="dialog" aria-modal="true" aria-label="Session ended">
      <form key={`${ticket ? 2 : 1}-${tick}`} onSubmit={submit} className="a-card w-full max-w-sm space-y-3 !p-6">
        <h2 className="text-lg font-bold">You were signed out</h2>
        <p className="text-sm text-slate-600">For your safety the session ended. <b>Your unsaved work is still here.</b> Sign in again and it will carry on where you left off.</p>
        {ticket ? (<>
          <label className="block text-sm font-semibold">Authenticator code<input name="code" required autoFocus autoComplete="one-time-code" className="a-input mt-1 tracking-widest" /></label>
          {trust.can && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="trust" defaultChecked />Don’t ask for a code on this browser for {trust.days} days</label>}
        </>) : (<><p className="text-sm"><b>{email}</b></p><label className="block text-sm font-semibold">Password<input name="password" type="password" required autoFocus autoComplete="current-password" className="a-input mt-1" /></label></>)}
        {err && <p role="alert" className="a-err">{err}</p>}
        <button disabled={busy} className="a-btn a-btn-primary w-full justify-center">{ticket ? 'Verify and continue' : 'Sign in and continue'}</button>
      </form>
    </div>
  );
}

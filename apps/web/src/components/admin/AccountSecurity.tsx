'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MailCheck } from 'lucide-react';
import { adminFetch, describeError } from '@/lib/admin-api';
import { Help } from './Help';
import { useToast } from './Toast';

const post = (path: string, body?: unknown) => adminFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
function Code({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return <input className="a-input max-w-[12rem] text-center font-mono text-xl tracking-[.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="6-digit code" />;
}
function Resend({ onSend }: { onSend: () => Promise<boolean> }) {
  const [wait, setWait] = useState(45);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  return <button type="button" className="a-btn a-btn-sm" disabled={wait > 0} onClick={async () => { if (await onSend()) setWait(45); }}>{wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}</button>;
}

/** Password change: current password + new password, then a 6-digit code emailed to the account. Other devices are signed out. */
export function PasswordChange() {
  const toast = useToast();
  const [step, setStep] = useState<'form' | 'code'>('form'); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ cur: '', n1: '', n2: '' }); const [code, setCode] = useState(''); const [to, setTo] = useState('');
  const bad = !f.cur || f.n1.length < 12 || f.n1 !== f.n2;
  const send = async () => { const r = await post('/auth/password/code'); if (r.ok) { setTo((await r.json()).sentTo); toast.success('We emailed you a 6-digit code'); return true; } toast.error(await describeError(r)); return false; };
  const start = async () => { setBusy(true); if (await send()) setStep('code'); setBusy(false); };
  const done = async () => {
    setBusy(true);
    const r = await post('/auth/password', { currentPassword: f.cur, newPassword: f.n1, code }); setBusy(false);
    if (r.ok) { toast.success('Password changed. Your other devices were signed out.'); setStep('form'); setF({ cur: '', n1: '', n2: '' }); setCode(''); } else toast.error(await describeError(r));
  };
  return (
    <section className="a-card">
      <h2>Change password<Help text="Use at least 12 characters. For your safety we email a 6-digit code to confirm it is you. Changing it signs you out of all other devices." align="left" /></h2>
      {step === 'form' ? (
        <form className="mt-3 grid max-w-md gap-3" onSubmit={(e) => { e.preventDefault(); if (!bad) start(); }}>
          <label><span className="a-label">Current password</span><input type="password" className="a-input" autoComplete="current-password" value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} /></label>
          <label><span className="a-label">New password (12+ characters)</span><input type="password" className="a-input" autoComplete="new-password" value={f.n1} onChange={(e) => setF({ ...f, n1: e.target.value })} /></label>
          <label><span className="a-label">Repeat new password</span><input type="password" className="a-input" autoComplete="new-password" aria-invalid={!!f.n2 && f.n1 !== f.n2} value={f.n2} onChange={(e) => setF({ ...f, n2: e.target.value })} />{!!f.n2 && f.n1 !== f.n2 && <p className="a-err">The two passwords do not match.</p>}</label>
          <div><button className="a-btn a-btn-primary" disabled={bad || busy}>{busy ? 'Sending code…' : 'Email me a code'}</button></div>
        </form>
      ) : (
        <div className="mt-3 grid max-w-md gap-3">
          <p className="flex items-start gap-2 text-sm"><Mail className="mt-0.5 h-4 w-4 shrink-0" />We sent a 6-digit code to <strong>{to}</strong>. It works for 10 minutes.</p>
          <Code value={code} onChange={setCode} autoFocus />
          <div className="flex flex-wrap gap-2"><button className="a-btn a-btn-primary" disabled={code.length !== 6 || busy} onClick={done}>{busy ? 'Changing…' : 'Confirm & change password'}</button><button className="a-btn" onClick={() => { setStep('form'); setCode(''); }}>Back</button><Resend onSend={send} /></div>
        </div>
      )}
    </section>
  );
}

/** Email change: a code to the CURRENT address, then a second code to the NEW address. The change happens only after both. */
export function EmailChange({ email, onChanged }: { email: string; onChanged: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: '', pw: '' }); const [c1, setC1] = useState(''); const [c2, setC2] = useState(''); const [to, setTo] = useState('');
  const reset = () => { setStep(0); setF({ email: '', pw: '' }); setC1(''); setC2(''); };
  const run = async (fn: () => Promise<Response>, ok: () => void, msg?: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { if (msg) toast.success(msg); ok(); return r; } toast.error(await describeError(r)); return null; };
  const start = () => run(() => post('/auth/email/start', { newEmail: f.email, password: f.pw }), () => setStep(1), 'We emailed a code to your current address');
  const verifyOld = async () => { const r = await run(() => post('/auth/email/verify-current', { code: c1 }), () => setStep(2), 'Current email confirmed. Now check your new inbox.'); if (r) setTo((await r.clone().json()).sentTo); };
  const confirm = () => run(() => post('/auth/email/confirm', { code: c2 }), () => { setStep(3); onChanged(); }, 'Email address changed');
  const resend = async () => { const r = await (step === 1 ? post('/auth/email/start', { newEmail: f.email, password: f.pw }) : post('/auth/email/verify-current', { code: c1 })); if (r.ok) { toast.success('New code sent'); return true; } toast.error(await describeError(r)); return false; };
  const ok = /^\S+@\S+\.\S+$/.test(f.email) && f.email.toLowerCase() !== email.toLowerCase() && !!f.pw;
  return (
    <section className="a-card">
      <h2>Email address<Help text="To protect your account, we send a code to your current email AND a code to the new one. The address changes only when both are confirmed." align="left" /></h2>
      <p className="a-sub">Signed in as <strong>{email}</strong></p>
      {step === 0 && (
        <form className="mt-3 grid max-w-md gap-3" onSubmit={(e) => { e.preventDefault(); if (ok) start(); }}>
          <label><span className="a-label">New email address</span><input type="email" className="a-input" autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label><span className="a-label">Your password</span><input type="password" className="a-input" autoComplete="current-password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} /></label>
          <div><button className="a-btn a-btn-primary" disabled={!ok || busy}>{busy ? 'Sending…' : 'Send code to my current email'}</button></div>
        </form>
      )}
      {step > 0 && step < 3 && (
        <div className="mt-3 grid max-w-md gap-3">
          <ol className="flex gap-2 text-xs font-bold" aria-label="Progress">{['Confirm current email', 'Confirm new email'].map((t, k) => <li key={t} className={`flex-1 rounded-full px-3 py-1 text-center ${step === k + 1 ? 'bg-[#1f4d2b] text-white' : step > k + 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{k + 1}. {t}</li>)}</ol>
          {step === 1 ? (<>
            <p className="text-sm">Enter the 6-digit code we sent to your <strong>current</strong> email ({email}).</p>
            <Code value={c1} onChange={setC1} autoFocus />
            <div className="flex flex-wrap gap-2"><button className="a-btn a-btn-primary" disabled={c1.length !== 6 || busy} onClick={verifyOld}>{busy ? 'Checking…' : 'Confirm & email the new address'}</button><button className="a-btn" onClick={reset}>Cancel</button><Resend onSend={resend} /></div>
          </>) : (<>
            <p className="flex items-start gap-2 text-sm"><MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Now enter the code we sent to your <strong>new</strong> email {to && `(${to})`}.</p>
            <Code value={c2} onChange={setC2} autoFocus />
            <div className="flex flex-wrap gap-2"><button className="a-btn a-btn-primary" disabled={c2.length !== 6 || busy} onClick={confirm}>{busy ? 'Changing…' : `Change my email to ${f.email}`}</button><button className="a-btn" onClick={reset}>Cancel</button></div>
          </>)}
        </div>
      )}
      {step === 3 && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />Your email address was changed. Use the new one next time you sign in.<button className="a-btn a-btn-sm ms-2" onClick={reset}>Done</button></p>}
    </section>
  );
}

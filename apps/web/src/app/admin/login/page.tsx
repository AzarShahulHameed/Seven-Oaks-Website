'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BrandMark } from '@/components/admin/Brand';
import { adminFetch, jsonBody } from '@/lib/admin-api';

export default function Login() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [ticket, setTicket] = useState('');
  const [busy, setBusy] = useState(false);
  const [trust, setTrust] = useState({ can: false, days: 30 });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const r = ticket
      ? await adminFetch('/auth/login/2fa', { method: 'POST', ...jsonBody({ ticket, code: f.get('code'), trust: f.get('trust') === 'on' }) })
      : await adminFetch('/auth/login', { method: 'POST', ...jsonBody({ email: f.get('email'), password: f.get('password') }) });
    setBusy(false);
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      if (d.status === '2fa') { setTicket(d.ticket); setTrust({ can: !!d.canTrust, days: d.trustDays ?? 30 }); }
      else router.replace('/admin');
    } else if (r.status === 429) setErr('Too many attempts. Please wait a minute.');
    else if (ticket) {
      setErr('That code is not correct.');
      if (r.status === 401) { const e2 = await r.json().catch(() => ({})); if (/expired/i.test(e2.message ?? '')) { setTicket(''); setErr('Sign-in expired. Please start again.'); } }
    } else setErr('Invalid email or password.');
  }

  return (
    <main className="a-auth">
      <form key={ticket ? '2fa' : 'pw'} className="a-auth-card" onSubmit={submit}>
        <div className="flex justify-center"><BrandMark className="h-14" /></div>
        <h1 className="a-auth-title">{ticket ? 'Two-step verification' : 'Admin sign in'}</h1>
        {ticket ? (
          <>
            <p className="text-sm text-slate-600">Enter the 6-digit code from your authenticator app, or one of your recovery codes.</p>
            <label className="block text-sm font-semibold">Code<input name="code" required autoFocus autoComplete="one-time-code" inputMode="text" className="a-input mt-1 tracking-widest" /></label>
            {trust.can && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="trust" defaultChecked />Don’t ask for a code on this browser for {trust.days} days<span className="sr-only"> (only tick on your own device)</span></label>}
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold">Email<input name="email" type="email" required autoComplete="username" className="a-input mt-1" /></label>
            <label className="block text-sm font-semibold">Password<input name="password" type="password" required autoComplete="current-password" className="a-input mt-1" /></label>
          </>
        )}
        {err && <p role="alert" className="a-err">{err}</p>}
        <button disabled={busy} className="a-btn a-btn-primary w-full justify-center">{ticket ? 'Verify' : 'Sign in'}</button>
        {ticket ? <button type="button" className="text-sm underline" onClick={() => { setTicket(''); setErr(''); }}>Back</button> : <Link href="/admin/forgot" className="block text-center text-sm underline">Forgot password?</Link>}
      </form>
    </main>
  );
}

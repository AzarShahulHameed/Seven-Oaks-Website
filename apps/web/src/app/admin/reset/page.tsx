'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/admin/Brand';
import { adminFetch, jsonBody } from '@/lib/admin-api';

export default function Reset() {
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setToken(q.get('token') ?? ''); setInvite(q.get('invite') === '1');
    window.history.replaceState(null, '', window.location.pathname); // keep the token out of the address bar/history
  }, []);
  return (
    <main className="a-auth">
      <form
        className="a-auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (f.get('password') !== f.get('again')) return setErr('The two passwords do not match.');
          const r = await adminFetch('/auth/reset', { method: 'POST', ...jsonBody({ token, invite, password: f.get('password') }) });
          if (r.ok) setDone(true);
          else setErr((await r.json().catch(() => ({}))).message ?? 'Something went wrong.');
        }}
      >
        <div className="flex justify-center"><BrandMark className="h-14" /></div>
        <h1 className="a-auth-title">{invite ? 'Set your password' : 'Choose a new password'}</h1>
        {done ? (
          <p className="text-sm text-slate-700">Password saved. You can now <Link href="/admin/login" className="underline">sign in</Link>.</p>
        ) : !token ? (
          <p className="a-err">This link is missing its token. Open the link from your email again.</p>
        ) : (
          <>
            <label className="block text-sm font-semibold">New password (12+ characters)<input name="password" type="password" minLength={12} required autoComplete="new-password" className="a-input mt-1" /></label>
            <label className="block text-sm font-semibold">Repeat password<input name="again" type="password" minLength={12} required autoComplete="new-password" className="a-input mt-1" /></label>
            {err && <p role="alert" className="a-err">{err}</p>}
            <button className="a-btn a-btn-primary w-full justify-center">Save password</button>
          </>
        )}
      </form>
    </main>
  );
}

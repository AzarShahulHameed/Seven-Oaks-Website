'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BrandMark } from '@/components/admin/Brand';
import { adminFetch, jsonBody } from '@/lib/admin-api';

export default function Forgot() {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  return (
    <main className="a-auth">
      <form
        className="a-auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await adminFetch('/auth/forgot', { method: 'POST', ...jsonBody({ email: new FormData(e.currentTarget).get('email') }) });
          if (r.ok) setDone(true); else setErr(r.status === 429 ? 'Too many requests. Wait a minute.' : 'Enter a valid email address.');
        }}
      >
        <div className="flex justify-center"><BrandMark className="h-14" /></div>
        <h1 className="a-auth-title">Reset password</h1>
        {done ? (
          <p className="text-sm text-slate-700">If an account exists for that address, a reset link has been sent. It works once and expires in 1 hour.</p>
        ) : (
          <>
            <label className="block text-sm font-semibold">Email<input name="email" type="email" required className="a-input mt-1" /></label>
            {err && <p role="alert" className="a-err">{err}</p>}
            <button className="a-btn a-btn-primary w-full justify-center">Send reset link</button>
          </>
        )}
        <Link href="/admin/login" className="block text-center text-sm underline">Back to sign in</Link>
      </form>
    </main>
  );
}

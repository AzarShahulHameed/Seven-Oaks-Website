'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { knownVisitorId } from '@/lib/visitor';

/** Small "stay in touch" box. Collects an email only with an explicit tick-box consent. */
export function NewsletterForm({ locale, title, text, consent, policyHref, policyLabel, button }: { locale: string; title: string; text: string; consent: string; policyHref: string; policyLabel: string; button: string }) {
  const path = usePathname();
  const ar = locale === 'ar';
  const [email, setEmail] = useState(''); const [ok, setOk] = useState(false); const [agree, setAgree] = useState(false); const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'busy'>('idle'); const [err, setErr] = useState('');
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr(ar ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
    if (!agree) return setErr(ar ? 'يرجى الموافقة أولاً' : 'Please tick the box to agree first');
    setState('busy');
    try {
      const r = await fetch('/api/public/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email.trim(), consent: true, locale, page: path, hp, vid: knownVisitorId() }) });
      if (r.ok) setOk(true); else setErr(ar ? 'تعذّر الاشتراك. حاول مرة أخرى.' : 'We could not sign you up. Please try again.');
    } catch { setErr(ar ? 'تعذّر الاتصال بالخادم.' : 'Cannot reach the server.'); }
    setState('idle');
  };
  if (ok) return <p role="status" className="rounded-xl bg-white/10 p-4 text-sm font-semibold">{ar ? 'شكراً لاشتراككم!' : 'Thank you for subscribing!'}</p>;
  return (
    <form onSubmit={go} noValidate>
      <h3 className="font-heading text-h5 font-bold">{title}</h3>
      {text && <p className="mt-1 text-sm opacity-90">{text}</p>}
      <div className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="nl-email">{ar ? 'البريد الإلكتروني' : 'Email address'}</label>
        <input id="nl-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-btn border-0 bg-white px-4 py-2.5 text-sm text-black outline-none focus:ring-4 focus:ring-white/40" />
        <span aria-hidden className="absolute -start-[9999px]"><input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></span>
        <button disabled={state === 'busy'} className="rounded-btn bg-accent px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-70">{state === 'busy' ? '…' : button}</button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-xs opacity-90"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--colors-accent)]" /><span>{consent} {policyHref && <a href={policyHref} className="underline">{policyLabel}</a>}</span></label>
      {err && <p role="alert" className="mt-2 text-xs font-bold text-amber-200">{err}</p>}
    </form>
  );
}

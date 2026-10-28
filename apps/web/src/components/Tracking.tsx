'use client';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// Re-validated here even though the API validates on save: these values are placed into script code/URLs.
const GA = /^G-[A-Z0-9]{4,14}$/, GTM = /^GTM-[A-Z0-9]{4,10}$/, PX = /^\d{6,20}$/;
const KEY = 'so_cookie_consent_v2';
type Choice = { analytics: boolean; marketing: boolean };
type Props = {
  locale: string; gaId: string; gtmId: string; pixelId: string; version: string;
  text: string; accept: string; decline: string; customize: string; save: string; policyLabel: string; policyHref: string;
  labels: { necessary: string; necessaryText: string; analytics: string; analyticsText: string; marketing: string; marketingText: string; title: string };
};

function addScript(src: string) { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }

function loadTrackers(c: Choice, { gaId, gtmId, pixelId }: Pick<Props, 'gaId' | 'gtmId' | 'pixelId'>) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  if (c.analytics && !w.__soAnalytics) {
    w.__soAnalytics = true;
    if (GTM.test(gtmId)) { // GTM owns GA4 when configured, so GA4 is not loaded a second time.
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      addScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`);
    } else if (GA.test(gaId)) {
      w.gtag = function () { w.dataLayer.push(arguments); };
      w.gtag('js', new Date()); w.gtag('config', gaId, { anonymize_ip: true });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
    }
  }
  if (c.marketing && PX.test(pixelId) && !w.fbq) {
    w.__soMarketing = true;
    const n: any = (w.fbq = function (...a: unknown[]) { n.callMethod ? n.callMethod(...a) : n.queue.push(a); });
    w._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    addScript('https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('init', pixelId); w.fbq('track', 'PageView');
  }
}

const cid = () => { try { let v = localStorage.getItem('so_cid'); if (!v) { const a = new Uint8Array(10); crypto.getRandomValues(a); v = Array.from(a, (b) => (b % 36).toString(36)).join('') + 'x'; localStorage.setItem('so_cid', v); } return v; } catch { return 'anonymous00x'; } };

/** Cookie banner + preference centre. Nothing optional is loaded until the visitor agrees, and every decision is recorded (anonymously) for consent management. */
export function Tracking(p: Props) {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false });
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    let v: Choice | null = null;
    try { const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (raw && raw.v === p.version) v = { analytics: !!raw.analytics, marketing: !!raw.marketing }; } catch { /* undecided */ }
    setChoice(v); if (v) setDraft(v);
    const reopen = () => { setDraft(v ?? { analytics: false, marketing: false }); setOpen(true); };
    window.addEventListener('so-open-cookies', reopen);
    return () => window.removeEventListener('so-open-cookies', reopen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.version]);
  useEffect(() => { if (choice) loadTrackers(choice, p); /* eslint-disable-next-line */ }, [choice]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const w = window as any;
    if (choice?.marketing && w.fbq && PX.test(p.pixelId)) w.fbq('track', 'PageView');
    /* eslint-disable-next-line */
  }, [path]);

  const decide = useCallback((c: Choice) => {
    const w = window as any;
    const withdrew = (w.__soAnalytics && !c.analytics) || (w.__soMarketing && !c.marketing);
    try { localStorage.setItem(KEY, JSON.stringify({ ...c, v: p.version, at: Date.now() })); } catch { /* ignore */ }
    fetch('/api/public/consent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cid: cid(), analytics: c.analytics, marketing: c.marketing, version: p.version }), keepalive: true }).catch(() => undefined);
    setChoice(c); setOpen(false);
    window.dispatchEvent(new CustomEvent('so-consent', { detail: c }));
    if (withdrew) window.location.reload(); // already-loaded scripts cannot be unloaded, so start clean
  }, [p.version]);

  if (choice === undefined) return null; // not yet read from storage
  const show = choice === null || open;
  if (!show) return null;
  const rtl = p.locale === 'ar';
  const Row = ({ k, title, text, locked }: { k?: keyof Choice; title: string; text: string; locked?: boolean }) => (
    <label className="flex items-start gap-3 rounded-xl bg-black/[.04] p-3">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--colors-primary)]" checked={locked ? true : !!(k && draft[k])} disabled={locked} onChange={(e) => k && setDraft({ ...draft, [k]: e.target.checked })} />
      <span><span className="block font-bold">{title}</span><span className="block text-xs opacity-80">{text}</span></span>
    </label>
  );
  return (
    <div role="dialog" aria-modal={open} aria-label={p.labels.title} dir={rtl ? 'rtl' : 'ltr'} className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-card bg-surface p-4 text-sm text-ink shadow-card ring-1 ring-black/10">
      {!open ? (
        <div className="md:flex md:items-center md:gap-4">
          <p className="flex-1">{p.text} {p.policyHref && <a href={p.policyHref} className="font-bold">{p.policyLabel}</a>}</p>
          <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
            <button onClick={() => { setDraft({ analytics: false, marketing: false }); setOpen(true); }} className="rounded-btn px-3 py-2 font-bold text-primary">{p.customize}</button>
            <button onClick={() => decide({ analytics: false, marketing: false })} className="rounded-btn border-2 border-primary px-4 py-2 font-bold text-primary">{p.decline}</button>
            <button onClick={() => decide({ analytics: true, marketing: true })} className="rounded-btn border-2 border-transparent bg-btn px-4 py-2 font-bold text-btntext">{p.accept}</button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="font-heading text-h5 font-bold">{p.labels.title}</h2>
          <div className="mt-3 space-y-2">
            <Row locked title={p.labels.necessary} text={p.labels.necessaryText} />
            <Row k="analytics" title={p.labels.analytics} text={p.labels.analyticsText} />
            <Row k="marketing" title={p.labels.marketing} text={p.labels.marketingText} />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {choice && <button onClick={() => setOpen(false)} className="rounded-btn px-3 py-2 font-bold">{rtl ? 'إغلاق' : 'Close'}</button>}
            <button onClick={() => decide({ analytics: false, marketing: false })} className="rounded-btn border-2 border-primary px-4 py-2 font-bold text-primary">{p.decline}</button>
            <button onClick={() => decide(draft)} className="rounded-btn border-2 border-transparent bg-btn px-4 py-2 font-bold text-btntext">{p.save}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Footer link that reopens the cookie preferences. */
export function CookieSettingsLink({ label }: { label: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('so-open-cookies'))} className="hover:opacity-80">{label}</button>;
}

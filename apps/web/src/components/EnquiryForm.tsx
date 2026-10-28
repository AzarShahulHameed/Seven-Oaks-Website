'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { knownVisitorId } from '@/lib/visitor';

type Field = { show: boolean; required: boolean };
export type FormCfg = {
  enabled?: boolean; submitLabel?: string; successTitle?: string; successText?: string; consentText?: string; policyHref?: string; policyLabel?: string;
  programs: { value: string; label: string }[]; fields: Record<string, Field>;
};
const L = {
  en: { parentName: 'Your name', childName: 'Child’s name', email: 'Email', phone: 'Phone / WhatsApp', program: 'Programme you are interested in', visitDate: 'Preferred visit date', childAge: 'Child’s age', preferredContact: 'How would you like us to reach you?', message: 'Your message', choose: 'Choose…', phoneOpt: 'Phone call', whatsapp: 'WhatsApp', emailOpt: 'Email', sending: 'Sending…', required: 'This field is required', badEmail: 'Please enter a valid email address', consent: 'Please tick the box to agree before sending', error: 'We could not send your message. Please try again, or call us.', network: 'Cannot reach the server. Check your internet connection and try again.' },
  ar: { parentName: 'اسمك', childName: 'اسم الطفل', email: 'البريد الإلكتروني', phone: 'الهاتف / واتساب', program: 'البرنامج الذي يهمّك', visitDate: 'موعد الزيارة المفضل', childAge: 'عمر الطفل', preferredContact: 'كيف تفضّل أن نتواصل معك؟', message: 'رسالتك', choose: 'اختر…', phoneOpt: 'مكالمة هاتفية', whatsapp: 'واتساب', emailOpt: 'البريد الإلكتروني', sending: 'جارٍ الإرسال…', required: 'هذا الحقل مطلوب', badEmail: 'يرجى إدخال بريد إلكتروني صحيح', consent: 'يرجى الموافقة قبل الإرسال', error: 'تعذّر إرسال رسالتك. حاول مرة أخرى أو اتصل بنا.', network: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.' },
};
const input = 'mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15';

export function EnquiryForm({ cfg, locale }: { cfg: FormCfg; locale: string }) {
  const l = locale === 'ar' ? L.ar : L.en;
  const path = usePathname();
  const f = cfg.fields;
  const [v, setV] = useState<Record<string, string>>({ parentName: '', email: '', childName: '', phone: '', program: '', visitDate: '', childAge: '', preferredContact: '', message: '', hp: '' });
  const [consent, setConsent] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [fail, setFail] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setV({ ...v, [k]: e.target.value }); if (errs[k]) setErrs({ ...errs, [k]: '' }); };
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFail('');
    const er: Record<string, string> = {};
    if (!v.parentName.trim()) er.parentName = l.required;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) er.email = l.badEmail;
    for (const k of ['childName', 'phone', 'program', 'visitDate', 'childAge', 'preferredContact', 'message']) if (f[k]?.show && f[k]?.required && !v[k]?.trim()) er[k] = l.required;
    if (!consent) er.consent = l.consent;
    setErrs(er); if (Object.keys(er).length) { document.getElementById(`enq-${Object.keys(er)[0]}`)?.focus(); return; }
    setState('sending');
    try {
      const r = await fetch('/api/public/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...v, consent: true, consentText: cfg.consentText ?? '', locale, page: path, referrer: document.referrer.slice(0, 300), vid: knownVisitorId() }) });
      if (r.ok) { setState('done'); return; }
      const j = await r.json().catch(() => ({}));
      const issues: { path: string; message: string }[] = j?.issues ?? [];
      if (issues.length) { setErrs(Object.fromEntries(issues.map((i) => [i.path, i.message]))); setFail(''); } else setFail(typeof j?.message === 'string' && j.message !== 'Validation failed' ? j.message : l.error);
    } catch { setFail(l.network); }
    setState('idle');
  };

  const Err = ({ k }: { k: string }) => (errs[k] ? <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{errs[k]}</p> : null);
  const Lbl = ({ k, children, req }: { k: string; children: React.ReactNode; req?: boolean }) => <label htmlFor={`enq-${k}`} className="block text-sm font-bold">{children}{req && <span aria-hidden className="text-red-600"> *</span>}</label>;

  return (
    <AnimatePresence mode="wait">
      {state === 'done' ? (
        <m.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-card bg-surface p-8 text-center shadow-card" role="status">
          <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage text-primary"><CheckCircle2 className="h-9 w-9" /></m.span>
          <h3 className="mt-4 text-h4">{cfg.successTitle || (locale === 'ar' ? 'شكراً لكم!' : 'Thank you!')}</h3>
          <p className="mt-2">{cfg.successText || (locale === 'ar' ? 'استلمنا رسالتكم وسنتواصل معكم قريباً.' : 'We have received your message and will be in touch very soon.')}</p>
        </m.div>
      ) : (
        <m.form key="form" onSubmit={submit} noValidate className="space-y-4 rounded-card bg-surface p-6 shadow-card md:p-8" aria-busy={state === 'sending'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Lbl k="parentName" req>{l.parentName}</Lbl><input id="enq-parentName" autoComplete="name" maxLength={100} value={v.parentName} onChange={set('parentName')} className={input} aria-invalid={!!errs.parentName} /><Err k="parentName" /></div>
            <div><Lbl k="email" req>{l.email}</Lbl><input id="enq-email" type="email" autoComplete="email" maxLength={254} dir="ltr" value={v.email} onChange={set('email')} className={input} aria-invalid={!!errs.email} /><Err k="email" /></div>
            {f.phone?.show && <div><Lbl k="phone" req={f.phone.required}>{l.phone}</Lbl><input id="enq-phone" type="tel" autoComplete="tel" maxLength={30} dir="ltr" value={v.phone} onChange={set('phone')} className={input} /><Err k="phone" /></div>}
            {f.childName?.show && <div><Lbl k="childName" req={f.childName.required}>{l.childName}</Lbl><input id="enq-childName" maxLength={100} value={v.childName} onChange={set('childName')} className={input} /><Err k="childName" /></div>}
            {f.childAge?.show && <div><Lbl k="childAge" req={f.childAge.required}>{l.childAge}</Lbl><input id="enq-childAge" maxLength={40} value={v.childAge} onChange={set('childAge')} className={input} placeholder={locale === 'ar' ? 'مثال: سنتان ونصف' : 'e.g. 2 years 6 months'} /><Err k="childAge" /></div>}
            {f.program?.show && cfg.programs.length > 0 && <div><Lbl k="program" req={f.program.required}>{l.program}</Lbl><select id="enq-program" value={v.program} onChange={set('program')} className={input}><option value="">{l.choose}</option>{cfg.programs.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select><Err k="program" /></div>}
            {f.visitDate?.show && <div><Lbl k="visitDate" req={f.visitDate.required}>{l.visitDate}</Lbl><input id="enq-visitDate" type="date" min={today} value={v.visitDate} onChange={set('visitDate')} className={input} /><Err k="visitDate" /></div>}
            {f.preferredContact?.show && <div><Lbl k="preferredContact" req={f.preferredContact.required}>{l.preferredContact}</Lbl><select id="enq-preferredContact" value={v.preferredContact} onChange={set('preferredContact')} className={input}><option value="">{l.choose}</option><option value="phone">{l.phoneOpt}</option><option value="whatsapp">{l.whatsapp}</option><option value="email">{l.emailOpt}</option></select><Err k="preferredContact" /></div>}
          </div>
          {f.message?.show && <div><Lbl k="message" req={f.message.required}>{l.message}</Lbl><textarea id="enq-message" rows={4} maxLength={2000} value={v.message} onChange={set('message')} className={input} /><Err k="message" /></div>}
          <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden"><label>Leave empty<input tabIndex={-1} autoComplete="off" value={v.hp} onChange={set('hp')} /></label></div>
          <div>
            <label className="flex items-start gap-3 text-sm"><input id="enq-consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (errs.consent) setErrs({ ...errs, consent: '' }); }} className="mt-1 h-5 w-5 shrink-0 accent-[var(--colors-primary)]" /><span>{cfg.consentText || (locale === 'ar' ? 'أوافق على أن تتواصل معي الحضانة بخصوص هذا الاستفسار، وقد اطلعت على سياسة الخصوصية.' : 'I agree that the nursery may contact me about this enquiry, and I have read the Privacy Policy.')} {cfg.policyHref && <a href={cfg.policyHref} className="underline" target="_blank" rel="noopener noreferrer">{cfg.policyLabel}</a>}</span></label>
            <Err k="consent" />
          </div>
          {fail && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{fail}</p>}
          <button disabled={state === 'sending'} className="group inline-flex items-center gap-2 rounded-btn bg-btn px-7 py-3.5 text-btn font-bold uppercase tracking-wide text-btntext transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70">
            {state === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" />{l.sending}</> : <>{cfg.submitLabel || (locale === 'ar' ? 'إرسال' : 'Send enquiry')}<Send className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" /></>}
          </button>
        </m.form>
      )}
    </AnimatePresence>
  );
}

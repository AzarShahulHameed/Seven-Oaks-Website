'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Mail, Monitor, RotateCcw, Send, Smartphone, Trash2 } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { useDirtyFlag, useIncompleteFlag } from '@/components/admin/Dirty';
import { Help } from '@/components/admin/Help';
import { Bi, type I } from '@/components/admin/Bi';
import { EmailPreviewModal } from '@/components/admin/EmailPreviewModal';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { SOCIAL_PATHS } from '@/lib/social-icons';
import { Skel, SkelCard } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

type T = { key: string; name: string; description: string; hasButton: boolean; vars: { name: string; description?: string; sample: string }[]; customised: boolean; subject: I; heading: I; body: I; buttonLabel: I; enabled: boolean };
type Brand = { headerBg: string; accent: string; buttonBg: string; buttonText: string; headingColor: string; textColor: string; showLogo: boolean; logoUrl: string; logoAlign: 'start' | 'center' | 'end'; logoSize: 'small' | 'medium' | 'large'; logoOnWhite: boolean; fontFamily: string; fontSize: number; footerText: I; address: I; phone: string; email: string; social: Record<string, string>; socialStyle: 'brand' | 'dark' };
const SOCIAL = ['instagram', 'facebook', 'whatsapp', 'youtube', 'tiktok', 'x', 'linkedin', 'snapchat', 'website'];
const SOCIAL_HINT: Record<string, string> = { whatsapp: 'https://wa.me/9715XXXXXXXX', website: 'https://…' };
const FONTS: [string, string][] = [['arial', 'Arial (clean)'], ['tahoma', 'Tahoma (good for Arabic)'], ['verdana', 'Verdana (wide)'], ['trebuchet', 'Trebuchet (friendly)'], ['georgia', 'Georgia (classic)']];
const miss = (v: I) => !v.en.trim() || !v.ar.trim();

export default function EmailTemplatesPage() {
  const toast = useToast(); const dlg = useDialogs();
  const [list, setList] = useState<T[] | null>(null); const [brand0, setBrand0] = useState<Brand | null>(null);
  const [key, setKey] = useState('welcome'); const [draft, setDraft] = useState<T | null>(null); const [brand, setBrand] = useState<Brand | null>(null);
  const [locale, setLocale] = useState<'en' | 'ar'>('en'); const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [html, setHtml] = useState(''); const [subject, setSubject] = useState(''); const [pv, setPv] = useState(false);
  const [to, setTo] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'template' | 'brand'>('template');
  const [popup, setPopup] = useState(false); const [pick, setPick] = useState(false);

  const load = useCallback(() => adminFetch('/admin/email/templates').then(async (r) => { if (r.ok) { const j = await r.json(); setList(j.templates); setBrand0(j.brand); setBrand(j.brand); } else setErr(await describeError(r)); }), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = list?.find((x) => x.key === key); if (t) setDraft(JSON.parse(JSON.stringify(t))); }, [key, list]);
  const saved = list?.find((x) => x.key === key);
  const tplDirty = !!(draft && saved && JSON.stringify({ ...draft, customised: 0 }) !== JSON.stringify({ ...saved, customised: 0 }));
  const brandDirty = !!(brand && brand0 && JSON.stringify(brand) !== JSON.stringify(brand0));
  useDirtyFlag(tplDirty || brandDirty);

  // live preview (debounced) from the unsaved draft
  useEffect(() => {
    if (!draft || !brand) return;
    setPv(true);
    const t = setTimeout(async () => {
      const r = await adminFetch(`/admin/email/templates/${key}/preview`, { method: 'POST', body: JSON.stringify({ locale, draft: { subject: draft.subject, heading: draft.heading, body: draft.body, buttonLabel: draft.buttonLabel, enabled: draft.enabled }, brand }) });
      if (r.ok) { const j = await r.json(); setHtml(j.html); setSubject(j.subject); } else toast.error(await describeError(r));
      setPv(false);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, brand, locale, key]);

  const bodyBlocked = !!draft && (miss(draft.subject) || miss(draft.heading) || miss(draft.body) || (draft.hasButton && draft.buttonLabel && (!!draft.buttonLabel.en.trim() !== !!draft.buttonLabel.ar.trim())));
  const brandBlocked = !!brand && (miss(brand.footerText) || (!!brand.address.en.trim() !== !!brand.address.ar.trim()));
  useIncompleteFlag((tplDirty && bodyBlocked) || (brandDirty && brandBlocked));
  const names = useMemo(() => draft?.vars.map((v) => v.name) ?? [], [draft]);

  const saveTemplate = async () => {
    if (!draft) return; setBusy(true);
    const r = await adminFetch(`/admin/email/templates/${key}`, { method: 'PUT', body: JSON.stringify({ subject: draft.subject, heading: draft.heading, body: draft.body, buttonLabel: draft.buttonLabel, enabled: draft.enabled }) });
    setBusy(false); if (r.ok) { toast.success('Template saved'); load(); } else toast.error(await describeError(r));
  };
  const saveBrand = async () => {
    if (!brand) return; setBusy(true);
    const r = await adminFetch('/admin/email/brand', { method: 'PUT', body: JSON.stringify(brand) });
    setBusy(false); if (r.ok) { toast.success('Brand saved. It applies to every email.'); load(); } else toast.error(await describeError(r));
  };
  const reset = async () => {
    if (!(await dlg.confirm({ title: 'Restore the original wording?', message: 'Your edits to this template will be replaced by the built-in text.', confirmLabel: 'Restore', danger: true }))) return;
    const r = await adminFetch(`/admin/email/templates/${key}/reset`, { method: 'POST' }); if (r.ok) { toast.success('Restored'); load(); } else toast.error(await describeError(r));
  };
  const sendTest = async () => {
    if (!draft || !brand) return; setBusy(true);
    const r = await adminFetch(`/admin/email/templates/${key}/test`, { method: 'POST', body: JSON.stringify({ to, locale, draft: { subject: draft.subject, heading: draft.heading, body: draft.body, buttonLabel: draft.buttonLabel, enabled: draft.enabled }, brand }) });
    setBusy(false); if (r.ok) toast.success(`Test email sent to ${to}`); else toast.error(await describeError(r));
  };

  if (err) return <p className="a-err" role="alert">{err}</p>;
  if (!list || !draft || !brand) return <div className="space-y-4"><Skel className="h-8 w-56" /><div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]"><SkelCard lines={6} /><SkelCard lines={8} /><Skel className="h-96" /></div></div>;
  const setB = (p: Partial<Brand>) => setBrand({ ...brand, ...p });

  return (
    <div className="space-y-4">
      <PageBar title="Email templates" help="Everything the website emails: welcome, enquiries, admissions, password reset, verification codes and newsletters. Edit the words and look here and see the result live." />
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <nav className="a-card !p-2 lg:self-start" aria-label="Templates">
          {list.map((t) => <button key={t.key} onClick={async () => { if (tplDirty && !(await dlg.confirm({ title: 'Discard unsaved changes?', message: 'This template has changes that are not saved.', confirmLabel: 'Discard', danger: true }))) return; setKey(t.key); setTab('template'); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${key === t.key && tab === 'template' ? 'bg-[#1f4d2b] font-bold text-white' : 'hover:bg-slate-100'}`}><Mail className="h-4 w-4 shrink-0" /><span className="flex-1">{t.name}</span>{!t.enabled && <span className="text-[10px] opacity-70">off</span>}</button>)}
          <hr className="my-2" />
          <button onClick={() => setTab('brand')} className={`w-full rounded-lg px-3 py-2 text-start text-sm ${tab === 'brand' ? 'bg-[#1f4d2b] font-bold text-white' : 'hover:bg-slate-100'}`}>🎨 Brand, logo & footer</button>
        </nav>

        <div className="a-card space-y-4">
          {tab === 'template' ? (<>
            <div><h2 className="a-h2">{draft.name}</h2><p className="a-sub">{draft.description}</p></div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />This email is switched on<Help text="When off, the website will not send this email. Security emails such as verification codes should stay on." align="left" /></label>
            <Bi label="Subject line" value={draft.subject} onChange={(v) => setDraft({ ...draft, subject: v })} vars={names} />
            <Bi label="Heading" value={draft.heading} onChange={(v) => setDraft({ ...draft, heading: v })} vars={names} />
            <Bi label="Message" help="A blank line starts a new paragraph. **bold** makes text bold. A line starting with “# ” becomes a large highlighted line (used for codes)." value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} rows={9} vars={names} />
            {draft.hasButton && <Bi label="Button text" value={draft.buttonLabel} onChange={(v) => setDraft({ ...draft, buttonLabel: v })} />}
            <details className="rounded-lg bg-slate-50 p-3 text-xs"><summary className="cursor-pointer font-bold">Placeholders you can use</summary><ul className="mt-2 space-y-1">{draft.vars.map((v) => <li key={v.name}><code className="font-mono">{`{{${v.name}}}`}</code> — {v.description ?? v.name} <span className="text-slate-400">(e.g. {v.sample})</span></li>)}</ul></details>
            {bodyBlocked && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Fill in both the English and Arabic subject, heading and message to save.</p>}
            <div className="flex flex-wrap items-center gap-2">
              <button className="a-btn a-btn-primary" disabled={!tplDirty || bodyBlocked || busy} onClick={saveTemplate}>{busy ? 'Saving…' : 'Save template'}</button>
              {saved?.customised && <button className="a-btn" onClick={reset}><RotateCcw className="h-4 w-4" />Restore original</button>}
              {tplDirty && <button className="a-btn" onClick={() => setDraft(JSON.parse(JSON.stringify(saved)))}>Discard changes</button>}
            </div>
          </>) : (<>
            <div><h2 className="a-h2">Brand, logo & footer</h2><p className="a-sub">Applies to every email, including follow-up campaigns. The preview on the right updates as you change things; use “Large view” to see it full size.</p></div>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">Logo</legend>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={brand.showLogo} onChange={(e) => setB({ showLogo: e.target.checked })} />Show the logo at the top of every email</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-lg border bg-slate-50">{brand.logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={brand.logoUrl} alt="Email logo" className="max-h-14 max-w-[6.5rem] object-contain" /> : <span className="px-2 text-center text-[11px] text-slate-500">Using the site logo from Settings</span>}</div>
                <div className="flex flex-wrap gap-2"><button type="button" className="a-btn" onClick={() => setPick(true)}>{brand.logoUrl ? 'Change logo' : 'Upload or choose logo'}</button>{brand.logoUrl && <button type="button" className="a-btn" onClick={() => setB({ logoUrl: '' })}><Trash2 className="h-4 w-4" />Use site logo</button>}</div>
              </div>
              <div><p className="a-label">Where the logo sits<Help text="Position of the logo inside the coloured header band." align="left" /></p>
                <div className="grid max-w-md grid-cols-3 gap-2">{(['start', 'center', 'end'] as const).map((al) => <button type="button" key={al} onClick={() => setB({ logoAlign: al })} aria-pressed={brand.logoAlign === al} className={`rounded-lg border p-2 text-xs font-semibold ${brand.logoAlign === al ? 'border-[#1f4d2b] ring-2 ring-[#1f4d2b]/30' : 'border-slate-300'}`}>
                  <span className="mb-1 block h-6 rounded" style={{ background: brand.headerBg }}><span className="block h-full w-6 rounded bg-white/90" style={{ marginInlineStart: al === 'start' ? 4 : al === 'center' ? 'calc(50% - 12px)' : 'calc(100% - 28px)' }} /></span>{al === 'start' ? 'Left (right in Arabic)' : al === 'center' ? 'Centre' : 'Right (left in Arabic)'}</button>)}</div></div>
              <div className="a-cols"><div className="a-cols-grid">
                <label><span className="a-label">Logo size</span><select className="a-input" value={brand.logoSize} onChange={(e) => setB({ logoSize: e.target.value as any })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" checked={brand.logoOnWhite} onChange={(e) => setB({ logoOnWhite: e.target.checked })} />Put the logo on a white badge<Help text="Helps a dark or coloured logo stay readable on the coloured header." align="left" /></label>
              </div></div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">Colours</legend>
              <div className="a-cols"><div className="a-cols-grid">
                {([['headerBg', 'Header band'], ['accent', 'Accent line'], ['buttonBg', 'Button'], ['buttonText', 'Button text'], ['headingColor', 'Headings'], ['textColor', 'Body text']] as const).map(([k, l]) => <label key={k}><span className="a-label">{l}</span><div className="flex gap-2"><input type="color" value={brand[k]} onChange={(e) => setB({ [k]: e.target.value } as any)} className="h-9 w-12 shrink-0 rounded" aria-label={l} /><input className="a-input font-mono" value={brand[k]} onChange={(e) => setB({ [k]: e.target.value } as any)} maxLength={7} /></div></label>)}
              </div></div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">Text style</legend>
              <div className="a-cols"><div className="a-cols-grid">
                <label><span className="a-label">Font</span><select className="a-input" value={brand.fontFamily} onChange={(e) => setB({ fontFamily: e.target.value })}>{FONTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label><span className="a-label">Text size: {brand.fontSize}px</span><input type="range" min={14} max={19} value={brand.fontSize} onChange={(e) => setB({ fontSize: Number(e.target.value) })} className="w-full" /></label>
              </div></div>
              <p className="text-xs text-slate-500">Email apps only show a few safe fonts, so these are the ones that look right everywhere.</p>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">Nursery details in the footer</legend>
              <Bi label="Footer text" help="Small print at the bottom of every email." value={brand.footerText} onChange={(v) => setB({ footerText: v })} rows={3} vars={['nurseryName']} />
              <Bi label="Address" value={brand.address} onChange={(v) => setB({ address: v })} rows={2} />
              <div className="a-cols"><div className="a-cols-grid">
                <label><span className="a-label">Mobile / phone</span><input className="a-input" dir="ltr" inputMode="tel" placeholder="+971 50 000 0000" value={brand.phone} onChange={(e) => setB({ phone: e.target.value })} maxLength={40} /></label>
                <label><span className="a-label">Contact email</span><input className="a-input" dir="ltr" type="email" placeholder="hello@yournursery.ae" value={brand.email} onChange={(e) => setB({ email: e.target.value })} maxLength={120} /></label>
              </div></div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">Social media (shown as icons)</legend>
              <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">Icon colours:</span>{(['brand', 'dark'] as const).map((st) => <button type="button" key={st} onClick={() => setB({ socialStyle: st })} aria-pressed={brand.socialStyle === st} className={`a-btn a-btn-sm ${brand.socialStyle === st ? 'a-btn-primary' : ''}`}>{st === 'brand' ? 'Each brand’s colour' : 'One dark colour'}</button>)}</div>
              <div className="grid gap-2 sm:grid-cols-2">{SOCIAL.map((k) => (
                <label key={k} className="flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100" title={k}><svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={brand.social[k] ? '#1f4d2b' : '#94a3b8'} aria-hidden>{SOCIAL_PATHS[k] ? <path d={SOCIAL_PATHS[k]} /> : <circle cx="12" cy="12" r="9" />}</svg></span>
                  <input className="a-input" dir="ltr" placeholder={SOCIAL_HINT[k] ?? `${k} link (https://…)`} value={brand.social[k] ?? ''} onChange={(e) => setB({ social: { ...brand.social, [k]: e.target.value } })} aria-label={`${k} link`} /></label>))}</div>
              <p className="text-xs text-slate-500">Leave a box empty to hide that icon. Only icons with a link appear in the email.</p>
            </fieldset>
            {brandBlocked && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Fill in both English and Arabic for the footer text (and the address, if used).</p>}
            <div className="flex gap-2"><button className="a-btn a-btn-primary" disabled={!brandDirty || brandBlocked || busy} onClick={saveBrand}>{busy ? 'Saving…' : 'Save brand'}</button>{brandDirty && <button className="a-btn" onClick={() => setBrand(brand0)}>Discard changes</button>}</div>
          </>)}
        </div>

        <div className="a-card space-y-3 lg:sticky lg:top-16 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="a-h2 !mb-0">Live preview</h2>{pv && <span className="text-xs text-slate-400">updating…</span>}
            <button className="a-btn a-btn-sm" onClick={() => setPopup(true)} aria-label="Open large preview" title="Open large preview"><Eye className="h-4 w-4" />Large view</button>
            <div className="ms-auto flex gap-1">
              {(['en', 'ar'] as const).map((l) => <button key={l} onClick={() => setLocale(l)} className={`a-btn a-btn-sm ${locale === l ? 'a-btn-primary' : ''}`}>{l === 'en' ? 'EN' : 'AR'}</button>)}
              <button onClick={() => setDevice('desktop')} className={`a-btn a-btn-sm ${device === 'desktop' ? 'a-btn-primary' : ''}`} aria-label="Desktop"><Monitor className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDevice('mobile')} className={`a-btn a-btn-sm ${device === 'mobile' ? 'a-btn-primary' : ''}`} aria-label="Mobile"><Smartphone className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <p className="truncate rounded bg-slate-50 px-3 py-1.5 text-xs"><span className="text-slate-500">Subject: </span><strong>{subject}</strong></p>
          <div className="overflow-hidden rounded-xl border bg-slate-100 p-2">
            {html ? <iframe title="Email preview" sandbox="" srcDoc={html} className="mx-auto block h-[560px] rounded bg-white transition-all" style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: '100%' }} /> : <Skel className="h-[560px]" />}
          </div>
          <p className="text-xs text-slate-500">Preview uses sample values for placeholders. Real emails fill in the real details.</p>
          <div className="flex gap-2"><input className="a-input" type="email" placeholder="Send a test to… (your email)" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Test email address" /><button className="a-btn shrink-0 whitespace-nowrap" disabled={busy || !/^\S+@\S+\.\S+$/.test(to)} onClick={sendTest}><Send className="h-4 w-4" />Test</button></div>
        </div>
      </div>
      {popup && <EmailPreviewModal title={`${draft.name}: how it looks`} onClose={() => setPopup(false)} load={async (l) => { const r = await adminFetch(`/admin/email/templates/${key}/preview`, { method: 'POST', body: JSON.stringify({ locale: l, draft: { subject: draft.subject, heading: draft.heading, body: draft.body, buttonLabel: draft.buttonLabel, enabled: draft.enabled }, brand }) }); if (!r.ok) throw new Error(await describeError(r)); const j = await r.json(); return { subject: j.subject, html: j.html }; }} />}
      {pick && <MediaPicker onClose={() => setPick(false)} onPick={(m) => { setB({ logoUrl: m.url, showLogo: true }); setPick(false); }} />}
    </div>
  );
}

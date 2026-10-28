'use client';
import { useEffect, useRef, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { Help } from '@/components/admin/Help';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

type View = {
  cloudinary: { enabled: boolean; cloudName: string; apiKey: string; folder: string; hasApiSecret: boolean; apiSecretHint: string };
  resend: { enabled: boolean; fromEmail: string; fromName: string; replyTo: string; hasApiKey: boolean; apiKeyHint: string };
  google: { hasTranslateKey: boolean; translateKeyHint: string };
};
type Cl = { enabled: boolean; cloudName: string; apiKey: string; apiSecret: string; folder: string };
type Rs = { enabled: boolean; apiKey: string; fromEmail: string; fromName: string; replyTo: string };
const L = ({ t, help, req }: { t: string; help: string; req?: boolean }) => <span className="a-label">{t}{req && <span className="a-req">*</span>}<Help text={help} align="left" /></span>;

export default function IntegrationsPage() {
  const toast = useToast();
  const [v, setV] = useState<View | null>(null);
  const [denied, setDenied] = useState('');
  const [cl, setCl] = useState<Cl>({ enabled: false, cloudName: '', apiKey: '', apiSecret: '', folder: 'sevenoaks' });
  const [rs, setRs] = useState<Rs>({ enabled: false, apiKey: '', fromEmail: '', fromName: '', replyTo: '' });
  const base = useRef({ cl: '', rs: '' });
  const [errC, setErrC] = useState<Record<string, string>>({});
  const [errR, setErrR] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [gKey, setGKey] = useState('');
  const [errG, setErrG] = useState('');

  const apply = (d: View) => {
    setV(d);
    const c = { enabled: d.cloudinary.enabled, cloudName: d.cloudinary.cloudName, apiKey: d.cloudinary.apiKey, apiSecret: '', folder: d.cloudinary.folder };
    const r = { enabled: d.resend.enabled, apiKey: '', fromEmail: d.resend.fromEmail, fromName: d.resend.fromName, replyTo: d.resend.replyTo };
    setCl(c); setRs(r); base.current = { cl: JSON.stringify(c), rs: JSON.stringify(r) };
  };
  useEffect(() => { adminFetch('/admin/integrations').then(async (r) => (r.ok ? apply(await r.json()) : setDenied(await describeError(r)))); }, []);
  const dirtyC = JSON.stringify(cl) !== base.current.cl, dirtyR = JSON.stringify(rs) !== base.current.rs;
  useDirtyFlag(!!v && (dirtyC || dirtyR || !!gKey));

  const checkC = () => {
    const e: Record<string, string> = {};
    if (cl.enabled || cl.cloudName || cl.apiKey || cl.apiSecret) {
      if (!/^[a-zA-Z0-9_-]{2,60}$/.test(cl.cloudName)) e.cloudName = 'Letters, numbers, - and _ only (as shown at the top of your Cloudinary dashboard)';
      if (!/^\d{6,24}$/.test(cl.apiKey)) e.apiKey = 'The API key is a number with 15 digits';
      if (!v?.cloudinary.hasApiSecret && !cl.apiSecret) e.apiSecret = 'Paste your API secret';
    }
    if (!/^[a-z0-9_-]{1,40}$/i.test(cl.folder)) e.folder = 'Letters, numbers, - and _ only';
    setErrC(e); return e;
  };
  const checkR = () => {
    const e: Record<string, string> = {};
    if (rs.enabled || rs.apiKey || rs.fromEmail) {
      if (!v?.resend.hasApiKey && !rs.apiKey) e.apiKey = 'Paste your Resend API key';
      else if (rs.apiKey && !/^re_[A-Za-z0-9_]{10,}$/.test(rs.apiKey)) e.apiKey = 'Resend keys start with re_';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rs.fromEmail)) e.fromEmail = 'Enter a valid email address on your verified domain';
    }
    if (rs.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rs.replyTo)) e.replyTo = 'Enter a valid email address';
    setErrR(e); return e;
  };

  async function save(which: 'cloudinary' | 'resend') {
    const e = which === 'cloudinary' ? checkC() : checkR();
    if (Object.keys(e).length) return toast.error('Not saved: please fix the fields marked in red.');
    setBusy(which);
    const r = await adminFetch('/admin/integrations', { method: 'PUT', ...jsonBody({ [which]: which === 'cloudinary' ? cl : rs }) });
    setBusy('');
    if (r.ok) { const d: View = await r.json(); const keep = which === 'cloudinary' ? rs : cl; apply(d); which === 'cloudinary' ? setRs(keep as Rs) : setCl(keep as Cl); toast.success(which === 'cloudinary' ? 'Cloudinary settings saved.' : 'Resend settings saved.'); }
    else toast.error(await describeError(r));
  }
  async function saveGoogle(clear = false) {
    if (!clear && !/^AIza[0-9A-Za-z_-]{30,60}$/.test(gKey.trim())) { setErrG('Google API keys start with AIza and are about 39 characters long'); return toast.error('Not saved: please check the key.'); }
    setErrG(''); setBusy('google');
    const r = await adminFetch('/admin/integrations', { method: 'PUT', ...jsonBody({ google: clear ? { clearTranslateKey: true } : { translateApiKey: gKey.trim() } }) });
    setBusy('');
    if (r.ok) { setV(await r.json()); setGKey(''); toast.success(clear ? 'Google Translate key removed.' : 'Google Translate key saved. Use “Test connection” to check it.'); } else toast.error(await describeError(r));
  }
  async function test(path: string, name: string) {
    setBusy(name);
    const r = await adminFetch(path, { method: 'POST' });
    setBusy('');
    if (!r.ok) return toast.error(await describeError(r));
    const j = await r.json();
    j.ok ? toast.success(j.message) : toast.error(j.message);
  }

  if (denied) return <div className="a-card"><p className="a-err">{denied}</p></div>;
  if (!v) return <p>Loading…</p>;
  const ready = (b: boolean) => <span className={`a-badge ${b ? 'a-badge-ok' : 'a-badge-warn'}`}>{b ? 'Connected' : 'Not connected'}</span>;

  return (
    <div className="space-y-6">
      <PageBar title="Integrations" help="Connect outside services. Keys are stored encrypted and never shown again after you save them." />
      <p className="a-sub !mb-0">Leave a secret box empty to keep the one already saved.</p>

      <section className="a-card space-y-4">
        <h2>Cloudinary: photo storage {ready(!!(v.cloudinary.enabled && v.cloudinary.hasApiSecret))}<Help text="Cloudinary stores and delivers your photos quickly. Create a free account at cloudinary.com, then copy the three values from Dashboard → API Keys." align="left" /></h2>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#1f4d2b]" checked={cl.enabled} onChange={(e) => setCl({ ...cl, enabled: e.target.checked })} />Use Cloudinary for photos</label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><L t="Cloud name" req help="Shown at the top of your Cloudinary dashboard, e.g. demo-sevenoaks." /><input className="a-input" aria-invalid={!!errC.cloudName} value={cl.cloudName} onChange={(e) => setCl({ ...cl, cloudName: e.target.value })} />{errC.cloudName && <p className="a-err">{errC.cloudName}</p>}</label>
          <label><L t="API key" req help="A 15-digit number from Dashboard → API Keys." /><input className="a-input" inputMode="numeric" autoComplete="off" aria-invalid={!!errC.apiKey} value={cl.apiKey} onChange={(e) => setCl({ ...cl, apiKey: e.target.value })} />{errC.apiKey && <p className="a-err">{errC.apiKey}</p>}</label>
          <label><L t={`API secret ${v.cloudinary.hasApiSecret ? `(saved: ${v.cloudinary.apiSecretHint})` : ''}`} req={!v.cloudinary.hasApiSecret} help="The secret next to your API key. It is encrypted when saved and can never be viewed again." /><input className="a-input" type="password" autoComplete="new-password" aria-invalid={!!errC.apiSecret} placeholder={v.cloudinary.hasApiSecret ? 'Leave empty to keep the saved secret' : ''} value={cl.apiSecret} onChange={(e) => setCl({ ...cl, apiSecret: e.target.value })} />{errC.apiSecret && <p className="a-err">{errC.apiSecret}</p>}</label>
          <label><L t="Folder name" help="Photos are stored inside this folder in your Cloudinary account." /><input className="a-input" aria-invalid={!!errC.folder} value={cl.folder} onChange={(e) => setCl({ ...cl, folder: e.target.value })} />{errC.folder && <p className="a-err">{errC.folder}</p>}</label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="a-btn a-btn-primary" disabled={!!busy || !dirtyC} onClick={() => save('cloudinary')}>{busy === 'cloudinary' ? 'Saving…' : 'Save'}</button>
          <button className="a-btn" disabled={!!busy || dirtyC} title={dirtyC ? 'Save first, then test' : ''} onClick={() => test('/admin/integrations/test-cloudinary', 'tc')}>{busy === 'tc' ? 'Testing…' : 'Test connection'}</button>
        </div>
      </section>

      <section className="a-card space-y-4">
        <h2>Resend: email {ready(!!(v.resend.enabled && v.resend.hasApiKey))}<Help text="Resend sends the invitation and password-reset emails. Create an account at resend.com, verify your domain, then create an API key." align="left" /></h2>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#1f4d2b]" checked={rs.enabled} onChange={(e) => setRs({ ...rs, enabled: e.target.checked })} />Send emails with Resend</label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><L t={`API key ${v.resend.hasApiKey ? `(saved: ${v.resend.apiKeyHint})` : ''}`} req={!v.resend.hasApiKey} help="Starts with re_. Created in Resend → API Keys. Encrypted when saved." /><input className="a-input" type="password" autoComplete="new-password" aria-invalid={!!errR.apiKey} placeholder={v.resend.hasApiKey ? 'Leave empty to keep the saved key' : 're_…'} value={rs.apiKey} onChange={(e) => setRs({ ...rs, apiKey: e.target.value })} />{errR.apiKey && <p className="a-err">{errR.apiKey}</p>}</label>
          <label><L t="Sender email" req help="Emails are sent from this address. It must be on a domain you verified in Resend, e.g. no-reply@yourdomain.ae." /><input className="a-input" type="email" aria-invalid={!!errR.fromEmail} value={rs.fromEmail} onChange={(e) => setRs({ ...rs, fromEmail: e.target.value })} />{errR.fromEmail && <p className="a-err">{errR.fromEmail}</p>}</label>
          <label><L t="Sender name" help="The name people see, e.g. Seven Oaks British Nursery." /><input className="a-input" value={rs.fromName} onChange={(e) => setRs({ ...rs, fromName: e.target.value })} /></label>
          <label><L t="Reply-to email (optional)" help="Where replies go if someone answers an email." /><input className="a-input" type="email" aria-invalid={!!errR.replyTo} value={rs.replyTo} onChange={(e) => setRs({ ...rs, replyTo: e.target.value })} />{errR.replyTo && <p className="a-err">{errR.replyTo}</p>}</label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="a-btn a-btn-primary" disabled={!!busy || !dirtyR} onClick={() => save('resend')}>{busy === 'resend' ? 'Saving…' : 'Save'}</button>
          <button className="a-btn" disabled={!!busy || dirtyR} title={dirtyR ? 'Save first, then test' : ''} onClick={() => test('/admin/integrations/test-resend', 'tr')}>{busy === 'tr' ? 'Sending…' : 'Send a test email to me'}</button>
        </div>
      </section>

      <section className="a-card space-y-4">
        <h2>Google Translate: English → Arabic {ready(v.google.hasTranslateKey)}<Help text="With this connected, every text box that has English and Arabic gets a “Translate to Arabic” button, and each page has “Translate all missing Arabic”. You can always edit the result." align="left" /></h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm text-slate-600">
          <li>Open <b>console.cloud.google.com</b>, create or choose a project, and switch on billing (the first 500,000 characters each month are free).</li>
          <li>Go to <b>APIs &amp; Services → Library</b>, search <b>Cloud Translation API</b> and press <b>Enable</b>.</li>
          <li>Go to <b>APIs &amp; Services → Credentials → Create credentials → API key</b>. Under <b>API restrictions</b> choose <b>Cloud Translation API</b>.</li>
          <li>Paste the key below. It is stored encrypted and cannot be read back.</li>
        </ol>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label><L t={`API key ${v.google.hasTranslateKey ? `(saved: ${v.google.translateKeyHint})` : ''}`} req={!v.google.hasTranslateKey} help="The key created in Google Cloud. Starts with AIza." /><input className="a-input" type="password" autoComplete="new-password" aria-invalid={!!errG} placeholder={v.google.hasTranslateKey ? 'Leave empty to keep the saved key' : 'AIza…'} value={gKey} onChange={(e) => setGKey(e.target.value)} />{errG && <p className="a-err">{errG}</p>}</label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="a-btn a-btn-primary" disabled={!!busy || !gKey} onClick={() => saveGoogle()}>{busy === 'google' ? 'Saving…' : 'Save'}</button>
          <button className="a-btn" disabled={!!busy || !v.google.hasTranslateKey || !!gKey} onClick={() => test('/admin/integrations/test-translate', 'tt')}>{busy === 'tt' ? 'Testing…' : 'Test connection'}</button>
          {v.google.hasTranslateKey && <button className="a-btn a-btn-danger" disabled={!!busy} onClick={() => saveGoogle(true)}>Remove key</button>}
        </div>
      </section>
    </div>
  );
}

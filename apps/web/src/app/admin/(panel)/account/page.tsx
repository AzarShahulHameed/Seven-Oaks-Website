'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageBar } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/admin/Brand';
import { useDialogs } from '@/components/admin/Dialogs';
import { useDirtyFlag, useDirtyGuard } from '@/components/admin/Dirty';
import { ImageCropper } from '@/components/admin/ImageCropper';
import { Help } from '@/components/admin/Help';
import { EmailChange, PasswordChange } from '@/components/admin/AccountSecurity';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const { guard } = useDirtyGuard();
  const [me, setMe] = useState<any>(null);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const { confirm } = useDialogs();
  const fileIn = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [prof, setProf] = useState({ name: '', phone: '' });
  const [profBase, setProfBase] = useState('');
  const [profErr, setProfErr] = useState<Record<string, string>>({});
  const apply = (m: any) => { setMe(m); const p = { name: m.name ?? '', phone: m.phone ?? '' }; setProf(p); setProfBase(JSON.stringify(p)); };
  const load = () => adminFetch('/auth/me').then(async (r) => r.ok && apply(await r.json()));
  useEffect(() => { load(); }, []);
  const profDirty = !!me && JSON.stringify(prof) !== profBase;
  useDirtyFlag(profDirty);
  if (!me) return <p>Loading…</p>;

  const announce = () => window.dispatchEvent(new Event('so-me-changed'));
  async function uploadAvatar(blob: Blob) {
    setCrop(null); setBusy(true);
    const fd = new FormData(); fd.set('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    try {
      const r = await fetch('/api/auth/me/avatar', { method: 'PUT', body: fd, credentials: 'same-origin' });
      if (r.ok) { setMe(await r.json()); announce(); toast.success('Profile photo updated.'); } else toast.error(await describeError(r));
    } catch { toast.error('Cannot reach the server. Check your internet connection and try again.'); }
    setBusy(false);
  }
  async function saveProfile() {
    const e: Record<string, string> = {};
    if (!prof.name.trim()) e.name = 'Please enter your name';
    if (prof.phone && !/^[0-9+()\-\s]{5,30}$/.test(prof.phone)) e.phone = 'Use digits, spaces, + ( ) - only';
    setProfErr(e);
    if (Object.keys(e).length) return toast.error('Not saved: please fix the fields marked in red.');
    setBusy(true);
    const r = await adminFetch('/auth/me', { method: 'PUT', ...jsonBody({ name: prof.name.trim(), phone: prof.phone.trim() || null }) });
    setBusy(false);
    if (r.ok) { apply(await r.json()); announce(); toast.success('Your details were saved.'); } else toast.error(await describeError(r));
  }

  return (
    <div className="space-y-6">
      <PageBar title="My account" help="Your sign-in security. Two-step verification adds a code from your phone to every sign-in." />
      <section className="a-card">
        <h2>Profile<Help text="Your name and photo are shown in the admin top bar, the team list and the activity log." align="left" /></h2>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2">
            <Avatar url={me.avatarUrl} name={me.name} size={112} />
            <input ref={fileIn} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast.error('Please choose a JPG, PNG or WebP picture.');
              if (f.size > 8 * 1024 * 1024) return toast.error('That picture is larger than 8 MB. Please choose a smaller one.');
              setCrop(f);
            }} />
            <div className="flex gap-2">
              <button className="a-btn a-btn-sm" disabled={busy} onClick={() => fileIn.current?.click()}>{me.avatarUrl ? 'Change photo' : 'Upload photo'}</button>
              {me.avatarUrl && <button className="a-btn a-btn-sm a-btn-danger" disabled={busy} onClick={async () => {
                if (!(await confirm({ title: 'Remove your profile photo?', message: 'Your initials will be shown instead.', confirmLabel: 'Remove', danger: true }))) return;
                const r = await adminFetch('/auth/me/avatar', { method: 'DELETE' });
                if (r.ok) { setMe(await r.json()); announce(); toast.success('Profile photo removed.'); } else toast.error(await describeError(r));
              }}>Remove</button>}
            </div>
            <p className="a-hint max-w-[11rem] text-center">Stored in Cloudinary, so it must be connected in Integrations.</p>
          </div>
          <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
            <label><span className="a-label">Your name<span className="a-req">*</span></span><input className="a-input" aria-invalid={!!profErr.name} value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} />{profErr.name && <p className="a-err">{profErr.name}</p>}</label>
            <label><span className="a-label">Phone (optional)</span><input className="a-input" dir="ltr" aria-invalid={!!profErr.phone} value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} />{profErr.phone && <p className="a-err">{profErr.phone}</p>}</label>
            <label className="sm:col-span-2"><span className="a-label">Email (used to sign in)<Help text="To change your email address, ask an admin." /></span><input className="a-input" value={me.email} disabled /></label>
            <div className="sm:col-span-2"><button className="a-btn a-btn-primary" disabled={!profDirty || busy} onClick={saveProfile}>Save details</button></div>
          </div>
        </div>
      </section>
      {crop && <ImageCropper file={crop} onCancel={() => setCrop(null)} onDone={uploadAvatar} />}

      <section className="a-card space-y-3">
        <h2>Two-step verification {me.totpEnabled ? <span className="a-badge a-badge-ok">On</span> : <span className="a-badge a-badge-warn">Off</span>}<Help text="After your password, you also enter a 6-digit code from an authenticator app. This keeps the website safe even if your password leaks." align="left" /></h2>
        {codes ? (
          <div>
            <p className="text-sm font-semibold text-amber-800">Save these recovery codes now. Each one works once if you lose your phone. They are not shown again.</p>
            <pre className="mt-2 rounded-lg bg-slate-100 p-3 text-sm">{codes.join('\n')}</pre>
            <div className="mt-2 flex gap-2">
              <button className="a-btn" onClick={() => { navigator.clipboard?.writeText(codes.join('\n')); toast.info('Recovery codes copied.'); }}>Copy codes</button>
              <button className="a-btn a-btn-primary" onClick={() => setCodes(null)}>I have saved them</button>
            </div>
          </div>
        ) : me.totpEnabled ? (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const kind = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value;
            const r = await adminFetch(kind === 'off' ? '/auth/2fa/disable' : '/auth/2fa/recovery', { method: 'POST', ...jsonBody({ password: f.get('password'), code: f.get('code') }) });
            if (!r.ok) return toast.error(await describeError(r));
            if (kind === 'off') toast.success('Two-step verification turned off.'); else { setCodes((await r.json()).recoveryCodes); toast.success('New recovery codes created. The old ones no longer work.'); }
            load();
          }}>
            <p className="text-sm text-slate-600">{me.recoveryCodesLeft} recovery code(s) left. To change anything, confirm with your password and a current code.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="a-label">Password</span><input name="password" type="password" required className="a-input" autoComplete="current-password" /></label>
              <label><span className="a-label">Code from your app (or a recovery code)</span><input name="code" required className="a-input" autoComplete="one-time-code" /></label>
            </div>
            <div className="flex gap-2"><button value="new" className="a-btn">Create new recovery codes</button><button value="off" className="a-btn a-btn-danger">Turn off</button></div>
          </form>
        ) : setup ? (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            const r = await adminFetch('/auth/2fa/enable', { method: 'POST', ...jsonBody({ code: new FormData(e.currentTarget).get('code') }) });
            if (!r.ok) return toast.error(await describeError(r));
            setCodes((await r.json()).recoveryCodes); setSetup(null); toast.success('Two-step verification is now on.'); load();
          }}>
            <p className="text-sm">1. Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…). 2. Scan this picture. 3. Type the 6-digit code it shows.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} className="rounded-lg border" />
            <p className="break-all text-xs text-slate-500">Cannot scan? Type this key into the app: <code>{setup.secret}</code></p>
            <label className="block max-w-xs"><span className="a-label">6-digit code</span><input name="code" required inputMode="numeric" pattern="\d{6}" title="6 digits" className="a-input" autoComplete="one-time-code" /></label>
            <div className="flex gap-2"><button className="a-btn a-btn-primary">Turn on</button><button type="button" className="a-btn" onClick={() => setSetup(null)}>Cancel</button></div>
          </form>
        ) : (
          <>
            <p className="text-sm text-slate-600">Strongly recommended for everyone who can edit the website.</p>
            <button className="a-btn a-btn-primary" onClick={async () => { const r = await adminFetch('/auth/2fa/setup', { method: 'POST' }); r.ok ? setSetup(await r.json()) : toast.error(await describeError(r)); }}>Set up two-step verification</button>
          </>
        )}
      </section>

      <EmailChange email={me.email} onChanged={() => { load(); window.dispatchEvent(new Event('so-me-changed')); }} />
      <PasswordChange />

      <button className="a-btn" onClick={() => guard(async () => { await adminFetch('/auth/logout-all', { method: 'POST' }); router.replace('/admin/login'); })}>Sign out of all devices</button>
    </div>
  );
}

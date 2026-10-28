'use client';
import { useEffect, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/admin/Brand';
import { useDialogs } from '@/components/admin/Dialogs';
import { Help } from '@/components/admin/Help';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

type U = { id: string; avatarUrl?: string | null; name: string; email: string; isActive: boolean; totpEnabled: boolean; roles: string[]; lastLogin: string | null };
type Role = { key: string; name: { en: string } };

export default function UsersPage() {
  const toast = useToast();
  const { confirm } = useDialogs();
  const [users, setUsers] = useState<U[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [link, setLink] = useState('');
  const [form, setForm] = useState({ name: '', email: '', roleKey: 'EDITOR' });
  const [denied, setDenied] = useState('');

  const load = async () => {
    try {
      const [a, b] = await Promise.all([adminFetch('/admin/users'), adminFetch('/admin/users/roles').catch(() => null)]);
      if (a.ok) { setUsers(await a.json()); setDenied(''); } else setDenied(await describeError(a));
      if (b?.ok) setRoles(await b.json());
    } catch {
      setDenied('We could not load the users. Check your connection and that the API is running, then try again.');
    }
  };
  useEffect(() => { load(); }, []);

  async function act(fn: () => Promise<Response>, ok: string) {
    setLink('');
    const r = await fn();
    if (r.ok) { toast.success(ok); await load(); } else toast.error(await describeError(r));
    return r;
  }
  if (denied) return <div className="a-card"><p className="a-err">{denied}</p><button type="button" className="a-btn mt-3" onClick={() => { setDenied(''); setUsers(null); load(); }}>Try again</button></div>;
  if (!users) return <p>Loading…</p>;
  const roleName = (k: string) => roles.find((r) => r.key === k)?.name.en ?? k;

  return (
    <div className="space-y-6">
      <PageBar title="Team" help="People who can sign in to this admin. Each person has a role that decides what they can change." />
      {link && <p className="break-all rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">Email is not connected, so send this invitation link to them yourself (valid 72 hours, shown only once):<br /><code>{link}</code></p>}

      <form className="a-card space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Enter a valid email address for the invitation.');
        const r = await adminFetch('/admin/users', { method: 'POST', ...jsonBody(form) });
        if (!r.ok) return toast.error(await describeError(r));
        const d = await r.json();
        if (d.inviteUrl) { setLink(d.inviteUrl); toast.warn('Invitation created, but no email was sent. Copy the link shown on this page.'); } else toast.success(`Invitation emailed to ${form.email}.`);
        setForm({ ...form, name: '', email: '' }); load();
      }}>
        <h2>Invite someone<Help text="They get an email with a link to choose their own password. Choose the role carefully: Editors can change pages; Admins can also manage settings and users." align="left" /></h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label><span className="a-label">Name</span><input required className="a-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span className="a-label">Email</span><input required type="email" className="a-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span className="a-label">Role<Help text="Super Admin: everything. Admin: everything except Super Admins. Editor: pages, photos, menus and search only." /></span><select className="a-input" value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>{roles.map((r) => <option key={r.key} value={r.key}>{r.name.en}</option>)}</select></label>
          <button className="a-btn a-btn-primary">Send invitation</button>
        </div>
      </form>

      <div className="a-card !p-0 overflow-x-auto">
        <table className="a-table">
          <thead><tr><th>Person</th><th>Role</th><th>2-step</th><th>Last sign-in</th><th>Status</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><div className="flex items-center gap-3"><Avatar url={u.avatarUrl} name={u.name} size={36} /><div><div className="font-bold">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></div></td>
                <td><select className="a-input !w-auto" aria-label={`Role for ${u.name}`} value={u.roles[0] ?? ''} onChange={(e) => act(() => adminFetch(`/admin/users/${u.id}`, { method: 'PUT', ...jsonBody({ roleKey: e.target.value }) }), `${u.name} is now ${roleName(e.target.value)}. They must sign in again.`)}>
                  {!roles.some((r) => r.key === u.roles[0]) && <option value={u.roles[0]}>{u.roles[0]}</option>}
                  {roles.map((r) => <option key={r.key} value={r.key}>{r.name.en}</option>)}</select></td>
                <td>{u.totpEnabled ? <span className="a-badge a-badge-ok">On</span> : <span className="a-badge a-badge-warn">Off</span>}</td>
                <td className="whitespace-nowrap">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                <td>{u.isActive ? <span className="a-badge a-badge-ok">Active</span> : <span className="a-badge a-badge-bad">Disabled</span>}</td>
                <td className="space-x-1 whitespace-nowrap text-end">
                  <button className="a-btn a-btn-sm" onClick={async () => {
                    if (u.isActive && !(await confirm({ title: `Disable ${u.name}?`, message: 'They are signed out and cannot sign in until you enable them again.', confirmLabel: 'Disable', danger: true }))) return;
                    act(() => adminFetch(`/admin/users/${u.id}`, { method: 'PUT', ...jsonBody({ isActive: !u.isActive }) }), u.isActive ? `${u.name} disabled.` : `${u.name} enabled.`);
                  }}>{u.isActive ? 'Disable' : 'Enable'}</button>
                  {u.totpEnabled && <button className="a-btn a-btn-sm" onClick={async () => { if (await confirm({ title: `Reset two-step verification for ${u.name}?`, message: 'It is switched off and they are signed out. Use this if they lost their phone.', confirmLabel: 'Reset 2-step' })) act(() => adminFetch(`/admin/users/${u.id}/reset-2fa`, { method: 'POST' }), 'Two-step verification reset.'); }}>Reset 2-step</button>}
                  <button className="a-btn a-btn-sm" onClick={() => act(() => adminFetch(`/admin/users/${u.id}/revoke-sessions`, { method: 'POST' }), `${u.name} was signed out everywhere.`)}>Sign out</button>
                  <button className="a-btn a-btn-sm a-btn-danger" onClick={async () => { if (await confirm({ title: `Delete ${u.name}?`, message: 'The account is removed. Their past activity stays in the Activity log.', confirmLabel: 'Delete user', danger: true })) act(() => adminFetch(`/admin/users/${u.id}`, { method: 'DELETE' }), `${u.name} deleted.`); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="a-hint">Changing someone’s role or status signs them out so the new permissions apply. A session that is already open can keep working for up to 15 minutes.</p>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Help } from '@/components/admin/Help';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

export default function PagesList() {
  const toast = useToast();
  const [rows, setRows] = useState<any[] | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const load = () => adminFetch('/admin/pages').then(async (r) => (r.ok ? setRows(await r.json()) : toast.error(await describeError(r))));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="space-y-6">
      <PageBar title="Pages" help="Every page of your website. Click a page to edit its text, pictures and layout." />
      <div className="a-card !p-0 overflow-hidden">
        <table className="a-table">
          <thead><tr><th>Page</th><th>Address</th><th>Status</th><th>Published version</th><th /></tr></thead>
          <tbody>
            {(rows ?? []).map((p) => (
              <tr key={p.key}>
                <td><Link className="font-bold text-[#1f4d2b] hover:underline" href={`/admin/pages/${p.key}`}>{p.title?.en || p.key}</Link><div className="text-xs text-slate-400" dir="rtl">{p.title?.ar}</div></td>
                <td className="font-mono text-xs text-slate-500">{p.key === 'home' ? '/' : `/${p.key}`}</td>
                <td><span className={`a-badge ${p.status === 'PUBLISHED' ? 'a-badge-ok' : 'a-badge-warn'}`}>{p.status === 'PUBLISHED' ? 'Live' : 'Draft'}</span></td>
                <td>{p.latestVersion ? `v${p.latestVersion}` : '—'}</td>
                <td className="text-end"><Link className="a-btn a-btn-sm" href={`/admin/pages/${p.key}`}><Pencil className="h-3.5 w-3.5" />Edit</Link></td>
              </tr>
            ))}
            {rows === null && <tr><td colSpan={5} className="text-slate-500">Loading…</td></tr>}
          </tbody>
        </table>
      </div>

      <form className="a-card space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const k = key || slugify(name);
        if (!/^[a-z0-9-]{1,60}$/.test(k)) return toast.error('Web address can only use lowercase letters, numbers and dashes.');
        const r = await adminFetch('/admin/pages', { method: 'POST', ...jsonBody({ key: k, title: { en: name, ar: name } }) });
        if (r.ok) { toast.success(`Page “${name}” created as a draft. Open it to add content.`); setName(''); setKey(''); load(); } else toast.error(await describeError(r));
      }}>
        <h2>Add a new page<Help text="Creates an empty draft page. Add blocks to it, then publish. Add it to a menu in Menus so visitors can find it." align="left" /></h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label><span className="a-label">Page name</span><input required className="a-input" value={name} placeholder="e.g. Summer Camp" onChange={(e) => { setName(e.target.value); setKey(slugify(e.target.value)); }} /></label>
          <label><span className="a-label">Web address<Help text="Lowercase letters, numbers and dashes. This becomes /your-address." /></span><input required className="a-input" dir="ltr" pattern="[a-z0-9\-]+" value={key} onChange={(e) => setKey(e.target.value)} /></label>
          <button className="a-btn a-btn-primary"><Plus className="h-4 w-4" />Add page</button>
        </div>
      </form>
    </div>
  );
}

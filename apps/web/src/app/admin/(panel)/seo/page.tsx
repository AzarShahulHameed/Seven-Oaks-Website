'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { Help } from '@/components/admin/Help';
import { useSave } from '@/components/admin/Toast';
import { adminFetch, jsonBody } from '@/lib/admin-api';

const len = (v: any, l: string) => (v?.[l] ?? '').trim().length;

function issues(p: any): string[] {
  const out: string[] = [];
  for (const l of ['en', 'ar']) {
    const t = len(p.metaTitle, l), d = len(p.metaDescription, l);
    if (!t) out.push(`${l.toUpperCase()} title missing`); else if (t > 60) out.push(`${l.toUpperCase()} title long`);
    if (!d) out.push(`${l.toUpperCase()} description missing`); else if (d > 160) out.push(`${l.toUpperCase()} description long`);
  }
  if (!len(p.keywords, 'en')) out.push('EN keywords missing');
  if (!p.hasOgImage) out.push('no share picture');
  if (p.noindex) out.push('hidden from search');
  if (p.status !== 'PUBLISHED') out.push('not published');
  return out;
}

export default function SeoPage() {
  const [pages, setPages] = useState<any[] | null>(null);
  const [reds, setReds] = useState<any[] | null>(null);
  const [form, setForm] = useState({ fromPath: '', toPath: '', statusCode: 301 });
  const { run } = useSave();
  const { confirm } = useDialogs();
  const load = () => {
    adminFetch('/admin/seo/overview').then(async (r) => r.ok && setPages(await r.json()));
    adminFetch('/admin/redirects').then(async (r) => r.ok && setReds(await r.json()));
  };
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <PageBar title="Search (SEO)" help="How your pages look in Google, and where old web addresses should lead." />
      <p className="text-sm text-slate-600">
        Page titles, descriptions, social image, canonical URL and extra structured data are edited on each page. Analytics IDs, cookie text and business structured data live in
        <Link href="/admin/settings" className="mx-1 underline">Settings</Link>(analytics, cookie banner, Google business data, default sharing picture).
      </p>

      <section className="a-card !p-0 overflow-hidden">
        <h2 className="px-4 pt-4">Page overview<Help text="Title and description lengths for each language. Red or amber notes show what to improve." align="left" /></h2>
        <table className="a-table mt-2">
          <thead><tr className="text-slate-500"><th className="p-2 text-start">Page</th><th >EN title / desc</th><th >AR title / desc</th><th >Attention</th></tr></thead>
          <tbody>
            {(pages ?? []).map((p) => {
              const iss = issues(p);
              return (
                <tr key={p.key} className="border-t align-top">
                  <td className="p-2"><Link className="font-semibold text-emerald-800 underline" href={`/admin/pages/${p.key}`}>{p.title?.en || p.key}</Link></td>
                  <td>{len(p.metaTitle, 'en')} / {len(p.metaDescription, 'en')}</td>
                  <td>{len(p.metaTitle, 'ar')} / {len(p.metaDescription, 'ar')}</td>
                  <td className={iss.length ? 'text-amber-700' : 'text-emerald-700'}>{iss.length ? iss.join(' · ') : 'OK'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Aim for titles up to 60 characters and descriptions of 70–160. Both languages need their own text.</p>
      </section>

      <section className="a-card">
        <h2>Redirects<Help text="Send visitors from an old address to a new one so no links break. Pages that change address get one automatically." align="left" /></h2>
        <p className="mb-3 text-sm text-slate-600">When you change a published page’s URL, a 301 from the old address is added automatically. Add your own for old website links.</p>
        <table className="a-table mb-4">
          <thead><tr className="text-slate-500"><th className="p-2 text-start">From</th><th >To</th><th >Type</th><th >Active</th><th /></tr></thead>
          <tbody>
            {(reds ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono text-xs" dir="ltr">{r.fromPath}</td>
                <td className="font-mono text-xs" dir="ltr">{r.toPath}</td>
                <td>{r.statusCode}</td>
                <td><input type="checkbox" checked={r.isActive} aria-label="Active" onChange={async (e) => {
                  await run(() => adminFetch(`/admin/redirects/${r.id}`, { method: 'PUT', ...jsonBody({ fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode, isActive: e.target.checked }) }));
                  load();
                }} /></td>
                <td><button className="a-btn a-btn-sm a-btn-danger" onClick={async () => { if (await confirm({ title: 'Delete this redirect?', message: `Visitors using ${r.fromPath} will no longer be sent to the new address.`, confirmLabel: 'Delete', danger: true })) { await run(() => adminFetch(`/admin/redirects/${r.id}`, { method: 'DELETE' }), 'Redirect deleted'); load(); } }}>Delete</button></td>
              </tr>
            ))}
            {reds?.length === 0 && <tr><td colSpan={5} className="p-2 text-slate-500">No redirects yet.</td></tr>}
          </tbody>
        </table>
        <form className="flex flex-wrap items-center gap-2" onSubmit={async (e) => {
          e.preventDefault();
          const r = await run(() => adminFetch('/admin/redirects', { method: 'POST', ...jsonBody({ ...form, isActive: true }) }), 'Redirect added');
          if (r.ok) { setForm({ fromPath: '', toPath: '', statusCode: 301 }); load(); }
        }}>
          <input required dir="ltr" placeholder="/en/old-page" value={form.fromPath} onChange={(e) => setForm({ ...form, fromPath: e.target.value })} className="a-input !w-auto" />
          <span>→</span>
          <input required dir="ltr" placeholder="/en/new-page or https://…" value={form.toPath} onChange={(e) => setForm({ ...form, toPath: e.target.value })} className="a-input !w-auto" />
          <select value={form.statusCode} onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) })} className="a-input !w-auto">
            <option value={301}>301 permanent</option><option value={302}>302 temporary</option>
          </select>
          <button className="a-btn a-btn-primary">Add redirect</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Paths include the language prefix, e.g. <code>/en/about-us</code>. Redirects apply to URLs that have no page.</p>
      </section>
    </div>
  );
}

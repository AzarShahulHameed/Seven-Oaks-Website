'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, FileClock, Inbox, Trash2, TriangleAlert } from 'lucide-react';
import { Greeting } from '@/components/admin/Greeting';
import { SiteLinkStatus } from '@/components/admin/SiteLink';
import { adminFetch } from '@/lib/admin-api';

type Todo = { label: string; href: string; why: string };
type SavedDraft = { key: string; label: string; href: string; at: number };

const draftHref = (k: string) => (k.startsWith('page:') ? `/admin/pages/${k.slice(5)}` : k.startsWith('gallery:') ? `/admin/galleries/${k.slice(8)}` : k.startsWith('category:') ? `/admin/gallery-categories/${k.slice(9)}` : k.startsWith('entry:') ? `/admin/details/${k.slice(6)}` : '/admin');
const draftLabel = (k: string) => (k.startsWith('page:') ? `Page: ${k.slice(5)}` : k.startsWith('gallery:') ? `Gallery: ${k.slice(8)}` : k.startsWith('category:') ? `Category: ${k.slice(9)}` : k.startsWith('entry:') ? `Detail page: ${k.slice(6)}` : k);

/** Only what needs attention. Nothing is shown for things that are already done. */
export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newLeads, setNewLeads] = useState(0);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  const readDrafts = () => {
    const out: SavedDraft[] = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) ?? ''; if (!k.startsWith('so-draft:')) continue; const id = k.slice(9); let at = 0; try { at = JSON.parse(localStorage.getItem(k) || '{}').at ?? 0; } catch { /* ignore */ } out.push({ key: k, label: draftLabel(id), href: draftHref(id), at }); } } catch { /* storage unavailable */ }
    setDrafts(out.sort((a, b) => b.at - a.at));
  };

  useEffect(() => {
    readDrafts();
    (async () => {
      const get = async (p: string) => { const r = await adminFetch(p); return r.ok ? r.json() : null; };
      const [m, integ, settings, pages, leads] = await Promise.all([get('/auth/me'), get('/admin/integrations'), get('/admin/settings'), get('/admin/pages'), get('/admin/leads?page=1&pageSize=1')]);
      setMe(m); setNewLeads(leads?.counts?.NEW ?? 0);
      const t: Todo[] = [];
      if (integ && !(integ.cloudinary.enabled && integ.cloudinary.hasApiSecret)) t.push({ label: 'Connect Cloudinary', href: '/admin/integrations', why: 'Needed to upload your own photos and videos.' });
      if (integ && !(integ.resend.enabled && integ.resend.hasApiKey)) t.push({ label: 'Connect Resend', href: '/admin/integrations', why: 'Needed to send invitations, password resets and follow-up emails.' });
      const contact = settings?.find((s: any) => s.key === 'public.contact')?.value ?? {};
      if (settings && (!contact.phone || /000 0000/.test(contact.phone) || !contact.email || /\.example$/.test(contact.email))) t.push({ label: 'Add your real phone and email', href: '/admin/settings#public.contact', why: 'The sample details must not go live.' });
      if (m && !m.totpEnabled) t.push({ label: 'Turn on two-step verification', href: '/admin/account', why: 'Protects the website if your password is stolen.' });
      const draftPages = (pages ?? []).filter((p: any) => p.status !== 'PUBLISHED');
      if (draftPages.length) t.push({ label: `${draftPages.length} page${draftPages.length === 1 ? ' is' : 's are'} not published`, href: '/admin/pages', why: 'Visitors cannot see draft pages.' });
      setTodos(t);
    })();
  }, []);

  const discard = (d: SavedDraft) => { try { localStorage.removeItem(d.key); } catch { /* ignore */ } readDrafts(); };
  const first = me?.name ? String(me.name).split(' ')[0] : '';

  return (
    <div className="space-y-5">
      <Greeting name={first || 'there'} />
      <SiteLinkStatus compact />

      {drafts.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4" aria-label="Unsaved work">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-950"><FileClock className="h-5 w-5" />You left some work unsaved</h2>
          <p className="mt-1 text-sm text-amber-900">These changes were kept safely in this browser. Open one to carry on where you stopped.</p>
          <ul className="mt-3 space-y-2">
            {drafts.map((d) => (
              <li key={d.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2.5 text-sm">
                <span className="min-w-0 flex-1"><b>{d.label}</b>{d.at > 0 && <span className="ms-2 text-xs text-slate-500">{new Date(d.at).toLocaleString()}</span>}</span>
                <Link href={d.href} className="a-btn a-btn-sm a-btn-primary">Resume<ArrowRight className="h-3.5 w-3.5" /></Link>
                <button className="a-btn a-btn-sm" onClick={() => discard(d)} aria-label={`Discard saved draft: ${d.label}`}><Trash2 className="h-3.5 w-3.5" />Discard</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(newLeads > 0 || todos.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {newLeads > 0 && (
            <Link href="/admin/leads" className="a-card flex items-center gap-4 transition hover:border-[#1f4d2b] hover:shadow-md">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e6f0e1] text-[#1f4d2b]"><Inbox className="h-6 w-6" /></span>
              <span><span className="block text-2xl font-extrabold tabular-nums">{newLeads}</span><span className="text-sm text-slate-600">new enquir{newLeads === 1 ? 'y' : 'ies'} waiting for a reply</span></span>
              <ArrowRight className="ms-auto h-5 w-5 text-slate-400" />
            </Link>
          )}
          {todos.length > 0 && (
            <section className="a-card" aria-label="To do">
              <h2 className="!mb-2 flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-600" />Needs attention</h2>
              <ul className="space-y-1">
                {todos.map((t) => <li key={t.label}><Link href={t.href} className="flex items-start gap-2 rounded-lg p-2 hover:bg-slate-50"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" /><span><span className="font-semibold">{t.label}</span><span className="block text-xs text-slate-500">{t.why}</span></span></Link></li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

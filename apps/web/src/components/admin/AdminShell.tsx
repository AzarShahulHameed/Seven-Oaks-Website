'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, FolderTree, Gauge, Images, FileStack, Inbox, Mail, Send, Languages, Scale, Quote, ExternalLink, FileText, Image as ImageIcon, LayoutDashboard, ListTree, LogOut, Menu, Palette, Plug, ScrollText, Search, Settings, ShieldCheck, Users, X } from 'lucide-react';
import { adminFetch, describeError, startSessionKeeper } from '@/lib/admin-api';
import { useBrand } from '@/lib/use-brand';
import { Avatar, BrandMark } from './Brand';
import { DialogProvider } from './Dialogs';
import { NotificationBell } from './NotificationBell';
import { PageSkeleton } from './Skeleton';
import { DirtyProvider, useDirtyGuard } from './Dirty';
import { ToastProvider } from './Toast';
import { SessionGate } from './SessionGate';

export { useSave } from './Toast';

type Me = { name: string; email: string; avatarUrl?: string | null; totpEnabled: boolean; roles: string[]; perms: string[] };
type Item = { href: string; label: string; icon: any; perm?: string; help: string };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, help: 'Your starting point: setup checklist and shortcuts.' },
    { href: '/admin/leads', label: 'Enquiries & leads', icon: Inbox, perm: 'lead:read', help: 'Parents who sent an enquiry or signed up, with follow-up tracking.' },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:read', help: 'Visitors (with IP address and email), popular pages, traffic sources and devices.' },
    { href: '/admin/campaigns', label: 'Follow-up emails', icon: Send, perm: 'campaign:read', help: 'Send a branded follow-up or celebration email to families who showed interest.' },
  ] },
  { title: 'Website content', items: [
    { href: '/admin/pages', label: 'Pages', icon: FileText, perm: 'page:read', help: 'Edit the words, pictures and layout of every page.' },
    { href: '/admin/galleries', label: 'Galleries', icon: Images, perm: 'entry:read', help: 'Photo and video galleries, each with its own page.' },
    { href: '/admin/gallery-categories', label: 'Gallery categories', icon: FolderTree, perm: 'entry:read', help: 'Group your galleries into categories.' },
    { href: '/admin/details', label: 'Detail pages', icon: FileStack, perm: 'entry:read', help: 'Reusable pages with text, photos, videos, documents and links.' },
    { href: '/admin/testimonials', label: 'Testimonials', icon: Quote, perm: 'testimonial:read', help: 'Parent reviews: approve, feature and choose where they show.' },
    { href: '/admin/media', label: 'Photos', icon: ImageIcon, perm: 'media:read', help: 'Your photo library, with parent-consent tracking for photos of children.' },
    { href: '/admin/menus', label: 'Menus', icon: ListTree, perm: 'menu:read', help: 'The links in the header and footer.' },
  ] },
  { title: 'Look & search', items: [
    { href: '/admin/theme', label: 'Colours & fonts', icon: Palette, perm: 'theme:read', help: 'Change colours, fonts and sizes for the whole site.' },
    { href: '/admin/legal', label: 'Legal & privacy', icon: Scale, perm: 'page:read', help: 'Privacy, cookie, terms, data protection and retention policies, with consent records.' },
    { href: '/admin/seo', label: 'Search (SEO)', icon: Search, perm: 'seo:read', help: 'How the site appears in Google, redirects and page titles.' },
  ] },
  { title: 'Site setup', items: [
    { href: '/admin/settings', label: 'Settings', icon: Settings, perm: 'settings:read', help: 'Contact details, social links, announcement bar, analytics and more.' },
    { href: '/admin/enquiry-form', label: 'Enquiry form', icon: FileText, perm: 'settings:read', help: 'Choose the form fields, programmes, who is notified and how enquiries are routed.' },
    { href: '/admin/email-templates', label: 'Email templates', icon: Mail, perm: 'email:read', help: 'Edit and preview every email the website sends.' },
    { href: '/admin/translation', label: 'Translation usage', icon: Languages, perm: 'integration:read', help: 'Characters translated, remaining quota and cost.' },
    { href: '/admin/usage', label: 'API usage & billing', icon: Gauge, perm: 'integration:read', help: 'Google Maps loads and emails sent this month, against your free allowance, with alerts.' },
    { href: '/admin/integrations', label: 'Integrations', icon: Plug, perm: 'integration:read', help: 'Connect Cloudinary (photos), Resend (email) and Google Translate.' },
  ] },
  { title: 'Team & security', items: [
    { href: '/admin/users', label: 'Users', icon: Users, perm: 'user:read', help: 'Invite people and choose what they can do.' },
    { href: '/admin/roles', label: 'Roles & permissions', icon: ShieldCheck, perm: 'user:read', help: 'What each role can and cannot do.' },
    { href: '/admin/audit', label: 'Activity log', icon: ScrollText, perm: 'audit:read', help: 'Who changed what, and every sign-in.' },
    { href: '/admin/account', label: 'My account', icon: ShieldCheck, help: 'Your password and two-step verification.' },
  ] },
];

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { guard, dirty } = useDirtyGuard();
  const [me, setMe] = useState<Me | null>(null);
  const [fail, setFail] = useState('');
  const [open, setOpen] = useState(false);
  const brand = useBrand();

  const load = () => adminFetch('/auth/me').then(async (r) => {
    if (r.ok) { setMe(await r.json()); setFail(''); }
    else if (r.status === 401) router.replace('/admin/login');
    else setFail(await describeError(r));
  });
  useEffect(() => { load(); const f = () => { load(); }; window.addEventListener('so-me-changed', f); return () => window.removeEventListener('so-me-changed', f); /* eslint-disable-next-line */ }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => startSessionKeeper(), []);
  useEffect(() => { // browser-tab icon follows the favicon saved in Settings
    if (!brand?.faviconUrl) return;
    let l = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    l.href = brand.faviconUrl;
  }, [brand?.faviconUrl]);

  if (fail) return (
    <main className="grid min-h-screen place-items-center p-6 text-center"><div className="a-card max-w-md"><h1 className="text-lg font-bold">We could not open the admin</h1><p className="a-sub mt-1">{fail}</p><button className="a-btn a-btn-primary" onClick={load}>Try again</button></div></main>
  );
  if (!me) return <div className="p-6"><PageSkeleton /></div>;

  const can = (p?: string) => !p || me.roles.includes('SUPER_ADMIN') || me.perms.includes(p);
  const active = (h: string) => (h === '/admin' ? path === '/admin' : path === h || path.startsWith(h + '/'));
  const current = GROUPS.flatMap((g) => g.items).find((i) => active(i.href));
  const signOut = () => guard(async () => { await adminFetch('/auth/logout', { method: 'POST' }); router.replace('/admin/login'); });

  const nav = (
    <nav className="a-nav space-y-0.5 px-3 pb-6" aria-label="Admin">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => can(i.perm));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="a-nav-title">{g.title}</p>
            {items.map((i) => (
              <Link key={i.href} href={i.href} aria-current={active(i.href) ? 'page' : undefined}>
                <i.icon className="h-[18px] w-[18px] shrink-0" aria-hidden /><span className="flex-1">{i.label}</span>
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SessionGate email={me.email} />
      {/* HEADER: fixed, never scrolls away */}
      <header className="z-40 flex h-[4.5rem] shrink-0 items-stretch border-b border-[#163a20] bg-[#1f4d2b] text-white">
        {/* Logo block: exactly as wide as the sidebar so the logo and the menu line up */}
        <div className="flex shrink-0 items-center gap-2 px-3 md:w-64 md:border-e md:border-white/10 md:px-4">
          <button className="rounded-lg p-1.5 hover:bg-white/10 md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Link href="/admin" className="flex min-w-0 items-center" aria-label="Dashboard"><BrandMark on="dark" className="h-10 md:h-11" /></Link>
        </div>
        <p className="hidden items-center ps-6 text-sm font-semibold text-white/85 md:flex">{current?.label ?? 'Admin'}</p>
        <div className="flex flex-1 items-center gap-3 pe-4">
        <div className="ms-auto flex items-center gap-2">
          {dirty && <span className="hidden rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 sm:inline">Unsaved changes</span>}
          <a href="/en" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/10"><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">View website</span></a>
          <NotificationBell />
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"><Avatar url={me.avatarUrl} name={me.name} size={30} /><span className="hidden text-sm font-semibold sm:inline">{me.name}</span></summary>
            <div className="absolute end-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
              <div className="flex items-center gap-3 px-3 py-2"><Avatar url={me.avatarUrl} name={me.name} size={40} /><div className="min-w-0"><p className="truncate text-sm font-bold">{me.name}</p><p className="truncate text-xs text-slate-500">{me.email}</p></div></div>
              <Link href="/admin/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">My account & security</Link>
              <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-100"><LogOut className="h-4 w-4" />Sign out</button>
            </div>
          </details>
        </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* SIDEBAR: fixed on desktop, drawer on phones */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto bg-[#244f31] md:block">
          {nav}
          {!me.totpEnabled && <Link href="/admin/account" className="mx-3 mb-4 block rounded-lg bg-amber-400/20 p-3 text-xs text-amber-100">🔐 Protect your account: turn on two-step verification.</Link>}
        </aside>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 start-0 w-72 overflow-y-auto bg-[#244f31]">
              <div className="flex items-center justify-between p-4 text-white"><BrandMark on="dark" className="h-8" /><button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
              {nav}
            </aside>
          </div>
        )}
        <main id="a-main" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider><DialogProvider><DirtyProvider><Shell>{children}</Shell></DirtyProvider></DialogProvider></ToastProvider>
  );
}

/** Sticky title bar at the top of the content area; stays visible while the page scrolls. */
export function PageBar({ title, help, children, status }: { title: string; help?: string; children?: React.ReactNode; status?: React.ReactNode }) {
  const { dirty } = useDirtyGuard();
  return (
    <div className="a-sticky-bar flex flex-wrap items-center gap-3">
      <h1 className="text-xl font-bold" title={help}>{title}</h1>
      {status}
      {dirty && <span className="a-badge a-badge-warn">Unsaved changes</span>}
      <div className="ms-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

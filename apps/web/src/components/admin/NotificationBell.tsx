'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, FileText, Inbox, KeyRound, Languages, Trash2, Upload, UserPlus } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { Skel } from './Skeleton';

type N = { id: string; type: string; severity: 'info' | 'success' | 'warning' | 'critical' | 'error'; title: string; body?: string | null; link?: string | null; createdAt: string; read: boolean };
const ICON: Record<string, any> = { enquiry: Inbox, lead: UserPlus, upload: Upload, translate: Languages, translation: Languages, content: FileText, login: KeyRound, security: AlertTriangle };
const TONE: Record<string, string> = { info: 'bg-sky-100 text-sky-700', success: 'bg-emerald-100 text-emerald-700', warning: 'bg-amber-100 text-amber-800', critical: 'bg-red-100 text-red-700', error: 'bg-red-100 text-red-700' };

export const ago = (d: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/** Bell with unread counter. Polls every 30 s and when the tab regains focus (near-real-time, no websocket needed). */
export function NotificationBell() {
  const [data, setData] = useState<{ unread: number; items: N[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const box = useRef<HTMLDivElement>(null);
  const load = useCallback(() => adminFetch('/admin/notifications').then(async (r) => { if (r.ok) setData(await r.json()); }).catch(() => {}), []);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 30000);
    const f = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', f);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', f); };
  }, [load]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);

  // Optimistic: update the screen first, then tell the server.
  const read = (ids?: string[]) => {
    setData((d) => d && { unread: ids ? Math.max(0, d.unread - d.items.filter((i) => !i.read && ids.includes(i.id)).length) : 0, items: d.items.map((i) => (!ids || ids.includes(i.id) ? { ...i, read: true } : i)) });
    adminFetch('/admin/notifications/read', { method: 'POST', body: JSON.stringify(ids ? { ids } : {}) }).then((r) => { if (!r.ok) load(); });
  };
  const clear = () => { setData({ unread: 0, items: [] }); adminFetch('/admin/notifications', { method: 'DELETE' }).then((r) => { if (!r.ok) load(); }); };
  const items = (data?.items ?? []).filter((i) => tab === 'all' || !i.read);
  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 hover:bg-white/10" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute end-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-2 w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl" role="dialog" aria-label="Notifications">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <p className="font-bold">Notifications</p>
            <div className="ms-auto flex gap-1">
              <button onClick={() => read()} disabled={!unread} className="a-btn a-btn-sm" title="Mark all as read"><CheckCheck className="h-3.5 w-3.5" />Read all</button>
              <button onClick={clear} disabled={!data?.items.length} className="a-btn a-btn-sm" title="Remove all from your list"><Trash2 className="h-3.5 w-3.5" />Clear</button>
            </div>
          </div>
          <div className="flex gap-1 border-b border-slate-100 px-3 py-2 text-sm">
            {(['all', 'unread'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 font-semibold ${tab === t ? 'bg-[#1f4d2b] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t === 'all' ? 'All' : `Unread${unread ? ` (${unread})` : ''}`}</button>)}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {!data && <div className="space-y-3 p-4">{[0, 1, 2].map((k) => <div key={k} className="flex gap-3"><Skel className="h-9 w-9 !rounded-full" /><div className="flex-1 space-y-2"><Skel className="h-3 w-3/5" /><Skel className="h-3 w-4/5" /></div></div>)}</div>}
            {data && !items.length && <p className="p-8 text-center text-sm text-slate-500">{tab === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}</p>}
            {items.map((n) => {
              const I = ICON[n.type] ?? Bell;
              const inner = (
                <div className={`flex gap-3 px-4 py-3 ${n.read ? '' : 'bg-emerald-50/60'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONE[n.severity] ?? TONE.info}`}><I className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className={`text-sm ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>{n.body && <p className="line-clamp-2 text-xs text-slate-600">{n.body}</p>}<p className="mt-0.5 text-[11px] text-slate-400">{ago(n.createdAt)}</p></div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-label="Unread" />}
                </div>
              );
              return n.link && /^\//.test(n.link)
                ? <Link key={n.id} href={n.link} onClick={() => { read([n.id]); setOpen(false); }} className="block border-b border-slate-50 hover:bg-slate-50">{inner}</Link>
                : <button key={n.id} onClick={() => read([n.id])} className="block w-full border-b border-slate-50 text-start hover:bg-slate-50">{inner}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

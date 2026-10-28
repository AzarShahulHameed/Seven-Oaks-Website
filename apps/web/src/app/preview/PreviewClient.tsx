'use client';
import { useEffect, useState } from 'react';
import type { Bootstrap } from '@/lib/api';
import { Announcement, Footer, Header } from '@/components/chrome';
import { entryKey, Section } from '@/components/sections';
import { EntryView } from '@/components/entries';
import { MotionProvider } from '@/components/motion';

type Msg = { type: 'so-preview'; entry?: any; page: { sections: { type: string; config: any; isVisible: boolean }[] }; locale: 'en' | 'ar' };

export function PreviewClient({ b }: { b: Bootstrap }) {
  const [m, setM] = useState<Msg | null>(null);
  const [tm, setTm] = useState<Record<string, any[]>>({});
  useEffect(() => { Promise.all(['home', 'about', 'testimonials'].map((pl) => fetch(`/api/public/testimonials?place=${pl}`).then((r) => (r.ok ? r.json() : [])).catch(() => []))).then(([a, b2, c2]) => setTm({ home: a, about: b2, testimonials: c2 })); }, []);
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.type === 'so-preview') setM(e.data); };
    window.addEventListener('message', on);
    window.parent.postMessage({ type: 'so-preview-ready' }, location.origin);
    return () => window.removeEventListener('message', on);
  }, []);
  const [ents, setEnts] = useState<Record<string, { list: any[]; cats: any[] }>>({});
  const wanted = [...(m?.page?.sections ?? []), ...((m?.entry?.blocks ?? []) as any[])].filter((s) => s.type === 'entry-list').map((s) => s.config);
  const wantedKey = JSON.stringify([...new Set(wanted.map(entryKey))]);
  useEffect(() => {
    const keys: string[] = JSON.parse(wantedKey);
    keys.forEach((k) => { const [kind, group, limit] = k.split('|'); const get = (kd: string, g: string, l: number) => fetch(`/api/public/entries?kind=${kd}&group=${encodeURIComponent(g)}&limit=${l}`).then((r) => (r.ok ? r.json() : [])).catch(() => []);
      Promise.all([get(kind, group, Number(limit)), kind === 'GALLERY' ? get('CATEGORY', '', 30) : Promise.resolve([])]).then(([list, cats]) => setEnts((x) => ({ ...x, [k]: { list, cats } }))); });
  }, [wantedKey]);
  const locale = m?.locale ?? 'en';
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; }, [locale]);
  if (!m) return <p className="p-8 text-center text-sm opacity-60">Loading preview…</p>;
  return (
    <MotionProvider>
    {/* Links inside the preview are switched off so a click never leaves the page being edited. */}
    <div onClickCapture={(e) => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
      <Announcement locale={locale} b={b} />
      <Header locale={locale} b={b} />
      <main>{m.entry ? null : m.page.sections.filter((s) => s.isVisible !== false).map((s, n) => <Section key={n} n={n} type={s.type} c={s.config} locale={locale} settings={b.settings} data={{ testimonials: tm, entries: ents }} />)}</main>
      {m.entry && <EntryView e={m.entry} related={[]} category={null} locale={locale} parent={m.entry.path && m.entry.path !== 'info' ? { label: String(m.entry.path).replace(/-/g, ' '), href: `/${locale}/${m.entry.path}` } : null}>
        {(m.entry.blocks ?? []).filter((s: any) => s.isVisible !== false).map((s: any, n: number) => <Section key={n} n={n} type={s.type} c={s.config} locale={locale} settings={b.settings} data={{ testimonials: tm, entries: ents }} />)}
      </EntryView>}
      <Footer locale={locale} b={b} />
    </div>
    </MotionProvider>
  );
}

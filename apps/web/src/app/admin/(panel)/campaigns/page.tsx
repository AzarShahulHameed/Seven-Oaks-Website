'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Eye, Mail, Palette, PartyPopper, Plus, Send, Trash2, Users } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { Bi, type I } from '@/components/admin/Bi';
import { useDialogs } from '@/components/admin/Dialogs';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { CampaignDesign } from '@/components/admin/CampaignDesign';
import { EmailPreviewModal } from '@/components/admin/EmailPreviewModal';
import { Help } from '@/components/admin/Help';
import { SkelRows } from '@/components/admin/Skeleton';
import { TranslateButton } from '@/components/admin/TranslateButton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';

type Audience = { kind: 'leads' | 'newsletter' | 'visitors' | 'all' | 'selected'; status: string[]; sinceDays: number; pagePrefix: string; visitorIds: string[]; leadIds: string[] };
type Content = { subject: I; heading: I; body: I; buttonLabel: I; buttonUrl: string; celebrate: boolean; design?: any };
type Draft = { id?: string; name: string; audience: Audience; content: Content };
const E = (): I => ({ en: '', ar: '' });
const STATUS: [string, string][] = [['NEW', 'New'], ['CONTACTED', 'Contacted'], ['TOUR', 'Tour booked'], ['OFFERED', 'Place offered'], ['ENROLLED', 'Enrolled'], ['DECLINED', 'Not proceeding']];
const KINDS: [Audience['kind'], string, string][] = [
  ['visitors', 'Website visitors who gave their email', 'People who accepted cookies, then sent an enquiry or signed up. You can limit it to people who viewed a certain page.'],
  ['leads', 'People who sent an enquiry', 'Parents from the contact and admissions forms who agreed to be contacted.'],
  ['newsletter', 'Newsletter subscribers', 'People who joined your email list.'],
  ['all', 'Everyone above', 'All three groups together, each person once.'],
];
const blank = (): Draft => ({ name: '', audience: { kind: 'visitors', status: [], sinceDays: 0, pagePrefix: '', visitorIds: [], leadIds: [] }, content: { subject: E(), heading: E(), body: E(), buttonLabel: E(), buttonUrl: '', celebrate: false } });

const STARTERS: { key: string; label: string; name: string; content: Omit<Content, 'buttonUrl'> }[] = [
  { key: 'welcome', label: '🎉 Welcome to the family', name: 'Welcome to the Seven Oaks family', content: { celebrate: true,
    subject: { en: 'Join the {{nurseryName}} family 🎉', ar: 'انضموا إلى عائلة {{nurseryName}} 🎉' },
    heading: { en: 'We would love to count you in, {{name}}!', ar: 'يسعدنا أن تكونوا معنا يا {{name}}!' },
    body: { en: 'Thank you for visiting {{nurseryName}} online. Learning with love, growing with care: we would be delighted to welcome your child into our family.\n\nPlaces for the new term are limited. Book a visit to see our classrooms, our garden and our teachers for yourself.', ar: 'شكراً لزيارتكم {{nurseryName}} عبر الإنترنت. كل شجرة سنديان عظيمة تبدأ كبلوطة صغيرة، ويسعدنا أن نرحّب بطفلكم في عائلتنا.\n\nالأماكن للفصل الدراسي الجديد محدودة. احجزوا زيارة لتروا فصولنا وحديقتنا ومعلماتنا بأنفسكم.' },
    buttonLabel: { en: 'Book a visit', ar: 'احجزوا زيارة' } } },
  { key: 'tour', label: '🌳 Come and see us', name: 'Tour invitation', content: { celebrate: false,
    subject: { en: 'Come and meet us at {{nurseryName}}', ar: 'تعالوا لزيارتنا في {{nurseryName}}' },
    heading: { en: 'See Seven Oaks for yourself, {{name}}', ar: 'شاهدوا سيفن أوكس بأنفسكم يا {{name}}' },
    body: { en: 'Photos only tell part of the story. A short visit lets you meet our team, see the children learning and ask us anything.\n\nChoose a day that suits you and we will take care of the rest.', ar: 'الصور تحكي جزءاً من القصة فقط. زيارة قصيرة تتيح لكم لقاء فريقنا ومشاهدة الأطفال وهم يتعلمون وسؤالنا عن أي شيء.\n\nاختاروا اليوم المناسب لكم ونحن نتولى الباقي.' },
    buttonLabel: { en: 'Choose a visit day', ar: 'اختاروا يوم الزيارة' } } },
  { key: 'places', label: '⏳ Places are filling up', name: 'Places filling up', content: { celebrate: false,
    subject: { en: 'Places at {{nurseryName}} are filling up', ar: 'الأماكن في {{nurseryName}} تمتلئ' },
    heading: { en: 'Only a few places are left', ar: 'تبقّت أماكن قليلة' },
    body: { en: 'Hello {{name}},\n\nYou showed an interest in {{nurseryName}} and we wanted you to be the first to know that places for the coming term are filling up.\n\nReply to this email or press the button and our admissions team will help you.', ar: 'مرحباً {{name}}،\n\nأبديتم اهتمامكم بـ {{nurseryName}} ونود أن تكونوا أول من يعلم أن الأماكن للفصل القادم بدأت تمتلئ.\n\nردوا على هذه الرسالة أو اضغطوا الزر وسيساعدكم فريق القبول.' },
    buttonLabel: { en: 'Talk to admissions', ar: 'تحدثوا مع القبول' } } },
];
const STATUS_BADGE: Record<string, string> = { DRAFT: 'a-badge', SENDING: 'a-badge a-badge-warn', SENT: 'a-badge a-badge-ok', PAUSED: 'a-badge a-badge-warn', FAILED: 'a-badge a-badge-bad' };
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Draft', SENDING: 'Sending…', SENT: 'Sent', PAUSED: 'Paused', FAILED: 'Failed' };
const dt = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '–');
const miss = (v: I) => !v.en.trim() || !v.ar.trim();

function Inner() {
  const toast = useToast(); const dlg = useDialogs(); const router = useRouter(); const params = useSearchParams();
  const [list, setList] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const [edit, setEdit] = useState<Draft | null>(null); const [orig, setOrig] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [count, setCount] = useState<any>(null); const [html, setHtml] = useState(''); const [subject, setSubject] = useState(''); const [pvLocale, setPvLocale] = useState<'en' | 'ar'>('en');
  const [popup, setPopup] = useState(false); const [to, setTo] = useState(''); const [busy, setBusy] = useState('');
  const started = useRef(false);

  const loadList = useCallback(() => adminFetch('/admin/campaigns').then(async (r) => { if (r.ok) { setList(await r.json()); setErr(''); } else setErr(await describeError(r)); }), []);
  useEffect(() => { loadList(); adminFetch('/auth/me').then(async (r) => r.ok && setTo((await r.json()).email ?? '')); }, [loadList]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const startNew = useCallback((starter?: (typeof STARTERS)[number]) => {
    const d = blank();
    try { const a = JSON.parse(sessionStorage.getItem('so-campaign-audience') ?? 'null'); if (a?.kind === 'selected') d.audience = { ...d.audience, ...a }; sessionStorage.removeItem('so-campaign-audience'); } catch { /* none */ }
    const s = starter ?? STARTERS[0];
    d.name = s.name; d.content = { ...s.content, buttonUrl: `${origin}/{lang}/admissions` };
    setEdit(d); setOrig(JSON.stringify(d)); setDetail(null);
  }, [origin]);
  useEffect(() => {
    if (started.current) return; started.current = true;
    if (params.get('new')) { startNew(); router.replace('/admin/campaigns'); }
    const o = params.get('open'); if (o) openDetail(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: string) => { const r = await adminFetch(`/admin/campaigns/${id}`); if (r.ok) { setDetail(await r.json()); setEdit(null); } else toast.error(await describeError(r)); };
  useEffect(() => { if (detail?.status !== 'SENDING') return; const t = setInterval(() => openDetail(detail.id), 3000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [detail?.id, detail?.status]);
  const openEdit = async (id: string) => { const r = await adminFetch(`/admin/campaigns/${id}`); if (!r.ok) return toast.error(await describeError(r)); const c = await r.json(); const d: Draft = { id: c.id, name: c.name, audience: { ...blank().audience, ...c.audience }, content: { ...blank().content, ...c.content } }; setEdit(d); setOrig(JSON.stringify(d)); setDetail(null); };

  const dirty = !!edit && JSON.stringify(edit) !== orig;
  const incomplete = !!edit && (miss(edit.content.subject) || miss(edit.content.heading) || miss(edit.content.body) || (!!edit.content.buttonLabel.en.trim() !== !!edit.content.buttonLabel.ar.trim()));
  useDirtyFlag(dirty);

  // live audience count + live preview (debounced)
  const audKey = JSON.stringify(edit?.audience);
  useEffect(() => {
    if (!edit) return; setCount(null);
    const t = setTimeout(async () => { const r = await adminFetch('/admin/campaigns/audience', { method: 'POST', ...jsonBody(edit.audience) }); if (r.ok) setCount(await r.json()); else setCount({ error: await describeError(r) }); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audKey]);
  const contentKey = JSON.stringify(edit?.content);
  useEffect(() => {
    if (!edit) return;
    const t = setTimeout(async () => { const r = await adminFetch('/admin/campaigns/preview', { method: 'POST', ...jsonBody({ content: edit.content, locale: pvLocale }) }); if (r.ok) { const j = await r.json(); setHtml(j.html); setSubject(j.subject); } }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, pvLocale, !!edit]);

  const set = (p: Partial<Draft>) => setEdit((d) => d && { ...d, ...p });
  const setC = (p: Partial<Content>) => setEdit((d) => d && { ...d, content: { ...d.content, ...p } });
  const setA = (p: Partial<Audience>) => setEdit((d) => d && { ...d, audience: { ...d.audience, ...p } });
  const names = ['name', 'nurseryName'];

  const save = async (): Promise<string | null> => {
    if (!edit) return null; setBusy('save');
    const r = await adminFetch(edit.id ? `/admin/campaigns/${edit.id}` : '/admin/campaigns', { method: edit.id ? 'PUT' : 'POST', ...jsonBody({ name: edit.name, audience: edit.audience, content: edit.content }) });
    setBusy('');
    if (!r.ok) { toast.error(await describeError(r)); return null; }
    const id = edit.id ?? (await r.json()).id; setEdit({ ...edit, id }); setOrig(JSON.stringify({ ...edit, id })); loadList(); return id;
  };
  const sendTest = async () => {
    if (!edit) return; setBusy('test');
    const r = await adminFetch('/admin/campaigns/test', { method: 'POST', ...jsonBody({ content: edit.content, locale: pvLocale, to }) });
    setBusy(''); if (r.ok) toast.success(`Test email sent to ${to}`); else toast.error(await describeError(r));
  };
  const send = async () => {
    if (!edit || !count || count.error) return;
    if (!(await dlg.confirm({ title: `Send to ${count.count} ${count.count === 1 ? 'person' : 'people'}?`, message: 'Each person receives the email in their own language, with an unsubscribe link. This cannot be undone once sending starts.', confirmLabel: `Send ${count.count} emails` }))) return;
    const id = await save(); if (!id) return;
    setBusy('send'); const r = await adminFetch(`/admin/campaigns/${id}/send`, { method: 'POST' }); setBusy('');
    if (r.ok) { toast.success('Sending has started. You can leave this page: it continues on its own.'); setOrig(JSON.stringify(edit)); await openDetail(id); loadList(); } else toast.error(await describeError(r));
  };
  const back = async () => { if (dirty && !(await dlg.confirm({ title: 'Leave without saving?', message: 'Your changes to this campaign are not saved.', confirmLabel: 'Leave', danger: true }))) return; setEdit(null); setDetail(null); setOrig(''); loadList(); };

  // ───────────────── list ─────────────────
  if (!edit && !detail) return (
    <div className="space-y-4">
      <PageBar title="Follow-up emails" help="Send a branded email to families who showed interest, for example to celebrate and invite them to join.">
        <button className="a-btn a-btn-primary" onClick={() => startNew()}><Plus className="h-4 w-4" />New email campaign</button>
      </PageBar>
      <div className="a-card"><h2><PartyPopper className="h-4 w-4" />How it works</h2>
        <ol className="mt-2 grid gap-3 text-sm sm:grid-cols-3">{[['1. Choose who', 'People who visited the website and then gave their email, or sent an enquiry, or joined the newsletter. Only people who ticked the agreement box are ever included.'], ['2. Write or pick a message', 'Start from a ready-made celebration email. It is branded with your logo, colours and address, and sent in each person’s language.'], ['3. Preview, test, send', 'Open the eye-icon preview (computer, tablet, phone, English and Arabic), send a test to yourself, then send.']].map(([t, d]) => <li key={t} className="rounded-xl bg-slate-50 p-3"><b>{t}</b><p className="mt-1 text-slate-600">{d}</p></li>)}</ol></div>
      {err && <p className="a-err" role="alert">{err}</p>}
      {!list && !err && <SkelRows rows={4} />}
      {list && list.length === 0 && <p className="py-6 text-center text-slate-500">No campaigns yet. Press “New email campaign”.</p>}
      {list && list.length > 0 && <div className="a-card a-scroll-x !p-0"><table className="a-table min-w-[40rem]"><thead><tr><th>Campaign</th><th>Status</th><th>Delivered</th><th>Created</th><th /></tr></thead><tbody>
        {list.map((c) => <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => (c.status === 'DRAFT' ? openEdit(c.id) : openDetail(c.id))}>
          <td><b>{c.name}</b><span className="block max-w-xs truncate text-xs text-slate-500">{c.subject}</span></td>
          <td><span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status] ?? c.status}</span></td>
          <td className="tabular-nums">{c.status === 'DRAFT' ? '–' : `${c.sent} of ${c.total}`}{c.failed > 0 && <span className="ms-1 text-red-600">({c.failed} failed)</span>}</td>
          <td className="whitespace-nowrap text-xs">{dt(c.createdAt)}<span className="block text-slate-500">{c.createdByName}</span></td>
          <td className="text-end"><button className="a-btn a-btn-sm">{c.status === 'DRAFT' ? 'Edit' : 'View'}</button></td></tr>)}
      </tbody></table></div>}
    </div>
  );

  // ───────────────── detail ─────────────────
  if (detail) {
    const pct = detail.total ? Math.round(((detail.sent + detail.failed + detail.skipped) / detail.total) * 100) : 0;
    return (
      <div className="space-y-4">
        <PageBar title={detail.name} status={<span className={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status] ?? detail.status}</span>}>
          <button className="a-btn" onClick={back}>← All campaigns</button>
          {detail.status === 'PAUSED' && <button className="a-btn a-btn-primary" onClick={async () => { const r = await adminFetch(`/admin/campaigns/${detail.id}/send`, { method: 'POST' }); if (r.ok) { toast.success('Sending resumed'); openDetail(detail.id); } else toast.error(await describeError(r)); }}><Send className="h-4 w-4" />Resume sending</button>}
          <button className="a-btn" onClick={async () => { const r = await adminFetch(`/admin/campaigns/${detail.id}/duplicate`, { method: 'POST' }); if (r.ok) { toast.success('Copied as a new draft'); openEdit((await r.json()).id); } else toast.error(await describeError(r)); }}><Copy className="h-4 w-4" />Duplicate</button>
          {detail.status !== 'SENDING' && <button className="a-btn a-btn-danger" onClick={async () => { if (!(await dlg.confirm({ title: 'Delete this campaign?', message: 'The record of who it was sent to is removed. The emails already sent cannot be recalled.', confirmLabel: 'Delete', danger: true }))) return; const r = await adminFetch(`/admin/campaigns/${detail.id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); setDetail(null); loadList(); } else toast.error(await describeError(r)); }}><Trash2 className="h-4 w-4" /></button>}
        </PageBar>
        <div className="grid gap-3 sm:grid-cols-4">{[['Recipients', detail.total], ['Sent', detail.sent], ['Failed', detail.failed], ['Skipped (unsubscribed)', detail.skipped]].map(([l, n]) => <div key={l as string} className="a-card"><p className="a-label">{l}</p><p className="text-3xl font-extrabold tabular-nums">{n}</p></div>)}</div>
        {(detail.status === 'SENDING' || detail.status === 'PAUSED') && <div className="a-card"><div className="mb-1 flex justify-between text-sm"><b>{detail.status === 'SENDING' ? 'Sending…' : 'Paused'}</b><span>{pct}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#1f4d2b] transition-all" style={{ width: `${pct}%` }} /></div>{detail.status === 'PAUSED' && <p className="a-hint mt-2">Sending stopped, usually because your email plan’s daily limit was reached. Press “Resume sending” (tomorrow, or after raising the limit in your Resend plan).</p>}</div>}
        <div className="a-card a-scroll-x"><h2>Recipients{detail.recipients.length >= 300 ? ' (first 300)' : ''}</h2><table className="a-table mt-2 min-w-[32rem]"><thead><tr><th>Email</th><th>Name</th><th>Language</th><th>Status</th></tr></thead><tbody>{detail.recipients.map((r: any) => <tr key={r.email}><td dir="ltr" className="text-start">{r.email}</td><td>{r.name || '–'}</td><td>{r.locale === 'ar' ? 'Arabic' : 'English'}</td><td><span className={r.status === 'SENT' ? 'a-badge a-badge-ok' : r.status === 'FAILED' ? 'a-badge a-badge-bad' : 'a-badge'}>{r.status === 'SENT' ? 'Sent' : r.status === 'FAILED' ? 'Failed' : r.status === 'SKIPPED' ? 'Skipped' : 'Waiting'}</span>{r.error && <span className="ms-2 text-xs text-red-600">{r.error}</span>}</td></tr>)}</tbody></table></div>
      </div>
    );
  }

  // ───────────────── composer ─────────────────
  const e = edit!;
  const canSend = !incomplete && e.name.trim().length >= 2 && !!count && !count.error && count.count > 0 && !count.tooMany && !!e.content.buttonLabel.en.trim() === !!e.content.buttonUrl.trim();
  return (
    <div className="space-y-4">
      <PageBar title={e.id ? 'Edit campaign' : 'New email campaign'} help="Write once; each person receives it in English or Arabic automatically.">
        <button className="a-btn" onClick={back}>← Back</button>
        <button className="a-btn" onClick={() => setPopup(true)}><Eye className="h-4 w-4" />Preview</button>
        <button className="a-btn" disabled={!dirty || busy === 'save'} onClick={async () => { if (await save()) toast.success('Draft saved'); }}>{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
        <button className="a-btn a-btn-primary" disabled={!canSend || !!busy} onClick={send}><Send className="h-4 w-4" />{count && !count.error ? `Send to ${count.count}` : 'Send'}</button>
      </PageBar>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="space-y-4">
          <section className="a-card space-y-3">
            <h2><Users className="h-4 w-4" />1. Who receives it<Help text="Only people who ticked the agreement box on a form, and who have not unsubscribed, are ever included. You cannot add anyone else." align="left" /></h2>
            <label><span className="a-label">Campaign name (only you see this)</span><input className="a-input" value={e.name} onChange={(ev) => set({ name: ev.target.value })} maxLength={100} /></label>
            {e.audience.kind === 'selected' ? (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm"><b>{e.audience.visitorIds.length + e.audience.leadIds.length} people you selected</b> in the visitor list. <button className="underline" onClick={() => setA({ kind: 'visitors', visitorIds: [], leadIds: [] })}>Choose a group instead</button></div>
            ) : (<>
              <div className="grid gap-2" role="radiogroup" aria-label="Audience">{KINDS.map(([k, l, d]) => <label key={k} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${e.audience.kind === k ? 'border-[#1f4d2b] bg-[#f3f8f0]' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="aud" className="mt-1" checked={e.audience.kind === k} onChange={() => setA({ kind: k })} /><span><b className="block text-sm">{l}</b><span className="text-xs text-slate-600">{d}</span></span></label>)}</div>
              <div className="a-cols"><div className="a-cols-grid">
                <label><span className="a-label">Active in the last<Help text="Only people who enquired or visited within this time." align="left" /></span><select className="a-input" value={e.audience.sinceDays} onChange={(ev) => setA({ sinceDays: Number(ev.target.value) })}>{[[0, 'Any time'], [7, '7 days'], [30, '30 days'], [90, '3 months'], [365, 'Year']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                {(e.audience.kind === 'visitors' || e.audience.kind === 'all') && <label><span className="a-label">Viewed a page starting with<Help text="For example /admissions to reach people who read about admissions. Leave empty for everyone." align="left" /></span><input className="a-input" dir="ltr" placeholder="/admissions" value={e.audience.pagePrefix} onChange={(ev) => setA({ pagePrefix: ev.target.value.trim() })} /></label>}
              </div></div>
              {(e.audience.kind === 'leads' || e.audience.kind === 'all') && <div><span className="a-label">Enquiry stage (leave all unticked for every stage)</span><div className="flex flex-wrap gap-2">{STATUS.map(([k, l]) => <label key={k} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${e.audience.status.includes(k) ? 'border-[#1f4d2b] bg-[#1f4d2b] text-white' : 'border-slate-300 bg-white'}`}><input type="checkbox" className="sr-only" checked={e.audience.status.includes(k)} onChange={() => setA({ status: e.audience.status.includes(k) ? e.audience.status.filter((x) => x !== k) : [...e.audience.status, k] })} />{l}</label>)}</div></div>}
            </>)}
            <div className="rounded-xl bg-slate-50 p-3 text-sm" aria-live="polite">
              {!count && <span className="text-slate-500">Counting…</span>}
              {count?.error && <span className="text-red-600">{count.error}</span>}
              {count && !count.error && <><b>{count.count} {count.count === 1 ? 'person' : 'people'} will receive this.</b>{count.tooMany && <span className="ms-2 text-red-600">That is more than the {count.max} allowed per campaign: narrow it down.</span>}
                {count.sample.length > 0 && <ul className="mt-1 space-y-0.5 text-xs text-slate-600">{count.sample.map((s: any) => <li key={s.email} dir="ltr" className="text-start">{s.name ? `${s.name} · ` : ''}{s.email} <span className="text-slate-400">({s.from}, {s.locale === 'ar' ? 'Arabic' : 'English'})</span></li>)}{count.count > count.sample.length && <li className="text-slate-400">…and {count.count - count.sample.length} more</li>}</ul>}
                {count.count === 0 && <p className="mt-1 text-slate-600">Nobody matches yet. People appear here after they accept cookies and send an enquiry, or join the newsletter.</p>}</>}
            </div>
          </section>

          <section className="a-card space-y-3">
            <div className="flex flex-wrap items-center gap-2"><h2 className="!mb-0"><Mail className="h-4 w-4" />2. The message</h2><div className="ms-auto"><TranslateButton small label="Translate to Arabic" value={e.content} onChange={(v) => setC(v)} help="Fills the Arabic from the English with Google Translate. Read it before sending." /></div></div>
            <div><span className="a-label">Start from a ready-made email</span><div className="flex flex-wrap gap-2">{STARTERS.map((s) => <button key={s.key} type="button" className="a-btn a-btn-sm" onClick={async () => { if (dirty && !(await dlg.confirm({ title: 'Replace the message?', message: 'The subject, heading and message will be replaced by this example. You can edit it afterwards.', confirmLabel: 'Replace' }))) return; setC({ ...s.content, buttonUrl: e.content.buttonUrl || `${origin}/{lang}/admissions` }); if (!e.id) set({ name: s.name }); }}>{s.label}</button>)}</div></div>
            <Bi label="Subject line" value={e.content.subject} onChange={(v) => setC({ subject: v })} vars={names} />
            <Bi label="Heading" value={e.content.heading} onChange={(v) => setC({ heading: v })} vars={names} />
            <Bi label="Message" help="A blank line starts a new paragraph. **bold** makes text bold." value={e.content.body} onChange={(v) => setC({ body: v })} rows={8} vars={names} />
            <Bi label="Button text (optional)" value={e.content.buttonLabel} onChange={(v) => setC({ buttonLabel: v })} />
            <label><span className="a-label">Button goes to<Help text="Use {lang} in the address and it becomes en or ar for each person, for example https://yoursite.com/{lang}/admissions" align="left" /></span><input className="a-input" dir="ltr" placeholder="https://yoursite.com/{lang}/admissions" value={e.content.buttonUrl} onChange={(ev) => setC({ buttonUrl: ev.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={e.content.celebrate} onChange={(ev) => setC({ celebrate: ev.target.checked })} />🎉 Celebration style<Help text="Adds a festive confetti band under the header. {{name}} becomes the person’s first name." align="left" /></label>
            {incomplete && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">Fill in the subject, heading and message in both English and Arabic before sending. Use “Translate to Arabic” above to do it in one click.</p>}
          </section>

          <section className="a-card space-y-3">
            <h2><Palette className="h-4 w-4" />3. Design the look<Help text="Choose colours, a banner picture and where it sits, fonts, button and footer style, and add extra blocks. The preview on the right updates as you go." align="left" /></h2>
            <CampaignDesign value={e.content.design} onChange={(d) => setC({ design: d })} />
          </section>

          <section className="a-card space-y-3">
            <h2><Send className="h-4 w-4" />4. Test, then send</h2>
            <div className="flex flex-wrap gap-2"><input className="a-input !w-auto min-w-[14rem] flex-1" type="email" dir="ltr" placeholder="Send a test to…" value={to} onChange={(ev) => setTo(ev.target.value)} aria-label="Test email address" /><button className="a-btn" disabled={!!busy || incomplete || !/^\S+@\S+\.\S+$/.test(to)} onClick={sendTest}>{busy === 'test' ? 'Sending…' : `Send test (${pvLocale === 'ar' ? 'Arabic' : 'English'})`}</button></div>
            <p className="a-hint">Every email ends with an unsubscribe link. People who use it are never emailed again. Sending is paced (about one email a second) so your email provider is not overloaded; you can close this page while it runs.</p>
          </section>
        </div>

        <aside className="a-card space-y-2 xl:sticky xl:top-20 xl:self-start">
          <div className="flex flex-wrap items-center gap-2"><h2 className="!mb-0">Live preview</h2><div className="ms-auto flex gap-1">{(['en', 'ar'] as const).map((l) => <button key={l} className={`a-btn a-btn-sm ${pvLocale === l ? 'a-btn-primary' : ''}`} onClick={() => setPvLocale(l)}>{l.toUpperCase()}</button>)}<button className="a-btn a-btn-sm" aria-label="Open large preview" onClick={() => setPopup(true)}><Eye className="h-3.5 w-3.5" /></button></div></div>
          <p className="truncate rounded bg-slate-50 px-3 py-1.5 text-xs"><span className="text-slate-500">Subject: </span><b>{subject}</b></p>
          <div className="overflow-hidden rounded-xl border bg-slate-100 p-2">{html ? <iframe title="Email preview" sandbox="" srcDoc={html} className="block h-[34rem] w-full rounded bg-white" /> : <div className="so-shimmer h-[34rem] rounded" />}</div>
        </aside>
      </div>
      {popup && <EmailPreviewModal title={`Preview: ${e.name || 'campaign'}`} onClose={() => setPopup(false)} load={async (locale) => { const r = await adminFetch('/admin/campaigns/preview', { method: 'POST', ...jsonBody({ content: e.content, locale }) }); if (!r.ok) throw new Error(await describeError(r)); return r.json(); }} />}
    </div>
  );
}

export default function CampaignsPage() { return <Suspense><Inner /></Suspense>; }

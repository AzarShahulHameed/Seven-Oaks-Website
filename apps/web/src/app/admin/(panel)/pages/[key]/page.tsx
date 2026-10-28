'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Eye, EyeOff, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { IncompleteGate, useDraft } from '@/components/admin/Dirty';
import { blankFor, type Errors, type FieldDef, SchemaForm, validate, warnings } from '@/components/admin/Fields';
import { Help } from '@/components/admin/Help';
import { JsonEditor } from '@/components/admin/JsonEditor';
import { JsonLdField, SerpPreview } from '@/components/admin/SeoWidgets';
import { TranslateButton } from '@/components/admin/TranslateButton';
import { PreviewModal } from '@/components/admin/PreviewModal';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { SECTION_SCHEMAS } from '@/lib/admin-schemas';

const SEO_FIELDS: FieldDef[] = [
  { k: 'slug', label: 'Web address (URL) of this page', type: 'i18n', help: 'The last part of the page address, e.g. “about-us” gives /en/about-us. Leave empty for the home page. Changing it on a published page adds an automatic redirect from the old address.' },
  { k: 'metaTitle', label: 'Title in Google results', type: 'i18n', max: 60, help: 'Shown as the blue link in Google and in the browser tab. Aim for under 60 characters.' },
  { k: 'metaDescription', label: 'Description in Google results', type: 'i18n', multiline: true, max: 160, help: 'The grey text under the link in Google. Aim for 70–160 characters that make people want to click.' },
  { k: 'keywords', label: 'Search keywords', type: 'i18n', multiline: true, max: 300, help: 'A few words or phrases people might search for, separated by commas, e.g. “nursery in Sharjah, British EYFS, preschool”. Google ignores keywords for ranking, but other search engines and sharing tools may use them.' },
  { k: 'ogImageUrl', label: 'Picture when shared (WhatsApp, Facebook…)', type: 'imageurl', help: 'Use a JPG or PNG about 1200 × 630. Must be an https:// address.' },
  { k: 'canonical', label: 'Canonical address (advanced)', type: 'url', help: 'Leave empty unless this page duplicates another page. It tells Google which address is the main one. Must start with https://' },
  { k: 'noindex', label: 'Hide this page from Google', type: 'bool', help: 'Tick only for pages that should not appear in search results.' },
];
const TITLE_FIELDS: FieldDef[] = [{ k: 'title', label: 'Page name', type: 'i18n', required: true, help: 'The name of the page as you see it in the admin. Also the browser-tab title if you leave the Google title empty.' }];

type Section = { type: string; config: any; isVisible: boolean };
type Page = { key: string; title: any; status: string; seo: any; sections: Section[]; versions: { version: number; createdAt: string }[] };

const summary = (s: Section) => {
  const c = s.config ?? {};
  const x = c.title ?? c.items?.[0]?.value ?? c.paragraphs?.[0];
  return typeof x === 'string' ? x : x?.en || x?.ar || '';
};

export default function PageEditor({ params }: { params: { key: string } }) {
  const { key } = params;
  const toast = useToast();
  const { confirm } = useDialogs();
  const d = useDraft<Page>(`page:${key}`);
  const page = d.value;
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState('');
  const [missing, setMissing] = useState('');
  const [preview, setPreview] = useState(false);
  const autosave = useRef<null | (() => Promise<void>)>(null);
  useEffect(() => { if (!d.dirty) return; const t = setTimeout(() => { autosave.current?.(); }, 30_000); return () => clearTimeout(t); }, [d.value, d.dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    const r = await adminFetch(`/admin/pages/${key}`);
    if (!r.ok) return setMissing(await describeError(r));
    const p = await r.json();
    p.seo = { ...p.seo, keywords: p.seo?.keywords ?? { en: '', ar: '' }, slug: { en: p.seo?.slug?.en ?? '', ar: p.seo?.slug?.ar ?? '' } };
    d.load(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { load(); }, [load]);

  if (missing) return <div className="a-card"><p className="a-err">{missing}</p><Link href="/admin/pages" className="a-btn mt-3">Back to pages</Link></div>;
  if (!page) return <p>Loading…</p>;

  const set = (patch: Partial<Page>) => d.setValue((p) => ({ ...p!, ...patch }));
  const setSection = (i: number, patch: Partial<Section>) => set({ sections: page.sections.map((s, n) => (n === i ? { ...s, ...patch } : s)) });

  // ── validation ──
  const secErrors = page.sections.map((s) => { const sc = SECTION_SCHEMAS[s.type]; return sc ? validate(sc.fields, s.config) : {}; });
  const secWarns = page.sections.map((s) => { const sc = SECTION_SCHEMAS[s.type]; return sc ? warnings(sc.fields, s.config) : {}; });
  const seoErrors: Errors = { ...validate(SEO_FIELDS, page.seo) };
  for (const l of ['en', 'ar'] as const) {
    const sl = page.seo.slug?.[l] ?? '';
    if (sl && !/^[\p{L}\p{N}\-/]+$/u.test(sl)) seoErrors.slug = 'Use only letters, numbers and dashes, with no spaces';
  }
  if (page.seo.canonical && !/^https:\/\//.test(page.seo.canonical)) seoErrors.canonical = 'Must start with https://';
  if (page.seo.ogImageUrl && !/^https:\/\//.test(page.seo.ogImageUrl)) seoErrors.ogImageUrl = 'Must be a full https:// address (not a /seed/ picture)';
  const titleErrors = validate(TITLE_FIELDS, page);
  const isTr = (m: string) => /missing|changed after/i.test(m);
  const trList: string[] = [
    ...Object.entries(warnings(TITLE_FIELDS, page)).filter(([, m]) => isTr(m)).map(([k]) => `Page name`),
    ...Object.entries(warnings(SEO_FIELDS, page.seo)).filter(([, m]) => isTr(m)).map(([k]) => `Search: ${k}`),
    ...secWarns.flatMap((w, n) => Object.entries(w).filter(([, m]) => isTr(m)).map(([k]) => `${SECTION_SCHEMAS[page.sections[n].type]?.label ?? page.sections[n].type} #${n + 1}: ${k.replace(/\.\d+/g, '')}`)),
  ];
  const incomplete = d.dirty && trList.length > 0;
  const problems = Object.keys(titleErrors).length + Object.keys(seoErrors).length + secErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  const firstBad = () => {
    const i = secErrors.findIndex((e) => Object.keys(e).length);
    if (i >= 0) setOpen((o) => new Set(o).add(i));
    setTimeout(() => document.querySelector('[aria-invalid="true"], .a-err')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
  };

  async function saveDraft(): Promise<boolean> {
    setShowErrors(true);
    if (problems) { toast.error(`Not saved: please fix ${problems} problem${problems > 1 ? 's' : ''} marked in red.`); firstBad(); return false; }
    const r = await adminFetch(`/admin/pages/${key}`, { method: 'PUT', ...jsonBody({ title: page!.title, seo: page!.seo, sections: page!.sections }) });
    if (!r.ok) { toast.error(`Could not save. ${await describeError(r)}`); return false; }
    d.markSaved();
    return true;
  }
  autosave.current = async () => {
    if (problems || incomplete || !page) return; // never auto-save something half-finished or invalid
    const r = await adminFetch(`/admin/pages/${key}`, { method: 'PUT', ...jsonBody({ title: page.title, seo: page.seo, sections: page.sections }) });
    if (r.ok) { d.markSaved(); toast.info('Draft saved automatically. Visitors will not see it until you publish.'); }
  };
  async function onSave() { setBusy('save'); if (await saveDraft()) toast.success('Draft saved. Visitors will not see it until you publish.'); setBusy(''); }
  async function onPublish() {
    setBusy('publish');
    if (await saveDraft()) {
      const r = await adminFetch(`/admin/pages/${key}/publish`, { method: 'POST' });
      if (r.ok) { toast.success('Published. The live website updates within a few seconds.'); await load(); }
      else toast.error(`Saved, but not published. ${await describeError(r)}`);
    }
    setBusy('');
  }

  const move = (i: number, dir: number) => {
    const j = i + dir; if (j < 0 || j >= page.sections.length) return;
    const c = [...page.sections]; [c[i], c[j]] = [c[j], c[i]]; set({ sections: c });
    setOpen((o) => new Set([...o].map((k) => (k === i ? j : k === j ? i : k))));
  };
  const toggle = (i: number) => setOpen((o) => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const remove = async (i: number) => {
    const label = SECTION_SCHEMAS[page.sections[i].type]?.label ?? page.sections[i].type;
    if (await confirm({ title: `Delete this “${label}” block?`, message: 'It is removed from the page when you save. You can restore an older version from Version history.', confirmLabel: 'Delete block', danger: true })) {
      set({ sections: page.sections.filter((_, n) => n !== i) });
      setOpen(new Set());
    }
  };
  const addSection = (type: string) => {
    const sc = SECTION_SCHEMAS[type];
    set({ sections: [...page.sections, { type, config: sc ? blankFor(sc.fields) : {}, isVisible: true }] });
    setOpen((o) => new Set(o).add(page.sections.length));
    setAdding(false);
    toast.info(`“${sc?.label ?? type}” added at the bottom. Fill it in, then save.`);
    setTimeout(() => document.getElementById('a-main')?.scrollTo({ top: 1e6, behavior: 'smooth' }), 100);
  };
  const duplicate = (i: number) => { const c = [...page.sections]; c.splice(i + 1, 0, JSON.parse(JSON.stringify(page.sections[i]))); set({ sections: c }); setOpen(new Set([i + 1])); toast.info('Block duplicated just below the original.'); };
  const slugEn = page.seo.slug?.en ?? '';
  const live = `/en${slugEn ? '/' + slugEn : ''}`;

  return (
    <div className="space-y-6">
      <PageBar title={page.title?.en || key} help="Edit this page, then press Save draft to keep your work, or Save & publish to put it live." status={<span className={`a-badge ${page.status === 'PUBLISHED' ? 'a-badge-ok' : 'a-badge-warn'}`}>{page.status === 'PUBLISHED' ? 'Live' : 'Draft'}</span>}>
        <TranslateButton value={{ title: page.title, seo: page.seo, sections: page.sections }} onChange={(v) => set({ title: v.title, seo: v.seo, sections: v.sections })} label="Translate all missing Arabic" help="Fills in Arabic for every English text on this page (titles, search text and all blocks) using Google Translate. Nothing is published until you press Save & publish." />
        <button className="a-btn" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Preview</button>
        <a href={live} target="_blank" rel="noopener noreferrer" className="a-btn"><ExternalLink className="h-4 w-4" />View live</a>
        <button className="a-btn" disabled={!!busy || !d.dirty || incomplete} onClick={onSave}>{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
        <button className="a-btn a-btn-primary" disabled={!!busy || incomplete} title={incomplete ? 'Finish the Arabic translation first' : undefined} onClick={onPublish}>{busy === 'publish' ? 'Publishing…' : 'Save & publish'}</button>
      </PageBar>
      {d.pending && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><span className="flex-1"><b>You left this page without saving.</b> We kept your unsaved changes from {new Date(d.pending.at).toLocaleString()}.</span><button className="a-btn a-btn-sm a-btn-primary" onClick={d.restore}>Restore my changes</button><button className="a-btn a-btn-sm" onClick={d.discardPending}>Discard them</button></div>}
      <IncompleteGate on={incomplete} />
      {incomplete && (
        <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Arabic translation is missing or out of date, so this page cannot be saved yet.</p>
          <ul className="mt-1 list-disc ps-5">{trList.slice(0, 8).map((t, k) => <li key={k}>{t}</li>)}{trList.length > 8 && <li>…and {trList.length - 8} more</li>}</ul>
          <p className="mt-1">Press <strong>Translate all missing Arabic</strong> above, check the result, then save.</p>
        </div>
      )}

      {showErrors && problems > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">There {problems === 1 ? 'is 1 problem' : `are ${problems} problems`} to fix before this page can be saved. They are marked in red below.</div>}

      <section className="a-card space-y-4">
        <h2>Page name & search appearance<Help text="Settings that affect how this page is named and how it appears in Google and when shared." align="left" /></h2>
        <SchemaForm fields={TITLE_FIELDS} value={page} onChange={(v) => set({ title: v.title })} errors={showErrors ? titleErrors : {}} />
        <SchemaForm fields={SEO_FIELDS} value={page.seo} onChange={(v) => set({ seo: { ...page.seo, ...v } })} errors={showErrors ? seoErrors : {}} />
        <SerpPreview title={page.title} metaTitle={page.seo.metaTitle} metaDescription={page.seo.metaDescription} slug={page.seo.slug} />
        <JsonLdField value={page.seo.jsonLd} onChange={(v) => set({ seo: { ...page.seo, jsonLd: v } })} />
      </section>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">Page blocks ({page.sections.length})<Help text="A page is built from blocks stacked from top to bottom. Open a block to edit its words and pictures. Use the arrows to reorder, the eye to hide a block without deleting it." align="left" /></h2>
          <button className="a-btn a-btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add block</button>
        </div>
        <div className="space-y-3">
          {page.sections.map((s, i) => {
            const sc = SECTION_SCHEMAS[s.type];
            const isOpen = open.has(i);
            const nErr = Object.keys(secErrors[i]).length;
            return (
              <div key={i} className={`a-card !p-0 ${nErr && showErrors ? '!border-red-300' : ''} ${!s.isVisible ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <button className="flex min-w-0 flex-1 items-center gap-2 text-start" aria-expanded={isOpen} onClick={() => toggle(i)}>
                    {isOpen ? <ChevronDown className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
                    <span className="a-badge">{i + 1}</span>
                    <span className="min-w-0"><span className="block font-bold">{sc?.label ?? s.type}</span><span className="block truncate text-sm text-slate-500">{summary(s) || 'No heading yet'}</span></span>
                    {!s.isVisible && <span className="a-badge a-badge-warn">Hidden</span>}
                    {nErr > 0 && showErrors && <span className="a-badge a-badge-bad">{nErr} to fix</span>}
                  </button>
                  <div className="flex items-center gap-1">
                    <TranslateButton small label="Arabic" value={s.config} onChange={(v) => setSection(i, { config: v })} />
                    <button className="a-btn a-btn-sm" title="Move up" aria-label="Move block up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button className="a-btn a-btn-sm" title="Move down" aria-label="Move block down" disabled={i === page.sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button className="a-btn a-btn-sm" title={s.isVisible ? 'Hide from the website' : 'Show on the website'} aria-label={s.isVisible ? 'Hide block' : 'Show block'} onClick={() => setSection(i, { isVisible: !s.isVisible })}>{s.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                    <button className="a-btn a-btn-sm" title="Duplicate" aria-label="Duplicate block" onClick={() => duplicate(i)}><Copy className="h-3.5 w-3.5" /></button>
                    <button className="a-btn a-btn-sm a-btn-danger" title="Delete" aria-label="Delete block" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 p-4">
                    {sc ? <>
                      <p className="a-sub">{sc.description}</p>
                      <SchemaForm fields={sc.fields} value={s.config} onChange={(v) => setSection(i, { config: v })} errors={showErrors ? secErrors[i] : {}} warns={secWarns[i]} />
                    </> : <>
                      <p className="a-sub">This block type has no form yet, so it is shown as raw fields.</p>
                      <JsonEditor value={s.config} onChange={(v) => setSection(i, { config: v })} />
                    </>}
                  </div>
                )}
              </div>
            );
          })}
          {page.sections.length === 0 && <div className="a-card text-center text-slate-500">This page has no blocks yet. Press “Add block” to start.</div>}
        </div>
      </div>

      <section className="a-card">
        <h2>Version history<Help text="Every time you publish, a copy is kept. Restoring loads an old copy into the draft; nothing goes live until you publish again." align="left" /></h2>
        <ul className="mt-2 space-y-1 text-sm">
          {page.versions.length === 0 && <li className="text-slate-500">Not published yet.</li>}
          {page.versions.map((v) => (
            <li key={v.version} className="flex items-center gap-3">
              <span>Version {v.version} · {new Date(v.createdAt).toLocaleString()}</span>
              <button className="a-btn a-btn-sm" onClick={async () => {
                if (!(await confirm({ title: `Load version ${v.version} into the draft?`, message: d.dirty ? 'Your unsaved changes on this page will be replaced.' : 'The current draft will be replaced. Nothing goes live until you publish.', confirmLabel: 'Load into draft' }))) return;
                const r = await adminFetch(`/admin/pages/${key}/restore/${v.version}`, { method: 'POST' });
                if (r.ok) { toast.success(`Version ${v.version} loaded into the draft. Review it, then publish.`); await load(); } else toast.error(await describeError(r));
              }}>Restore to draft</button>
            </li>
          ))}
        </ul>
      </section>

      {preview && <PreviewModal pageKey={key} page={{ title: page.title, seo: page.seo, sections: page.sections }} onClose={() => setPreview(false)} />}

      {adding && (
        <div className="a-modal-bg" role="dialog" aria-modal="true" aria-label="Add a block" onMouseDown={(e) => e.target === e.currentTarget && setAdding(false)}>
          <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">What would you like to add?</h2><button className="a-btn a-btn-sm" aria-label="Close" onClick={() => setAdding(false)}><X className="h-4 w-4" /></button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(SECTION_SCHEMAS).map(([t, sc]) => (
                <button key={t} className="rounded-xl border border-slate-200 p-3 text-start hover:border-[#1f4d2b] hover:bg-[#f3f8f0]" onClick={() => addSection(t)}>
                  <span className="block font-bold">{sc.label}</span><span className="text-sm text-slate-600">{sc.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

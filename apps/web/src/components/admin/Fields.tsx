'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, ImageIcon, Images, Plus, Trash2, Video } from 'lucide-react';
import { Help } from './Help';
import { MediaPicker } from './MediaPicker';
import { DocPicker } from './DocPicker';
import { useDialogs } from './Dialogs';
import { useToast } from './Toast';
import { stamp, stateOf, translateTexts } from '@/lib/translate';

// ───────────── field definitions ─────────────
type Base = { k: string; label: string; help?: string; required?: boolean };
export type FieldDef = Base & (
  | { type: 'i18n'; multiline?: boolean; max?: number; placeholder?: string }
  | { type: 'text' | 'url' | 'email' | 'tel'; max?: number; placeholder?: string }
  | { type: 'color' }
  | { type: 'imageurl'; placeholder?: string }
  | { type: 'file'; placeholder?: string }
  | { type: 'number'; min?: number; max?: number; optional?: boolean }
  | { type: 'bool' }
  | { type: 'select'; options: [string, string][] }
  | { type: 'icon' }
  | { type: 'image'; frame?: 'background' | 'side' | 'card' | 'square'; where?: string; caption?: boolean }
  | { type: 'button' }
  | { type: 'i18nlist'; addLabel?: string; multiline?: boolean }
  | { type: 'strings'; addLabel?: string; placeholder?: string }
  | { type: 'list'; item: FieldDef[]; bulkImage?: string; titleKey?: string; addLabel?: string; itemName?: string; min?: number; max?: number }
  | { type: 'object'; fields: FieldDef[] }
);
export type Errors = Record<string, string>;
const E = { en: '', ar: '' };

export const ICONS: [string, string][] = [
  ['heart', 'Heart'], ['sprout', 'Sprout'], ['book', 'Book'], ['lightbulb', 'Light bulb'], ['users', 'People'], ['user', 'Person'], ['message', 'Speech bubble'],
  ['activity', 'Activity'], ['calculator', 'Calculator'], ['globe', 'Globe'], ['palette', 'Palette'], ['calendar', 'Calendar'], ['file', 'Document'],
  ['utensils', 'Food'], ['shield', 'Shield'], ['help', 'Question mark'], ['phone', 'Phone'], ['mail', 'Email'], ['pin', 'Location pin'], ['leaf', 'Leaf'],
  ['info', 'Information'], ['star', 'Star'], ['sun', 'Sun'], ['moon', 'Moon / rest'], ['music', 'Music'], ['smile', 'Smile'], ['sparkles', 'Sparkles'], ['bell', 'Bell'], ['baby', 'Baby'], ['party', 'Celebration'],
  ['shirt', 'Uniform'], ['cake', 'Birthday cake'], ['puzzle', 'Puzzle'], ['trophy', 'Trophy'], ['rocket', 'Rocket'], ['camera', 'Camera'], ['clock', 'Clock'], ['bus', 'Bus'], ['backpack', 'Bag'],
  ['pencil', 'Pencil'], ['bird', 'Bird'], ['rainbow', 'Rainbow'], ['apple', 'Apple'], ['footprints', 'Footprints'], ['school', 'School'], ['doctor', 'Health'], ['water', 'Water drop'], ['trees', 'Trees'],
];
export const BUTTON_STYLES: [string, string][] = [['primary', 'Solid green'], ['outline', 'Outline'], ['light', 'White']];

export function blankFor(fields: FieldDef[]): any {
  const o: any = {};
  for (const f of fields) o[f.k] = blankOne(f);
  return o;
}
function blankOne(f: FieldDef): any {
  switch (f.type) {
    case 'i18n': return { ...E };
    case 'text': case 'url': case 'email': case 'tel': case 'color': case 'imageurl': case 'file': return '';
    case 'number': return f.optional ? '' : (f.min ?? 0);
    case 'bool': return false;
    case 'select': return f.options[0]?.[0] ?? '';
    case 'icon': return 'leaf';
    case 'image': return { url: '', alt: { ...E }, focalX: 50, focalY: 50, fit: 'cover' };
    case 'button': return { label: { ...E }, href: '', variant: 'primary' };
    case 'i18nlist': case 'strings': return [];
    case 'list': return Array.from({ length: f.min ?? 0 }, () => blankFor(f.item));
    case 'object': return blankFor(f.fields);
  }
}

// ───────────── validation ─────────────
const URL_OK = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+|\/[^\s]*|#[^\s]*)?$/i;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const urlError = (v: string) => (URL_OK.test(v.trim()) ? '' : 'Start the address with https:// (outside website) or / (page on this site, like /contact)');

/** Returns { path: message }. Messages ending with "(optional)" style warnings are produced separately by warningsFor. */
export function validate(fields: FieldDef[], value: any, path = ''): Errors {
  const errs: Errors = {};
  const add = (k: string, m: string) => { errs[path + k] = m; };
  for (const f of fields) {
    const v = value?.[f.k];
    const p = (path + f.k);
    switch (f.type) {
      case 'i18n':
        if (f.required && !String(v?.en ?? '').trim()) add(f.k, 'Required (English)');
        else if (f.max && (String(v?.en ?? '').length > f.max || String(v?.ar ?? '').length > f.max)) add(f.k, `Keep it under ${f.max} characters`);
        break;
      case 'text': case 'url': case 'email': case 'tel':
        if (f.required && !String(v ?? '').trim()) add(f.k, 'Required');
        else if (f.type === 'url' && urlError(String(v ?? ''))) add(f.k, urlError(String(v)));
        else if (f.type === 'email' && v && !EMAIL_OK.test(String(v))) add(f.k, 'Enter a valid email address, e.g. name@example.com');
        else if ('max' in f && f.max && String(v ?? '').length > f.max) add(f.k, `Keep it under ${f.max} characters`);
        break;
      case 'imageurl': if (v && urlError(String(v))) add(f.k, urlError(String(v))); break;
      case 'file':
        if (f.required && !String(v ?? '').trim()) add(f.k, 'Please choose a document or paste its address');
        else if (v && urlError(String(v))) add(f.k, urlError(String(v)));
        break;
      case 'color': if (v && !/^#[0-9a-f]{6}$/i.test(String(v))) add(f.k, 'Use a colour like #1f4d2b'); break;
      case 'number':
        if (f.optional && (v === '' || v === null || v === undefined)) break;
        if (v === '' || v === null || Number.isNaN(Number(v))) add(f.k, 'Enter a number');
        else if (f.min !== undefined && Number(v) < f.min) add(f.k, `Must be at least ${f.min}`);
        else if (f.max !== undefined && Number(v) > f.max) add(f.k, `Must be at most ${f.max}`);
        break;
      case 'image':
        if (v?.url && urlError(String(v.url))) add(f.k + '.url', urlError(String(v.url)));
        else if (f.required && !v?.url) add(f.k + '.url', 'Please choose an image');
        if (v?.mobileUrl && urlError(String(v.mobileUrl))) add(f.k + '.mobileUrl', urlError(String(v.mobileUrl)));
        if (v?.tabletUrl && urlError(String(v.tabletUrl))) add(f.k + '.tabletUrl', urlError(String(v.tabletUrl)));
        break;
      case 'button': {
        const hasL = !!(v?.label?.en || v?.label?.ar), hasH = !!v?.href;
        if (hasL && !hasH) add(f.k + '.href', 'Add where this button should go');
        else if (hasH && !hasL) add(f.k + '.label', 'Add the button text');
        else if (hasH && urlError(String(v.href))) add(f.k + '.href', urlError(String(v.href)));
        else if (f.required && !hasL) add(f.k + '.label', 'Required');
        break;
      }
      case 'list':
        if (f.min && (v?.length ?? 0) < f.min) add(f.k, `Add at least ${f.min} item${f.min > 1 ? 's' : ''}`);
        (v ?? []).forEach((it: any, n: number) => Object.assign(errs, validate(f.item, it, `${p}.${n}.`)));
        break;
      case 'object': Object.assign(errs, validate(f.fields, v, `${p}.`)); break;
      case 'strings': (v ?? []).forEach((s: string, n: number) => { if (!String(s).trim()) errs[`${p}.${n}`] = 'Empty: fill it in or remove it'; }); break;
    }
  }
  return errs;
}

/** Soft issues that do not block saving (missing Arabic, missing image description). */
export function warnings(fields: FieldDef[], value: any, path = ''): Errors {
  const w: Errors = {};
  for (const f of fields) {
    const v = value?.[f.k]; const p = path + f.k;
    if (f.type === 'i18n' && v?.en && !v?.ar) w[p] = 'Arabic version is missing';
    if (f.type === 'i18n' && !v?.en && v?.ar) w[p] = 'English version is missing';
    if (f.type === 'i18n' && stateOf(v) === 'stale-manual') w[p] = 'English was changed after the Arabic was written. Check the Arabic still matches.';
    if (f.type === 'i18n' && stateOf(v) === 'stale-auto') w[p] = 'English was changed after the Arabic was translated. Press Translate to update it.';
    if (f.type === 'image' && v?.url && !v?.alt?.en) w[p + '.alt'] = 'Add a short description for accessibility and SEO';
    if (f.type === 'list') (v ?? []).forEach((it: any, n: number) => Object.assign(w, warnings(f.item, it, `${p}.${n}.`)));
    if (f.type === 'object') Object.assign(w, warnings(f.fields, v, `${p}.`));
  }
  return w;
}

// ───────────── rendering ─────────────
type Ctx = { errors: Errors; warns: Errors };
const Label = ({ f, id }: { f: { label: string; help?: string; required?: boolean }; id?: string }) => (
  <label htmlFor={id} className="a-label">{f.label}{f.required && <span className="a-req" aria-hidden>*</span>}{f.help && <Help text={f.help} align="left" />}</label>
);
const Msg = ({ path, c }: { path: string; c: Ctx }) => (
  <>{c.errors[path] && <p className="a-err" role="alert">{c.errors[path]}</p>}{!c.errors[path] && c.warns[path] && <p className="a-warn">{c.warns[path]}</p>}</>
);

export function SchemaForm({ fields, value, onChange, errors = {}, warns = {} }: { fields: FieldDef[]; value: any; onChange: (v: any) => void; errors?: Errors; warns?: Errors }) {
  return <FieldList fields={fields} value={value} onChange={onChange} path="" c={{ errors, warns }} />;
}

function FieldList({ fields, value, onChange, path, c }: { fields: FieldDef[]; value: any; onChange: (v: any) => void; path: string; c: Ctx }) {
  const v = value ?? {};
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldView key={f.k} f={f} value={v[f.k]} path={path + f.k} c={c} onChange={(nv) => onChange({ ...v, [f.k]: nv })} />
      ))}
    </div>
  );
}

function I18nField({ f, value, onChange, path, c, id, bad }: { f: Extract<FieldDef, { type: 'i18n' }>; value: any; onChange: (v: any) => void; path: string; c: Ctx; id: string; bad: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const v = value ?? E;
  const multi = f.multiline;
  const T: any = multi ? 'textarea' : 'input';
  const st = stateOf(v);
  const translate = async () => {
    if (!String(v.en ?? '').trim()) return toast.warn('Type the English first, then translate.');
    setBusy(true);
    try { const [ar] = await translateTexts([v.en]); onChange({ ...v, ar, arSrc: stamp('auto', v.en) }); toast.success('Arabic created. Please read it and fix anything that sounds wrong.'); }
    catch (e: any) { toast.error(e?.message ?? 'Translation failed.'); }
    setBusy(false);
  };
  return (
    <div className="a-pair">
      <Label f={f} id={id} />
      <div className="a-pair-grid">
        <div><span className="mb-0.5 block text-[11px] font-bold text-slate-400">ENGLISH</span><T id={id} aria-invalid={bad} className="a-input" rows={rowsFor(v.en, multi)} placeholder={f.placeholder} value={v.en ?? ''} onChange={(e: any) => onChange({ ...v, en: e.target.value })} /></div>
        <div>
          <span className="mb-0.5 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
            <span>العربية (ARABIC){st === 'auto' && <span className="ms-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">AUTO-TRANSLATED · please review</span>}</span>
            <button type="button" disabled={busy} onClick={translate} className="rounded border border-emerald-700/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50" title="Translate the English into Arabic with Google Translate. You can edit the result.">{busy ? 'Translating…' : v.ar ? '↻ Re-translate' : '✨ Translate to Arabic'}</button>
          </span>
          <T aria-invalid={bad} dir="rtl" lang="ar" className="a-input" rows={rowsFor(v.ar, multi)} value={v.ar ?? ''} onChange={(e: any) => onChange({ ...v, ar: e.target.value, arSrc: stamp('manual', v.en ?? '') })} />
        </div>
      </div>
      {f.max && <p className="a-hint">{(v.en ?? '').length}/{f.max} characters</p>}
      <Msg path={path} c={c} />
    </div>
  );
}

const rowsFor = (s: string, multi?: boolean) => (multi ? Math.min(8, Math.max(3, Math.ceil((s?.length ?? 0) / 55))) : 1);

function FieldView({ f, value, onChange, path, c }: { f: FieldDef; value: any; onChange: (v: any) => void; path: string; c: Ctx }) {
  const id = `f-${path}`;
  const bad = !!c.errors[path];
  switch (f.type) {
    case 'i18n': return <I18nField f={f} value={value} onChange={onChange} path={path} c={c} id={id} bad={bad} />;
    case 'text': case 'url': case 'email': case 'tel':
      return (
        <div>
          <Label f={f} id={id} />
          <input id={id} aria-invalid={bad} className="a-input" type={f.type === 'email' ? 'email' : 'text'} dir={f.type === 'url' || f.type === 'email' || f.type === 'tel' ? 'ltr' : undefined} placeholder={f.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          <Msg path={path} c={c} />
        </div>
      );
    case 'imageurl': return <ImageUrlField f={f} value={value} onChange={onChange} path={path} c={c} />;
    case 'file': return <FileField f={f} value={value} onChange={onChange} path={path} c={c} />;
    case 'color':
      return (
        <div>
          <Label f={f} id={id} />
          <div className="flex items-center gap-2">
            <input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300" />
            <input id={id} aria-invalid={bad} className="a-input !w-32 font-mono" dir="ltr" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          </div>
          <Msg path={path} c={c} />
        </div>
      );
    case 'number':
      return (
        <div>
          <Label f={f} id={id} />
          <input id={id} type="number" min={f.min} max={f.max} aria-invalid={bad} className="a-input !w-32" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
          <Msg path={path} c={c} />
        </div>
      );
    case 'bool':
      return (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1f4d2b]" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="font-semibold">{f.label}{f.help && <> <Help text={f.help} align="left" /></>}</span>
        </label>
      );
    case 'select':
      return (
        <div>
          <Label f={f} id={id} />
          <select id={id} className="a-input !w-auto min-w-[10rem]" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{f.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
      );
    case 'icon':
      return (
        <div>
          <Label f={f} id={id} />
          <select id={id} className="a-input !w-auto min-w-[10rem]" value={value ?? 'leaf'} onChange={(e) => onChange(e.target.value)}>{ICONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
      );
    case 'image': return <ImageField f={f} value={value} onChange={onChange} path={path} c={c} />;
    case 'button': {
      const v = value ?? { label: { ...E }, href: '', variant: 'primary' };
      const set = (patch: object) => onChange({ ...v, ...patch });
      return (
        <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="a-label px-1">{f.label}{f.help && <Help text={f.help} align="left" />}</legend>
          <div className="space-y-3">
            <FieldView f={{ k: 'label', label: 'Button text', type: 'i18n', help: 'The words on the button. Leave empty to hide this button.' }} value={v.label} path={path + '.label'} c={c} onChange={(x) => set({ label: x })} />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <FieldView f={{ k: 'href', label: 'Goes to', type: 'url', placeholder: '/contact or https://…', help: 'Where the button leads. Use /page-name for a page on this site (like /admissions) or a full https:// address.' }} value={v.href} path={path + '.href'} c={c} onChange={(x) => set({ href: x })} />
              <FieldView f={{ k: 'variant', label: 'Style', type: 'select', options: BUTTON_STYLES }} value={v.variant} path={path + '.variant'} c={c} onChange={(x) => set({ variant: x })} />
            </div>
          </div>
        </fieldset>
      );
    }
    case 'i18nlist': return <ListEditor label={f.label} help={f.help} add={f.addLabel ?? 'Add'} items={value ?? []} onChange={onChange} blank={() => ({ ...E })} title={(it) => it?.en || it?.ar || ''} render={(it, n, set) => <FieldView f={{ k: 'x', label: 'Text', type: 'i18n', multiline: f.multiline ?? true }} value={it} path={`${path}.${n}`} c={c} onChange={set} />} path={path} c={c} />;
    case 'strings': return <ListEditor label={f.label} help={f.help} add={f.addLabel ?? 'Add'} items={value ?? []} onChange={onChange} blank={() => ''} title={(it) => String(it ?? '')} render={(it, n, set) => <><input className="a-input" aria-invalid={!!c.errors[`${path}.${n}`]} dir="ltr" placeholder={f.placeholder} value={it ?? ''} onChange={(e) => set(e.target.value)} /><Msg path={`${path}.${n}`} c={c} /></>} path={path} c={c} flat />;
    case 'list': {
      const t = (it: any) => { const x = it?.[f.titleKey ?? 'title'] ?? it?.label ?? it?.name ?? it?.q; return typeof x === 'string' ? x : x?.en || x?.ar || ''; };
      return <ListEditor label={f.label} help={f.help} add={f.addLabel ?? `Add ${f.itemName ?? 'item'}`} itemName={f.itemName} items={value ?? []} min={f.min} max={f.max} onChange={onChange} blank={() => blankFor(f.item)} title={t}
        render={(it, n, set) => <FieldList fields={f.item} value={it} onChange={set} path={`${path}.${n}.`} c={c} />} path={path} c={c}
        bulk={f.bulkImage ? (ms) => ms.map((m: any) => { const b = blankFor(f.item); const tk = f.titleKey ?? 'title'; const cap = { en: m.altText?.en ?? '', ar: m.altText?.ar ?? '' }; return { ...b, [f.bulkImage!]: { ...(b[f.bulkImage!] ?? {}), url: m.url, alt: cap }, ...(f.item.some((x) => x.k === tk && x.type === 'i18n') ? { [tk]: cap } : {}) }; }) : undefined} />;
    }
    case 'object':
      return (
        <fieldset className="rounded-xl border border-slate-200 p-3">
          <legend className="a-label px-1">{f.label}{f.help && <Help text={f.help} align="left" />}</legend>
          <FieldList fields={f.fields} value={value} onChange={onChange} path={`${path}.`} c={c} />
        </fieldset>
      );
  }
}

function FileField({ f, value, onChange, path, c }: { f: Base & { placeholder?: string }; value: any; onChange: (v: any, name?: string) => void; path: string; c: Ctx }) {
  const [pick, setPick] = useState(false);
  return (
    <div>
      <Label f={f} id={`f-${path}`} />
      <div className="flex gap-2">
        <input id={`f-${path}`} className="a-input" aria-invalid={!!c.errors[path]} dir="ltr" placeholder={f.placeholder ?? 'https://… or choose from library'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="a-btn a-btn-sm shrink-0" onClick={() => setPick(true)}>Choose or upload…</button>
      </div>
      <Msg path={path} c={c} />
      {pick && <DocPicker onClose={() => setPick(false)} onPick={(d) => { onChange(d.url, d.filename); setPick(false); }} />}
    </div>
  );
}

function ImageUrlField({ f, value, onChange, path, c }: { f: Base; value: any; onChange: (v: any) => void; path: string; c: Ctx }) {
  const [pick, setPick] = useState(false);
  const bad = !!c.errors[path];
  return (
    <div>
      <Label f={f} id={`f-${path}`} />
      <div className="flex items-center gap-2">
        <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {value && !bad ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-slate-300" aria-hidden />}
        </div>
        <input id={`f-${path}`} className="a-input" aria-invalid={bad} dir="ltr" placeholder="https://… or choose from library" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="a-btn a-btn-sm shrink-0" onClick={() => setPick(true)}>Choose…</button>
      </div>
      <Msg path={path} c={c} />
      {pick && <MediaPicker onClose={() => setPick(false)} onPick={(m) => { onChange(m.url); setPick(false); }} />}
    </div>
  );
}

const FRAME_RATIO = { background: '16 / 7', side: '4 / 3', card: '3 / 2', square: '1 / 1' } as const;
const FRAME_NAME = { background: 'banner', side: 'picture frame', card: 'card', square: 'frame' } as const;
const SHAPES: [string, string, string][] = [['', 'Automatic (best for this block)', ''], ['16/9', 'Wide (16:9)', '16 / 9'], ['4/3', 'Standard (4:3)', '4 / 3'], ['3/2', 'Photo (3:2)', '3 / 2'], ['1/1', 'Square', '1 / 1'], ['3/4', 'Tall (3:4)', '3 / 4'], ['21/9', 'Extra wide (21:9)', '21 / 9']];

function ImageField({ f, value, onChange, path, c }: { f: Extract<FieldDef, { type: 'image' }> & Base; value: any; onChange: (v: any) => void; path: string; c: Ctx }) {
  const toast = useToast();
  const [pick, setPick] = useState<null | 'main' | 'video' | 'mobileUrl' | 'tabletUrl'>(null);
  const [nat, setNat] = useState<string>('');
  const v = value ?? { url: '', alt: { ...E } };
  const set = (patch: object) => onChange({ ...v, ...patch });
  const bad = !!c.errors[path + '.url'];
  const frame = f.frame ?? 'side';
  const fx = Number.isFinite(Number(v.focalX)) ? Number(v.focalX) : 50, fy = Number.isFinite(Number(v.focalY)) ? Number(v.focalY) : 50;
  const shape = SHAPES.find((x) => x[0] === (v.ratio ?? ''))?.[2] || FRAME_RATIO[frame];
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set({ focalX: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))), focalY: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))) });
  };
  const has = !!v.url && !bad;
  void 0;
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <legend className="a-label px-1">{f.label}{f.required && <span className="a-req">*</span>}{f.help && <Help text={f.help} align="left" />}</legend>
      {f.where && <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">📍 <b>Where it appears:</b> {f.where}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="a-btn a-btn-sm" onClick={() => setPick('main')}><ImageIcon className="h-3.5 w-3.5" />Choose or upload photo</button>
        {v.url && <button type="button" className="a-btn a-btn-sm a-btn-danger" onClick={() => set({ url: '' })}>Remove</button>}
        <button type="button" className="a-btn a-btn-sm" onClick={() => setPick('video')}><Video className="h-3.5 w-3.5" />{v.videoUrl ? 'Change video' : 'Add a video (optional)'}</button>
        {v.videoUrl && <button type="button" className="a-btn a-btn-sm a-btn-danger" onClick={() => set({ videoUrl: '', videoPoster: '' })}>Remove video</button>}
      </div>
      {v.videoUrl && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap items-start gap-3">
            <video src={v.videoUrl} poster={v.videoPoster || v.url || undefined} muted playsInline controls preload="metadata" className="h-24 w-40 rounded bg-black object-cover" />
            <div className="min-w-0 flex-1 text-sm"><p className="font-semibold">{v.url ? 'Photo and video' : 'Video only'}</p><p className="text-xs text-slate-500">{v.url ? 'The photo shows while the video loads, and where video cannot play.' : 'Add a photo too if you want a still picture to show while the video loads.'}</p>
              <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={!!v.videoControls} onChange={(e) => set({ videoControls: e.target.checked, ...(e.target.checked ? { videoSound: false } : {}) })} />Show the video player (play, pause, volume). Visitors press play and hear the sound.</label>
              <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={!!v.videoSound} disabled={!!v.videoControls} onChange={(e) => set({ videoSound: e.target.checked })} />Play on a loop with a sound button (starts silent because browsers block automatic sound; visitors tap the speaker to hear it).</label></div>
          </div>
        </div>
      )}
      <input className="a-input mt-2" aria-label="Image address" aria-invalid={bad} dir="ltr" placeholder="Image address (https://… or /seed/…)" value={v.url ?? ''} onChange={(e) => set({ url: e.target.value })} />
      {c.errors[path + '.url'] && <p className="a-err" role="alert">{c.errors[path + '.url']}</p>}

      {has && (
        <div className="a-cols mt-3"><div className="a-cols-grid">
          <div>
            <p className="a-label">1. Pick the important part<Help text="Click or drag the white dot onto the most important part of the photo (a face, the main subject). When the picture is cropped to fit, for example on a phone, this part stays visible." align="left" /></p>
            <div className="relative mx-auto max-w-xs cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-slate-300 bg-white" style={{ aspectRatio: nat || '4 / 3' }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => { if (e.buttons) move(e); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.url} alt="" draggable={false} className="h-full w-full object-fill" onLoad={(e) => setNat(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)} />
              <span aria-hidden className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-emerald-700/40 shadow-[0_0_0_2px_rgba(0,0,0,.45)]" style={{ left: `${fx}%`, top: `${fy}%` }} />
              <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-white/70" style={{ left: `${fx}%` }} /><span aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-white/70" style={{ top: `${fy}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500"><span>Focus: {fx}% across, {fy}% down</span><button type="button" className="underline" onClick={() => set({ focalX: 50, focalY: 50 })}>Reset to centre</button></div>
          </div>
          <div>
            <p className="a-label">2. How it will look in the {FRAME_NAME[frame]}<Help text="A live preview of the crop. The real block may be a little wider or narrower depending on the screen; use Preview at the top of the page to check computer, tablet and phone." align="left" /></p>
            <div className="mx-auto max-w-xs overflow-hidden rounded-lg border border-slate-300 bg-slate-200" style={{ aspectRatio: shape }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.url} alt="" className="h-full w-full" style={{ objectFit: v.fit === 'contain' ? 'contain' : 'cover', objectPosition: `${fx}% ${fy}%` }} />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2" style={{ gridColumn: '1 / -1' }}>
            <div className="a-cols"><div className="a-cols-grid">
              <label><span className="a-label">3. Fit<Help text="“Fill” crops the edges so there are no empty bars (best for most photos). “Show whole picture” never crops but may leave empty space; good for logos and diagrams." align="left" /></span>
                <select className="a-input" value={v.fit === 'contain' ? 'contain' : 'cover'} onChange={(e) => set({ fit: e.target.value })}><option value="cover">Fill the frame (crop the edges)</option><option value="contain">Show the whole picture</option></select></label>
              {frame !== 'background' && <label><span className="a-label">4. Shape of the frame<Help text="Changes the width-to-height shape of the picture frame. “Automatic” uses the shape designed for this block." align="left" /></span>
                <select className="a-input" value={v.ratio ?? ''} onChange={(e) => set({ ratio: e.target.value })}>{SHAPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>}
            </div></div>
          </div>
        </div></div>
      )}

      <div className="a-pair mt-3"><div className="a-pair-grid">
        <input className="a-input" aria-label="Picture description (English)" placeholder="Describe the picture (English)" value={v.alt?.en ?? ''} onChange={(e) => set({ alt: { ...(v.alt ?? E), en: e.target.value } })} />
        <input className="a-input" aria-label="Picture description (Arabic)" dir="rtl" placeholder="وصف الصورة (العربية)" value={v.alt?.ar ?? ''} onChange={(e) => set({ alt: { ...(v.alt ?? E), ar: e.target.value } })} />
      </div></div>
      {c.warns[path + '.alt'] ? <p className="a-warn">{c.warns[path + '.alt']}</p> : <p className="a-hint">The description helps visitors who cannot see the picture, and Google.</p>}

      {(f.caption || v.mobileUrl || v.tabletUrl || v.url) && (
        <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-bold">More options: caption, phone &amp; tablet versions</summary>
          <div className="mt-3 space-y-3">
            {f.caption && (
              <div><p className="a-label">Caption (shown over the bottom of the picture)</p>
                <div className="a-pair"><div className="a-pair-grid">
                  <input className="a-input" placeholder="Caption (English)" aria-label="Caption (English)" value={v.caption?.en ?? ''} onChange={(e) => set({ caption: { ...(v.caption ?? E), en: e.target.value } })} />
                  <input className="a-input" dir="rtl" placeholder="التعليق (العربية)" aria-label="Caption (Arabic)" value={v.caption?.ar ?? ''} onChange={(e) => set({ caption: { ...(v.caption ?? E), ar: e.target.value } })} />
                </div></div></div>
            )}
            {([['mobileUrl', 'Phone version', 'Used on phones (screens under 640 px wide). Useful when a wide photo is too small to read on a phone: upload a tighter, more vertical crop.'], ['tabletUrl', 'Tablet version', 'Used on tablets (640–1023 px wide). Leave empty to use the main picture.']] as const).map(([k, label, help]) => (
              <div key={k}><p className="a-label">{label} (optional)<Help text={help} align="left" /></p>
                <div className="flex gap-2"><input className="a-input" dir="ltr" aria-invalid={!!c.errors[path + '.' + k]} placeholder="Leave empty to use the main picture" value={v[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} /><button type="button" className="a-btn a-btn-sm shrink-0" onClick={() => setPick(k)}>Choose…</button></div>
                {c.errors[path + '.' + k] && <p className="a-err">{c.errors[path + '.' + k]}</p>}</div>
            ))}
          </div>
        </details>
      )}
      {pick && <MediaPicker allowVideo={pick === 'video'} initialTab="VIDEO" onClose={() => setPick(null)} onPick={(m) => { if (pick === 'video') { if (m.kind === 'VIDEO') set({ videoUrl: m.url, videoPoster: m.posterUrl ?? '', alt: { en: v.alt?.en || m.altText?.en || '', ar: v.alt?.ar || m.altText?.ar || '' } }); else { toast.warn('Please choose a video.'); return; } } else if (pick === 'main') set({ url: m.url, alt: { en: v.alt?.en || m.altText?.en || '', ar: v.alt?.ar || m.altText?.ar || '' } }); else set({ [pick]: m.url }); setPick(null); }} />}
    </fieldset>
  );
}

function ListEditor({ label, help, add, items, onChange, blank, title, render, min, max, itemName = 'item', flat, path, c, bulk }: {
  label: string; help?: string; add: string; items: any[]; onChange: (v: any[]) => void; blank: () => any; title: (it: any) => string;
  render: (it: any, n: number, set: (v: any) => void) => React.ReactNode; min?: number; max?: number; itemName?: string; flat?: boolean; path: string; c: Ctx; bulk?: (urls: any[]) => any[];
}) {
  const { confirm } = useDialogs();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length <= 2 ? items.map((_, n) => n) : []));
  const toggle = (n: number) => setOpen((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const move = (n: number, d: number) => {
    const j = n + d; if (j < 0 || j >= items.length) return;
    const a = [...items]; [a[n], a[j]] = [a[j], a[n]]; onChange(a);
    setOpen((s) => new Set([...s].map((k) => (k === n ? j : k === j ? n : k))));
  };
  const duplicate = (n: number) => {
    if (max && items.length >= max) return;
    const a = [...items]; a.splice(n + 1, 0, JSON.parse(JSON.stringify(items[n] ?? null))); onChange(a);
    setOpen((s) => new Set([...[...s].map((k) => (k > n ? k + 1 : k)), n + 1]));
  };
  const remove = async (n: number) => {
    if (min && items.length <= min) return;
    if (await confirm({ title: `Remove this ${itemName}?`, message: 'It will disappear from the page once you save.', confirmLabel: 'Remove', danger: true })) {
      onChange(items.filter((_, k) => k !== n));
      setOpen((s) => new Set([...s].filter((k) => k !== n).map((k) => (k > n ? k - 1 : k))));
    }
  };
  const err = c.errors[path];
  return (
    <fieldset className="rounded-xl border border-slate-200 p-3">
      <legend className="a-label px-1">{label} <span className="font-normal text-slate-400">({items.length})</span>{help && <Help text={help} align="left" />}</legend>
      <div className="space-y-2">
        {items.map((it, n) => {
          const isOpen = flat || open.has(n);
          return (
            <div key={n} className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-1 px-2 py-1.5">
                {!flat && <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-start text-sm font-semibold" aria-expanded={isOpen} onClick={() => toggle(n)}>
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="text-slate-400">{n + 1}.</span><span className="truncate">{title(it) || <em className="font-normal text-slate-400">Untitled {itemName}</em>}</span>
                </button>}
                {flat && <div className="flex-1">{render(it, n, (v) => onChange(items.map((x, k) => (k === n ? v : x))))}</div>}
                <button type="button" className="a-btn a-btn-sm" aria-label="Move up" disabled={n === 0} onClick={() => move(n, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className="a-btn a-btn-sm" aria-label="Move down" disabled={n === items.length - 1} onClick={() => move(n, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" className="a-btn a-btn-sm" aria-label={`Duplicate ${itemName}`} title={`Duplicate this ${itemName}`} disabled={!!max && items.length >= max} onClick={() => duplicate(n)}><Copy className="h-3.5 w-3.5" /></button>
                <button type="button" className="a-btn a-btn-sm a-btn-danger" aria-label={`Remove ${itemName}`} disabled={!!min && items.length <= min} onClick={() => remove(n)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {!flat && isOpen && <div className="border-t border-slate-100 p-3">{render(it, n, (v) => onChange(items.map((x, k) => (k === n ? v : x))))}</div>}
            </div>
          );
        })}
      </div>
      {err && <p className="a-err" role="alert">{err}</p>}
      {(!max || items.length < max) && (
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" className="a-btn a-btn-sm" onClick={() => { onChange([...items, blank()]); if (!flat) setOpen((s) => new Set(s).add(items.length)); }}><Plus className="h-3.5 w-3.5" />{add}</button>
          {bulk && <button type="button" className="a-btn a-btn-sm" onClick={() => setBulkOpen(true)}><Images className="h-3.5 w-3.5" />Add several photos at once</button>}</div>
      )}
      {bulkOpen && bulk && <MediaPicker onClose={() => setBulkOpen(false)} onPickMany={(ms) => { const room = max ? Math.max(0, max - items.length) : ms.length; onChange([...items, ...bulk(ms.slice(0, room))]); setBulkOpen(false); }} />}
    </fieldset>
  );
}

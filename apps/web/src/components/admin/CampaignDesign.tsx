'use client';
import { ArrowDown, ArrowUp, Palette, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SchemaForm, type FieldDef } from './Fields';

/** Visual design of a follow-up email: theme, colours, banner picture and position, fonts, button, footer and content blocks. */
export type Design = any;
const I = { en: '', ar: '' };
export const blankDesign = (): Design => ({
  theme: 'brand', pageBg: '', cardBg: '', headerBg: '', accent: '', headingColor: '', textColor: '', buttonBg: '', buttonText: '', fontFamily: '', fontSize: 16, headingSize: 26, headingAlign: 'start', corners: 'soft',
  banner: { url: '', alt: { ...I }, link: '', position: 'top', height: 'medium', inset: false },
  button: { shape: 'soft', align: 'start', fullWidth: false }, footer: { style: 'light', bg: '', showSocial: true, note: { ...I } }, blocks: [],
});

const THEMES: [string, string, string[]][] = [
  ['brand', 'My brand colours', ['#f3f4f6', '#1f4d2b', '#c9a227']], ['forest', 'Oak forest', ['#eaf3e4', '#1f4d2b', '#c9a227']], ['sunshine', 'Sunshine', ['#fff5d6', '#f2a900', '#e76f51']],
  ['ocean', 'Ocean', ['#e3f1fa', '#1d6fa5', '#62c4d9']], ['blossom', 'Blossom', ['#fdebf1', '#d6577e', '#f5b5c8']], ['night', 'Bedtime story', ['#1b2236', '#101524', '#ffd166']],
];
const t = (k: string, label: string, help?: string, multiline = false): FieldDef => ({ k, label, help, type: 'i18n', multiline } as FieldDef);
const sel = (k: string, label: string, options: [string, string][], help?: string): FieldDef => ({ k, label, help, type: 'select', options } as FieldDef);
const col = (k: string, label: string, help?: string): FieldDef => ({ k, label, help: help ?? 'Leave empty to use the theme colour.', type: 'color' } as FieldDef);
const ALIGN: [string, string][] = [['start', 'Start of the line'], ['center', 'Centred'], ['end', 'End of the line']];

const COLOURS: FieldDef[] = [col('pageBg', 'Page background', 'The colour around the email.'), col('cardBg', 'Email background'), col('headerBg', 'Header band'), col('accent', 'Accent line and highlights'), col('headingColor', 'Heading colour'), col('textColor', 'Text colour'), col('buttonBg', 'Button colour'), col('buttonText', 'Button text colour')];
const TYPE: FieldDef[] = [
  sel('fontFamily', 'Font', [['', 'Use my brand font'], ['arial', 'Arial (clean)'], ['tahoma', 'Tahoma'], ['verdana', 'Verdana (wide)'], ['trebuchet', 'Trebuchet (friendly)'], ['georgia', 'Georgia (classic)']], 'Email apps only show a small set of safe fonts.'),
  { k: 'fontSize', label: 'Text size', type: 'number', min: 14, max: 19, help: 'In pixels.' } as FieldDef, { k: 'headingSize', label: 'Heading size', type: 'number', min: 20, max: 40, help: 'In pixels.' } as FieldDef,
  sel('headingAlign', 'Heading position', [['start', 'Start of the line'], ['center', 'Centred']]), sel('corners', 'Corners', [['square', 'Square'], ['soft', 'Soft'], ['round', 'Very round']]),
];
const BANNER: FieldDef = { k: 'banner', label: 'Banner picture', type: 'object', fields: [
  { k: 'url', label: 'Picture', type: 'imageurl', help: 'A wide picture works best. Choose it from your library or upload a new one.' } as FieldDef, t('alt', 'Describe the picture', 'Shown if the picture cannot load, and read aloud by screen readers.'),
  sel('position', 'Where it goes', [['top', 'Top, full width under the header'], ['afterHeading', 'Under the heading'], ['sideStart', 'Beside the text (start side)'], ['sideEnd', 'Beside the text (end side)'], ['bottom', 'Bottom, above the footer']]),
  sel('height', 'Height', [['short', 'Short'], ['medium', 'Medium'], ['tall', 'Tall']], 'Used for full-width banners.'), { k: 'inset', label: 'Frame it inside the margins with rounded corners', type: 'bool' } as FieldDef,
  { k: 'link', label: 'Opens this page when clicked (optional)', type: 'url', placeholder: 'https://…' } as FieldDef] } as FieldDef;
const BUTTON: FieldDef = { k: 'button', label: 'Main button', type: 'object', fields: [sel('shape', 'Shape', [['square', 'Square'], ['soft', 'Soft'], ['pill', 'Pill']]), sel('align', 'Position', ALIGN), { k: 'fullWidth', label: 'Stretch across the whole email', type: 'bool' } as FieldDef] } as FieldDef;
const FOOTER: FieldDef = { k: 'footer', label: 'Footer', type: 'object', fields: [sel('style', 'Style', [['light', 'Light'], ['brand', 'Header colour'], ['dark', 'Dark']]), col('bg', 'Footer colour', 'Leave empty to use the style above.'), { k: 'showSocial', label: 'Show the social icons', type: 'bool' } as FieldDef, t('note', 'Extra footer line (optional)', 'For example: Registered in Sharjah.')] } as FieldDef;

const BLOCKS: Record<string, { label: string; fields: FieldDef[]; blank: () => any }> = {
  text: { label: '📝 Text', fields: [t('body', 'Text', 'A blank line starts a new paragraph. **bold** makes text bold. {{name}} becomes the first name.', true)], blank: () => ({ type: 'text', body: { ...I } }) },
  image: { label: '🖼 Picture', fields: [{ k: 'url', label: 'Picture', type: 'imageurl' } as FieldDef, t('alt', 'Describe the picture'), sel('align', 'Position', ALIGN), { k: 'width', label: 'Width (percent)', type: 'number', min: 20, max: 100 } as FieldDef, { k: 'rounded', label: 'Rounded corners', type: 'bool' } as FieldDef, { k: 'link', label: 'Opens this page when clicked (optional)', type: 'url', placeholder: 'https://…' } as FieldDef], blank: () => ({ type: 'image', url: '', alt: { ...I }, link: '', align: 'center', width: 100, rounded: true }) },
  button: { label: '🔘 Button', fields: [t('label', 'Button text'), { k: 'url', label: 'Goes to', type: 'url', placeholder: 'https://…' } as FieldDef, sel('align', 'Position', ALIGN)], blank: () => ({ type: 'button', label: { ...I }, url: '', align: 'center' }) },
  callout: { label: '💡 Highlight box', fields: [{ k: 'emoji', label: 'Emoji', type: 'text', max: 8, placeholder: '🌳' } as FieldDef, t('title', 'Title'), t('body', 'Text', undefined, true), col('bg', 'Box colour', 'Leave empty for a soft tint of the accent colour.')], blank: () => ({ type: 'callout', title: { ...I }, body: { ...I }, bg: '', emoji: '🌳' }) },
  features: { label: '✨ Feature columns', fields: [{ k: 'items', label: 'Columns (up to 4)', type: 'list', itemName: 'column', titleKey: 'title', max: 4, addLabel: 'Add column', item: [{ k: 'emoji', label: 'Emoji', type: 'text', max: 8 } as FieldDef, t('title', 'Title'), t('text', 'Short text')] } as FieldDef], blank: () => ({ type: 'features', items: [{ emoji: '🎨', title: { ...I }, text: { ...I } }, { emoji: '🌱', title: { ...I }, text: { ...I } }] }) },
  quote: { label: '💬 Quote', fields: [t('body', 'Quote', undefined, true), t('author', 'Who said it (optional)')], blank: () => ({ type: 'quote', body: { ...I }, author: { ...I } }) },
  divider: { label: '〰 Divider', fields: [sel('style', 'Style', [['line', 'Line'], ['dots', 'Dots'], ['leaves', 'Leaves and oak']])], blank: () => ({ type: 'divider', style: 'leaves' }) },
  spacer: { label: '⬍ Space', fields: [{ k: 'height', label: 'Height (pixels)', type: 'number', min: 8, max: 80 } as FieldDef], blank: () => ({ type: 'spacer', height: 24 }) },
};
const summary = (b: any) => { const s = b.body?.en || b.title?.en || b.label?.en || b.items?.[0]?.title?.en || b.url || ''; return String(s).replace(/\s+/g, ' ').slice(0, 50); };

export function CampaignDesign({ value, onChange }: { value?: Design; onChange: (d: Design) => void }) {
  const d: Design = { ...blankDesign(), ...(value ?? {}), banner: { ...blankDesign().banner, ...(value?.banner ?? {}) }, button: { ...blankDesign().button, ...(value?.button ?? {}) }, footer: { ...blankDesign().footer, ...(value?.footer ?? {}) } };
  const [open, setOpen] = useState<number | null>(null); const [add, setAdd] = useState('text');
  const set = (p: Partial<Design>) => onChange({ ...d, ...p });
  const blocks: any[] = d.blocks ?? [];
  const setBlocks = (b: any[]) => set({ blocks: b });
  const move = (i: number, dir: number) => { const j = i + dir; if (j < 0 || j >= blocks.length) return; const b = blocks.slice(); [b[i], b[j]] = [b[j], b[i]]; setBlocks(b); setOpen(j); };
  return (
    <div className="space-y-4">
      <div>
        <span className="a-label">Colour theme</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Colour theme">
          {THEMES.map(([k, label, sw]) => (
            <button key={k} type="button" role="radio" aria-checked={d.theme === k} onClick={() => set({ theme: k })} className={`rounded-xl border-2 p-2 text-start text-sm font-semibold transition ${d.theme === k ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-400'}`}>
              <span className="mb-1 flex overflow-hidden rounded-md" aria-hidden>{sw.map((c) => <span key={c} className="h-5 flex-1" style={{ background: c }} />)}</span>{label}
            </button>
          ))}
        </div>
      </div>
      <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-bold"><Palette className="me-1 inline h-4 w-4" />Fine-tune colours</summary><div className="mt-3"><SchemaForm fields={COLOURS} value={d} onChange={(v) => set(v)} /></div></details>
      <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-bold">Fonts and corners</summary><div className="mt-3"><SchemaForm fields={TYPE} value={d} onChange={(v) => set(v)} /></div></details>
      <details className="rounded-xl border p-3" open={!!d.banner?.url}><summary className="cursor-pointer text-sm font-bold">Banner picture and position</summary><div className="mt-3"><SchemaForm fields={[BANNER]} value={d} onChange={(v) => set(v)} /></div></details>
      <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-bold">Button and footer style</summary><div className="mt-3 space-y-4"><SchemaForm fields={[BUTTON, FOOTER]} value={d} onChange={(v) => set(v)} /></div></details>

      <div>
        <span className="a-label">Extra content blocks<span className="ms-1 font-normal text-slate-500">(shown under the message, in this order)</span></span>
        {blocks.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No extra blocks yet. Add pictures, highlight boxes, feature columns, quotes, dividers and more.</p>}
        <ul className="space-y-2">
          {blocks.map((b, i) => {
            const def = BLOCKS[b.type]; if (!def) return null;
            return (
              <li key={i} className="rounded-xl border bg-white">
                <div className="flex items-center gap-1 p-2">
                  <button type="button" className="min-w-0 flex-1 truncate text-start text-sm font-bold" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{def.label}<span className="ms-2 font-normal text-slate-500">{summary(b)}</span></button>
                  <button type="button" className="a-btn a-btn-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" className="a-btn a-btn-sm" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" className="a-btn a-btn-sm a-btn-danger" aria-label="Remove block" onClick={() => { setBlocks(blocks.filter((_, n) => n !== i)); setOpen(null); }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {open === i && <div className="border-t p-3"><SchemaForm fields={def.fields} value={b} onChange={(v) => setBlocks(blocks.map((x, n) => (n === i ? { ...v, type: b.type } : x)))} /></div>}
              </li>
            );
          })}
        </ul>
        {blocks.length < 12 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select className="a-input !w-auto" value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Type of block to add">{Object.entries(BLOCKS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <button type="button" className="a-btn" onClick={() => { setBlocks([...blocks, BLOCKS[add].blank()]); setOpen(blocks.length); }}><Plus className="h-4 w-4" />Add block</button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { SECTION_SCHEMAS } from '@/lib/admin-schemas';
import { blankFor, SchemaForm, validate, warnings } from './Fields';
import { Help } from './Help';
import { useDialogs } from './Dialogs';
import { TranslateButton } from './TranslateButton';

export type Block = { type: string; config: any; isVisible: boolean };
const NOT_FOR_DETAIL = new Set(['hero']);
const summary = (b: Block) => { const c = b.config ?? {}; return String(c.title?.en ?? c.heading?.en ?? c.eyebrow?.en ?? c.text?.en ?? '').slice(0, 80); };

/** Errors and missing-Arabic warnings for every block (used by the screens that save them). */
export function blockProblems(blocks: Block[]) {
  const errors = blocks.map((b) => { const sc = SECTION_SCHEMAS[b.type]; return sc ? validate(sc.fields, b.config) : {}; });
  const warns = blocks.map((b) => { const sc = SECTION_SCHEMAS[b.type]; return sc ? warnings(sc.fields, b.config) : {}; });
  return { errors, warns, count: errors.reduce((a, e) => a + Object.keys(e).length, 0) };
}

/** The same block editor as pages, used inside a detail page so it can be designed freely: text, tables, photo cards, steps, FAQ and more. */
export function BlocksEditor({ value, onChange, showErrors }: { value: Block[]; onChange: (v: Block[]) => void; showErrors: boolean }) {
  const { confirm } = useDialogs();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const { errors, warns } = blockProblems(value);
  const set = (i: number, patch: Partial<Block>) => onChange(value.map((b, n) => (n === i ? { ...b, ...patch } : b)));
  const toggle = (i: number) => setOpen((o) => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const c = [...value]; [c[i], c[j]] = [c[j], c[i]]; onChange(c); setOpen(new Set()); };
  const add = (type: string) => { const sc = SECTION_SCHEMAS[type]; onChange([...value, { type, config: sc ? blankFor(sc.fields) : {}, isVisible: true }]); setOpen(new Set([value.length])); setAdding(false); };
  const remove = async (i: number) => { if (await confirm({ title: `Delete this “${SECTION_SCHEMAS[value[i].type]?.label ?? value[i].type}” block?`, message: 'It is removed when you save.', confirmLabel: 'Delete block', danger: true })) { onChange(value.filter((_, n) => n !== i)); setOpen(new Set()); } };
  const dup = (i: number) => { const c = [...value]; c.splice(i + 1, 0, JSON.parse(JSON.stringify(value[i]))); onChange(c); setOpen(new Set([i + 1])); };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">Designed blocks ({value.length})<Help text="Build this page like any other page: stack blocks from top to bottom. Use Table for timetables and lists that change, Photo cards for colourful highlights, Steps, FAQ, Callout and more. The text above comes first, then these blocks." align="left" /></h2>
        <button type="button" className="a-btn a-btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add block</button>
      </div>
      <div className="space-y-3">
        {value.map((b, i) => {
          const sc = SECTION_SCHEMAS[b.type]; const isOpen = open.has(i); const nErr = Object.keys(errors[i] ?? {}).length;
          return (
            <div key={i} className={`rounded-xl border bg-white ${nErr && showErrors ? 'border-red-300' : 'border-slate-200'} ${!b.isVisible ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-start" aria-expanded={isOpen} onClick={() => toggle(i)}>
                  {isOpen ? <ChevronDown className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
                  <span className="a-badge">{i + 1}</span>
                  <span className="min-w-0"><span className="block font-bold">{sc?.label ?? b.type}</span><span className="block truncate text-sm text-slate-500">{summary(b) || 'No heading yet'}</span></span>
                  {!b.isVisible && <span className="a-badge a-badge-warn">Hidden</span>}
                  {nErr > 0 && showErrors && <span className="a-badge a-badge-bad">{nErr} to fix</span>}
                </button>
                <div className="flex items-center gap-1">
                  <TranslateButton small label="Arabic" value={b.config} onChange={(v) => set(i, { config: v })} />
                  <button type="button" className="a-btn a-btn-sm" aria-label="Move block up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" className="a-btn a-btn-sm" aria-label="Move block down" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" className="a-btn a-btn-sm" aria-label={b.isVisible ? 'Hide block' : 'Show block'} onClick={() => set(i, { isVisible: !b.isVisible })}>{b.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                  <button type="button" className="a-btn a-btn-sm" aria-label="Duplicate block" onClick={() => dup(i)}><Copy className="h-3.5 w-3.5" /></button>
                  <button type="button" className="a-btn a-btn-sm a-btn-danger" aria-label="Delete block" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 p-4">
                  {sc ? <><p className="a-sub">{sc.description}</p><SchemaForm fields={sc.fields} value={b.config} onChange={(v) => set(i, { config: v })} errors={showErrors ? errors[i] : {}} warns={warns[i]} /></> : <p className="a-sub">This block type is not editable here.</p>}
                </div>
              )}
            </div>
          );
        })}
        {value.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">No designed blocks yet. Press “Add block” to add a table, photo cards, steps, a callout and more.</div>}
      </div>
      {adding && (
        <div className="a-modal-bg" role="dialog" aria-modal="true" aria-label="Add a block" onMouseDown={(e) => e.target === e.currentTarget && setAdding(false)}>
          <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">What would you like to add?</h2><button type="button" className="a-btn a-btn-sm" aria-label="Close" onClick={() => setAdding(false)}><X className="h-4 w-4" /></button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(SECTION_SCHEMAS).filter(([t]) => !NOT_FOR_DETAIL.has(t)).map(([t, sc]) => (
                <button type="button" key={t} className="rounded-xl border border-slate-200 p-3 text-start hover:border-[#1f4d2b] hover:bg-[#f3f8f0]" onClick={() => add(t)}><span className="block font-bold">{sc.label}</span><span className="text-sm text-slate-600">{sc.description}</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

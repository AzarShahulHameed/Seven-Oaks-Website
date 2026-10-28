'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDialogs } from '@/components/admin/Dialogs';
import { IncompleteGate, useDirtyGuard, useDraft } from '@/components/admin/Dirty';
import { SchemaForm, validate, warnings, type FieldDef } from '@/components/admin/Fields';
import { Help } from '@/components/admin/Help';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { MENU_ITEM_FIELDS } from '@/lib/admin-schemas';

const LOCS: [string, string, string][] = [
  ['HEADER', 'Header menu', 'The links across the top of every page. Items marked as a button appear highlighted on the right.'],
  ['FOOTER', 'Footer menu', 'The links at the bottom of every page.'],
  ['QUICK_LINKS', 'Quick links', 'An extra short list of links. Not shown unless a block uses it.'],
];
const FIELD: FieldDef = { k: 'items', label: 'Menu items', type: 'list', itemName: 'link', addLabel: 'Add link', titleKey: 'label', item: MENU_ITEM_FIELDS, help: 'Drag order with the arrows. The order here is the order visitors see.' };

export default function MenusPage() {
  const toast = useToast();
  const { guard } = useDirtyGuard();
  const { confirm } = useDialogs();
  const [loc, setLoc] = useState('HEADER');
  const d = useDraft<{ items: any[] }>();
  const [show, setShow] = useState(false);
  const load = (l: string) => { d.setValue(null); adminFetch(`/admin/menus/${l}`).then(async (r) => (r.ok ? (d.load({ items: (await r.json()).items }), setShow(false)) : toast.error(await describeError(r)))); };
  useEffect(() => { load('HEADER'); /* eslint-disable-next-line */ }, []);
  const errors = useMemo(() => (d.value ? validate([FIELD], d.value) : {}), [d.value]);
  const n = Object.keys(errors).length;
  const warns = useMemo(() => (d.value ? warnings([FIELD], d.value) : {}), [d.value]);
  const nw = Object.values(warns).filter((m) => /missing|changed after/i.test(m)).length;
  const incomplete = d.dirty && nw > 0;
  const cur = LOCS.find((l) => l[0] === loc)!;

  async function save() {
    setShow(true);
    if (n) return toast.error(`Not saved: please fix ${n} problem${n > 1 ? 's' : ''} marked in red.`);
    const r = await adminFetch(`/admin/menus/${loc}`, { method: 'PUT', ...jsonBody({ items: d.value!.items }) });
    if (r.ok) { d.markSaved(); toast.success(`${cur[1]} saved. The website updates within a few seconds.`); } else toast.error(await describeError(r));
  }

  return (
    <div className="space-y-6">
      <PageBar title="Menus" help="Choose which links appear in the header and footer, in what order and with what words (English and Arabic).">
        <button className="a-btn a-btn-primary" disabled={!d.dirty || incomplete} onClick={save}>Save menu</button>
      </PageBar>
      <div className="flex flex-wrap gap-2" role="tablist">
        {LOCS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={k === loc} className={`a-btn ${k === loc ? 'a-btn-primary' : ''}`} onClick={() => k !== loc && guard(() => { setLoc(k); load(k); })}>{label}</button>
        ))}
      </div>
      <IncompleteGate on={incomplete} />
      {incomplete && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">{nw} menu text{nw > 1 ? 's need' : ' needs'} its Arabic (or English) version before you can save.</p>}
      <p className="a-sub !mb-0">{cur[2]}</p>
      {d.value === null ? <p>Loading…</p> : (
        <div className="a-card">
          {d.value.items.length === 0 && <p className="mb-3 text-sm text-slate-500">This menu is empty. Add your first link below.</p>}
          <SchemaForm fields={[FIELD]} value={d.value} onChange={(v) => d.setValue(v)} errors={show ? errors : {}} warns={warns} />
          <p className="a-hint mt-3">Tip: write links like <code>/about-us</code> (the language is added automatically) or a full <code>https://</code> address. Page addresses are shown in Pages.</p>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDirtyFlag, useIncompleteFlag } from '@/components/admin/Dirty';
import { SchemaForm, blankFor, validate, warnings } from '@/components/admin/Fields';
import { Help } from '@/components/admin/Help';
import { JsonEditor } from '@/components/admin/JsonEditor';
import { MapKeyTest, SiteLinkStatus } from '@/components/admin/SiteLink';
import { TranslateButton } from '@/components/admin/TranslateButton';
import { useToast } from '@/components/admin/Toast';
import { SkelCard } from '@/components/admin/Skeleton';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { SETTING_SCHEMAS } from '@/lib/admin-schemas';
import { refreshBrand } from '@/lib/use-brand';

type Row = { key: string; value: any };

/** Finds latitude/longitude inside a normal Google Maps address (…/@25.34,55.42,17z or …!3d25.34!4d55.42 or ?q=25.34,55.42). */
function coordsFromLink(link: string): { lat: number; lng: number } | null {
  const pats = [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|destination)=(-?\d{1,2}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/];
  for (const p of pats) { const m = link.match(p); if (m) { const lat = +m[1], lng = +m[2]; if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }; } }
  return null;
}
function MapHelper({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const toast = useToast();
  const [link, setLink] = useState('');
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <p className="a-label">Find my location from a Google Maps link<Help text="Open your nursery in Google Maps, copy the address from the browser bar (it contains numbers like @25.34,55.42) and paste it here. Short links such as maps.app.goo.gl must be opened first so the full address appears in the bar." align="left" /></p>
      <div className="flex gap-2">
        <input className="a-input" dir="ltr" placeholder="https://www.google.com/maps/place/…/@25.3463,55.4209,17z" value={link} onChange={(e) => setLink(e.target.value)} />
        <button type="button" className="a-btn shrink-0" onClick={() => {
          const c = coordsFromLink(link.trim());
          if (!c) return toast.error('Could not find coordinates in that link. Open it in your browser first so the full address (with @ and numbers) is in the address bar, then copy that.');
          onChange({ ...value, latitude: c.lat, longitude: c.lng }); toast.success(`Location found: ${c.lat}, ${c.lng}. Check the map below, then press Save.`);
        }}>Find location</button>
      </div>
    </div>
  );
}

function Card({ row }: { row: Row }) {
  const toast = useToast();
  const sc = SETTING_SCHEMAS[row.key];
  const [saved, setSaved] = useState(JSON.stringify(row.value));
  const [value, setValue] = useState(row.value);
  const [show, setShow] = useState(false);
  const dirty = JSON.stringify(value) !== saved;
  useDirtyFlag(dirty);
  const errors = useMemo(() => (sc ? validate(sc.fields, value) : {}), [sc, value]);
  const n = Object.keys(errors).length;
  const warns = useMemo(() => (sc ? warnings(sc.fields, value) : {}), [sc, value]);
  const nw = Object.keys(warns).filter((k) => /missing|changed after/i.test(warns[k])).length;
  const incomplete = dirty && nw > 0;
  useIncompleteFlag(incomplete);

  async function save() {
    setShow(true);
    if (n) return toast.error(`Not saved: please fix ${n} problem${n > 1 ? 's' : ''} marked in red.`);
    const r = await adminFetch(`/admin/settings/${row.key}`, { method: 'PUT', ...jsonBody({ value }) });
    if (r.ok) { if (row.key === 'public.branding' || row.key === 'public.site') refreshBrand(); setSaved(JSON.stringify(value)); toast.success(`${sc?.label ?? row.key} saved. The website updates within a few seconds.`); }
    else toast.error(await describeError(r));
  }
  return (
    <div className="a-card" id={row.key}>
      <h2>{sc?.label ?? row.key}{sc && <Help text={sc.description} align="left" />}{dirty && <span className="a-badge a-badge-warn">Unsaved</span>}</h2>
      {sc && <p className="a-sub">{sc.description}</p>}
      {row.key === 'public.map' && <MapHelper value={value} onChange={setValue} />}
      {sc ? <SchemaForm fields={sc.fields} value={value} onChange={setValue} errors={show ? errors : {}} warns={warns} /> : <JsonEditor value={value} onChange={setValue} />}
      {row.key === 'public.map' && <MapKeyTest apiKey={String(value?.apiKey ?? '')} />}
      {incomplete && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900" role="alert">{nw} text{nw > 1 ? 's need' : ' needs'} its Arabic (or English) version updated before you can save. Use “Translate” below, then check the result.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="a-btn a-btn-primary" onClick={save} disabled={!dirty || incomplete} title={incomplete ? 'Finish the English and Arabic text first' : undefined}>Save</button>
        {sc && <TranslateButton value={value} onChange={setValue} />}
        {dirty && <button className="a-btn" onClick={() => { setValue(JSON.parse(saved)); setShow(false); }}>Undo changes</button>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => { adminFetch('/admin/settings').then(async (r) => (r.ok ? setRows(await r.json()) : toast.error(await describeError(r)))); /* eslint-disable-next-line */ }, []);
  if (!rows) return <div className="space-y-4"><SkelCard lines={4} /><SkelCard lines={6} /><SkelCard lines={3} /></div>;
  const groups = ['Nursery', 'Site', 'Search & tracking', 'Marketing', 'Legal', 'Security'];
  // Settings that exist in the code but not yet in this database (e.g. added by an upgrade) still get a card, with blank values.
  const known: Row[] = Object.keys(SETTING_SCHEMAS).map((k) => rows.find((r) => r.key === k) ?? { key: k, value: blankFor(SETTING_SCHEMAS[k].fields) });
  const other = rows.filter((r) => !SETTING_SCHEMAS[r.key]);
  return (
    <div className="space-y-6">
      <PageBar title="Settings" help="Site-wide details used on many pages: contact information, social links, announcement bar, analytics and more. Each box has its own Save button." />
      <SiteLinkStatus />
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Jump to">
        {known.map((r) => <a key={r.key} href={`#${r.key}`} className="a-badge hover:bg-[#d8e6d3]">{SETTING_SCHEMAS[r.key].label}</a>)}
      </nav>
      {groups.map((g) => (
        <section key={g} className="space-y-4">
          <h2 className="text-lg font-bold text-[#1f4d2b]">{g}</h2>
          {known.filter((r) => SETTING_SCHEMAS[r.key].group === g).map((r) => <Card key={r.key} row={r} />)}
        </section>
      ))}
      {other.length > 0 && <section className="space-y-4"><h2 className="text-lg font-bold">Other</h2>{other.map((r) => <Card key={r.key} row={r} />)}</section>}
    </div>
  );
}

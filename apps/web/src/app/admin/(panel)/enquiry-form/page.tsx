'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { IncompleteGate, useDirtyFlag } from '@/components/admin/Dirty';
import { SchemaForm, validate, warnings, type FieldDef } from '@/components/admin/Fields';
import { SkelCard } from '@/components/admin/Skeleton';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError } from '@/lib/admin-api';

const i18n = (k: string, label: string, help?: string, multiline = false): FieldDef => ({ k, label, help, type: 'i18n', multiline } as FieldDef);
const FIELD_KEYS: [string, string][] = [['childName', 'Child’s name'], ['childAge', 'Child’s age'], ['phone', 'Phone number'], ['program', 'Interested programme'], ['visitDate', 'Preferred visit date'], ['preferredContact', 'Preferred contact method'], ['message', 'Message']];
const FORM: FieldDef[] = [
  { k: 'enabled', label: 'Show the form on the website', type: 'bool', help: 'Turn off to hide the form everywhere (the contact details stay).' },
  i18n('submitLabel', 'Button text'), i18n('consentText', 'Consent sentence', 'Shown beside the tick box. Parents must tick it. Mention the Privacy Policy.', true),
  i18n('successTitle', 'Thank-you heading'), i18n('successText', 'Thank-you message', undefined, true),
  { k: 'programs', label: 'Programmes parents can choose', type: 'list', itemName: 'programme', titleKey: 'value', addLabel: 'Add programme', max: 30, help: 'The list in the “Interested programme” box. The code is used for routing rules.', item: [{ k: 'value', label: 'Code', type: 'text', required: true, max: 40, placeholder: 'toddlers', help: 'Lowercase letters, numbers and dashes only.' }, i18n('label', 'Name shown to parents')] },
  { k: 'fields', label: 'Form fields', type: 'object', fields: FIELD_KEYS.map(([k, l]) => ({ k, label: l, type: 'object', fields: [{ k: 'show', label: 'Show', type: 'bool' }, { k: 'required', label: 'Required', type: 'bool' }] } as FieldDef)) } as FieldDef,
];
const ROUTING: FieldDef[] = [
  { k: 'recipients', label: 'Who receives every enquiry', type: 'strings', addLabel: 'Add email', placeholder: 'admissions@yourdomain.ae', help: 'These people get an email for each new enquiry. If empty, the nursery contact email is used.' },
  { k: 'autoReply', label: 'Send parents an automatic thank-you email', type: 'bool', help: 'Uses the “Enquiry received” template in Email templates.' },
  { k: 'rules', label: 'Routing rules', type: 'list', itemName: 'rule', titleKey: 'program', addLabel: 'Add rule', max: 30, help: 'When a parent picks a programme, also notify extra people and assign the lead to one team member.', item: [{ k: 'program', label: 'Programme code', type: 'text', required: true, max: 40, placeholder: 'babies', help: 'Must match a programme code above.' }, { k: 'recipients', label: 'Also notify', type: 'strings', addLabel: 'Add email', placeholder: 'babies.lead@yourdomain.ae' }, { k: 'assigneeEmail', label: 'Assign the lead to (admin user email)', type: 'email', help: 'Must be the email of an active admin user. Leave empty to leave leads unassigned.' }] },
];

function useSetting(key: string) {
  const toast = useToast();
  const [saved, setSaved] = useState<any>(null); const [value, setValue] = useState<any>(null);
  useEffect(() => { adminFetch('/admin/settings').then(async (r) => { if (r.ok) { const row = (await r.json()).find((x: any) => x.key === key); const v = row?.value ?? {}; setSaved(v); setValue(JSON.parse(JSON.stringify(v))); } else toast.error(await describeError(r)); }); /* eslint-disable-next-line */ }, []);
  const dirty = value !== null && JSON.stringify(value) !== JSON.stringify(saved);
  const save = async () => { const r = await adminFetch(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }); if (r.ok) { setSaved(JSON.parse(JSON.stringify(value))); toast.success('Saved'); } else toast.error(await describeError(r)); return r.ok; };
  return { value, setValue, dirty, save, undo: () => setValue(JSON.parse(JSON.stringify(saved))) };
}

function Card({ title, desc, fields, s, need }: { title: string; desc: string; fields: FieldDef[]; s: ReturnType<typeof useSetting>; need?: boolean }) {
  const [show, setShow] = useState(false);
  useDirtyFlag(s.dirty);
  const errors = useMemo(() => (s.value ? validate(fields, s.value) : {}), [s.value, fields]);
  const warns = useMemo(() => (s.value ? warnings(fields, s.value) : {}), [s.value, fields]);
  const nw = Object.values(warns).filter((m) => /missing|changed after/i.test(m)).length;
  const incomplete = s.dirty && nw > 0;
  if (!s.value) return <SkelCard lines={6} />;
  return (
    <div className="a-card">
      <IncompleteGate on={incomplete} />
      <h2 className="a-h2">{title}{s.dirty && <span className="a-badge a-badge-warn">Unsaved</span>}</h2><p className="a-sub">{desc}</p>
      <SchemaForm fields={fields} value={s.value} onChange={s.setValue} errors={show ? errors : {}} warns={warns} />
      {incomplete && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">{nw} text{nw > 1 ? 's need' : ' needs'} its Arabic (or English) version before you can save.</p>}
      <div className="mt-4 flex gap-2"><button className="a-btn a-btn-primary" disabled={!s.dirty || incomplete} onClick={() => { setShow(true); if (Object.keys(errors).length) return; s.save(); }}>Save</button>{s.dirty && <button className="a-btn" onClick={s.undo}>Undo changes</button>}</div>
    </div>
  );
}

export default function EnquiryFormAdmin() {
  const form = useSetting('public.enquiryForm'); const routing = useSetting('enquiry.routing');
  return (
    <div className="space-y-4">
      <PageBar title="Enquiry form" help="Control the form parents use on the Contact page and home page: which questions it asks, the programmes, the thank-you message, who is emailed and how enquiries are routed." />
      <p className="rounded-xl bg-sky-50 p-4 text-sm text-sky-900">Every enquiry is saved under <strong>Enquiries & leads</strong>, where you can assign, follow up and export. Parents must tick the consent box before anything is stored. The reply email wording is under <strong>Email templates</strong>.</p>
      <Card title="Form questions & messages" desc="Choose what the form asks and says." fields={FORM} s={form} />
      <Card title="Notifications & routing" desc="Who is told about new enquiries, and who they are assigned to." fields={ROUTING} s={routing} />
    </div>
  );
}

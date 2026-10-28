'use client';
import { useState } from 'react';
import { collect, translateMissing } from '@/lib/translate';
import { Help } from './Help';
import { useToast } from './Toast';

/** Translates every English text inside `value` that has no Arabic yet (or whose machine translation is out of date). Results stay editable. */
export function TranslateButton({ value, onChange, label = 'Translate missing Arabic', small = false, help }: { value: any; onChange: (v: any) => void; label?: string; small?: boolean; help?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pending = collect(value);
  const todo = pending.filter((p) => p.state !== 'stale-manual').length;
  const manualStale = pending.length - todo;

  async function run() {
    if (!pending.length) return toast.info('Nothing to translate: every English text already has Arabic.');
    setBusy(true);
    try {
      const r = await translateMissing(value);
      if (r.done) onChange(r.value);
      toast.success(`${r.done} text${r.done === 1 ? '' : 's'} translated to Arabic. They are marked “Auto-translated”: please read them before publishing.${r.skipped ? ` ${r.skipped} you wrote yourself ${r.skipped === 1 ? 'was' : 'were'} left alone (the English changed, so check ${r.skipped === 1 ? 'it' : 'them'}).` : ''}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Translation failed.');
    }
    setBusy(false);
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className={`a-btn ${small ? 'a-btn-sm' : ''}`} disabled={busy} onClick={run} title="Uses Google Translate. Arabic you typed yourself is never overwritten.">
        {busy ? 'Translating…' : <>🌐 {label}{todo + manualStale > 0 && <span className="ms-1 rounded-full bg-amber-200 px-1.5 text-[11px] font-bold text-amber-900">{todo + manualStale}</span>}</>}
      </button>
      {help && <Help text={help} align="right" />}
    </span>
  );
}

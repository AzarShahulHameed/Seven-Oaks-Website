'use client';
import { adminFetch, describeError, jsonBody } from './admin-api';

/** A bilingual text box is saved as { en, ar, arSrc }. arSrc remembers whether the Arabic was machine-made ("auto") or typed/checked by a person ("manual"), and which English it was based on. */
export type I18n = { en?: string; ar?: string; arSrc?: string };
export type Path = (string | number)[];

export const hashEn = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export const stamp = (kind: 'auto' | 'manual', en: string) => `${kind}:${hashEn(en)}`;

export function isI18n(o: any): o is I18n {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const k = Object.keys(o);
  return k.length > 0 && k.every((x) => x === 'en' || x === 'ar' || x === 'arSrc') && (typeof o.en === 'string' || typeof o.ar === 'string');
}

export type TState = 'empty' | 'missing' | 'stale-auto' | 'stale-manual' | 'auto' | 'ok';
export function stateOf(v: I18n | undefined): TState {
  const en = (v?.en ?? '').trim(), ar = (v?.ar ?? '').trim();
  if (!en) return 'empty';
  if (!ar) return 'missing';
  const src = v?.arSrc;
  if (!src) return 'ok';
  const [kind, h] = [src.slice(0, src.indexOf(':')), src.slice(src.indexOf(':') + 1)];
  const stale = h !== hashEn(v!.en!);
  return stale ? (kind === 'auto' ? 'stale-auto' : 'stale-manual') : kind === 'auto' ? 'auto' : 'ok';
}

export type Target = { path: Path; en: string; state: TState };
/** Finds every bilingual text inside any value (a page, a section, a setting) that needs an Arabic version. */
export function collect(value: any, path: Path = [], out: Target[] = []): Target[] {
  if (isI18n(value)) {
    const st = stateOf(value);
    if (st === 'missing' || st === 'stale-auto' || st === 'stale-manual') out.push({ path, en: value.en!, state: st });
    return out;
  }
  if (Array.isArray(value)) value.forEach((x, n) => collect(x, [...path, n], out));
  else if (value && typeof value === 'object') for (const [k, x] of Object.entries(value)) collect(x, [...path, k], out);
  return out;
}

export function setAt(root: any, path: Path, v: any): any {
  if (!path.length) return v;
  const [h, ...rest] = path;
  if (Array.isArray(root)) return root.map((x, n) => (n === h ? setAt(x, rest, v) : x));
  return { ...root, [h]: setAt(root?.[h], rest, v) };
}

/** Sends the English texts to Google Translate (through our server) and returns Arabic. Throws an Error with a plain-language reason. */
export async function translateTexts(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const r = await adminFetch('/admin/translate', { method: 'POST', ...jsonBody({ texts: texts.slice(i, i + 100), source: 'en', target: 'ar' }) });
    if (!r.ok) throw new Error(await describeError(r));
    out.push(...(await r.json()).texts);
  }
  return out;
}

/** Fills Arabic for everything missing (and for machine-translated text whose English changed). Person-edited Arabic is never overwritten. */
export async function translateMissing(value: any): Promise<{ value: any; done: number; skipped: number }> {
  const all = collect(value);
  const todo = all.filter((t) => t.state !== 'stale-manual');
  const skipped = all.length - todo.length;
  if (!todo.length) return { value, done: 0, skipped };
  const ar = await translateTexts(todo.map((t) => t.en));
  let next = value;
  todo.forEach((t, n) => { next = setAt(next, t.path, { en: t.en, ar: ar[n], arSrc: stamp('auto', t.en) }); });
  return { value: next, done: todo.length, skipped };
}

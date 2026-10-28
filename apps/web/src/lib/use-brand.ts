'use client';
import { useEffect, useState } from 'react';

export type Brand = { logoUrl: string; logoDarkUrl: string; faviconUrl: string; name: string };
const SAFE = /^(https:\/\/|\/(?!\/))/;
const clean = (v: unknown) => (typeof v === 'string' && SAFE.test(v) ? v : '');
const subs = new Set<(b: Brand) => void>();
let cache: Brand | null = null;
let inflight: Promise<Brand> | null = null;

async function load(): Promise<Brand> {
  try {
    const r = await fetch('/api/public/bootstrap', { cache: 'no-store' });
    const j = await r.json();
    const b = j?.settings?.['public.branding'] ?? {};
    return { logoUrl: clean(b.logoUrl), logoDarkUrl: clean(b.logoDarkUrl), faviconUrl: clean(b.faviconUrl), name: String(j?.settings?.['public.site']?.name?.en ?? '') };
  } catch {
    return { logoUrl: '', logoDarkUrl: '', faviconUrl: '', name: '' };
  }
}

/** Call after the logo setting is saved so the admin screens update instantly. */
export function refreshBrand() {
  inflight = load().then((b) => { cache = b; subs.forEach((f) => f(b)); return b; });
  return inflight;
}

/** The logo and name saved in Admin → Settings → Logo & icon. Used by the sidebar, header and sign-in pages. */
export function useBrand(): Brand | null {
  const [b, setB] = useState<Brand | null>(cache);
  useEffect(() => {
    subs.add(setB);
    if (!cache) (inflight ??= load().then((x) => (cache = x))).then(setB);
    return () => { subs.delete(setB); };
  }, []);
  return b;
}

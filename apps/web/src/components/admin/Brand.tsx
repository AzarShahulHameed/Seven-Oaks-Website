'use client';
import { useBrand } from '@/lib/use-brand';

/** The nursery logo from Settings. On a dark background it uses the "dark background" logo if one was uploaded, otherwise sits on a white chip. */
export function BrandMark({ on = 'light', className = 'h-9', showName = false }: { on?: 'light' | 'dark'; className?: string; showName?: boolean }) {
  const b = useBrand();
  const dark = on === 'dark';
  const src = dark ? b?.logoDarkUrl || b?.logoUrl : b?.logoUrl;
  const chip = dark && !b?.logoDarkUrl && !!b?.logoUrl;
  if (!b) return <span className={`inline-block ${className} aspect-square rounded-lg bg-slate-300/30`} aria-hidden />;
  if (!src) return <span className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-lg" aria-hidden>🌰</span>{b.name || 'Admin'}</span>;
  return (
    <span className="flex items-center gap-2">
      <span className={chip ? 'rounded-xl bg-white px-2.5 py-1.5' : ''}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={b.name || 'Logo'} className={`${className} w-auto max-w-[13.5rem] object-contain`} />
      </span>
      {showName && b.name && <span className="font-bold">{b.name}</span>}
    </span>
  );
}

export function Avatar({ url, name, size = 32, className = '' }: { url?: string | null; name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const s = { width: size, height: size, fontSize: Math.max(11, size * 0.4) };
  return url && /^(https:\/\/|\/(?!\/))/.test(url)
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={url} alt="" style={s} className={`shrink-0 rounded-full object-cover ${className}`} />
    : <span style={s} className={`grid shrink-0 place-items-center rounded-full bg-emerald-200 font-bold text-emerald-900 ${className}`} aria-hidden>{initials}</span>;
}

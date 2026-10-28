const SAFE = /^[^;{}<>\\]*$/;

/** Flattens saved design tokens into CSS variables: tokens.colors.primary → --colors-primary */
export function tokensToCss(tokens: Record<string, any>): string {
  const out: string[] = [];
  const walk = (v: any, path: string[]) => {
    if (path[0] === 'fontUrls') return;
    if (typeof v === 'string' || typeof v === 'number') {
      const s = String(v);
      if (s.trim() === '') return; // an empty value would hide the built-in default
      if (SAFE.test(s) && s.length < 300) out.push(`--${path.join('-')}:${s}`);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, x] of Object.entries(v)) if (/^[A-Za-z0-9]+$/.test(k)) walk(x, [...path, k]);
    }
  };
  walk(tokens, []);
  return `:root{${out.join(';')}}`;
}

export function fontUrls(tokens: Record<string, any>): string[] {
  const urls = Array.isArray(tokens?.fontUrls) ? tokens.fontUrls : [];
  return urls.filter((u: unknown): u is string => typeof u === 'string' && u.startsWith('https://fonts.googleapis.com/'));
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageBar } from '@/components/admin/AdminShell';
import { useDirtyFlag } from '@/components/admin/Dirty';
import { SchemaForm, validate } from '@/components/admin/Fields';
import { Help } from '@/components/admin/Help';
import { useToast } from '@/components/admin/Toast';
import { adminFetch, describeError, jsonBody } from '@/lib/admin-api';
import { getPath, setPath, THEME_FIELDS } from '@/lib/admin-schemas';
import { fontUrls, tokensToCss } from '@/lib/theme';

// One-click colour sets. “Seven Oaks green” is taken from the nursery logo.
const PRESETS: { name: string; note: string; colors: Record<string, string> }[] = [
  { name: 'Seven Oaks green', note: 'From the logo (recommended)', colors: { primary: '#3a7d2c', secondary: '#eef5dc', accent: '#9bc53d', background: '#fcfdf6', surface: '#ffffff', text: '#27381f', link: '#1b5fc9', buttonBg: '#3a7d2c', buttonText: '#ffffff', brown: '#8a6a34', sunny: '#ffc93c', sky: '#5bbce4', coral: '#ff7a59', berry: '#e0629a' } },
  { name: 'Sunny meadow', note: 'Green with golden yellow', colors: { primary: '#2f7d4f', secondary: '#f3f7e2', accent: '#f2b632', background: '#fffdf5', surface: '#ffffff', text: '#2a3a26', link: '#1b5fc9', buttonBg: '#2f7d4f', buttonText: '#ffffff', brown: '#8a6a34', sunny: '#ffc93c', sky: '#5bbce4', coral: '#ff7a59', berry: '#e0629a' } },
  { name: 'Ocean blue', note: 'Blue and aqua', colors: { primary: '#1f6fb2', secondary: '#e8f3fb', accent: '#4cc3d9', background: '#fbfdff', surface: '#ffffff', text: '#1f2d3d', link: '#1b5fc9', buttonBg: '#1f6fb2', buttonText: '#ffffff', brown: '#8a6a34', sunny: '#ffc93c', sky: '#5bbce4', coral: '#ff7a59', berry: '#e0629a' } },
  { name: 'Berry pop', note: 'Pink and plum', colors: { primary: '#a8326b', secondary: '#fbeaf2', accent: '#f0a6c8', background: '#fffafc', surface: '#ffffff', text: '#3a2030', link: '#1b5fc9', buttonBg: '#a8326b', buttonText: '#ffffff', brown: '#8a6a34', sunny: '#ffc93c', sky: '#5bbce4', coral: '#ff7a59', berry: '#e0629a' } },
];
// Fonts offered in the drop-downs. Choosing one also adds its Google Fonts link automatically.
type FontChoice = { label: string; css: string; fam: string };
const FONT_CHOICES: Record<'heading' | 'body' | 'arabic' | 'script', FontChoice[]> = {
  heading: [
    { label: 'Fredoka – round and playful', css: "'Fredoka', 'Nunito', system-ui, sans-serif", fam: 'Fredoka:wght@500;600;700' },
    { label: 'Baloo 2 – chunky and friendly', css: "'Baloo 2', 'Nunito', system-ui, sans-serif", fam: 'Baloo+2:wght@500;600;700' },
    { label: 'Quicksand – soft and modern', css: "'Quicksand', 'Nunito', system-ui, sans-serif", fam: 'Quicksand:wght@500;600;700' },
    { label: 'Poppins – clean', css: "'Poppins', system-ui, sans-serif", fam: 'Poppins:wght@500;600;700' },
    { label: 'Cormorant Garamond – elegant', css: "'Cormorant Garamond', Georgia, serif", fam: 'Cormorant+Garamond:wght@500;600;700' },
    { label: 'Playfair Display – classic', css: "'Playfair Display', Georgia, serif", fam: 'Playfair+Display:wght@500;600;700' },
  ],
  body: [
    { label: 'Nunito – friendly and easy to read', css: "'Nunito', system-ui, sans-serif", fam: 'Nunito:wght@400;600;700' },
    { label: 'Quicksand – soft', css: "'Quicksand', system-ui, sans-serif", fam: 'Quicksand:wght@400;600;700' },
    { label: 'Poppins – clean', css: "'Poppins', system-ui, sans-serif", fam: 'Poppins:wght@400;600;700' },
    { label: 'Inter – neutral', css: "'Inter', system-ui, sans-serif", fam: 'Inter:wght@400;600;700' },
    { label: 'Lato – calm', css: "'Lato', system-ui, sans-serif", fam: 'Lato:wght@400;700' },
  ],
  arabic: [
    { label: 'Cairo', css: "'Cairo', 'Tajawal', system-ui, sans-serif", fam: 'Cairo:wght@400;600;700' },
    { label: 'Tajawal', css: "'Tajawal', 'Cairo', system-ui, sans-serif", fam: 'Tajawal:wght@400;500;700' },
    { label: 'Almarai', css: "'Almarai', 'Cairo', system-ui, sans-serif", fam: 'Almarai:wght@400;700' },
  ],
  script: [
    { label: 'Caveat – neat handwriting', css: "'Caveat', cursive", fam: 'Caveat:wght@500;700' },
    { label: 'Patrick Hand – schoolbook', css: "'Patrick Hand', cursive", fam: 'Patrick+Hand' },
    { label: 'Indie Flower – childlike', css: "'Indie Flower', cursive", fam: 'Indie+Flower' },
    { label: 'Shantell Sans – playful', css: "'Shantell Sans', cursive", fam: 'Shantell+Sans:wght@400;600' },
  ],
};
const ROLE_LABEL: Record<string, string> = { heading: 'Heading font', body: 'Body (reading) font', arabic: 'Arabic font', script: 'Handwriting font (playful taglines)' };
const gUrl = (fams: string[]) => `https://fonts.googleapis.com/css2?${[...new Set(fams)].map((f) => `family=${f}`).join('&')}&display=swap`;

const flat = (tokens: any, fields: any[]) => Object.fromEntries(fields.map((f) => [f.k, f.type === 'strings' ? (getPath(tokens, f.k) ?? []) : (getPath(tokens, f.k) ?? '')]));

export default function ThemePage() {
  const toast = useToast();
  const [tokens, setTokens] = useState<any>(null);
  const [saved, setSaved] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => { adminFetch('/admin/theme').then(async (r) => { if (r.ok) { const t = (await r.json()).tokens; setTokens(t); setSaved(JSON.stringify(t)); } else toast.error(await describeError(r)); }); /* eslint-disable-next-line */ }, []);
  const dirty = tokens !== null && JSON.stringify(tokens) !== saved;
  useDirtyFlag(dirty);
  const errors = useMemo(() => (tokens ? THEME_FIELDS.map((g) => validate(g.fields, flat(tokens, g.fields))) : []), [tokens]);
  if (!tokens) return <p>Loading…</p>;
  const n = errors.reduce((a, e) => a + Object.keys(e).length, 0);

  async function save() {
    setShow(true);
    if (n) return toast.error(`Not saved: please fix ${n} problem${n > 1 ? 's' : ''} marked in red.`);
    const r = await adminFetch('/admin/theme', { method: 'PUT', ...jsonBody({ tokens }) });
    if (r.ok) { setSaved(JSON.stringify(tokens)); toast.success('Colours & fonts published. The website updates within a few seconds.'); } else toast.error(await describeError(r));
  }

  return (
    <div className="space-y-6">
      <PageBar title="Colours & fonts" help="The look of the whole website. Changes here apply to every page once you press Save & publish. Use the live preview to check before saving.">
        {dirty && <button className="a-btn" onClick={() => { setTokens(JSON.parse(saved)); setShow(false); }}>Undo changes</button>}
        <button className="a-btn a-btn-primary" disabled={!dirty} onClick={save}>Save & publish</button>
      </PageBar>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="a-card">
            <h2>Quick colour sets<Help text="One click changes all the colours below. You can still adjust any single colour afterwards. Nothing is saved until you press Save & publish." align="left" /></h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PRESETS.map((p) => (
                <button key={p.name} type="button" className="rounded-xl border border-slate-200 p-3 text-start hover:border-slate-400 focus-visible:outline focus-visible:outline-2" onClick={() => { setTokens((t: any) => ({ ...t, colors: { ...(t.colors ?? {}), ...p.colors } })); toast.info(`“${p.name}” applied. Press Save & publish to make it live.`); }}>
                  <span className="mb-2 flex gap-1">{[p.colors.primary, p.colors.accent, p.colors.secondary, p.colors.brown, p.colors.sunny].map((c, k) => <span key={k} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c }} />)}</span>
                  <b className="block text-sm">{p.name}</b><span className="text-xs text-slate-600">{p.note}</span>
                </button>
              ))}
            </div>
          </section>
          {THEME_FIELDS.map((g, i) => g.title === 'Fonts' ? (
            <section key={g.title} className="a-card">
              <h2>{g.title}<Help text="Pick a font from each list. The matching Google Fonts link is added for you, so the font loads on the website. Use “Advanced” only if you know the CSS font name." align="left" /></h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {(['heading', 'body', 'arabic', 'script'] as const).map((role) => {
                  const cur = String(getPath(tokens, `fonts.${role}`) ?? '');
                  const known = FONT_CHOICES[role].some((c) => c.css === cur);
                  return (
                    <div key={role}>
                      <label className="a-label" htmlFor={`font-${role}`}>{ROLE_LABEL[role]}</label>
                      <select id={`font-${role}`} className="a-input" value={known ? cur : '__custom'} onChange={(e) => {
                        if (e.target.value === '__custom') return;
                        setTokens((t: any) => {
                          const next = setPath(t, `fonts.${role}`, e.target.value);
                          const fams = (['heading', 'body', 'arabic', 'script'] as const).map((r) => FONT_CHOICES[r].find((c) => c.css === getPath(next, `fonts.${r}`))?.fam);
                          const all = fams.every(Boolean);
                          const gen = gUrl(fams.filter(Boolean) as string[]);
                          return { ...next, fontUrls: all ? [gen] : [...new Set([...(Array.isArray(t.fontUrls) ? t.fontUrls : []), gen])] };
                        });
                      }}>
                        {FONT_CHOICES[role].map((c) => <option key={c.css} value={c.css} style={{ fontFamily: c.css }}>{c.label}</option>)}
                        {!known && <option value="__custom">Custom: {cur.slice(0, 40)}</option>}
                      </select>
                    </div>
                  );
                })}
              </div>
              <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Advanced: type font names and links yourself</summary>
                <div className="mt-3"><SchemaForm fields={g.fields} value={flat(tokens, g.fields)} errors={show ? errors[i] : {}}
                  onChange={(nv) => setTokens((t: any) => g.fields.reduce((acc, f) => (JSON.stringify(nv[f.k]) !== JSON.stringify(getPath(acc, f.k)) ? setPath(acc, f.k, nv[f.k]) : acc), t))} /></div>
              </details>
            </section>
          ) : (
            <section key={g.title} className="a-card">
              <h2>{g.title}<Help text={g.help} align="left" /></h2>
              <div className="mt-3">
                <SchemaForm fields={g.fields} value={flat(tokens, g.fields)} errors={show ? errors[i] : {}}
                  onChange={(nv) => setTokens((t: any) => g.fields.reduce((acc, f) => (JSON.stringify(nv[f.k]) !== JSON.stringify(getPath(acc, f.k)) ? setPath(acc, f.k, nv[f.k]) : acc), t))} />
              </div>
            </section>
          ))}
          <section className="a-card">
            <h2>Start again<Help text="Puts every colour, font and size back to the starter look from the logo. Nothing is saved until you press Save & publish." align="left" /></h2>
            <button type="button" className="a-btn mt-3" onClick={() => { setTokens((t: any) => ({ ...t, colors: { ...(t.colors ?? {}), ...PRESETS[0].colors }, fonts: { heading: FONT_CHOICES.heading[0].css, body: FONT_CHOICES.body[0].css, arabic: FONT_CHOICES.arabic[0].css, script: FONT_CHOICES.script[0].css }, fontUrls: [gUrl([FONT_CHOICES.heading[0].fam, FONT_CHOICES.body[0].fam, FONT_CHOICES.arabic[0].fam, FONT_CHOICES.script[0].fam])] })); toast.info('Starter look loaded. Press Save & publish to make it live.'); }}>Load the starter look</button>
          </section>
        </div>
        <aside className="self-start xl:sticky xl:top-20">
          <h2 className="mb-2 flex items-center gap-2 font-bold">Live preview<Help text="A small sample using your current choices. It updates as you type, before saving." /></h2>
          {fontUrls(tokens).map((u) => <link key={u} rel="stylesheet" href={u} />)}
          <style>{tokensToCss(tokens).replace(':root', '.preview')}</style>
          <div className="preview rounded-2xl border p-4" style={{ background: 'var(--colors-background)', color: 'var(--colors-text)', fontFamily: 'var(--fonts-body)' }}>
            <h3 style={{ fontFamily: 'var(--fonts-heading)', fontSize: 'var(--sizes-h2)', color: 'var(--colors-primary)', lineHeight: 1.15 }}>Seven Oaks</h3>
            <p style={{ fontSize: 'var(--sizes-body)' }}>Where little minds grow and friendships flourish.</p>
            <p style={{ fontFamily: 'var(--fonts-script)', fontSize: '1.5rem', color: 'var(--colors-accent)' }}>Play · Learn · Grow</p>
            <div className="my-3 p-4" style={{ background: 'var(--colors-secondary)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>A soft panel</div>
            <div className="my-3 p-4" style={{ background: 'var(--colors-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>A white card</div>
            <button style={{ background: 'var(--colors-buttonBg)', color: 'var(--colors-buttonText)', borderRadius: 'var(--radius-button)', padding: '0.6rem 1.4rem', fontSize: 'var(--sizes-button)', fontWeight: 700 }}>BOOK A TOUR</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

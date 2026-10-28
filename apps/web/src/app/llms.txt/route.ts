// /llms.txt: a plain-text, AI-friendly summary of the website (llmstxt.org convention). Built from the published pages and Settings.
import { getBootstrap, getPage, getSitemap } from '@/lib/api';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\*/g, '').trim();

export async function GET() {
  const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  const [b, map] = await Promise.all([getBootstrap(), getSitemap()]);
  const s = b?.settings ?? {};
  if (s['public.seoDefaults']?.blockAiCrawlers === true) return new Response('# llms.txt is switched off\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  const name = t(s['public.site']?.name, 'en') || 'Nursery';
  const c = s['public.contact'] ?? {}; const sch = s['public.schema'] ?? {};
  const lines: string[] = [`# ${name}`, '', `> ${clean(t(s['public.site']?.tagline, 'en'))}. ${name} is a ${sch.type === 'ChildCare' ? 'child care centre' : 'nursery (preschool)'} in ${clean(t(sch.locality, 'en') || 'the UAE')}, offering the British Early Years Foundation Stage (EYFS) curriculum in English and Arabic.`, ''];
  const facts = [c.phone && `Phone: ${c.phone}`, c.email && `Email: ${c.email}`, t(c.address, 'en') && `Address: ${clean(t(c.address, 'en'))}`, t(c.hours, 'en') && `Opening hours: ${clean(t(c.hours, 'en'))}`].filter(Boolean);
  if (facts.length) lines.push('## Key facts', ...facts.map((f) => `- ${f}`), '');
  lines.push('## Pages', '');
  const faqs: { q: string; a: string }[] = [];
  for (const p of map ?? []) {
    const slug = p.slugs.en ?? '';
    const pg = await getPage('en', slug);
    if (!pg) continue;
    const desc = clean(t(pg.seo.metaDescription, 'en'));
    lines.push(`- [${clean(t(pg.title, 'en'))}](${site}/en${slug ? '/' + slug : ''})${desc ? `: ${desc}` : ''}`);
    for (const sec of pg.sections) if (sec.type === 'faq') for (const it of sec.config?.items ?? []) { const q = clean(t(it.q, 'en')), a = clean(t(it.a, 'en')); if (q && a && !faqs.some((f) => f.q === q)) faqs.push({ q, a }); }
  }
  lines.push('', `Arabic versions of every page are available at ${site}/ar.`, '');
  if (faqs.length) lines.push('## Frequently asked questions', '', ...faqs.flatMap((f) => [`**${f.q}**`, f.a, '']));
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600, s-maxage=3600' } });
}

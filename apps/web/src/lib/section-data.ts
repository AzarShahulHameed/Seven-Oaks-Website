import { getEntries, getTestimonials } from '@/lib/api';
import { entryKey } from '@/components/sections';

/** Loads what some blocks need (managed reviews, lists of galleries / detail pages) so a page or a detail page can show them. */
export async function loadSectionData(sections: { type: string; config: any }[], locale: string) {
  const places = [...new Set(sections.filter((s) => s.type === 'testimonials' && s.config?.source === 'managed').map((s) => String(s.config?.place || 'home')))];
  const lists = await Promise.all(places.map((pl) => getTestimonials(pl, locale)));
  const eSecs = sections.filter((s) => s.type === 'entry-list').map((s) => s.config);
  const eKeys = [...new Set(eSecs.map(entryKey))];
  const eLoaded = await Promise.all(eKeys.map(async (k) => {
    const [kind, group, limit] = k.split('|'); const c = eSecs.find((x) => entryKey(x) === k);
    const cats = kind === 'GALLERY' && c?.showCategories !== false ? await getEntries('CATEGORY', '', 30) : [];
    return [k, { list: await getEntries(kind as any, group, Number(limit)), cats }] as const;
  }));
  return { testimonials: Object.fromEntries(places.map((pl, n) => [pl, lists[n]])), entries: Object.fromEntries(eLoaded) };
}

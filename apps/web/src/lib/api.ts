// Server-side data access for the public site. Cached with tags; admin publishes call /api/revalidate.
export type Bootstrap = {
  theme: Record<string, any>;
  settings: Record<string, any>;
  menus: Record<string, { label: any; href: string; isButton: boolean; children: any[] }[]>;
};
export type PageData = {
  key: string; title: any; alternates: Record<string, string>;
  seo: { metaTitle?: any; metaDescription?: any; keywords?: any; noindex?: boolean; canonical?: string | null; ogImageUrl?: string | null; jsonLd?: Record<string, any> | null };
  sections: { id: string; type: string; config: any }[];
};

const base = () => (process.env.API_URL ?? '').replace(/\/$/, '');

async function get<T>(path: string, tag: 'content' | 'bootstrap'): Promise<T | null> {
  if (!process.env.API_URL) return null;
  try {
    const res = await fetch(`${base()}/api${path}`, { next: { tags: [tag], revalidate: 300 } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getBootstrap = () => get<Bootstrap>('/public/bootstrap', 'bootstrap');
export const getPage = (locale: string, slug: string) =>
  get<PageData>(`/public/page?locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(slug)}`, 'content');
export const getRedirect = (path: string) => get<{ to: string; status: number }>(`/public/redirect?path=${encodeURIComponent(path)}`, 'content');
export const getSitemap = () => get<{ key: string; slugs: Record<string, string>; lastmod?: string }[]>('/public/sitemap', 'content');
export type PublicTestimonial = { id: string; name: string; child: string | null; body: { en?: string; ar?: string }; rating: number | null; imageUrl: string | null; featured: boolean };
export const getTestimonials = async (place: string, locale: string) => (await get<PublicTestimonial[]>(`/public/testimonials?place=${encodeURIComponent(place)}&locale=${encodeURIComponent(locale)}`, 'content')) ?? [];

// ───────── galleries and detail pages (Admin → Galleries / Detail pages) ─────────
export type EntryCard = { id: string; kind: 'CATEGORY' | 'GALLERY' | 'DETAIL'; slug: string; group: string; path?: string; title: any; summary: any; cover: any; count: number; videos: number };
export type EntryFull = { id: string; kind: EntryCard['kind']; slug: string; group: string; path?: string; design?: { style?: string; showBack?: boolean; parentLabel?: any; badge?: any }; blocks?: { type: string; config: any; isVisible?: boolean }[]; title: any; summary: any; body: any; cover: any; items: { media: any; caption: any }[]; docs: { label: any; url: string; note: any }[]; links: { label: any; url: string }[]; info: { label: any; value: any }[]; seo: { metaTitle?: any; metaDescription?: any; ogImageUrl?: string; noindex?: boolean }; updatedAt: string };
export const getEntries = async (kind: EntryCard['kind'], group = '', limit = 60) => (await get<EntryCard[]>(`/public/entries?kind=${kind}&group=${encodeURIComponent(group)}&limit=${limit}`, 'content')) ?? [];
export const getEntry = (kind: EntryCard['kind'], slug: string) => get<{ entry: EntryFull; related: EntryCard[]; category: EntryCard | null }>(`/public/entry?kind=${kind}&slug=${encodeURIComponent(slug)}`, 'content');
export const getEntrySitemap = async () => (await get<{ kind: string; slug: string; path?: string; lastmod?: string }[]>('/public/entries/sitemap', 'content')) ?? [];

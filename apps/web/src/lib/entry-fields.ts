import type { FieldDef } from '@/components/admin/Fields';

export type Kind = 'GALLERY' | 'CATEGORY' | 'DETAIL';
const t = (k: string, label: string, help?: string, extra: object = {}): FieldDef => ({ k, label, help, type: 'i18n', ...extra } as FieldDef);

export const KIND_INFO: Record<Kind, { single: string; plural: string; base: string; draftKey: string; liveBase: string; blurb: string }> = {
  GALLERY: { single: 'gallery', plural: 'Galleries', base: '/admin/galleries', draftKey: 'gallery', liveBase: 'gallery', blurb: 'Each gallery has its own page with a description, photos, videos and extra information. Visitors reach it from the Gallery page.' },
  CATEGORY: { single: 'category', plural: 'Gallery categories', base: '/admin/gallery-categories', draftKey: 'category', liveBase: 'gallery/c', blurb: 'Categories group your galleries (for example Celebrations or Outdoor play). Each category has its own page.' },
  DETAIL: { single: 'detail page', plural: 'Detail pages', base: '/admin/details', draftKey: 'entry', liveBase: 'info', blurb: 'Reusable pages for anything that needs more room than a block: Parent Handbook, Nursery Calendar, policies. Link to them from any page, menu or button.' },
};

const SEO: FieldDef = { k: 'seo', label: 'Search engines (SEO)', type: 'object', fields: [
  t('metaTitle', 'Title in Google results', 'Leave empty to use the title.', { max: 70 }),
  t('metaDescription', 'Description in Google results', 'One or two sentences. Leave empty to use the short description.', { multiline: true, max: 170 }),
  { k: 'ogImageUrl', label: 'Picture when shared (WhatsApp, Facebook)', type: 'imageurl' },
  { k: 'noindex', label: 'Hide from Google', type: 'bool' },
] };

export function entryFields(kind: Kind, categories: [string, string][], folders: [string, string][] = []): FieldDef[] {
  const base: FieldDef[] = [
    t('title', 'Title', undefined, { required: true, max: 120 }),
    { k: 'slug', label: 'Web address', type: 'text', required: true, max: 80, placeholder: 'e.g. story-time', help: 'Lowercase letters, numbers and dashes. This becomes part of the page address.' },
  ];
  if (kind === 'GALLERY') base.push({ k: 'group', label: 'Category', type: 'select', options: [['', 'No category'], ...categories], help: 'Choose where this gallery belongs. Manage categories in Gallery categories.' });
  if (kind === 'DETAIL') base.push({ k: 'path', label: 'Where this page lives (folder in the web address)', type: 'select', options: [['info', 'Standalone: /info/…'], ...folders], help: 'Choose the page this belongs under, for example Parents → the address becomes /parents/your-page. The breadcrumb and the Back button then lead to that page. Pick “Standalone” for no parent.' });
  if (kind === 'DETAIL') base.push({ k: 'group', label: 'Topic (optional)', type: 'text', max: 80, placeholder: 'e.g. parents', help: 'Pages with the same topic are suggested to each other as related pages.' });
  base.push(t('summary', 'Short description', 'Shown on cards and under the title.', { multiline: true, max: 300 }));
  if (kind !== 'CATEGORY') base.push(t('body', 'Description', 'Blank line = new paragraph. “## ” starts a heading. “- ” starts a bullet. **bold** makes text bold. [link text](https://address) makes a link.', { multiline: true }));
  base.push({ k: 'cover', label: 'Cover picture or video', type: 'image', frame: 'side', where: 'On cards, and large at the top of its own page.' });
  if (kind === 'DETAIL') base.push({ k: 'design', label: 'Top banner look', type: 'object', fields: [
    { k: 'style', label: 'Style', type: 'select', options: [['split', 'Text with a framed photo beside it (playful)'], ['banner', 'Full-width photo banner'], ['simple', 'Simple colourful heading, no photo']], help: 'How the top of the page looks. A cover picture is needed for the first two.' },
    { k: 'showBack', label: 'Show a “Back” button', type: 'bool', help: 'Takes visitors to the page they came from.' },
    t('parentLabel', 'Name of the parent page in the breadcrumb (optional)', 'Leave empty to use the parent page’s own title.', { max: 40 }),
    t('badge', 'Small sticker above the title (optional)', 'E.g. “For parents” or “Good to know”.', { max: 30 }),
  ] });
  if (kind !== 'CATEGORY') {
    base.push(
      { k: 'items', label: kind === 'GALLERY' ? 'Photos and videos' : 'Pictures and videos', type: 'list', itemName: 'photo or video', titleKey: 'caption', bulkImage: 'media', addLabel: 'Add one', min: 0, help: 'Use “Add several photos at once” to pick many photos together. Each item can be a photo, a video, or both. Use the arrows to change the order.',
        item: [{ k: 'media', label: 'Photo or video', type: 'image', frame: 'card' }, t('caption', 'Caption (optional)')] },
      { k: 'info', label: 'Additional information', type: 'list', itemName: 'row', titleKey: 'label', addLabel: 'Add a row', help: 'Small facts shown as cards, e.g. Date, Age group, Location.', item: [t('label', 'Label', undefined, { required: true }), t('value', 'Value', undefined, { required: true })] },
      { k: 'docs', label: 'Documents to download', type: 'list', itemName: 'document', titleKey: 'label', addLabel: 'Add a document', item: [t('label', 'Name shown to visitors', undefined, { required: true }), { k: 'url', label: 'Document', type: 'file', required: true }, t('note', 'Short note (optional)', 'e.g. PDF, 2 pages')] },
      { k: 'links', label: 'External or internal links', type: 'list', itemName: 'link', titleKey: 'label', addLabel: 'Add a link', item: [t('label', 'Link text', undefined, { required: true }), { k: 'url', label: 'Goes to', type: 'url', required: true, placeholder: '/contact or https://…' }] },
      { k: 'related', label: 'Related pages (optional)', type: 'strings', addLabel: 'Add related', placeholder: 'web address of another one, e.g. music-and-movement', help: 'Leave empty to suggest others from the same category or topic automatically.' },
    );
  }
  base.push(SEO);
  return base;
}

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
export const blankEntry = (kind: Kind) => ({
  kind, slug: '', group: '', title: { en: '', ar: '' }, summary: { en: '', ar: '' }, body: { en: '', ar: '' }, cover: { url: '', alt: { en: '', ar: '' }, focalX: 50, focalY: 50, fit: 'cover' },
  items: [], docs: [], links: [], info: [], related: [], path: 'info', blocks: [] as { type: string; config: any; isVisible: boolean }[], design: { style: 'split', showBack: true, parentLabel: { en: '', ar: '' }, badge: { en: '', ar: '' } }, seo: { metaTitle: { en: '', ar: '' }, metaDescription: { en: '', ar: '' }, ogImageUrl: '', noindex: false },
  isVisible: true, status: 'DRAFT', publishAt: null as string | null,
});

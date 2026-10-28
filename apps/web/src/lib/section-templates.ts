// Blank starting shapes for the "Add section" menu in the Page Builder (structure only, no site content).
const i = { en: '', ar: '' };
const img = { url: '', alt: { ...i } };
const btn = { label: { ...i }, href: '', variant: 'primary' };

export const SECTION_TEMPLATES: Record<string, object> = {
  hero: { eyebrow: { ...i }, title: { ...i }, text: { ...i }, image: img, buttons: [btn], location: { ...i }, script: { ...i } },
  'text-image': { title: { ...i }, subtitle: { ...i }, paragraphs: [{ ...i }], button: btn, image: img, imageQuote: { ...i } },
  'feature-grid': { title: { ...i }, items: [{ icon: 'heart', title: { ...i }, text: { ...i } }] },
  'card-row': { title: { ...i }, subtitle: { ...i }, items: [{ title: { ...i }, subtitle: { ...i }, image: img }], button: btn },
  'icon-row': { title: { ...i }, subtitle: { ...i }, text: { ...i }, button: btn, items: [{ icon: 'leaf', label: { ...i } }], tagline: { ...i } },
  'photo-grid': { title: { ...i }, subtitle: { ...i }, items: [{ label: { ...i }, image: img }] },
  banner: { title: { ...i }, subtitle: { ...i }, paragraphs: [{ ...i }], button: btn, image: img, script: { ...i } },
  'link-list': { title: { ...i }, button: btn, items: [{ icon: 'file', label: { ...i }, href: '' }] },
  testimonials: { title: { ...i }, link: btn, items: [{ quote: { ...i }, author: { ...i }, rating: 5 }] },
  cta: { title: { ...i }, text: { ...i }, buttons: [btn], showContact: false, image: img },
};

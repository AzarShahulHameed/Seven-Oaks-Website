// Describes every editable block as a form. The admin builds its screens from these definitions, so each field has a plain label
// and a "?" explanation. Anything not listed here still works through the generic JSON editor.
import type { FieldDef } from '@/components/admin/Fields';

const t = (k: string, label: string, help?: string, extra: object = {}): FieldDef => ({ k, label, help, type: 'i18n', ...extra } as FieldDef);
const area = (k: string, label: string, help?: string, extra: object = {}) => t(k, label, help, { multiline: true, ...extra });
const btn = (k: string, label: string, help?: string): FieldDef => ({ k, label, help: help ?? 'An optional button. Leave its text empty to hide it.', type: 'button' });
const image = (k: string, label: string, help?: string, o: { frame?: 'background' | 'side' | 'card' | 'square'; where?: string; caption?: boolean } = {}): FieldDef => ({ k, label, help: help ?? 'Choose a photo from your library or upload a new one.', type: 'image', ...o } as FieldDef);
const title = t('title', 'Heading', 'The large title of this block.', { required: true });

export type SectionSchema = { label: string; description: string; fields: FieldDef[] };

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {
  hero: {
    label: 'Hero banner', description: 'A big picture banner with a heading, a short text and buttons. Usually the first block on a page.',
    fields: [
      t('eyebrow', 'Small line above the heading', 'A short label in capital letters, e.g. SEVEN OAKS NURSERY.'),
      t('title', 'Main heading', 'The biggest text on the page.', { required: true }),
      area('text', 'Introduction', 'One or two sentences under the heading.'),
      image('image', 'Background picture', 'A wide picture works best. Text is placed on top of it, so choose one that is not too busy.', { frame: 'background', where: 'Fills the whole banner behind the heading and slowly moves as visitors scroll. On phones the banner is taller and narrower, so use step 1 to keep the important part (e.g. the children) in view.' }),
      { k: 'align', label: 'Text position', type: 'select', options: [['left', 'Left (start of the line)'], ['center', 'Centred']], help: 'Where the heading and buttons sit on the banner.' },
      { k: 'overlay', label: 'Darkness behind the text', type: 'select', options: [['medium', 'Medium'], ['light', 'Light (bright photos only)'], ['strong', 'Strong (busy photos)']], help: 'A dark tint helps white text stay readable on bright photos.' },
      { k: 'size', label: 'Height', type: 'select', help: 'Large is for the home page. Compact suits inner pages.', options: [['large', 'Large'], ['compact', 'Compact'], ['full', 'Full screen height']] },
      { k: 'buttons', label: 'Buttons', type: 'list', itemName: 'button', titleKey: 'label', max: 3, help: 'Up to three buttons under the introduction.', item: [{ k: 'label', label: 'Button text', type: 'i18n', required: true }, { k: 'href', label: 'Goes to', type: 'url', required: true, placeholder: '/admissions', help: 'Use /page-name for pages on this site or a full https:// address.' }, { k: 'variant', label: 'Style', type: 'select', options: [['primary', 'Solid green'], ['outline', 'Outline (dark)'], ['outline-light', 'Outline (white, for photos)'], ['light', 'White']] }] },
      t('location', 'Location line', 'Shown with a map pin, e.g. Sharjah, UAE.'),
      t('script', 'Handwritten tagline', 'A short playful phrase shown in handwriting style on large screens.'),
      { k: 'layout', label: 'Layout', type: 'select', options: [['', 'Full-width picture banner'], ['split', 'Split: text beside a framed photo (recommended for the home page)']], help: 'Split layout is warmer and shows a second small photo. Use *word* in the heading to underline a word by hand.' },
      image('image2', 'Small second photo (split layout)', 'A small square photo shown like a pinned print.', { frame: 'square', where: 'Overlaps the corner of the main photo.' }),
      { k: 'chips', label: 'Reassurance points (split layout)', type: 'list', itemName: 'point', titleKey: 'text', max: 4, addLabel: 'Add point', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, t('text', 'Text', undefined, { required: true })] },
      { k: 'badges', label: 'Floating badges (split layout)', type: 'list', itemName: 'badge', titleKey: 'title', max: 2, addLabel: 'Add badge', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, t('title', 'Title', undefined, { required: true }), t('text', 'Small text')] },
    ],
  },
  'text-image': {
    label: 'Text with picture', description: 'A heading and paragraphs on one side, a picture on the other. Can list key points and have a button.',
    fields: [
      title, t('subtitle', 'Sub-heading', 'A short line under the heading.'),
      { k: 'paragraphs', label: 'Paragraphs', type: 'i18nlist', addLabel: 'Add paragraph', help: 'Each item is one paragraph of text.' },
      { k: 'bullets', label: 'Key points (optional)', type: 'i18nlist', addLabel: 'Add point', multiline: false, help: 'A short ticked list shown under the paragraphs.' },
      btn('button', 'Button'),
      image('image', 'Picture', undefined, { frame: 'side', caption: true, where: 'Beside the text, in a rounded frame. Its side, size and height are set just below.' }), t('imageQuote', 'Handwritten words over the picture', 'Optional short phrase placed on the picture.'),
      { k: 'imagePosition', label: 'Picture side', type: 'select', options: [['right', 'On the right (left in Arabic)'], ['left', 'On the left (right in Arabic)']], help: 'Switch sides to make a page feel less repetitive. In Arabic the page is mirrored automatically.' },
      { k: 'imageSize', label: 'Picture width', type: 'select', options: [['medium', 'Half of the width'], ['small', 'Smaller (about 40%)'], ['large', 'Larger (about 60%)']], help: 'How much of the row the picture takes. The text uses the rest.' },
      { k: 'imageHeight', label: 'Picture height', type: 'select', options: [['normal', 'Normal'], ['short', 'Short'], ['tall', 'Tall']], help: 'Ignored if you choose a specific frame shape on the picture.' },
      { k: 'imageStyle', label: 'Picture corners', type: 'select', options: [['rounded', 'Rounded'], ['arch', 'Arch (rounded top)'], ['sharp', 'Square corners']] },
    ],
  },
  'feature-grid': {
    label: 'Feature grid', description: 'A green panel with several icon + title + short text items, e.g. “Why choose us”.',
    fields: [title, { k: 'items', label: 'Items', type: 'list', itemName: 'item', min: 1, addLabel: 'Add item', help: 'Each item has an icon, a title and a short text.', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, image('image', 'Real photo instead of the icon (optional)', 'Choose a photo of the activity or room. When a photo is chosen it replaces the icon.', { frame: 'square', where: 'A round photo in place of the icon.' }), t('title', 'Title', undefined, { required: true }), area('text', 'Text')] }],
  },
  'card-row': {
    label: 'Picture cards', description: 'A row of picture cards with a title and subtitle, such as your classes.',
    fields: [title, t('subtitle', 'Handwritten sub-heading'), { k: 'items', label: 'Cards', type: 'list', itemName: 'card', bulkImage: 'image', min: 1, addLabel: 'Add card', item: [t('title', 'Card title', undefined, { required: true }), t('subtitle', 'Card subtitle', 'e.g. the age range.'), image('image', 'Card picture', undefined, { frame: 'card', where: 'At the top of this card, cropped to a wide shape.' })] }, btn('button', 'Button after the cards')],
  },
  'icon-row': {
    label: 'Icon row', description: 'A heading with text on the left and a row of round icons with labels on the right.',
    fields: [title, t('subtitle', 'Sub-heading'), area('text', 'Text'), btn('button', 'Button'), { k: 'items', label: 'Icons', type: 'list', itemName: 'icon', titleKey: 'label', addLabel: 'Add icon', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, image('image', 'Real photo instead of the icon (optional)', 'Choose a photo of the activity or room. When a photo is chosen it replaces the icon.', { frame: 'square', where: 'A round photo in place of the icon.' }), t('label', 'Label', undefined, { required: true })] }, t('tagline', 'Handwritten line under the icons')],
  },
  'photo-grid': {
    label: 'Photo grid / gallery', description: 'A grid of pictures with captions. Use it for galleries and “our spaces”.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'columns', label: 'Pictures per row (large screens)', type: 'select', options: [['4', '4'], ['3', '3']] }, { k: 'style', label: 'Style', type: 'select', options: [['', 'Plain rounded'], ['polaroid', 'Pinned prints (polaroid)']] }, { k: 'animation', label: 'How pictures appear', type: 'select', options: [['rise', 'Rise in one after another (default)'], ['zoom', 'Zoom in gently'], ['fade', 'Fade in'], ['none', 'No animation']], help: 'Plays once as the visitor scrolls to the gallery. Visitors who prefer reduced motion never see animation.' }, btn('button', 'Button'), { k: 'items', label: 'Pictures', type: 'list', itemName: 'picture', titleKey: 'label', bulkImage: 'image', min: 1, addLabel: 'Add picture', item: [t('label', 'Caption', undefined, { required: true }), image('image', 'Picture', undefined, { frame: 'card', where: 'A tile in the gallery grid; the caption sits on its lower edge.' })] }],
  },
  banner: {
    label: 'Feature banner', description: 'A highlighted panel with text and a large picture, good for an important message such as inclusion.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'paragraphs', label: 'Paragraphs', type: 'i18nlist', addLabel: 'Add paragraph' }, btn('button', 'Button'), image('image', 'Picture', undefined, { frame: 'side', caption: true, where: 'Fills the right half of the highlighted panel (left half in Arabic) from top to bottom.' }), t('script', 'Handwritten words over the picture'),
      { k: 'imagePosition', label: 'Picture side', type: 'select', options: [['right', 'On the right (left in Arabic)'], ['left', 'On the left (right in Arabic)']] },
      { k: 'imageSize', label: 'Picture width', type: 'select', options: [['medium', 'Half of the width'], ['large', 'Larger (about 60%)']] }],
  },
  'link-list': {
    label: 'Quick links', description: 'A box with icon links to other pages, e.g. “For parents”.',
    fields: [title, { k: 'items', label: 'Links', type: 'list', itemName: 'link', titleKey: 'label', min: 1, addLabel: 'Add link', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, t('label', 'Link text', undefined, { required: true }), { k: 'href', label: 'Goes to', type: 'url', required: true, placeholder: '/parents', help: 'Use /page-name or a full https:// address.' }] }, btn('button', 'Button')],
  },
  testimonials: {
    label: 'Parent reviews', description: 'Quotes from parents. By default it shows the approved reviews you manage in Admin → Testimonials for this place. Only publish genuine reviews you have permission to use.',
    fields: [title,
      { k: 'source', label: 'Where do the reviews come from?', type: 'select', options: [['managed', 'From Admin → Testimonials (recommended)'], ['manual', 'Typed in here']], help: 'Managed reviews have an approval step, ratings, photos and per-page display.' },
      { k: 'place', label: 'Place name (managed reviews)', type: 'select', options: [['home', 'Home page'], ['about', 'About page'], ['testimonials', 'Testimonials page']], help: 'Only reviews ticked for this place are shown.' },
      { k: 'layout', label: 'Layout', type: 'select', options: [['carousel', 'Sliding carousel'], ['grid', 'Grid of cards']] },
      { k: 'limit', label: 'Most reviews to show', type: 'number', min: 1, max: 60 },
      { k: 'items', label: 'Typed reviews (only if “Typed in here”)', type: 'list', itemName: 'review', titleKey: 'author', addLabel: 'Add review', item: [area('quote', 'Quote', 'Use the parent’s own words.'), t('author', 'Name shown under the quote', 'e.g. “Parent of a FS1 child”.'), { k: 'rating', label: 'Stars (1–5)', type: 'number', min: 1, max: 5 }] }, btn('link', 'Link to more reviews')],
  },
  cta: {
    label: 'Call to action', description: 'A coloured banner that invites visitors to act (book a tour), optionally with your contact details.',
    fields: [title, area('text', 'Text'), { k: 'buttons', label: 'Buttons', type: 'list', itemName: 'button', titleKey: 'label', max: 3, addLabel: 'Add button', item: [t('label', 'Button text', undefined, { required: true }), { k: 'href', label: 'Goes to', type: 'url', required: true }, { k: 'variant', label: 'Style', type: 'select', options: [['light', 'White'], ['outline', 'Outline (dark)'], ['outline-light', 'Outline (white, for photos)'], ['primary', 'Solid green']] }] }, { k: 'showContact', label: 'Show contact details box', type: 'bool', help: 'Shows your address, phone, email and map from Settings → Contact details.' }, image('image', 'Faded background picture', undefined, { frame: 'background', where: 'A faint picture (30% visible) behind the coloured banner. It moves slowly as visitors scroll.' }), { k: 'align', label: 'Text position', type: 'select', options: [['left', 'Left (start of the line)'], ['center', 'Centred']] }],
  },
  'rich-text': {
    label: 'Text block', description: 'Simple headed text with paragraphs and an optional bullet list. Good for policies and longer explanations.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'paragraphs', label: 'Paragraphs', type: 'i18nlist', addLabel: 'Add paragraph' }, { k: 'bullets', label: 'Bullet points (optional)', type: 'i18nlist', addLabel: 'Add point', multiline: false }],
  },
  downloads: {
    label: 'Documents to download', description: 'A list of files visitors can download: prospectus, fee sheet, forms, policies. Upload them in Photos & documents, then place them here.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'items', label: 'Documents', type: 'list', itemName: 'document', titleKey: 'label', min: 1, addLabel: 'Add document', item: [t('label', 'Name shown to visitors', 'e.g. Admissions prospectus 2026/27', { required: true }), t('text', 'Short note (optional)', 'e.g. PDF, 2 pages'), { k: 'url', label: 'Document', type: 'file', required: true, help: 'Choose a document from your library or upload a new one. You can also paste any https:// address.' }] }],
  },
  'entry-list': {
    label: 'Galleries / detail pages', description: 'Cards that open their own page: your galleries, gallery categories or detail pages (like Parent Handbook). The content is managed in Galleries and Detail pages in the side menu.',
    fields: [title, t('subtitle', 'Sub-heading'),
      { k: 'kind', label: 'What to show', type: 'select', options: [['GALLERY', 'Galleries (photos and videos)'], ['CATEGORY', 'Gallery categories'], ['DETAIL', 'Detail pages']] },
      { k: 'group', label: 'Only this category or topic (optional)', type: 'text', placeholder: 'e.g. celebrations', help: 'Type the web address name of a category (for galleries) or topic (for detail pages) to show only those. Leave empty to show everything.' },
      { k: 'limit', label: 'Most items to show', type: 'number', min: 1, max: 60 },
      { k: 'columns', label: 'Cards per row (large screens)', type: 'select', options: [['3', '3'], ['4', '4'], ['2', '2']] },
      { k: 'animation', label: 'How cards appear', type: 'select', options: [['rise', 'Rise in one after another'], ['zoom', 'Zoom in'], ['fade', 'Fade in'], ['none', 'No animation']] },
      { k: 'showCategories', label: 'Show category buttons above the galleries', type: 'bool' }, btn('button', 'Button')],
  },
  table: {
    label: 'Table (timetable, list, prices…)', description: 'A neat table for things that change: daily timetables, term dates, documents needed, uniform lists. Type one row per line and separate the cells with the | sign — you can paste straight from Excel after replacing tabs with |.',
    fields: [t('title', 'Heading (optional)'), t('subtitle', 'Sub-heading (optional)'),
      t('header', 'Column titles', 'Separate with | e.g.  Time | Activity | Notes   (leave empty for no header row).', { max: 200 }),
      area('rows', 'Rows', 'One row per line, cells separated by |  e.g.\n8:00 – 8:30 | Arrival and free play | Parents stay at the door\n8:30 – 9:00 | Circle time | Songs and stories\nYou can use **bold** and [links](/contact) inside a cell. Write the Arabic rows in the same order.', { required: true, max: 6000 }),
      { k: 'style', label: 'Look', type: 'select', options: [['striped', 'Colourful table with alternate rows'], ['plain', 'Clean table with lines'], ['cards', 'Cards instead of a table (best on phones)']], help: 'Cards show the first cell as the title and the other cells under it.' },
      t('note', 'Small note under the table (optional)')],
  },
  callout: {
    label: 'Highlight box', description: 'A friendly coloured box that draws attention to something important: a reminder, a tip, a celebration or a warning.',
    fields: [{ k: 'tone', label: 'Colour', type: 'select', options: [['info', 'Soft green (information)'], ['tip', 'Bright lime (tip)'], ['warning', 'Warm yellow (please note)'], ['celebrate', 'Pink (celebration)']] }, { k: 'icon', label: 'Icon', type: 'icon' }, t('title', 'Title (optional)'), area('text', 'Text', 'You can use **bold** and [links](/contact).', { required: true }), btn('button', 'Button (optional)')],
  },
  faq: {
    label: 'Questions & answers', description: 'Questions that open to show the answer. Great for parents and admissions pages.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'items', label: 'Questions', type: 'list', itemName: 'question', titleKey: 'q', min: 1, addLabel: 'Add question', item: [t('q', 'Question', undefined, { required: true }), area('a', 'Answer', 'You can put links inside the answer: [link text](/admissions). They show in blue with an underline. **bold**, “- ” bullets and blank lines work too.', { required: true }), { k: 'link', label: 'Button-style link under the answer (optional)', type: 'button', help: 'E.g. “Read the full policy” → /parents/health-and-wellbeing. Leave empty to hide.' }] }],
  },
  team: {
    label: 'Team', description: 'Cards with a portrait, name, role and short biography.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'items', label: 'People', type: 'list', itemName: 'person', titleKey: 'name', min: 1, addLabel: 'Add person', item: [t('name', 'Name', undefined, { required: true }), t('role', 'Role'), t('qualification', 'Qualification', 'Shown as a small badge, e.g. BA Early Childhood Education.'), area('bio', 'Short biography'), { k: 'featured', label: 'Show this person first, large (e.g. the Director)', type: 'bool', help: 'A featured person gets a big portrait and a personal message. Tick it for one person only.' }, area('message', 'Personal message or quote', 'Shown beside the portrait of a featured person, e.g. a welcome note from the Director.'), image('image', 'Portrait', 'Only use a photo of a staff member with their permission.', { frame: 'card', where: 'At the top of this person’s card.' })] }],
  },
  partner: {
    label: 'Partner organisation', description: 'Presents a partner or charity: who they are, what they do, vision and mission, activities, a link to their website and photos or videos.',
    fields: [title, t('subtitle', 'Sub-heading'), image('logo', 'Logo or main picture', 'Their logo or a photo.', { frame: 'card', where: 'Beside the introduction.' }),
      { k: 'about', label: 'About them', type: 'i18nlist', multiline: true, addLabel: 'Add paragraph', help: 'One or two short paragraphs.' },
      area('vision', 'Vision', 'Shown in its own card.'), area('mission', 'Mission', 'Shown in its own card.'),
      { k: 'activities', label: 'Activities and support', type: 'list', itemName: 'activity', titleKey: 'title', addLabel: 'Add activity', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, t('title', 'Title', undefined, { required: true }), area('text', 'Short text')] },
      btn('button', 'Link to their website'),
      { k: 'contact', label: 'Their contact details', type: 'list', itemName: 'line', titleKey: 'text', addLabel: 'Add line', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, t('text', 'Text (address, phone, email)')] },
      { k: 'media', label: 'Photos and videos', type: 'list', itemName: 'item', titleKey: 'caption', addLabel: 'Add photo or video', bulkImage: 'image', item: [image('image', 'Photo or video', 'Choose a photo, a video, or both.', { frame: 'card', where: 'In the gallery below the text.', caption: true })] }],
  },
  steps: {
    label: 'Numbered steps', description: 'A numbered process, e.g. how admissions work or a day in the nursery.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'items', label: 'Steps', type: 'list', itemName: 'step', min: 1, addLabel: 'Add step', item: [t('title', 'Step title', undefined, { required: true }), area('text', 'Step description'), image('image', 'Photo (optional)', 'A photo shown above this step.', { frame: 'card', where: 'Above the step title.' })] }],
  },
  stats: {
    label: 'Key facts', description: 'A coloured strip of big numbers or short facts with labels.',
    fields: [t('title', 'Heading (optional)', 'A short heading shown above the strip, e.g. “Tuition 2025–2026”.'), { k: 'items', label: 'Facts', type: 'list', itemName: 'fact', titleKey: 'value', min: 1, max: 6, addLabel: 'Add fact', item: [{ k: 'value', label: 'Big text', type: 'text', required: true, max: 24, help: 'e.g. 5, EYFS or 3 months – 5 years.' }, t('label', 'Label under it', undefined, { required: true })] }],
  },
  scenery: {
    label: 'Oak grove scene', description: 'A colourful storybook landscape (sky, sun, clouds, hills, oak trees, a little cottage and birds) with a heading and buttons. Great under the top banner on the home page.',
    fields: [t('title', 'Heading', 'The main heading of the scene.', { required: true }), area('text', 'Short text', 'One or two friendly sentences.'),
      { k: 'buttons', label: 'Buttons', type: 'list', itemName: 'button', titleKey: 'label', max: 2, item: [{ k: 'label', label: 'Button text', type: 'i18n', required: true }, { k: 'href', label: 'Goes to', type: 'url', required: true, placeholder: '/admissions' }, { k: 'variant', label: 'Style', type: 'select', options: [['primary', 'Solid'], ['outline', 'Outline']] }] },
      { k: 'sky', label: 'Sky', type: 'select', options: [['day', 'Sunny day'], ['sunrise', 'Warm sunrise'], ['dusk', 'Soft dusk']], help: 'The colour of the sky behind the scene.' },
      { k: 'showSun', label: 'Show the sun', type: 'bool' }, { k: 'showClouds', label: 'Show drifting clouds', type: 'bool' },
      { k: 'showTree', label: 'Show oak trees', type: 'bool' }, { k: 'showHouse', label: 'Show the little cottage', type: 'bool' }],
  },
  'trust-bar': {
    label: 'Trust numbers', description: 'A strip of reassuring facts: years of experience, teacher qualifications, ratio, safety, parent satisfaction. Only show figures that are true and that you can prove.',
    fields: [{ k: 'items', label: 'Facts', type: 'list', itemName: 'fact', titleKey: 'value', min: 1, max: 6, addLabel: 'Add fact', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, image('image', 'Real photo instead of the icon (optional)', 'Choose a photo of the activity or room. When a photo is chosen it replaces the icon.', { frame: 'square', where: 'A round photo in place of the icon.' }), { k: 'value', label: 'Big text', type: 'text', required: true, max: 16, help: 'e.g. 10+, 1:6, 98%.' }, t('label', 'Label', undefined, { required: true })] }],
  },
  safety: {
    label: 'Safety & security', description: 'A calm section that tells parents how their child is kept safe, with a picture, points and certification badges.',
    fields: [t('eyebrow', 'Small line above the heading'), title, area('text', 'Introduction'), image('image', 'Picture', undefined, { frame: 'side', where: 'Beside the safety points.' }),
      { k: 'items', label: 'Safety points', type: 'list', itemName: 'point', titleKey: 'title', min: 1, max: 8, addLabel: 'Add point', item: [{ k: 'icon', label: 'Icon', type: 'icon' }, image('image', 'Real photo instead of the icon (optional)', 'Choose a photo of the activity or room. When a photo is chosen it replaces the icon.', { frame: 'square', where: 'A round photo in place of the icon.' }), t('title', 'Title', undefined, { required: true }), area('text', 'Short text')] },
      { k: 'badges', label: 'Certification / licence badges', type: 'i18nlist', addLabel: 'Add badge', multiline: false, help: 'Only list licences and certifications you actually hold.' }, btn('button', 'Button')],
  },
  bento: {
    label: 'Facilities mosaic', description: 'A mosaic of pictures with captions that shows your spaces and facilities.',
    fields: [title, t('subtitle', 'Sub-heading'), { k: 'items', label: 'Spaces', type: 'list', itemName: 'space', titleKey: 'label', min: 1, max: 12, addLabel: 'Add space', item: [t('label', 'Name', undefined, { required: true }), t('text', 'Short text'), image('image', 'Picture', undefined, { frame: 'card' })] }],
  },
  'enquiry-form': {
    label: 'Enquiry form', description: 'The visit / question form for parents. Fields, programmes, recipients and routing are set in Admin → Enquiry form.',
    fields: [title, area('text', 'Introduction'), { k: 'showMap', label: 'Show contact details and map beside the form', type: 'bool' }],
  },
  contact: {
    label: 'Contact details', description: 'Shows your address, phone, email, opening hours and map. The details come from Settings → Contact details.',
    fields: [title, area('text', 'Introduction'), { k: 'showHours', label: 'Show opening hours', type: 'bool' }, { k: 'showMap', label: 'Show the map', type: 'bool', help: 'Uses your location from Settings → Map & directions (or the address as a fallback).' }],
  },
};

/** Titles for settings groups in Admin → Settings. */
export type SettingSchema = { label: string; description: string; fields: FieldDef[]; group: string };
const social = (k: string, label: string): FieldDef => ({ k, label, type: 'url', placeholder: 'https://…', help: 'Full address of your page. Leave empty to hide.' });
export const SETTING_SCHEMAS: Record<string, SettingSchema> = {
  'public.site': { group: 'Nursery', label: 'Nursery name & tagline', description: 'Shown in the header, footer and search results.', fields: [t('name', 'Nursery name', undefined, { required: true }), t('tagline', 'Tagline', 'The short slogan, e.g. From Little Acorns to Oak Trees.')] },
  'public.branding': { group: 'Nursery', label: 'Logo & icon', description: 'Upload your logo once. It updates automatically in the website header and footer, the admin sidebar and sign-in pages, and in emails sent from the system.', fields: [
    image2('logoUrl', 'Logo', 'Best: a wide PNG, WebP or SVG with a transparent background. Used in the website header, admin and emails (emails need PNG/WebP/JPG uploaded to your photo library).'),
    image2('logoDarkUrl', 'Logo for dark backgrounds (optional)', 'A white or light version, used in the website footer and the admin header. If empty, your normal logo is shown on a small white badge.'),
    t('logoAlt', 'Logo description', 'Read aloud by screen readers and used by Google.'), image2('faviconUrl', 'Browser tab icon (favicon)', 'A small square picture shown in the browser tab.')] },
  'public.contact': { group: 'Nursery', label: 'Contact details', description: 'Used on the Contact page, footer and in Google results.', fields: [
    { k: 'phone', label: 'Phone number', type: 'tel', placeholder: '+971 6 123 4567', help: 'Shown to visitors and used for tap-to-call.' },
    { k: 'whatsapp', label: 'WhatsApp number', type: 'tel', placeholder: '971501234567', help: 'Digits with country code, no + or spaces. Leave empty to hide the floating WhatsApp button.' },
    { k: 'email', label: 'Email address', type: 'email' }, t('address', 'Address', undefined, { multiline: true }), t('hours', 'Opening hours', 'e.g. Monday – Thursday 7:30 am – 2:30 pm'),
    { k: 'directionsUrl', label: 'Directions link', type: 'url', help: 'A Google Maps link that opens directions to the nursery.' },
    { k: 'mapEmbedUrl', label: 'Map embed link', type: 'url', help: 'In Google Maps: Share → Embed a map → copy only the address inside src="…". It must start with https://www.google.com/maps.' },
  ] },
  'public.map': { group: 'Nursery', label: 'Map & directions', description: 'Shows an interactive Google map with your nursery marked on the Contact page. Paste your Google Maps link in the helper above to fill in the location automatically.', fields: [
    { k: 'latitude', label: 'Latitude', type: 'number', optional: true, min: -90, max: 90, help: 'North–south position, e.g. 25.3463. Use the helper above to fill this in.' },
    { k: 'longitude', label: 'Longitude', type: 'number', optional: true, min: -180, max: 180, help: 'East–west position, e.g. 55.4209.' },
    { k: 'zoom', label: 'Zoom level', type: 'number', min: 3, max: 20, help: '3 = whole country, 16 = street level (recommended), 20 = building.' },
    t('markerLabel', 'Label on the marker', 'Shown when a visitor taps the marker, e.g. the nursery name.'),
    { k: 'apiKey', label: 'Google Maps API key (for the moving, branded map)', type: 'text', placeholder: 'AIza…', help: 'Optional but recommended. Create a "Maps JavaScript API" key in Google Cloud and restrict it to your website address. Without a key, a simpler interactive Google map is shown instead.' },
  ] },
  'public.social': { group: 'Nursery', label: 'Social media', description: 'Links in the footer. Empty ones are hidden.', fields: [social('instagram', 'Instagram'), social('facebook', 'Facebook'), social('whatsappLink', 'WhatsApp link')] },
  'public.floatingWhatsapp': { group: 'Nursery', label: 'Floating WhatsApp button', description: 'A round button in the corner of every page. Needs a WhatsApp number in Contact details.', fields: [{ k: 'enabled', label: 'Show the button', type: 'bool' }, t('message', 'Message that opens in WhatsApp', 'The first message visitors send you.', { multiline: true })] },
  'public.announcement': { group: 'Site', label: 'Announcement bar', description: 'A thin coloured bar above the header for news or notices.', fields: [{ k: 'enabled', label: 'Show the announcement', type: 'bool' }, t('text', 'Message'), { k: 'href', label: 'Link (optional)', type: 'url', placeholder: '/admissions' }] },
  'public.maintenance': { group: 'Site', label: 'Maintenance mode', description: 'Turn on to hide the whole website behind a message. The admin stays available. Use with care.', fields: [{ k: 'enabled', label: 'Turn maintenance mode ON', type: 'bool', help: 'Visitors will only see the message below until you turn this off.' }, t('message', 'Message for visitors', undefined, { multiline: true })] },
  'public.seo': { group: 'Search & tracking', label: 'Site name for search', description: 'Used in search results and social sharing.', fields: [t('siteName', 'Site name')] },
  'public.seoDefaults': { group: 'Search & tracking', label: 'Default sharing picture', description: 'Used when a page has no picture of its own, for example in WhatsApp previews.', fields: [image2('defaultOgImage', 'Default share picture', 'Use a JPG or PNG about 1200 × 630. SVG pictures are not shown by most apps.'), { k: 'twitterHandle', label: 'X / Twitter handle', type: 'text', placeholder: '@sevenoaks' }, { k: 'blockAiCrawlers', label: 'Block AI search and assistants', type: 'bool', help: 'Leave OFF (recommended). While off, ChatGPT, Copilot, Gemini, Perplexity, Claude and Bing may read and quote your pages and /llms.txt is published, which is how many parents now find nurseries. Turn on only if you do not want to appear in AI answers.' }] },
  'public.analytics': { group: 'Search & tracking', label: 'Analytics', description: 'Google/Meta tracking scripts load only after a visitor accepts cookies. Leave IDs empty to switch them off. Our own visitor statistics (Admin → Analytics) count visits without cookies; people who accept analytics cookies are also listed under Analytics → Visitors, with their IP address and, if they send an enquiry, their email.', fields: [{ k: 'enabled', label: 'Enable analytics', type: 'bool' }, { k: 'gaId', label: 'Google Analytics 4 ID', type: 'text', placeholder: 'G-XXXXXXXXXX', help: 'From Google Analytics → Admin → Data streams.' }, { k: 'gtmId', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXXXXX', help: 'If you add this, set up GA4 inside Tag Manager instead.' }, { k: 'metaPixelId', label: 'Meta (Facebook) Pixel ID', type: 'text', help: 'Digits only.' }, { k: 'searchConsole', label: 'Google Search Console verification code', type: 'text', placeholder: 'e.g. abc123_XYZ…', help: 'In Search Console choose “HTML tag” verification and copy only the code inside content="…". This lets Google confirm you own the website. Visitor statistics are in Admin → Analytics.' }] },
  'public.protection': { group: 'Security', label: 'Image protection', description: 'Makes it harder to copy your pictures or embed them on other websites. No web protection is absolute; this stops casual copying and hotlinking.', fields: [
    { k: 'enabled', label: 'Protect pictures', type: 'bool' }, { k: 'blockHotlinking', label: 'Block other websites from showing our pictures', type: 'bool' },
    { k: 'allowedDomains', label: 'Extra websites allowed to show pictures', type: 'text', placeholder: 'example.com, partner.ae', help: 'Separate with commas. Your own website is always allowed.' },
    { k: 'disableRightClick', label: 'Disable right-click on pictures', type: 'bool' }, { k: 'disableDrag', label: 'Disable dragging pictures', type: 'bool' }, { k: 'blockSaveShortcut', label: 'Block Ctrl/Cmd+S and Ctrl/Cmd+P', type: 'bool' },
    { k: 'watermark', label: 'Watermark', type: 'object', fields: [{ k: 'enabled', label: 'Add a watermark to large pictures', type: 'bool' }, t('text', 'Watermark text', 'Shown faintly across large pictures.')] },
  ] },
  'public.legal': { group: 'Legal', label: 'Legal page links', description: 'Where the footer links to your policies. Edit the policy text itself in Admin → Legal & privacy.', fields: [
    { k: 'links', label: 'Footer links', type: 'list', itemName: 'link', titleKey: 'label', addLabel: 'Add link', item: [t('label', 'Text', undefined, { required: true }), { k: 'href', label: 'Goes to', type: 'url', required: true }] },
  ] },
  'public.newsletter': { group: 'Marketing', label: 'Newsletter sign-up', description: 'The email sign-up in the footer. Emails are stored only with the visitor’s ticked consent.', fields: [
    { k: 'enabled', label: 'Show sign-up', type: 'bool' }, t('title', 'Title'), t('text', 'Text'), t('consent', 'Consent sentence', 'Shown next to the tick box.'), t('button', 'Button text'),
  ] },
  'public.cookies': { group: 'Search & tracking', label: 'Cookie banner', description: 'The notice asking visitors to accept analytics cookies.', fields: [t('text', 'Banner text', undefined, { multiline: true }), t('accept', 'Accept button'), t('decline', 'Decline button'), t('policyLabel', 'Privacy link text'), { k: 'policyHref', label: 'Privacy page', type: 'url', placeholder: '/privacy-policy' }, t('analyticsText', 'Explanation under “Analytics”', 'Say plainly what is collected. Our own visitor log keeps the IP address and links it to an email if the person sends an enquiry.', { multiline: true }), t('marketingText', 'Explanation under “Marketing”', 'Only matters if you add a Meta Pixel.', { multiline: true })] },
  'public.schema': { group: 'Search & tracking', label: 'Google local business data', description: 'Helps Google show your nursery in local search and maps.', fields: [
    { k: 'type', label: 'Business type', type: 'select', options: [['Preschool', 'Preschool'], ['ChildCare', 'Child care']] }, t('streetAddress', 'Street address'), t('locality', 'City'), t('region', 'Emirate / region'),
    { k: 'country', label: 'Country code', type: 'text', max: 2, help: 'Two letters, e.g. AE.' }, { k: 'latitude', label: 'Latitude', type: 'text', placeholder: '25.3463' }, { k: 'longitude', label: 'Longitude', type: 'text', placeholder: '55.4209' },
    { k: 'openingHours', label: 'Opening hours', type: 'strings', addLabel: 'Add hours', placeholder: 'Mo-Th 07:30-14:30', help: 'Format: Mo-Th 07:30-14:30 (days: Mo Tu We Th Fr Sa Su).' }, { k: 'priceRange', label: 'Price range (optional)', type: 'text', placeholder: 'AED AED' },
  ] },
};
function image2(k: string, label: string, help: string): FieldDef { return { k, label, help, type: 'imageurl' } as FieldDef; }

export const THEME_FIELDS: { title: string; help: string; fields: FieldDef[] }[] = [
  { title: 'Colours', help: 'The main colours of the website. Changes apply to every page.', fields: [
    { k: 'primary', label: 'Main colour', type: 'color', help: 'Headings, links, buttons and the footer.' }, { k: 'secondary', label: 'Soft panel colour', type: 'color', help: 'Light panels behind groups of content.' },
    { k: 'accent', label: 'Accent colour', type: 'color', help: 'Highlights such as stars and the announcement bar.' }, { k: 'background', label: 'Page background', type: 'color' },
    { k: 'surface', label: 'Card background', type: 'color' }, { k: 'text', label: 'Text colour', type: 'color' }, { k: 'link', label: 'Link colour', type: 'color', help: 'Text links inside paragraphs and answers (shown underlined).' },
    { k: 'buttonBg', label: 'Button colour', type: 'color' }, { k: 'buttonText', label: 'Button text colour', type: 'color' }, { k: 'brown', label: 'Oak brown', type: 'color', help: 'A warm secondary colour for decoration.' },
    { k: 'sunny', label: 'Fun colour: sunshine', type: 'color', help: 'Used for stickers, stars and playful touches.' }, { k: 'sky', label: 'Fun colour: sky', type: 'color', help: 'Used for playful shapes and badges.' },
    { k: 'coral', label: 'Fun colour: coral', type: 'color', help: 'Used for playful shapes and badges.' }, { k: 'berry', label: 'Fun colour: berry', type: 'color', help: 'Used for playful shapes and badges.' },
  ].map((f) => ({ ...f, k: `colors.${f.k}` })) as FieldDef[] },
  { title: 'Fonts', help: 'Font names as used in CSS. Fonts must be loaded from Google Fonts (see below).', fields: [
    { k: 'fonts.heading', label: 'Heading font', type: 'text', help: "e.g. 'Cormorant Garamond', Georgia, serif" }, { k: 'fonts.body', label: 'Body font', type: 'text' },
    { k: 'fonts.arabic', label: 'Arabic font', type: 'text', help: 'Used for the whole page when the language is Arabic.' }, { k: 'fonts.script', label: 'Handwriting font', type: 'text', help: 'Used for the playful taglines.' },
    { k: 'fontUrls', label: 'Google Fonts links', type: 'strings', addLabel: 'Add link', help: 'Links from fonts.google.com (they start with https://fonts.googleapis.com/). Only Google Fonts are allowed.' },
  ] },
  { title: 'Text sizes', help: 'Sizes use rem units (1rem is normal text size).', fields: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'button'].map((k) => ({ k: `sizes.${k}`, label: k === 'body' ? 'Body text' : k === 'button' ? 'Button text' : `Heading ${k.slice(1)}`, type: 'text', placeholder: '2rem' })) as FieldDef[] },
  { title: 'Shape & spacing', help: 'Roundness of cards and buttons and the gap between sections.', fields: [
    { k: 'radius.card', label: 'Card roundness', type: 'text', placeholder: '1.25rem' }, { k: 'radius.button', label: 'Button roundness', type: 'text', placeholder: '999px', help: '999px makes pill-shaped buttons.' },
    { k: 'shadow.card', label: 'Card shadow', type: 'text' }, { k: 'spacing.section', label: 'Space between sections', type: 'text', placeholder: '4rem' }, { k: 'container', label: 'Maximum content width', type: 'text', placeholder: '1200px' },
  ] },
];

export const MENU_ITEM_FIELDS: FieldDef[] = [
  { k: 'label', label: 'Menu text', type: 'i18n', required: true, help: 'The words shown in the menu.' },
  { k: 'href', label: 'Goes to', type: 'url', required: true, placeholder: '/about-us', help: 'Use /page-name for a page on this site (the language is added for you) or a full https:// address.' },
  { k: 'isButton', label: 'Show as a highlighted button', type: 'bool', help: 'Used for “Book a Tour”. Buttons appear on the right of the header.' },
  { k: 'isVisible', label: 'Visible', type: 'bool', help: 'Untick to hide this item without deleting it.' },
];

export const PAGE_META_FIELDS: FieldDef[] = [
  { k: 'title', label: 'Page name', type: 'i18n', required: true, help: 'The name of the page. Used as the browser tab title when no search title is set.' },
];

/** Reads/writes dotted paths like "colors.primary" on nested objects (theme editor). */
export const getPath = (o: any, p: string) => p.split('.').reduce((a, k) => a?.[k], o);
export const setPath = (o: any, p: string, v: any) => {
  const keys = p.split('.'); const root = { ...o }; let cur = root;
  keys.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] ?? {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = v; return root;
};

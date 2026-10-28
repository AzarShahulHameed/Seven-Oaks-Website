// Starter galleries, categories and detail pages (DATA, not code). Loaded once by seed.ts if no entries exist;
// afterwards everything is edited in Admin → Galleries / Gallery categories / Detail pages. Wording is a first draft.
import { i, im } from './content';
import { detailSeeds, type DetailSeed } from './content-details';

type Seed = { kind: 'CATEGORY' | 'GALLERY' | 'DETAIL'; slug: string; group?: string; title: any; summary: any; body?: any; cover?: string; items?: [string, string, string][]; info?: [string, string, string, string][]; links?: [string, string, string, string][]; related?: string[] };
const media = (n: string, en: string, ar: string) => ({ media: im(n, en, ar), caption: i(en, ar) });

export const entrySeeds: Seed[] = [
  // ── gallery categories
  { kind: 'CATEGORY', slug: 'learning-and-play', title: i('Learning & Play', 'التعلّم واللعب'), summary: i('Classrooms, play spaces and everyday discovery.', 'الصفوف ومساحات اللعب والاكتشاف اليومي.'), cover: 'p-class-paint' },
  { kind: 'CATEGORY', slug: 'celebrations-and-events', title: i('Celebrations & Events', 'الاحتفالات والفعاليات'), summary: i('Graduation, National Day, cultural days and community visits.', 'التخرج واليوم الوطني والأيام الثقافية والزيارات المجتمعية.'), cover: 'p-grad-1' },
  { kind: 'CATEGORY', slug: 'outdoors-and-nature', title: i('Outdoors & Animals', 'الهواء الطلق والحيوانات'), summary: i('Sports day and animal visits.', 'اليوم الرياضي وزيارات الحيوانات.'), cover: 'p-animal-3' },

  // ── galleries
  { kind: 'GALLERY', slug: 'graduation-2025', group: 'celebrations-and-events', title: i('Graduation 2025', 'حفل التخرج 2025'), summary: i('Gowns, caps, dancing and proud families.', 'أثواب وقبعات ورقص وأسر فخورة.'),
    body: i('Our graduation celebration brought children, teachers and families together for a joyful day on stage.', 'جمع حفل التخرج الأطفال والمعلمات والأسر في يوم مبهج على المنصة.'), cover: 'p-grad-1',
    items: [['p-grad-1', 'Children on the graduation stage', 'أطفال على منصة التخرج'], ['p-grad-2', 'Children dancing on stage', 'أطفال يرقصون على المنصة'], ['p-grad-3', 'Children singing on the graduation stage', 'أطفال يغنّون على منصة التخرج'], ['p-grad-4', 'Graduates in blue gowns', 'خريجون بأثواب زرقاء'], ['p-grad-5', 'Graduates with caps and a trophy', 'خريجون بقبعات وكأس'], ['p-grad-6', 'A graduate receiving a certificate', 'خريج يتسلّم شهادة'], ['p-grad-dance', 'A performance in pink skirts', 'عرض بتنانير وردية'], ['p-grad-hall', 'Families filling the hall', 'الأسر تملأ القاعة'], ['p-grad-group', 'The graduating class on stage', 'دفعة الخريجين على المنصة'], ['p-stage-wide', 'The graduation stage', 'منصة التخرج']],
    info: [['Year', 'العام', '2025', '2025']], related: ['uae-national-day', 'sports-day'] },
  { kind: 'GALLERY', slug: 'sports-day', group: 'outdoors-and-nature', title: i('Family Sports Day', 'اليوم الرياضي العائلي'), summary: i('Races, medals and a parents’ tug of war.', 'سباقات وميداليات وشدّ حبل للأهل.'),
    body: i('Our Sports Day invites parents to take part with their children.', 'يدعو يومنا الرياضي أولياء الأمور للمشاركة مع أطفالهم.'), cover: 'p-sports-2',
    items: [['p-sports-1', 'Children taking part in obstacle games', 'أطفال يشاركون في ألعاب العوائق'], ['p-sports-2', 'Two friends with their medals', 'صديقتان بميدالياتهما'], ['p-sports-3', 'Children and families at the sports day stations', 'أطفال وأسر عند محطات اليوم الرياضي'], ['p-sports-4', 'Families gathering on the field', 'الأسر تجتمع في الميدان'], ['p-sports-5', 'Parents in the tug of war', 'أولياء أمور في شدّ الحبل']],
    related: ['animal-visit', 'graduation-2025'] },
  { kind: 'GALLERY', slug: 'animal-visit', group: 'outdoors-and-nature', title: i('Animal Visit', 'زيارة الحيوانات'), summary: i('Rabbits, a kitten, a goat and even a snake.', 'أرانب وقطة صغيرة وماعز وحتى أفعى.'),
    body: i('Children met and gently handled friendly animals in the nursery garden.', 'تعرّف الأطفال على حيوانات أليفة وتعاملوا معها بلطف في حديقة الحضانة.'), cover: 'p-animal-3',
    items: [['p-animal-1', 'A child holding a rabbit in a basket', 'طفلة تحمل أرنباً في سلة'], ['p-animal-2', 'Children meeting a snake with its handler', 'أطفال يتعرفون على أفعى مع مدرّبها'], ['p-animal-3', 'Children stroking a rabbit', 'أطفال يداعبون أرنباً'], ['p-animal-4', 'Children petting a fluffy cat', 'أطفال يداعبون قطة'], ['p-animal-5', 'Children holding baskets with rabbits', 'أطفال يحملون سلالاً فيها أرانب']],
    related: ['sports-day', 'play-spaces'] },
  { kind: 'GALLERY', slug: 'uae-national-day', group: 'celebrations-and-events', title: i('UAE National Day', 'اليوم الوطني الإماراتي'), summary: i('Flags, balloons and traditional dress.', 'أعلام وبالونات وأزياء تقليدية.'),
    body: i('We celebrate UAE National Day with songs, dress-up and community events.', 'نحتفل باليوم الوطني الإماراتي بالأغاني والأزياء والفعاليات المجتمعية.'), cover: 'p-national-1',
    items: [['p-national-1', 'Children under a balloon arch in UAE colours', 'أطفال تحت قوس بالونات بألوان الإمارات'], ['p-national-2', 'Boys in traditional dress by the UAE flag', 'أولاد بالزي التقليدي بجانب علم الإمارات'], ['p-national-3', 'The whole nursery celebrating National Day', 'الحضانة كلها تحتفل باليوم الوطني'], ['p-national-4', 'Families at the National Day photo corner', 'أسر في ركن التصوير باليوم الوطني'], ['p-national-5', 'Children dressed for National Day', 'أطفال بأزياء اليوم الوطني']],
    related: ['community-visits', 'cultural-days'] },
  { kind: 'GALLERY', slug: 'community-visits', group: 'celebrations-and-events', title: i('Community Visits', 'الزيارات المجتمعية'), summary: i('Police visits, elders and neighbours.', 'زيارات الشرطة وكبار السن والجيران.'),
    body: i('Children learn about their community through visits and meetings with community helpers.', 'يتعرّف الأطفال على مجتمعهم عبر الزيارات واللقاءات مع العاملين في خدمة المجتمع.'), cover: 'p-visit-2',
    items: [['p-visit-1', 'Children and guests at the nursery', 'أطفال وضيوف في الحضانة'], ['p-visit-2', 'A child in a police beret in a patrol car', 'طفل بقبعة الشرطة في سيارة دورية'], ['p-visit-3', 'A child on a police motorbike with an officer', 'طفل على دراجة الشرطة مع شرطي'], ['p-visit-4', 'Children greeting an elder', 'أطفال يحيّون أحد كبار السن'], ['p-visit-5', 'Children lining up to greet visitors', 'أطفال يصطفون لتحية الزوار']],
    related: ['uae-national-day', 'cultural-days'] },
  { kind: 'GALLERY', slug: 'cultural-days', group: 'celebrations-and-events', title: i('Cultural Days & Ramadan', 'الأيام الثقافية ورمضان'), summary: i('Heritage corners, Ramadan and costumes from around the world.', 'أركان التراث ورمضان وأزياء من حول العالم.'),
    body: i('Children explore traditions through dress-up, heritage corners and festive scenes.', 'يستكشف الأطفال التقاليد عبر الأزياء وأركان التراث والمشاهد الاحتفالية.'), cover: 'p-culture-4',
    items: [['p-culture-1', 'A heritage corner with a coffee pot', 'ركن تراثي فيه دلّة قهوة'], ['p-culture-2', 'Children in a traditional majlis setting', 'أطفال في مجلس تقليدي'], ['p-culture-3', 'Children with a Ramadan lantern display', 'أطفال مع زينة فوانيس رمضان'], ['p-culture-4', 'A boy reading beside Ramadan lanterns', 'طفل يقرأ بجانب فوانيس رمضان'], ['p-culture-5', 'Children in costumes from different countries', 'أطفال بأزياء من بلدان مختلفة']],
    related: ['uae-national-day', 'special-days'] },
  { kind: 'GALLERY', slug: 'special-days', group: 'celebrations-and-events', title: i('Special Days', 'أيام خاصة'), summary: i('Pink Day, Mother’s Day and Orange Day.', 'اليوم الوردي وعيد الأم واليوم البرتقالي.'),
    body: i('Theme days bring colour, crafts and community awareness to the nursery.', 'تضفي الأيام الموضوعية الألوان والأعمال اليدوية والتوعية المجتمعية على الحضانة.'), cover: 'p-day-pink-1',
    items: [['p-day-pink-1', 'A girl at the Pink Day display', 'طفلة عند ركن اليوم الوردي'], ['p-day-pink-2', 'A girl at the Pink Day table', 'طفلة عند طاولة اليوم الوردي'], ['p-day-mother', 'A mother and her children on Mother’s Day', 'أم وأطفالها في عيد الأم'], ['p-day-orange', 'Children celebrating Orange Day', 'أطفال يحتفلون باليوم البرتقالي'], ['p-day-mom-workshop', 'Mothers and children at a craft workshop', 'أمهات وأطفال في ورشة أعمال يدوية']],
    related: ['cultural-days', 'graduation-2025'] },
  { kind: 'GALLERY', slug: 'classroom-learning', group: 'learning-and-play', title: i('Classroom Learning', 'التعلّم في الصفوف'), summary: i('Painting, counting, role play and sensory fun.', 'رسم وعدّ ولعب أدوار ومرح حسي.'),
    body: i('Learning is hands-on and playful: colouring, painting, number games, role play and sensory exploration.', 'التعلّم عملي وممتع: تلوين ورسم وألعاب أرقام ولعب أدوار واستكشاف حسي.'), cover: 'p-class-paint',
    items: [['p-art-girl', 'A child painting a plate', 'طفلة ترسم على طبق'], ['p-class-craft', 'A child colouring at a table', 'طفلة تلوّن على طاولة'], ['p-smile', 'A smiling child with crayons', 'طفلة مبتسمة مع ألوان'], ['p-class-toys', 'Children with teddy bears at a teddy picnic', 'أطفال مع الدببة في نزهة الدببة'], ['p-class-paint', 'Children painting', 'أطفال يرسمون'], ['p-class-cotton', 'Painting a pineapple with cotton buds', 'رسم أناناس بأعواد القطن'], ['p-class-numbers', 'A number game with counters', 'لعبة أرقام بقطع العدّ'], ['p-class-senses', 'Exploring with a magnifier and a drum', 'استكشاف بعدسة مكبّرة وطبل'], ['p-class-helpers', 'Community helpers role play', 'لعب أدوار عن مساعدي المجتمع'], ['p-class-roleplay', 'Children role-playing in the interactive room', 'أطفال يلعبون الأدوار في غرفة التفاعل'], ['p-class-dressup', 'Children dressed as police and firefighters', 'أطفال بأزياء الشرطة والإطفاء']],
    related: ['play-spaces', 'animal-visit'] },
  { kind: 'GALLERY', slug: 'play-spaces', group: 'learning-and-play', title: i('Play Spaces', 'مساحات اللعب'), summary: i('Soft play, jungle gym and the sand room.', 'اللعب الناعم وصالة التسلق وغرفة الرمل.'),
    body: i('Our indoor spaces give children room to climb, slide, dig and play.', 'تمنح مساحاتنا الداخلية الأطفال مجالاً للتسلق والانزلاق والحفر واللعب.'), cover: 'p-softplay',
    items: [['p-softplay', 'A child in the ball pit below the slide', 'طفل في حمام الكرات أسفل الزحليقة'], ['p-jungle', 'Children on the jungle gym slide', 'أطفال على زحليقة صالة التسلق'], ['p-sand', 'Children playing in the sand room', 'أطفال يلعبون في غرفة الرمل'], ['p-entrance', 'The nursery entrance', 'مدخل الحضانة']],
    related: ['classroom-learning', 'animal-visit'] },
];

export const toEntryData = (s: Seed, n: number) => ({
  kind: s.kind, slug: s.slug, group: s.group ?? '', title: s.title, summary: s.summary, body: s.body ?? i('', ''),
  cover: s.cover ? im(s.cover, s.title.en, s.title.ar) : null,
  items: (s.items ?? []).map(([img, en, ar]) => media(img, en, ar)),
  docs: [], links: (s.links ?? []).map(([en, ar, url]) => ({ label: i(en, ar), url })),
  info: (s.info ?? []).map(([le, la, ve, va]) => ({ label: i(le, la), value: i(ve, va) })),
  related: s.related ?? [], seo: { metaTitle: i('', ''), metaDescription: i('', ''), ogImageUrl: '', noindex: false },
  isVisible: true, status: 'PUBLISHED' as const, sortOrder: n,
});

/** Detail pages (Parents information and policies): designed blocks, placed under /parents/… . */
export const toDetailData = (d: DetailSeed, n: number, offset: number) => ({
  kind: 'DETAIL' as const, slug: d.slug, group: d.group, path: 'parents', title: d.title, summary: d.summary, body: d.intro,
  cover: im(d.cover, d.title.en, d.title.ar), items: [], docs: [],
  links: (d.links ?? []).map(([en, ar, url]) => ({ label: i(en, ar), url })), info: [], related: d.related ?? [],
  blocks: d.blocks, design: { style: d.style ?? 'split', showBack: true, parentLabel: i('', ''), badge: i(d.badge?.[0] ?? '', d.badge?.[1] ?? '') },
  seo: { metaTitle: i('', ''), metaDescription: i('', ''), ogImageUrl: '', noindex: false },
  isVisible: true, status: 'PUBLISHED' as const, sortOrder: offset + n,
});
export const detailEntries = detailSeeds;

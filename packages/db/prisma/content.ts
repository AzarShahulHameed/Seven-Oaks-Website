// Initial content (DATA, not code). Loaded once by seed.ts; afterwards everything is edited in the admin dashboard.
// Arabic strings are first-draft translations and must be reviewed by a native speaker.
export const i = (en: string, ar: string) => ({ en, ar });
const blank = i('', '');

export const theme = {
  // Taken from the nursery logo: leaf green, lime and oak brown. Everything here can be changed in Admin → Colours & fonts.
  colors: {
    primary: '#3a7d2c', secondary: '#eef5dc', accent: '#9bc53d', background: '#fcfdf6',
    surface: '#ffffff', text: '#27381f', link: '#1b5fc9', buttonBg: '#3a7d2c', buttonText: '#ffffff', brown: '#8a6a34',
    sunny: '#ffc93c', sky: '#5bbce4', coral: '#ff7a59', berry: '#e0629a',
  },
  fonts: {
    heading: "'Fredoka', 'Nunito', system-ui, sans-serif",
    body: "'Nunito', system-ui, sans-serif",
    arabic: "'Cairo', 'Tajawal', system-ui, sans-serif",
    script: "'Caveat', cursive",
  },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&family=Cairo:wght@400;600;700&family=Caveat:wght@500;700&display=swap',
  ],
  sizes: { h1: '3rem', h2: '2.1rem', h3: '1.55rem', h4: '1.3rem', h5: '1.15rem', h6: '1rem', body: '1.0625rem', button: '0.9rem' },
  weights: { heading: '600', body: '400', button: '700' },
  lineHeight: { body: '1.65', heading: '1.15' },
  radius: { card: '1.5rem', button: '999px' },
  shadow: { card: '0 8px 28px rgba(58,125,44,0.14)' },
  spacing: { section: '4rem' },
  container: '1200px',
};

export const settings: Record<string, unknown> = {
  'public.site': { name: i('Seven Oaks British Nursery', 'حضانة سيفن أوكس البريطانية'), tagline: i('Learning with Love, Growing with Care', 'نتعلّم بالحب، وننمو بالرعاية') },
  'public.branding': { logoUrl: '/seed/logo.png', logoAlt: i('Seven Oaks British Nursery logo', 'شعار حضانة سيفن أوكس البريطانية'), logoDarkUrl: '', faviconUrl: '/seed/favicon.png' },
  // No exact coordinates were supplied, so the contact page shows a Google map found from the address. For a pin, add latitude/longitude in Admin → Settings → Map & directions.
  'public.map': { apiKey: '', latitude: '', longitude: '', zoom: 16, markerLabel: i('Seven Oaks British Nursery', 'حضانة سيفن أوكس البريطانية') },
  'public.contact': {
    // From the Parent Handbook. Add the WhatsApp number in Admin → Settings → Contact details to show the floating WhatsApp button.
    phone: '+971 6 579 6955', whatsapp: '', email: 'donna.7oaks@gmail.com',
    address: i('Seven Oaks British Nursery, Al Khalidiyah, Al Khan, Sharjah, United Arab Emirates', 'حضانة سيفن أوكس البريطانية، الخالدية، الخان، الشارقة، الإمارات العربية المتحدة'),
    hours: i('Mon – Thu: morning 8:00 am – 1:00 pm · afternoon 1:00 – 5:00 pm · Fri 8:00 am – 12:00 pm · Daycare 1:00 – 5:00 pm · Admissions: Sunday 10:00 am – 2:00 pm', 'الاثنين – الخميس: صباحاً 8:00 ص – 1:00 م · مساءً 1:00 – 5:00 م · الجمعة 8:00 ص – 12:00 م · الرعاية النهارية 1:00 – 5:00 م · التسجيل: الأحد 10:00 ص – 2:00 م'),
    directionsUrl: 'https://maps.app.goo.gl/uM6VDjcwekitiiHug', mapEmbedUrl: '',
  },
  'public.social': { instagram: '', facebook: '', whatsappLink: '' },
  'public.floatingWhatsapp': { enabled: true, message: i('Hello! I would like to know more about Seven Oaks British Nursery.', 'مرحباً! أود معرفة المزيد عن حضانة سيفن أوكس البريطانية.') },
  'public.announcement': { enabled: true, text: i('Now welcoming families: book a tour and meet our team', 'نرحّب بالعائلات: احجزوا زيارة وتعرّفوا على فريقنا'), href: '/admissions' },
  'public.maintenance': { enabled: false, message: i('We are making improvements. Please check back soon.', 'نقوم بإجراء تحسينات. يرجى العودة قريباً.') },
  'public.seo': { siteName: i('Seven Oaks British Nursery', 'حضانة سيفن أوكس البريطانية') },
  'public.seoDefaults': { defaultOgImage: '', twitterHandle: '', blockAiCrawlers: false },
  // Analytics only load AFTER the visitor accepts cookies (UAE PDPL / GDPR-style consent). Leave IDs empty to disable.
  'public.analytics': { enabled: true, gaId: '', gtmId: '', metaPixelId: '', searchConsole: '' },
  'public.cookies': {
    text: i('We use cookies to understand how our website is used and to improve it. You can accept or decline analytics cookies.',
            'نستخدم ملفات تعريف الارتباط لفهم كيفية استخدام موقعنا وتحسينه. يمكنك قبول أو رفض ملفات التحليلات.'),
    accept: i('Accept all', 'قبول الكل'), decline: i('Necessary only', 'الضرورية فقط'), policyLabel: i('Cookie Policy', 'سياسة الكوكيز'), policyHref: '/cookie-policy',
    enabled: true, version: '1',
  },
  // Contact / admissions enquiry form shown by the "enquiry-form" section. Fields can be switched on/off and made required.
  'public.enquiryForm': {
    enabled: true,
    submitLabel: i('Send enquiry', 'إرسال الاستفسار'),
    consentText: i('I agree that Seven Oaks British Nursery may contact me about this enquiry, and I have read the Privacy Policy.', 'أوافق على أن تتواصل معي حضانة سيفن أوكس البريطانية بخصوص هذا الاستفسار، وقد اطلعت على سياسة الخصوصية.'),
    successTitle: i('Thank you!', 'شكراً لكم!'), successText: i('We have received your message and a member of our team will be in touch very soon.', 'استلمنا رسالتكم وسيتواصل معكم أحد أعضاء فريقنا قريباً جداً.'),
    programs: [
      { value: 'toddler', label: i('Toddler Class (18 months – 2 years)', 'صف الدارجين (18 شهراً – سنتان)') },
      { value: 'pre-foundation', label: i('Pre-Foundation Class (2 – 3 years)', 'صف ما قبل التأسيس (2 – 3 سنوات)') },
      { value: 'preschool', label: i('Preschool Class (3 – 4 years)', 'صف ما قبل المدرسة (3 – 4 سنوات)') },
    ],
    fields: {
      childName: { show: true, required: false }, phone: { show: true, required: true }, program: { show: true, required: false }, visitDate: { show: true, required: false },
      childAge: { show: true, required: false }, preferredContact: { show: true, required: false }, message: { show: true, required: true },
    },
  },
  // PRIVATE (not sent to the website): who receives enquiry emails and how they are routed. Edit in Admin → Enquiry form.
  'enquiry.routing': { recipients: [], rules: [], autoReply: true },
  'public.newsletter': {
    enabled: true, title: i('Stay in touch', 'ابقوا على اطلاع'), text: i('News, events and stories from our classrooms, a few times a year.', 'أخبار وفعاليات وقصص من صفوفنا، بضع مرات في السنة.'),
    consent: i('I agree to receive news and updates by email. I can unsubscribe at any time.', 'أوافق على استلام الأخبار والتحديثات عبر البريد الإلكتروني. يمكنني إلغاء الاشتراك في أي وقت.'), button: i('Subscribe', 'اشترك'),
  },
  // Links shown at the bottom of every page. Each one is a normal page you edit in Admin → Legal & privacy.
  'public.legal': {
    links: [
      { label: i('Privacy Policy', 'سياسة الخصوصية'), href: '/privacy-policy' }, { label: i('Cookie Policy', 'سياسة الكوكيز'), href: '/cookie-policy' },
      { label: i('Terms & Conditions', 'الشروط والأحكام'), href: '/terms-and-conditions' }, { label: i('Data Protection', 'حماية البيانات'), href: '/data-protection' },
      { label: i('Data Retention', 'الاحتفاظ بالبيانات'), href: '/data-retention' },
    ],
  },
  // Deters casual copying of photos. Nothing on the web can stop a screenshot; these stop casual copying and hot-linking.
  'public.protection': {
    enabled: true, blockHotlinking: true, allowedDomains: '', disableRightClick: true, disableDrag: true, blockSaveShortcut: false,
    watermark: { enabled: false, text: i('', '') },
  },
  // Structured data for Google (rich results / local search). type: Preschool or ChildCare.
  'public.schema': {
    type: 'Preschool',
    streetAddress: i('Al Khalidiyah, Al Khan', 'الخالدية، الخان'), locality: i('Sharjah', 'الشارقة'), region: i('Sharjah', 'الشارقة'), country: 'AE',
    latitude: '', longitude: '', openingHours: ['Mo-Th 08:00-17:00', 'Fr 08:00-12:00'], priceRange: '',
  },
};

const link = (en: string, ar: string, href: string, extra: object = {}) => ({ label: i(en, ar), href, isButton: false, isVisible: true, ...extra });

export const menus = {
  HEADER: [
    link('Home', 'الرئيسية', '/'), link('About Us', 'من نحن', '/about-us'), link('Our Nursery', 'حضانتنا', '/our-nursery'),
    link('Learning', 'التعلّم', '/learning'), link('Classes', 'الصفوف', '/classes'), link('Parents', 'أولياء الأمور', '/parents'),
    link('Gallery', 'المعرض', '/gallery'), link('Admissions', 'التسجيل', '/admissions'), link('Contact', 'تواصل معنا', '/contact'),
    link('Book a Tour', 'احجز زيارة', '/admissions', { isButton: true }),
  ],
  FOOTER: [
    link('Home', 'الرئيسية', '/'), link('About Us', 'من نحن', '/about-us'), link('Our Nursery', 'حضانتنا', '/our-nursery'),
    link('Learning', 'التعلّم', '/learning'), link('Classes', 'الصفوف', '/classes'), link('Parents', 'أولياء الأمور', '/parents'),
    link('Gallery', 'المعرض', '/gallery'), link('Admissions', 'التسجيل', '/admissions'), link('Contact', 'تواصل معنا', '/contact'),
    link('Inclusion', 'الدمج والشمول', '/inclusion'), link('Privacy Policy', 'سياسة الخصوصية', '/privacy-policy'),
  ],
  QUICK_LINKS: [] as any[],
};

export const btn = (en: string, ar: string, href: string, variant = 'primary') => ({ label: i(en, ar), href, variant });
/** Pictures that ship with the site (apps/web/public/seed). Names starting with "p-" are the nursery's own photographs. Replace any of them from the admin. */
const PHOTOS = ['p-class-paint', 'p-class-numbers', 'p-class-roleplay', 'p-jungle', 'p-sand', 'p-class-senses', 'p-class-craft', 'p-softplay', 'p-class-toys', 'p-class-dressup'];
/** Gives every item of a block a real photo (cycling through the list) so the blocks are not just icons. Editable per item in admin. */
export const withPhotos = <T extends { items?: any[] }>(cfg: T, offset = 0): T => ({ ...cfg, items: (cfg.items ?? []).map((it: any, n: number) => { const id = PHOTOS[(n + offset) % PHOTOS.length]!; return { ...it, image: im(id, '', '') }; }) });
export const im = (name: string, en: string, ar: string) => ({ url: `/seed/${name}.${name.startsWith('p-') ? 'jpg' : 'svg'}`, alt: i(en, ar) });

export const homeSections = [
  { type: 'hero', config: {
    layout: '', size: 'full', overlay: 'medium', align: 'left',
    eyebrow: i('BRITISH EARLY YEARS · AL KHALIDIYAH, SHARJAH', 'التعليم البريطاني المبكر · الخالدية، الشارقة'),
    title: i('Learning with Love, Growing with Care', 'نتعلّم بالحب، وننمو بالرعاية'),
    text: i('A warm, nurturing and stimulating British EYFS nursery for children from 18 months to 4 years, where little ones explore, play, learn and grow.',
            'حضانة بريطانية دافئة ومحفّزة وفق منهج EYFS للأطفال من عمر 18 شهراً إلى 4 سنوات، حيث يستكشف الصغار ويلعبون ويتعلّمون وينمون.'),
    image: im('p-hero', 'Seven Oaks children and teachers sitting together for a group photo', 'أطفال ومعلمات سيفن أوكس في صورة جماعية'), image2: { url: '', alt: i('', '') },
    script: i('', ''),
    buttons: [btn('Book a Tour', 'احجز زيارة', '#enquire', 'primary'), btn('Meet Our Principal', 'تعرّف على مديرتنا', '/about-us', 'outline-light')],
    chips: [{ icon: 'book', text: i('British EYFS curriculum', 'المنهج البريطاني EYFS') }, { icon: 'users', text: i('Small classes: 1 teacher to 4–8 children', 'صفوف صغيرة: معلمة لكل 4–8 أطفال') }, { icon: 'message', text: i('English & Arabic', 'الإنجليزية والعربية') }],
    badges: [{ icon: 'heart', title: i('Beacon Nursery 2025/26', 'حضانة رائدة 2025/26'), text: i('Recognised by Sharjah Private Education Authority', 'تقدير من هيئة الشارقة للتعليم الخاص') }, { icon: 'shield', title: i('Nut-free campus', 'حرم خالٍ من المكسرات'), text: i('Allergy-aware, every day', 'نراعي الحساسية كل يوم') }],
    buttonsNote: '' } },
  { type: 'trust-bar', config: { items: [
    { icon: 'users', value: '18 m – 4 y', label: i('Ages we welcome', 'الأعمار التي نستقبلها') },
    { icon: 'book', value: 'EYFS', label: i('British early years framework', 'إطار الطفولة المبكرة البريطاني') },
    { icon: 'heart', value: '1 : 4 – 1 : 8', label: i('Teacher-to-child ratios', 'نسب المعلمات إلى الأطفال') },
    { icon: 'message', value: 'EN · AR', label: i('Bilingual learning every day', 'تعلّم بلغتين كل يوم') },
    { icon: 'shield', value: 'Beacon', label: i('Nursery, SPEA Nursery to Nursery Project 2025/26', 'حضانة رائدة، مشروع «حضانة إلى حضانة» 2025/26') },
  ] } },
  { type: 'text-image', config: {
    title: i('Welcome to *Seven Oaks*', 'مرحباً بكم في *سيفن أوكس*'), subtitle: i('A warm, nurturing and stimulating place to grow.', 'مكان دافئ وراعٍ ومحفّز للنمو.'),
    paragraphs: [
      i('Early childhood education lays the foundation for a lifetime of curiosity, creativity and success. At Seven Oaks British Nursery we use a play-based, child-centred approach that nurtures each child’s intellectual and emotional development.',
        'يضع التعليم في الطفولة المبكرة الأساس لحياة من الفضول والإبداع والنجاح. في حضانة سيفن أوكس البريطانية نعتمد نهجاً قائماً على اللعب ومتمحوراً حول الطفل ينمّي نموه الفكري والعاطفي.'),
      i('Our dedicated teachers and staff work closely with families to build a supportive learning community, one that celebrates the diversity and culture of the UAE.',
        'يعمل معلماتنا وطاقمنا المتفانون عن كثب مع الأسر لبناء مجتمع تعلّم داعم يحتفي بتنوّع الإمارات وثقافتها.'),
    ],
    bullets: [i('Play-based, child-centred learning', 'تعلّم قائم على اللعب ومتمحور حول الطفل'), i('Indoor play spaces, a sand room and a garden', 'مساحات لعب داخلية وغرفة رمل وحديقة'), i('Parents kept informed through the Parents App', 'إبقاء الأهل على اطلاع عبر تطبيق أولياء الأمور')],
    button: btn('Discover Seven Oaks', 'اكتشف سيفن أوكس', '/about-us'), imagePosition: 'right', imageSize: 'medium', imageHeight: 'tall', imageStyle: 'arch', image: im('p-entrance', 'The welcoming entrance of Seven Oaks British Nursery', 'مدخل حضانة سيفن أوكس البريطانية الترحيبي'), imageQuote: i('Learning with Love, Growing with Care', 'نتعلّم بالحب، وننمو بالرعاية') } },
  { type: 'safety', config: {
    eyebrow: i('SAFETY & WELL-BEING', 'السلامة والرعاية'), title: i('Your child is *safe* with us', 'طفلكم *بأمان* معنا'),
    text: i('A safe, healthy and caring setting comes first. Our health, food and pick-up policies are explained clearly to every family.', 'البيئة الآمنة والصحية والراعية تأتي أولاً. نشرح لكل أسرة بوضوح سياساتنا في الصحة والغذاء والاستلام.'),
    image: im('p-class-craft', 'A child drawing and colouring in class', 'طفلة ترسم وتلوّن في الصف'),
    items: [
      { icon: 'shield', title: i('Authorised pick-up only', 'الاستلام للمخوَّلين فقط'), text: i('Only guardians listed on the emergency contact form may collect a child; a pick-up code is sent monthly.', 'لا يستلم الطفل إلا الأوصياء المسجّلون في نموذج الطوارئ، ويُرسل رمز الاستلام شهرياً.') },
      { icon: 'heart', title: i('Daily health check', 'فحص صحي يومي'), text: i('A quick health check at drop-off. Children with a fever or signs of infection stay home.', 'فحص صحي سريع عند الوصول. يبقى في المنزل الأطفال الذين لديهم حرارة أو علامات عدوى.') },
      { icon: 'utensils', title: i('Nut-free campus', 'حرم خالٍ من المكسرات'), text: i('No peanuts, tree nuts or nut-based products, and every child’s allergies are recorded.', 'لا فول سوداني ولا مكسرات ولا منتجات تحتويها، وتُسجَّل حساسية كل طفل.') },
      { icon: 'users', title: i('First-aid trained staff', 'طاقم مدرّب على الإسعاف'), text: i('All staff are trained in first aid and allergy response.', 'جميع العاملات مدرّبات على الإسعافات الأولية والتعامل مع الحساسية.') },
    ],
    badges: [i('Nut-free campus', 'حرم خالٍ من المكسرات'), i('First-aid trained staff', 'طاقم مدرّب على الإسعاف'), i('Hygiene and hand-washing routines', 'روتين للنظافة وغسل اليدين')],
    button: btn('Health & wellbeing policies', 'سياسات الصحة والرفاه', '/parents/health-and-wellbeing', 'outline-light') } },
  { type: 'icon-row', config: withPhotos({
    title: i('Learning through *play*', 'التعلّم من خلال *اللعب*'), subtitle: i('Play-based, hands-on, outdoors and child-led.', 'قائم على اللعب والتجربة والهواء الطلق ويقوده الطفل.'),
    text: i('Our curriculum follows the EYFS framework and supports every area of a child’s development through play, exploration and creativity.', 'يتبع منهجنا إطار EYFS ويدعم كل مجالات نمو الطفل عبر اللعب والاستكشاف والإبداع.'),
    button: btn('Discover Our Approach', 'اكتشف نهجنا', '/learning'),
    items: [
      { icon: 'heart', label: i('Personal, Social & Emotional', 'النمو الشخصي والاجتماعي والعاطفي') },
      { icon: 'book', label: i('Literacy', 'القراءة والكتابة') },
      { icon: 'calculator', label: i('Mathematics', 'الرياضيات') },
      { icon: 'message', label: i('Communication & Language', 'التواصل واللغة') },
      { icon: 'globe', label: i('Understanding the World', 'فهم العالم') },
      { icon: 'activity', label: i('Physical Development', 'النمو البدني') },
      { icon: 'palette', label: i('Expressive Arts & Design', 'الفنون التعبيرية والتصميم') },
    ], tagline: i('Curious children become confident learners.', 'الأطفال الفضوليون يصبحون متعلّمين واثقين.') }, 2) },
  { type: 'team', config: {
    title: i('A word from our *Principal*', 'كلمة من *مديرتنا*'), subtitle: i('', ''),
    items: [
      { name: i('Donna Rayson', 'دونا رايسون'), role: i('Principal', 'المديرة'), featured: true, qualification: i('', ''),
        message: i('We are delighted to welcome you and your child to Seven Oaks British Nursery. We believe early childhood education lays the foundation for a lifetime of curiosity, creativity and success, and we look forward to an exciting and joyful learning journey with you and your child.',
                   'يسعدنا أن نرحّب بكم وبطفلكم في حضانة سيفن أوكس البريطانية. نؤمن بأن التعليم في الطفولة المبكرة يضع أساس حياة من الفضول والإبداع والنجاح، ونتطلع إلى رحلة تعلّم ممتعة ومبهجة معكم ومع طفلكم.'),
        bio: i('Principal, Seven Oaks British Nursery', 'مديرة حضانة سيفن أوكس البريطانية'), image: { url: '', alt: i('', '') } },
    ] } },
  { type: 'bento', config: {
    title: i('A place to *discover*', 'مكان *للاكتشاف*'), subtitle: i('Soft play, a jungle gym, a sand room, a role-play room, bright classrooms and a garden with animal visits.', 'لعب ناعم وصالة تسلق وغرفة رمل وغرفة لعب أدوار وصفوف مشرقة وحديقة تستقبل زيارات الحيوانات.'),
    items: [
      ['Soft play & ball pit', 'اللعب الناعم وحمام الكرات', 'p-softplay'], ['Jungle gym', 'صالة التسلق', 'p-jungle'], ['Sand room', 'غرفة الرمل', 'p-sand'], ['Role-play room', 'غرفة لعب الأدوار', 'p-class-roleplay'],
      ['Bright classrooms', 'صفوف مشرقة', 'p-class-toys'], ['Outdoor play', 'اللعب في الهواء الطلق', 'p-sports-1'], ['Animal visits', 'زيارات الحيوانات', 'p-animal-1'], ['Art & creativity', 'الفن والإبداع', 'p-art-girl'],
    ].map(([en, ar, img]) => ({ label: i(en, ar), text: i('', ''), image: im(img, en, ar) })) } },
  { type: 'card-row', config: {
    title: i('Classes for every *stage*', 'صفوف لكل *مرحلة*'), subtitle: i('Three classes for ages 18 months to 4 years', 'ثلاثة صفوف للأعمار من 18 شهراً إلى 4 سنوات'),
    items: [
      { title: i('Toddler Class', 'صف الدارجين'), subtitle: i('18 months – 2 years · 1 teacher : 4 children', '18 شهراً – سنتان · معلمة لكل 4 أطفال'), image: im('p-class-toys', 'Toddlers playing with soft toys', 'أطفال صغار يلعبون بالدمى الناعمة') },
      { title: i('Pre-Foundation Class', 'صف ما قبل التأسيس'), subtitle: i('2 – 3 years · 1 teacher : 6 children', '2 – 3 سنوات · معلمة لكل 6 أطفال'), image: im('p-class-paint', 'Children painting together', 'أطفال يرسمون معاً') },
      { title: i('Preschool Class', 'صف ما قبل المدرسة'), subtitle: i('3 – 4 years · 1 teacher : 8 children', '3 – 4 سنوات · معلمة لكل 8 أطفال'), image: im('p-class-numbers', 'Children practising numbers', 'أطفال يتدرّبون على الأرقام') },
    ], button: btn('Explore Our Classes', 'استكشف صفوفنا', '/classes', 'outline') } },
  { type: 'testimonials', config: {
    title: i('What *parents* say', 'ماذا يقول *أولياء الأمور*'), source: 'managed', place: 'home', layout: 'carousel', limit: 9,
    link: btn('Read more reviews', 'اقرأ المزيد', '/testimonials', 'outline'), items: [] } },
  { type: 'photo-grid', config: {
    style: 'polaroid', title: i('Little moments, *big smiles*', 'لحظات صغيرة، *ابتسامات كبيرة*'), subtitle: i('A peek into life at Seven Oaks.', 'لمحة عن الحياة في سيفن أوكس.'),
    items: [['Sports day', 'اليوم الرياضي', 'p-sports-2'], ['Graduation 2025', 'حفل التخرج 2025', 'p-grad-4'], ['Animal visit', 'زيارة الحيوانات', 'p-animal-3'], ['Learning and play', 'التعلّم واللعب', 'p-art-girl'], ['UAE National Day', 'اليوم الوطني', 'p-national-1'], ['Ramadan', 'رمضان', 'p-culture-4']]
      .map(([en, ar, img]) => ({ label: i(en, ar), image: im(img, en, ar) })), columns: 3, button: btn('See the gallery', 'شاهد المعرض', '/gallery', 'outline') } },
  { type: 'faq', config: {
    title: i('Questions parents *ask us*', 'أسئلة *يسألها* الأهل'), subtitle: i('Short, honest answers. Can’t see yours? Just ask us.', 'إجابات قصيرة وصادقة. لم تجدوا سؤالكم؟ اسألونا.'),
    items: [
      { q: i('What ages do you take?', 'ما الأعمار التي تستقبلونها؟'), a: i('We welcome children from 18 months to 4 years, in three classes: Toddler, Pre-Foundation and Preschool.', 'نستقبل الأطفال من 18 شهراً حتى 4 سنوات في ثلاثة صفوف: الدارجون وما قبل التأسيس وما قبل المدرسة.') },
      { q: i('Which curriculum do you follow?', 'ما المنهج الذي تتبعونه؟'), a: i('The British Early Years Foundation Stage (EYFS) framework, adapted to Sharjah’s multicultural community and delivered through play-based, hands-on learning.', 'إطار المرحلة التأسيسية البريطاني EYFS مكيّفاً مع مجتمع الشارقة متعدد الثقافات ويُقدَّم عبر التعلّم باللعب والتجربة.') },
      { q: i('What are your opening hours?', 'ما ساعات الدوام؟'), a: i('Monday to Thursday: morning shift 8:00 am – 1:00 pm, afternoon shift 1:00 – 5:00 pm. Friday 8:00 am – 12:00 pm. Daycare 1:00 – 5:00 pm. Admissions: Sunday 10:00 am – 2:00 pm.', 'الاثنين إلى الخميس: الفترة الصباحية 8:00 ص – 1:00 م، والفترة المسائية 1:00 – 5:00 م. الجمعة 8:00 ص – 12:00 م. الرعاية النهارية 1:00 – 5:00 م. التسجيل: الأحد 10:00 ص – 2:00 م.') },
      { q: i('Do you allow nuts in lunch boxes?', 'هل يُسمح بالمكسرات في وجبات الأطفال؟'), a: i('No. Seven Oaks is a nut-free campus. Please tell us about any food allergy when you enrol.', 'لا. سيفن أوكس حرم خالٍ من المكسرات. يرجى إبلاغنا بأي حساسية غذائية عند التسجيل.') },
      { q: i('How do I register my child?', 'كيف أسجّل طفلي؟'), a: i('Fill in the enrolment form and bring the required documents. See the [Admissions page](/admissions) for the list and steps.', 'عبّئوا نموذج التسجيل وأحضروا المستندات المطلوبة. راجعوا [صفحة القبول](/admissions) للقائمة والخطوات.') },
    ] } },
  { type: 'cta', config: {
    title: i('Your child’s Seven Oaks journey starts here.', 'رحلة طفلك في سيفن أوكس تبدأ هنا.'),
    text: i('Come and visit us. Meet our team, explore our nursery and see why families choose Seven Oaks.', 'تفضّلوا بزيارتنا. تعرّفوا على فريقنا واستكشفوا حضانتنا واكتشفوا لماذا تختار العائلات سيفن أوكس.'),
    buttons: [btn('Book a Tour', 'احجز زيارة', '#enquire', 'light'), btn('How admissions work', 'كيف يتم القبول', '/admissions', 'outline-light')],
    showContact: false, align: 'center', image: im('p-grad-1', 'The Seven Oaks graduation stage', 'منصة حفل تخرج سيفن أوكس') } },
  { type: 'enquiry-form', config: {
    title: i('Let’s *talk*', 'لنتحدّث *معاً*'), text: i('Tell us a little about your family and we’ll get back to you personally.', 'أخبرونا قليلاً عن عائلتكم وسنرد عليكم شخصياً.'), showMap: true } },
];

export const homeSeo = {
  slug: i('', ''),
  metaTitle: i('Seven Oaks British Nursery | British EYFS Nursery in Sharjah', 'حضانة سيفن أوكس البريطانية | حضانة بريطانية EYFS في الشارقة'),
  metaDescription: i('A warm, inclusive British Early Years (EYFS) nursery in Sharjah, UAE. Book a tour of Seven Oaks British Nursery today.',
                     'حضانة بريطانية شاملة ودافئة وفق منهج EYFS في الشارقة. احجزوا زيارة لحضانة سيفن أوكس البريطانية اليوم.'),
  noindex: false,
};

export const permissions: [string, string][] = [
  ['page', 'read'], ['page', 'update'], ['page', 'publish'],
  ['menu', 'read'], ['menu', 'update'],
  ['theme', 'read'], ['theme', 'update'],
  ['settings', 'read'], ['settings', 'update'],
  ['media', 'read'], ['media', 'create'], ['media', 'update'], ['media', 'delete'],
  ['seo', 'read'], ['seo', 'update'],
  ['audit', 'read'], ['user', 'read'], ['user', 'create'], ['user', 'update'], ['user', 'delete'],
  ['integration', 'read'], ['integration', 'update'],
  ['analytics', 'read'],
  ['lead', 'read'], ['lead', 'update'], ['lead', 'delete'],
  ['testimonial', 'read'], ['testimonial', 'update'],
  ['visitor', 'read'], ['visitor', 'delete'], ['campaign', 'read'], ['campaign', 'create'], ['campaign', 'update'], ['campaign', 'delete'], ['campaign', 'send'],
  ['email', 'read'], ['email', 'update'],
  ['entry', 'read'], ['entry', 'create'], ['entry', 'update'], ['entry', 'delete'], ['entry', 'publish'],
];

export const roles: { key: string; name: { en: string; ar: string }; perms: string[] | 'ALL' }[] = [
  { key: 'SUPER_ADMIN', name: i('Super Admin', 'مدير النظام'), perms: 'ALL' },
  // Admin runs the website, its users and its content. Secret keys (Integrations) and the audit trail stay with the Super Admin.
  { key: 'ADMIN', name: i('Admin', 'مدير'), perms: permissions.map(([r, a]) => `${r}:${a}`).filter((p) => !['integration:read', 'integration:update', 'audit:read'].includes(p)) },
  { key: 'EDITOR', name: i('Editor', 'محرر'), perms: ['page:read', 'page:update', 'menu:read', 'theme:read', 'settings:read', 'media:read', 'media:create', 'media:update', 'seo:read', 'analytics:read', 'testimonial:read', 'testimonial:update', 'entry:read', 'entry:create', 'entry:update'] },
  { key: 'VIEWER', name: i('Viewer (read-only)', 'مشاهد (للقراءة فقط)'), perms: ['page:read', 'menu:read', 'theme:read', 'settings:read', 'media:read', 'seo:read', 'analytics:read', 'testimonial:read', 'entry:read'] },
  { key: 'ADMISSIONS', name: i('Admissions Officer', 'مسؤول القبول'), perms: ['lead:read', 'lead:update', 'testimonial:read'] },
  { key: 'MARKETING', name: i('Marketing', 'التسويق'), perms: ['analytics:read', 'visitor:read', 'campaign:read', 'campaign:create', 'campaign:update', 'campaign:delete', 'campaign:send', 'email:read', 'email:update', 'lead:read', 'testimonial:read', 'media:read', 'media:create', 'page:read'] },
  { key: 'TEACHER', name: i('Teacher', 'معلّم'), perms: [] },
  { key: 'PARENT', name: i('Parent', 'ولي أمر'), perms: [] },
];

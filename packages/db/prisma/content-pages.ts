// Starter content for every inner page (DATA, not code). Loaded once by seed.ts; afterwards each page, section, text and photo
// is edited in Admin → Pages. All wording is a first draft: review it, and have a native Arabic speaker review the Arabic.
import { btn, i, im, withPhotos } from './content';
import { legalPages } from './content-legal';

type Section = { type: string; config: Record<string, any> };
export type PageSeed = { key: string; slug: string; title: { en: string; ar: string }; metaTitle: { en: string; ar: string }; metaDescription: { en: string; ar: string }; sections: Section[] };

const hero = (en: string, ar: string, subEn: string, subAr: string, image: string, altEn: string, altAr: string, buttons: any[] = []): Section => ({
  type: 'hero',
  config: { eyebrow: i('SEVEN OAKS BRITISH NURSERY', 'حضانة سيفن أوكس البريطانية'), title: i(en, ar), text: i(subEn, subAr), image: im(image, altEn, altAr), size: 'compact', buttons, location: i('', ''), script: i('', '') },
});
const cta = (titleEn = 'Come and see Seven Oaks for yourself.', titleAr = 'تعالوا وشاهدوا سيفن أوكس بأنفسكم.'): Section => ({
  type: 'cta',
  config: {
    title: i(titleEn, titleAr),
    text: i('Meet our team, explore our nursery and see how your child could learn, play and grow with us.', 'تعرّفوا على فريقنا واستكشفوا حضانتنا وتخيّلوا كيف يمكن لطفلكم أن يتعلّم ويلعب وينمو معنا.'),
    buttons: [btn('Book a Tour', 'احجز زيارة', '/admissions', 'light'), btn('Contact Us', 'تواصل معنا', '/contact', 'outline-light')],
    showContact: true, image: im('p-grad-1', 'The Seven Oaks graduation stage', 'منصة حفل تخرج سيفن أوكس'),
  },
});
const ti = (titleEn: string, titleAr: string, subEn: string, subAr: string, paras: [string, string][], image: string, altEn: string, altAr: string, opts: { ratio?: string; reverse?: boolean; bullets?: [string, string][]; button?: any; quote?: [string, string] } = {}): Section => ({
  type: 'text-image',
  config: {
    title: i(titleEn, titleAr), subtitle: i(subEn, subAr), paragraphs: paras.map(([e, a]) => i(e, a)), bullets: (opts.bullets ?? []).map(([e, a]) => i(e, a)),
    button: opts.button ?? { label: i('', ''), href: '', variant: 'primary' }, image: { ...im(image, altEn, altAr), ...(opts.ratio ? { ratio: opts.ratio, fit: 'contain' } : {}) }, imageQuote: i(opts.quote?.[0] ?? '', opts.quote?.[1] ?? ''), imagePosition: opts.reverse ? 'left' : 'right', imageSize: 'medium', imageHeight: 'normal', imageStyle: 'rounded',
  },
});
const features = (titleEn: string, titleAr: string, items: [string, string, string, string, string][]): Section => ({
  type: 'feature-grid', config: withPhotos({ title: i(titleEn, titleAr), items: items.map(([icon, te, ta, xe, xa]) => ({ icon, title: i(te, ta), text: i(xe, xa) })) }, titleEn.length),
});
const faq = (titleEn: string, titleAr: string, items: [string, string, string, string][]): Section => ({
  type: 'faq', config: { title: i(titleEn, titleAr), subtitle: i('', ''), items: items.map(([qe, qa, ae, aa]) => ({ q: i(qe, qa), a: i(ae, aa) })) },
});
const steps = (titleEn: string, titleAr: string, subEn: string, subAr: string, items: [string, string, string, string][]): Section => ({
  type: 'steps', config: { title: i(titleEn, titleAr), subtitle: i(subEn, subAr), items: items.map(([te, ta, xe, xa]) => ({ title: i(te, ta), text: i(xe, xa) })) },
});
const rich = (titleEn: string, titleAr: string, paras: [string, string][], bullets: [string, string][] = [], subEn = '', subAr = ''): Section => ({
  type: 'rich-text', config: { title: i(titleEn, titleAr), subtitle: i(subEn, subAr), paragraphs: paras.map(([e, a]) => i(e, a)), bullets: bullets.map(([e, a]) => i(e, a)) },
});

/** Community partner shown on the Learning page. Only repeats what ephatha.ae states. Editable in Admin → Pages → Learning. */
export const ephatha: Section = {
  type: 'partner',
  config: {
    key: 'ephatha',
    title: i('Our Community Partner: Ephatha', 'شريكنا المجتمعي: إيفاثا'),
    subtitle: i('Supporting every child to communicate, learn and thrive.', 'ندعم كل طفل ليتواصل ويتعلم وينمو.'),
    logo: { url: '', alt: i('', '') },
    about: [
      i('Ephatha is a speech and occupational therapy centre in Dubai. Its licensed speech-language pathologists and occupational therapists offer personalised, evidence-based care for individuals of all ages and abilities, working closely with families, caregivers and educators.', 'إيفاثا مركز للنطق والعلاج الوظيفي في دبي. يقدّم أخصائيو النطق واللغة والعلاج الوظيفي المرخّصون رعاية مخصصة قائمة على الأدلة للأفراد من جميع الأعمار والقدرات، بالتعاون الوثيق مع الأسر ومقدمي الرعاية والمعلمين.'),
      i('The centre was founded by Feby Sara Jacob, a speech therapist with over 15 years of experience in speech therapy and special education.', 'أسست المركز فيبي سارة جاكوب، أخصائية نطق تتمتع بخبرة تزيد على 15 عاماً في علاج النطق والتربية الخاصة.'),
    ],
    vision: i('Everyone deserves the opportunity to communicate, learn and thrive.', 'لكل شخص الحق في فرصة للتواصل والتعلّم والنمو.'),
    mission: i('To bring personalised, evidence-based therapy to children and families, in close partnership with caregivers and educators.', 'تقديم علاج مخصص قائم على الأدلة للأطفال والأسر بشراكة وثيقة مع مقدمي الرعاية والمعلمين.'),
    activities: [
      { icon: 'message', title: i('Speech therapy', 'علاج النطق'), text: i('Individual and group sessions that help children express themselves and understand others.', 'جلسات فردية وجماعية تساعد الأطفال على التعبير عن أنفسهم وفهم الآخرين.') },
      { icon: 'activity', title: i('Occupational therapy', 'العلاج الوظيفي'), text: i('Building the everyday skills children need to play, learn and care for themselves.', 'بناء المهارات اليومية التي يحتاجها الأطفال للعب والتعلّم والاعتناء بأنفسهم.') },
      { icon: 'users', title: i('Working with families', 'العمل مع الأسر'), text: i('Family education so progress continues beyond sessions.', 'تثقيف الأسرة لتستمر الفائدة خارج الجلسات.') },
      { icon: 'heart', title: i('Assessment', 'التقييم'), text: i('Careful assessment to understand each child’s strengths and needs.', 'تقييم دقيق لفهم نقاط قوة كل طفل واحتياجاته.') },
    ],
    button: btn('Visit ephatha.ae', 'زيارة ephatha.ae', 'https://ephatha.ae/', 'primary'),
    contact: [{ icon: 'pin', text: i('412, Block 3, Bin Shabib Mall, Al Qusais Industrial Area First, Dubai, U.A.E.', 'مكتب 412، بلوك 3، بن شبيب مول، القصيص الصناعية الأولى، دبي، الإمارات') }, { icon: 'phone', text: i('+971 58 548 5673', '+971 58 548 5673') }, { icon: 'mail', text: i('info@ephatha.ae', 'info@ephatha.ae') }],
    media: [],
  },
};

export const pages: PageSeed[] = [
  // ───────────────────────── ABOUT US ─────────────────────────
  {
    key: 'about-us', slug: 'about-us', title: i('About Us', 'من نحن'),
    metaTitle: i('About Seven Oaks British Nursery | Our Story, Vision & Team', 'عن حضانة سيفن أوكس البريطانية | قصتنا ورؤيتنا وفريقنا'),
    metaDescription: i('Seven Oaks British Nursery in Al Khalidiyah, Sharjah: a safe, inclusive EYFS nursery for children aged 18 months to 4 years. Our vision, mission and Principal.', 'حضانة سيفن أوكس البريطانية في الخالدية بالشارقة: حضانة آمنة وشاملة وفق منهج EYFS للأطفال من 18 شهراً إلى 4 سنوات. رؤيتنا ورسالتنا ومديرتنا.'),
    sections: [
      hero('About Us', 'من نحن', 'Our story, our vision and the people who make Seven Oaks a happy place to grow.', 'قصتنا ورؤيتنا والأشخاص الذين يجعلون سيفن أوكس مكاناً سعيداً للنمو.', 'p-entrance', 'The entrance of Seven Oaks British Nursery', 'مدخل حضانة سيفن أوكس البريطانية'),
      ti('Our Story', 'قصتنا', 'Learning with Love, Growing with Care.', 'نتعلّم بالحب، وننمو بالرعاية.', [
        ['Seven Oaks British Nursery is a British curriculum nursery in Al Khalidiyah, Al Khan, Sharjah. We provide a safe, inclusive and stimulating learning environment for young children, following the EYFS Framework and promoting holistic development through play-based learning and family partnerships.', 'حضانة سيفن أوكس البريطانية حضانة بمنهج بريطاني في الخالدية بالخان في الشارقة. نوفّر بيئة تعلّم آمنة وشاملة ومحفّزة للأطفال الصغار وفق إطار EYFS، وننمّي نموهم الشامل عبر التعلّم باللعب والشراكة مع الأسر.'],
        ['We welcome children of all nationalities, including Emirati children, and promote UAE values, culture and identity. Our promise to parents is high-quality care, excellent early education, strong communication and a secure environment where every child can learn, grow and thrive.', 'نرحّب بالأطفال من جميع الجنسيات ومنهم الأطفال الإماراتيون، ونعزّز القيم والثقافة والهوية الإماراتية. وعدنا للأهل رعاية عالية الجودة وتعليم مبكر متميز وتواصل قوي وبيئة آمنة ينمو فيها كل طفل ويتألق.'],
      ], 'p-art-girl', 'A smiling child painting in class', 'طفلة مبتسمة ترسم في الصف', { quote: ['Learning with Love, Growing with Care', 'نتعلّم بالحب، وننمو بالرعاية'] }),
      { type: 'stats', config: { items: [
        { value: '18 m – 4 y', label: i('Ages we welcome', 'الأعمار التي نستقبلها') },
        { value: 'EYFS', label: i('British early years framework', 'إطار الطفولة المبكرة البريطاني') },
        { value: 'EN · AR', label: i('English and Arabic every day', 'الإنجليزية والعربية كل يوم') },
        { value: '3', label: i('Classes: Toddler, Pre-Foundation, Preschool', 'صفوف: الدارجون وما قبل التأسيس وما قبل المدرسة') },
      ] } },
      ti('A Beacon Nursery', 'حضانة رائدة', 'Recognised by the Sharjah Private Education Authority.', 'بتقدير من هيئة الشارقة للتعليم الخاص.', [
        ['On 30 June 2026 the Sharjah Private Education Authority (SPEA) presented Seven Oaks with a Certificate of Appreciation in recognition of its distinguished role as a Beacon Nursery within the Nursery to Nursery Project during the 2025/2026 academic year.', 'في 30 يونيو 2026 منحت هيئة الشارقة للتعليم الخاص حضانة سيفن أوكس شهادة تقدير تقديراً لدورها المتميز كإحدى الحضانات الرائدة ضمن مشروع «حضانة إلى حضانة» للعام الدراسي 2025/2026.'],
        ['The certificate thanks the nursery for its valuable contribution to sharing effective practices, supporting the quality of education, and caring for the positive impact on children’s learning and development.', 'وتشكر الشهادة الحضانة على مساهمتها القيّمة في تبادل الممارسات الفعّالة ودعم جودة التعليم والرعاية بما يترك أثراً إيجابياً في تعلّم الأطفال ونموهم.'],
      ], 'p-certificate', 'SPEA Certificate of Appreciation awarded to Seven Oaks nursery', 'شهادة تقدير من هيئة الشارقة للتعليم الخاص لحضانة سيفن أوكس', { reverse: true, ratio: '3/2' }),
      ti('Our Vision & Mission', 'رؤيتنا ورسالتنا', 'Every child valued, respected and supported.', 'كل طفل مُقدَّر ومحترَم ومدعوم.', [
        ['Our vision: to provide a happy, inclusive and stimulating learning environment where every child is valued, respected and supported to reach their full potential. We celebrate the diversity and culture of the UAE while nurturing confident, responsible and lifelong learners prepared for future success.', 'رؤيتنا: توفير بيئة تعلّم سعيدة وشاملة ومحفّزة يُقدَّر فيها كل طفل ويُحترم ويُدعم لبلوغ إمكاناته. نحتفي بتنوّع الإمارات وثقافتها ونرعى متعلّمين واثقين ومسؤولين مدى الحياة ومستعدين لنجاح المستقبل.'],
        ['Our mission: to provide a safe, inclusive and stimulating early childhood environment that supports every child’s intellectual, emotional, social and physical development. Through play-based learning, meaningful interactions, creativity and strong partnerships with families, we nurture confident, independent learners.', 'رسالتنا: توفير بيئة طفولة مبكرة آمنة وشاملة ومحفّزة تدعم نمو كل طفل فكرياً وعاطفياً واجتماعياً وبدنياً. عبر التعلّم باللعب والتفاعلات الهادفة والإبداع والشراكة القوية مع الأسر نرعى متعلّمين واثقين ومستقلين.'],
      ], 'p-smile', 'A smiling child at the craft table', 'طفلة مبتسمة على طاولة الأعمال اليدوية', { bullets: [['A happy, inclusive, stimulating environment', 'بيئة سعيدة وشاملة ومحفّزة'], ['Play-based learning and strong family partnerships', 'تعلّم باللعب وشراكة قوية مع الأسر'], ['UAE values, culture and identity', 'القيم والثقافة والهوية الإماراتية']] }),
      features('Our Educational Philosophy', 'فلسفتنا التعليمية', [
        ['lightbulb', 'Play-Based Learning', 'التعلّم باللعب', 'Active, joyful learning that builds early literacy, numeracy, problem-solving and social skills.', 'تعلّم نشط وممتع يبني مهارات القراءة والحساب وحل المشكلات والمهارات الاجتماعية.'],
        ['heart', 'Social-Emotional Development', 'النمو الاجتماعي والعاطفي', 'Children learn to express emotions, show empathy, cooperate and regulate themselves.', 'يتعلم الأطفال التعبير عن مشاعرهم والتعاطف والتعاون وضبط النفس.'],
        ['sprout', 'Hands-On Exploration', 'الاستكشاف بالتجربة', 'Sensory-rich arts, music, science and nature activities develop creativity and motor skills.', 'أنشطة غنية بالحواس في الفنون والموسيقى والعلوم والطبيعة تنمّي الإبداع والمهارات الحركية.'],
        ['message', 'Language & Communication', 'اللغة والتواصل', 'Children learn to express themselves and communicate effectively in a warm, inclusive classroom.', 'يتعلم الأطفال التعبير عن أنفسهم والتواصل بفاعلية في صف دافئ وشامل.'],
        ['users', 'Family Partnership', 'الشراكة مع الأسرة', 'Parents are a child’s first and most important teachers, and are involved in nursery life.', 'الأهل هم أول معلمي الطفل وأهمهم، ويشاركون في حياة الحضانة.'],
      ]),
      features('Our Student Profile', 'ملامح طفلنا', [
        ['lightbulb', 'Curious learner', 'متعلّم فضولي', 'Every child is capable, competent and ready to learn in their own way.', 'كل طفل قادر وكفؤ ومستعد للتعلّم بطريقته الخاصة.'],
        ['message', 'Confident communicator', 'متواصل واثق', 'We build confidence in expressing ideas, feelings and needs.', 'نبني الثقة في التعبير عن الأفكار والمشاعر والاحتياجات.'],
        ['palette', 'Creative individual', 'شخصية مبدعة', 'We celebrate the uniqueness of every child and nurture curiosity, confidence and compassion.', 'نحتفي بتفرّد كل طفل وننمّي الفضول والثقة والتعاطف.'],
      ]),
      { type: 'team', config: { title: i('A word from our Principal', 'كلمة من مديرتنا'), subtitle: i('', ''), items: [
        { name: i('Donna Rayson', 'دونا رايسون'), role: i('Principal', 'المديرة'), featured: true,
          message: i('We are delighted to welcome you and your child to Seven Oaks British Nursery. Our preschool is dedicated to providing a warm, nurturing and stimulating environment where children can explore, learn and grow. We believe early childhood education lays the foundation for a lifetime of curiosity, creativity and academic success.\n\nOur dedicated teachers and staff work closely with families to create a supportive learning community that nurtures each child’s unique potential. We look forward to an exciting and joyful learning journey with you and your child!',
                     'يسعدنا أن نرحّب بكم وبطفلكم في حضانة سيفن أوكس البريطانية. تلتزم حضانتنا بتوفير بيئة دافئة وراعية ومحفّزة يستكشف فيها الأطفال ويتعلّمون وينمون. نؤمن بأن التعليم في الطفولة المبكرة يضع أساس حياة من الفضول والإبداع والنجاح الدراسي.\n\nيعمل معلماتنا وطاقمنا المتفانون عن كثب مع الأسر لبناء مجتمع تعلّم داعم ينمّي إمكانات كل طفل الفريدة. نتطلع إلى رحلة تعلّم ممتعة ومبهجة معكم ومع طفلكم!'),
          bio: i('Principal, Seven Oaks British Nursery', 'مديرة حضانة سيفن أوكس البريطانية'), image: { url: '', alt: i('', '') } },
      ] } },
      rich('How we keep improving', 'كيف نواصل التحسّن', [['Our self-evaluation involves the Nursery Manager, Assistant Manager, teachers, support staff, parents and children. Evidence from lesson observations, learning walks, children’s assessments, parent surveys and staff feedback is analysed termly by the leadership team and used to update our Self-Evaluation Form and Nursery Improvement Plan, with clear actions, responsibilities and timelines.', 'يشارك في تقييمنا الذاتي مديرة الحضانة والمديرة المساعدة والمعلمات والطاقم المساند والأهل والأطفال. تحلّل القيادة كل فصل الأدلة المأخوذة من ملاحظات الحصص والجولات التعليمية وتقييمات الأطفال واستبيانات الأهل وآراء الطاقم، وتُستخدم لتحديث نموذج التقييم الذاتي وخطة التحسين مع إجراءات ومسؤوليات وجداول زمنية واضحة.']]),
      cta(),
    ],
  },

  // ───────────────────────── OUR NURSERY ─────────────────────────
  {
    key: 'our-nursery', slug: 'our-nursery', title: i('Our Nursery', 'حضانتنا'),
    metaTitle: i('Our Nursery | Spaces, Daily Schedule & Safety | Seven Oaks', 'حضانتنا | المساحات والجدول اليومي والسلامة | سيفن أوكس'),
    metaDescription: i('Soft play, jungle gym, sand room, role-play room and bright classrooms at Seven Oaks British Nursery, Sharjah. See our daily schedule.', 'لعب ناعم وصالة تسلق وغرفة رمل وغرفة لعب أدوار وصفوف مشرقة في حضانة سيفن أوكس البريطانية بالشارقة. اطلعوا على جدولنا اليومي.'),
    sections: [
      hero('Our Nursery', 'حضانتنا', 'Bright, safe and playful spaces to explore, indoors and out.', 'مساحات مشرقة وآمنة وممتعة للاستكشاف، في الداخل والخارج.', 'p-sand', 'Children playing together in the sand room', 'أطفال يلعبون معاً في غرفة الرمل'),
      ti('A Place Designed for Children', 'مكان مصمم للأطفال', 'Indoor and outdoor learning areas for every age.', 'مساحات تعلّم داخلية وخارجية لكل الأعمار.', [
        ['Our learning environment is carefully organised to support the EYFS curriculum through age-appropriate indoor and outdoor learning areas. Resources are accessible and encourage exploration, creativity, communication and physical development.', 'تنظَّم بيئة التعلّم لدينا بعناية لدعم منهج EYFS عبر مساحات داخلية وخارجية تناسب كل عمر. الموارد متاحة للأطفال وتشجّع على الاستكشاف والإبداع والتواصل والنمو البدني.'],
        ['Children enjoy a soft-play area with a ball pit and slide, a jungle gym, a sand room, a role-play and interactive room, and a garden where animals sometimes visit.', 'يستمتع الأطفال بمنطقة لعب ناعم فيها حمام كرات وزحليقة، وصالة تسلق، وغرفة رمل، وغرفة لعب أدوار وتفاعل، وحديقة تزورها الحيوانات أحياناً.'],
      ], 'p-softplay', 'A child in the ball pit beside a pink slide', 'طفل في حمام الكرات بجانب زحليقة وردية', { button: btn('Book a Tour', 'احجز زيارة', '/admissions') }),
      { type: 'photo-grid', config: { title: i('Our Spaces', 'مساحاتنا'), subtitle: i('Learning happens everywhere at Seven Oaks.', 'التعلّم يحدث في كل مكان في سيفن أوكس.'), columns: 4, items: [
        ['Soft play & ball pit', 'اللعب الناعم وحمام الكرات', 'p-softplay'], ['Jungle gym', 'صالة التسلق', 'p-jungle'], ['Sand room', 'غرفة الرمل', 'p-sand'], ['Role-play room', 'غرفة لعب الأدوار', 'p-class-roleplay'],
        ['Bright classrooms', 'صفوف مشرقة', 'p-class-toys'], ['Outdoor play', 'اللعب في الهواء الطلق', 'p-sports-1'], ['Animal visits', 'زيارات الحيوانات', 'p-animal-1'], ['Art & creativity', 'الفن والإبداع', 'p-art-girl'],
      ].map(([en, ar, img]) => ({ label: i(en, ar), image: im(img, en, ar) })) } },
      steps('A Day at Seven Oaks (morning shift)', 'يوم في سيفن أوكس (الفترة الصباحية)', 'Our daily schedule, Monday to Friday. The afternoon shift follows a similar rhythm.', 'جدولنا اليومي من الاثنين إلى الجمعة. وتتبع الفترة المسائية إيقاعاً مماثلاً.', [
        ['8:00 – 8:30 · Arrival & free play', '8:00 – 8:30 · الوصول واللعب الحر', 'Transition activities and social interaction, with the UAE National Anthem.', 'أنشطة انتقالية وتفاعل اجتماعي مع النشيد الوطني الإماراتي.'],
        ['8:30 – 9:15 · Breakfast', '8:30 – 9:15 · الإفطار', 'A healthy snack and hydration break.', 'وجبة خفيفة صحية واستراحة لشرب الماء.'],
        ['9:15 – 9:45 · Circle time', '9:15 – 9:45 · وقت الحلقة', 'Welcome songs and theme discussion.', 'أغانٍ ترحيبية ونقاش حول موضوع الأسبوع.'],
        ['9:45 – 10:30 · Focus activity', '9:45 – 10:30 · النشاط المركّز', 'Rotating literacy, maths, art and science stations.', 'محطات متنقلة للقراءة والرياضيات والفن والعلوم.'],
        ['10:30 – 11:15 · Arabic', '10:30 – 11:15 · اللغة العربية', 'Exploring the Arabic language and expressing thoughts and feelings creatively.', 'استكشاف اللغة العربية والتعبير عن الأفكار والمشاعر بطريقة إبداعية.'],
        ['11:15 – 11:45 · Lunch', '11:15 – 11:45 · الغداء', 'A healthy meal and hydration break.', 'وجبة صحية واستراحة لشرب الماء.'],
        ['11:45 – 12:15 · Role play / interactive room', '11:45 – 12:15 · لعب الأدوار / غرفة التفاعل', 'Developing social and language skills in playful time.', 'تنمية المهارات الاجتماعية واللغوية في وقت ممتع.'],
        ['12:15 – 12:45 · Jungle gym / sand room', '12:15 – 12:45 · صالة التسلق / غرفة الرمل', 'Gross and fine motor skills.', 'المهارات الحركية الكبرى والدقيقة.'],
        ['12:45 – 1:00 · Story time, music & drama', '12:45 – 1:00 · القصة والموسيقى والدراما', 'Stories that build creativity and confidence.', 'قصص تبني الإبداع والثقة.'],
      ]),
      features('Safety & Wellbeing', 'السلامة والرفاه', [
        ['shield', 'Authorised pick-up only', 'الاستلام للمخوَّلين فقط', 'Only guardians listed on the emergency contact form may collect a child, using a pick-up code sent monthly.', 'لا يستلم الطفل إلا الأوصياء المسجّلون في نموذج الطوارئ برمز استلام يُرسل شهرياً.'],
        ['heart', 'Health check at drop-off', 'فحص صحي عند الوصول', 'A quick health check is carried out each morning.', 'يُجرى فحص صحي سريع كل صباح.'],
        ['utensils', 'Nut-free campus', 'حرم خالٍ من المكسرات', 'No peanuts, tree nuts or nut-based products, and all staff are trained in allergy response.', 'لا فول سوداني ولا مكسرات ولا منتجات تحتويها، وجميع العاملات مدرّبات على التعامل مع الحساسية.'],
        ['users', 'First-aid trained staff', 'طاقم مدرّب على الإسعاف', 'All staff are trained in first aid and emergency procedures.', 'جميع العاملات مدرّبات على الإسعافات الأولية وإجراءات الطوارئ.'],
        ['sprout', 'Hygiene routines', 'روتين النظافة', 'Hand-washing on arrival, before eating and after toilet use; surfaces and toys cleaned daily.', 'غسل اليدين عند الوصول وقبل الأكل وبعد استخدام المرحاض، وتنظيف الأسطح والألعاب يومياً.'],
        ['file', 'Clear policies', 'سياسات واضحة', 'Our policies are available in the Parents App or from reception.', 'سياساتنا متاحة في تطبيق أولياء الأمور أو من الاستقبال.'],
      ]),
      cta(),
    ],
  },

  // ───────────────────────── LEARNING ─────────────────────────
  {
    key: 'learning', slug: 'learning', title: i('Learning', 'التعلّم'),
    metaTitle: i('Learning | British EYFS Curriculum in Sharjah | Seven Oaks', 'التعلّم | المنهج البريطاني EYFS في الشارقة | سيفن أوكس'),
    metaDescription: i('How children learn at Seven Oaks British Nursery: the British EYFS framework, play-based learning, Arabic and enrichment activities.', 'كيف يتعلّم الأطفال في حضانة سيفن أوكس البريطانية: إطار EYFS البريطاني والتعلّم باللعب والعربية وأنشطة الإثراء.'),
    sections: [
      hero('Learning at Seven Oaks', 'التعلّم في سيفن أوكس', 'Play-based, hands-on and developmentally appropriate.', 'قائم على اللعب والتجربة ومناسب لنمو الطفل.', 'p-class-numbers', 'Two children playing a number game', 'طفلتان تلعبان لعبة الأرقام'),
      ti('Our Curriculum: the British EYFS', 'منهجنا: المنهج البريطاني EYFS', 'Learning through play, exploration and creativity.', 'التعلّم عبر اللعب والاستكشاف والإبداع.', [
        ['Seven Oaks British Nursery follows the Early Years Foundation Stage (EYFS) framework. Through play-based, hands-on and developmentally appropriate experiences, children develop their intellectual, social, emotional, physical and language skills.', 'تتبع حضانة سيفن أوكس البريطانية إطار المرحلة التأسيسية للطفولة المبكرة (EYFS). عبر تجارب قائمة على اللعب والتجربة ومناسبة لنمو الطفل ينمّي الأطفال مهاراتهم الفكرية والاجتماعية والعاطفية والبدنية واللغوية.'],
        ['The curriculum encourages creativity, independence, problem-solving and confidence while promoting UAE values and cultural awareness. It is adapted to Sharjah’s multicultural community, celebrating UAE culture, Arabic language, national events and diverse traditions.', 'يشجّع المنهج الإبداع والاستقلالية وحل المشكلات والثقة مع تعزيز القيم الإماراتية والوعي الثقافي. وهو مكيّف مع مجتمع الشارقة متعدد الثقافات ويحتفي بالثقافة الإماراتية واللغة العربية والمناسبات الوطنية والتقاليد المتنوعة.'],
      ], 'p-class-paint', 'Children painting at a table', 'أطفال يرسمون على طاولة', { reverse: true }),
      { type: 'icon-row', config: withPhotos({
        title: i('Seven Areas of Learning', 'مجالات التعلّم السبعة'), subtitle: i('Our key developmental areas', 'مجالات النمو الرئيسية لدينا'),
        text: i('Assessment information is used to adapt teaching and ensure every child reaches developmental milestones and their full potential.', 'تُستخدم معلومات التقييم لتكييف التدريس وضمان بلوغ كل طفل مراحل النمو المتوقعة وإمكاناته الكاملة.'),
        button: btn('Book a Tour', 'احجز زيارة', '/admissions'),
        items: [
          { icon: 'heart', label: i('Personal, Social & Emotional', 'النمو الشخصي والاجتماعي والعاطفي') }, { icon: 'book', label: i('Literacy', 'القراءة والكتابة') },
          { icon: 'calculator', label: i('Mathematics', 'الرياضيات') }, { icon: 'message', label: i('Communication & Language', 'التواصل واللغة') },
          { icon: 'globe', label: i('Understanding the World', 'فهم العالم') }, { icon: 'activity', label: i('Physical Development', 'النمو البدني') },
          { icon: 'palette', label: i('Expressive Arts & Design', 'الفنون التعبيرية والتصميم') },
        ], tagline: i('Play · Learn · Grow', 'العب · تعلّم · انمُ') }, 1) },
      features('Teaching Methods', 'أساليب التعليم', [
        ['lightbulb', 'Hands-On Learning', 'التعلّم بالتجربة', 'Children explore actively using real-world materials to deepen understanding.', 'يستكشف الأطفال بنشاط باستخدام مواد من الحياة الواقعية لتعميق الفهم.'],
        ['users', 'Teacher-Guided & Child-Led', 'بتوجيه المعلمة وبقيادة الطفل', 'Curiosity and problem-solving grow through discovery-based experiences.', 'ينمو الفضول وحل المشكلات عبر تجارب قائمة على الاكتشاف.'],
        ['sprout', 'Outdoor Learning', 'التعلّم في الهواء الطلق', 'Nature becomes a classroom that builds observation skills and care for the environment.', 'تصبح الطبيعة صفاً يبني مهارات الملاحظة والاهتمام بالبيئة.'],
        ['heart', 'Whole-Child Approach', 'نهج الطفل المتكامل', 'We support cognitive, emotional, social and physical development together.', 'ندعم النمو المعرفي والعاطفي والاجتماعي والبدني معاً.'],
      ]),
      features('Enrichment & Specialist Activities', 'الأنشطة الإثرائية والتخصصية', [
        ['message', 'Arabic & Islamic Education', 'العربية والتربية الإسلامية', 'Arabic is taught through daily activities and structured lessons, alongside Islamic education.', 'تُدرَّس العربية عبر الأنشطة اليومية والدروس المنظمة إلى جانب التربية الإسلامية.'],
        ['palette', 'Music, Art & Craft', 'الموسيقى والفن والأشغال', 'Music and movement, art and craft, storytelling and drama.', 'الموسيقى والحركة والفن والأشغال اليدوية والقصص والدراما.'],
        ['activity', 'Physical Education', 'التربية البدنية', 'Jungle gym, soft play, sports day and active outdoor play.', 'صالة التسلق واللعب الناعم واليوم الرياضي واللعب النشط في الهواء الطلق.'],
        ['lightbulb', 'STEM & Sensory Play', 'العلوم والتقنية واللعب الحسي', 'Science experiences, cooking activities and sensory play.', 'تجارب علمية وأنشطة طبخ ولعب حسي.'],
        ['book', 'Library & Storytelling', 'المكتبة وسرد القصص', 'Library sessions and stories in English and Arabic.', 'حصص مكتبة وقصص بالإنجليزية والعربية.'],
        ['globe', 'UAE Culture & Celebrations', 'الثقافة الإماراتية والاحتفالات', 'National Day, Flag Day, Haq Al Laila, Arabic stories, traditional activities, community events and educational visits.', 'اليوم الوطني ويوم العلم وحق الليلة والقصص العربية والأنشطة التراثية والفعاليات المجتمعية والزيارات التعليمية.'],
      ]),
      rich('Languages at Seven Oaks', 'اللغات في سيفن أوكس', [['We follow a bilingual language model. English is the primary language of instruction and Arabic is taught through daily activities and structured lessons. Children’s home languages are respected and valued, and extra support helps children build confidence in both languages.', 'نتبع نموذجاً ثنائي اللغة: الإنجليزية لغة التدريس الأساسية، وتُدرَّس العربية عبر الأنشطة اليومية والدروس المنظمة. نحترم لغات الأطفال في بيوتهم ونقدّرها، ونوفّر دعماً إضافياً لبناء ثقتهم بالتواصل باللغتين.']]),
      steps('How we follow your child’s progress', 'كيف نتابع تقدّم طفلكم', 'Observation, assessment and sharing with parents.', 'الملاحظة والتقييم والمشاركة مع الأهل.', [
        ['Observe', 'نلاحظ', 'Teachers observe children through regular observations, photographs and work samples.', 'تلاحظ المعلمات الأطفال عبر ملاحظات منتظمة وصور ونماذج من أعمالهم.'],
        ['Record', 'نوثّق', 'Evidence is recorded on the nursery’s assessment system, aligned with the EYFS.', 'يُسجَّل الدليل في نظام التقييم لدى الحضانة بما يتوافق مع EYFS.'],
        ['Plan', 'نخطّط', 'Progress is checked against age-related expectations and used to plan next steps.', 'يُقارَن التقدّم بالمتوقع لكل عمر ويُستخدم لتخطيط الخطوات التالية.'],
        ['Share', 'نشارك', 'Parents hear about progress through meetings, reports and the Parents App.', 'يطّلع الأهل على التقدّم عبر الاجتماعات والتقارير وتطبيق أولياء الأمور.'],
      ]),
      ephatha,
      cta(),
    ],
  },

  // ───────────────────────── CLASSES ─────────────────────────
  {
    key: 'classes', slug: 'classes', title: i('Classes', 'الصفوف'),
    metaTitle: i('Our Classes | Toddler to Preschool | Seven Oaks', 'صفوفنا | من الدارجين إلى ما قبل المدرسة | سيفن أوكس'),
    metaDescription: i('Our three classes at Seven Oaks British Nursery, Sharjah: Toddler (18 months – 2 years), Pre-Foundation (2 – 3 years) and Preschool (3 – 4 years).', 'صفوفنا الثلاثة في حضانة سيفن أوكس البريطانية بالشارقة: الدارجون (18 شهراً – سنتان) وما قبل التأسيس (2 – 3 سنوات) وما قبل المدرسة (3 – 4 سنوات).'),
    sections: [
      hero('Our Classes', 'صفوفنا', 'Small classes, led by qualified early childhood educators.', 'صفوف صغيرة تقودها معلمات طفولة مبكرة مؤهلات.', 'p-class-toys', 'Children playing with teddy bears in the classroom', 'أطفال يلعبون بالدببة في الصف'),
      ti('Toddler Class', 'صف الدارجين', '18 months – 2 years · 1 teacher : 4 children', '18 شهراً – سنتان · معلمة لكل 4 أطفال', [['This class focuses on early socialisation, sensory exploration and foundational motor skills. Children begin using simple words and short sentences, and build independence through music, movement, hands-on exploration and simple routines.', 'يركّز هذا الصف على التنشئة الاجتماعية المبكرة والاستكشاف الحسي والمهارات الحركية الأساسية. يبدأ الأطفال باستخدام كلمات بسيطة وجمل قصيرة، ويبنون استقلاليتهم عبر الموسيقى والحركة والاستكشاف العملي والروتين البسيط.']], 'p-class-toys', 'Toddlers sitting with teddy bears', 'أطفال صغار يجلسون مع الدببة', { bullets: [['Circle time with songs and stories', 'وقت الحلقة مع الأغاني والقصص'], ['Sensory play: water tables, finger painting, texture boxes and playdough', 'اللعب الحسي: طاولات الماء والرسم بالأصابع وصناديق الملمس والصلصال'], ['Soft play and movement for gross motor skills', 'اللعب الناعم والحركة لتنمية المهارات الحركية الكبرى'], ['Snack time and supervised free play', 'وقت الوجبة الخفيفة واللعب الحر المُشرَف عليه']] }),
      ti('Pre-Foundation Class', 'صف ما قبل التأسيس', '2 – 3 years · 1 teacher : 6 children', '2 – 3 سنوات · معلمة لكل 6 أطفال', [['Children grow in language, learn to answer simple questions, play cooperatively and solve problems. Early literacy, numeracy and creative arts are introduced through play-based learning.', 'ينمو الأطفال لغوياً ويتعلمون الإجابة عن أسئلة بسيطة واللعب بتعاون وحل المشكلات. تُقدَّم القراءة والحساب والفنون الإبداعية المبكرة عبر التعلّم باللعب.']], 'p-class-paint', 'Children painting with bright colours', 'أطفال يرسمون بألوان زاهية', { reverse: true, bullets: [['Morning greetings and structured group activities', 'تحية الصباح وأنشطة جماعية منظمة'], ['Fine motor skills through colouring and clay', 'المهارات الحركية الدقيقة عبر التلوين والصلصال'], ['Outdoor play for coordination and teamwork', 'اللعب في الهواء الطلق للتناسق والعمل الجماعي'], ['Thematic storytelling and hands-on science', 'سرد قصصي موضوعي وعلوم بالتجربة']] }),
      ti('Preschool Class', 'صف ما قبل المدرسة', '3 – 4 years · 1 teacher : 8 children', '3 – 4 سنوات · معلمة لكل 8 أطفال', [['Preparing children for school. We develop cognitive skills, independence and the ability to take part in guided learning through structured activities, group discussions and hands-on experiments that foster curiosity.', 'نهيّئ الأطفال للمدرسة. ننمّي المهارات المعرفية والاستقلالية والقدرة على المشاركة في التعلّم الموجَّه عبر أنشطة منظمة ونقاشات جماعية وتجارب عملية تنمّي الفضول.']], 'p-class-numbers', 'Children practising numbers with counters', 'أطفال يتدرّبون على الأرقام', { bullets: [['Interactive literacy sessions: phonics and early writing', 'جلسات قراءة تفاعلية: الأصوات والكتابة المبكرة'], ['Learning centres for letters, numbers and fine motor skills', 'مراكز تعلّم للحروف والأرقام والمهارات الحركية الدقيقة'], ['Role-play and problem-solving games for social-emotional learning', 'لعب أدوار وألعاب حل مشكلات للتعلّم الاجتماعي والعاطفي'], ['Outdoor nature exploration and fitness', 'استكشاف الطبيعة واللياقة في الهواء الطلق']] }),
      features('In Every Class', 'في كل صف', [
        ['users', 'A qualified educator and two assistants', 'معلمة مؤهلة ومساعدتان', 'Each class is led by a qualified early childhood educator with two classroom assistants.', 'تقود كل صف معلمة طفولة مبكرة مؤهلة مع مساعدتين في الصف.'],
        ['heart', 'Independence and self-help', 'الاستقلالية والاعتماد على النفس', 'Children are encouraged to dress, tidy up and make choices.', 'يُشجَّع الأطفال على ارتداء ملابسهم وترتيب أغراضهم واتخاذ القرارات.'],
        ['lightbulb', 'Observed and assessed', 'ملاحظة وتقييم', 'Teachers observe progress to make sure children meet developmental milestones.', 'تلاحظ المعلمات التقدّم للتأكد من بلوغ الأطفال مراحل النمو المتوقعة.'],
        ['message', 'Updates through the Parents App', 'تحديثات عبر تطبيق أولياء الأمور', 'Photos, messages and reports are shared with parents.', 'تُشارَك الصور والرسائل والتقارير مع الأهل.'],
      ]),
      cta('Find the right class for your child.', 'اعثروا على الصف المناسب لطفلكم.'),
    ],
  },

  // ───────────────────────── INCLUSION ─────────────────────────
  {
    key: 'inclusion', slug: 'inclusion', title: i('Inclusion', 'الدمج والشمول'),
    metaTitle: i('Inclusion | Every Child Is Valued | Seven Oaks', 'الدمج والشمول | كل طفل مُقدَّر | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('Our approach to inclusion at Seven Oaks British Nursery, Sharjah: individual needs, support for children of determination and partnership with families.', 'نهجنا في الدمج في حضانة سيفن أوكس البريطانية بالشارقة: الاحتياجات الفردية ودعم أصحاب الهمم والشراكة مع الأسر.'),
    sections: [
      hero('Inclusion', 'الدمج والشمول', 'Every child is valued, respected and supported.', 'كل طفل مُقدَّر ومحترَم ومدعوم.', 'p-sports-2', 'Two friends hugging and wearing their medals', 'صديقتان تتعانقان وتضعان ميدالياتهما'),
      ti('Our Commitment', 'التزامنا', 'An inclusive environment where every child feels valued.', 'بيئة شاملة يشعر فيها كل طفل بأنه مُقدَّر.', [
        ['Admission is based on age eligibility and the nursery’s ability to meet each child’s needs. Children of determination are welcomed whenever appropriate support can be provided in partnership with families and our team specialists.', 'يعتمد القبول على الأهلية العمرية وقدرة الحضانة على تلبية احتياجات كل طفل. نرحّب بأصحاب الهمم متى أمكن توفير الدعم المناسب بالشراكة مع الأسر وأخصائيي فريقنا.'],
        ['Learning experiences are adapted to each child’s age, interests, abilities and developmental stage. Children who need extra support, including those with special educational needs, receive personalised planning, targeted interventions and collaboration with parents and external specialists where appropriate.', 'تُكيَّف تجارب التعلّم وفق عمر كل طفل واهتماماته وقدراته ومرحلة نموه. ويحصل الأطفال الذين يحتاجون دعماً إضافياً، ومنهم ذوو الاحتياجات التعليمية الخاصة، على تخطيط شخصي وتدخلات موجّهة وتعاون مع الأهل ومع مختصين خارجيين عند الحاجة.'],
      ], 'p-sports-2', 'Two friends hugging and wearing their medals', 'صديقتان تتعانقان وتضعان ميدالياتهما'),
      features('How we support every child', 'كيف ندعم كل طفل', [
        ['user', 'Personalised planning', 'تخطيط شخصي', 'Plans and next steps are based on each child’s observations and assessments.', 'تستند الخطط والخطوات التالية إلى ملاحظات كل طفل وتقييماته.'],
        ['users', 'Working with specialists', 'العمل مع المختصين', 'We collaborate with parents and external specialists where appropriate.', 'نتعاون مع الأهل ومع مختصين خارجيين عند الحاجة.'],
        ['globe', 'Every nationality, every language', 'كل الجنسيات وكل اللغات', 'We welcome children of all nationalities, including Emirati children, and value home languages.', 'نرحّب بأطفال جميع الجنسيات ومنهم الإماراتيون ونقدّر لغاتهم الأم.'],
        ['heart', 'Positive behaviour support', 'دعم السلوك الإيجابي', 'Praise, clear expectations and consistent routines. We guide rather than punish.', 'المديح والتوقعات الواضحة والروتين المتسق. نوجّه ولا نعاقب.'],
        ['message', 'Fair admissions', 'قبول عادل', 'Open, fair and clearly communicated procedures, with translated materials where needed.', 'إجراءات مفتوحة وعادلة وواضحة، مع مواد مترجمة عند الحاجة.'],
        ['shield', 'A voice for families', 'صوت للأسر', 'Parents are partners and are kept informed at every step.', 'الأهل شركاء ويُبقَون على اطلاع في كل خطوة.'],
      ]),
      faq('Inclusion: Questions Parents Ask', 'الدمج: أسئلة يطرحها الأهل', [
        ['Can my child with additional needs join Seven Oaks?', 'هل يمكن لطفلي من ذوي الاحتياجات الإضافية الالتحاق بسيفن أوكس؟', 'Children of determination are welcomed whenever we can provide appropriate support in partnership with the family and our specialists. Please contact us to talk about your child.', 'نرحّب بأصحاب الهمم متى استطعنا توفير الدعم المناسب بالشراكة مع الأسرة والمختصين. يرجى التواصل معنا للحديث عن طفلكم.'],
        ['How will I know how my child is doing?', 'كيف سأعرف كيف يسير طفلي؟', 'Parents are informed through meetings, reports and the Parents App.', 'يطّلع الأهل على التقدّم عبر الاجتماعات والتقارير وتطبيق أولياء الأمور.'],
      ]),
      cta('Talk to us about your child.', 'تحدثوا معنا عن طفلكم.'),
    ],
  },

  // ───────────────────────── PARENTS ─────────────────────────
  {
    key: 'parents', slug: 'parents', title: i('Parents', 'أولياء الأمور'),
    metaTitle: i('Parents | Hours, Policies & FAQs | Seven Oaks', 'أولياء الأمور | الدوام والسياسات | سيفن أوكس'),
    metaDescription: i('Everything parents need at Seven Oaks British Nursery: school hours, health and food policies, communication and answers to common questions.', 'كل ما يحتاجه أولياء الأمور في حضانة سيفن أوكس البريطانية: الدوام وسياسات الصحة والغذاء والتواصل وإجابات الأسئلة الشائعة.'),
    sections: [
      hero('Parents', 'أولياء الأمور', 'Parents are valued partners in their child’s learning journey.', 'أولياء الأمور شركاء مقدَّرون في رحلة تعلّم طفلهم.', 'p-sports-5', 'Parents and teachers enjoying the tug of war on family sports day', 'أولياء أمور ومعلمات يستمتعون بشدّ الحبل في اليوم الرياضي العائلي'),
      { type: 'link-list', config: { title: i('Quick Links', 'روابط سريعة'), button: btn('Contact Us', 'تواصل معنا', '/contact', 'outline'), items: [
        ['calendar', 'School hours & pick-up', 'ساعات الدوام والاستلام', '/parents/school-hours-and-pick-up'], ['clock', 'Daily schedule', 'الجدول اليومي', '/parents/daily-schedule'], ['file', 'Required documents', 'المستندات المطلوبة', '/parents/required-documents'], ['calendar', 'Attendance & absence', 'الحضور والغياب', '/parents/attendance-and-absence'],
        ['doctor', 'Health & wellbeing', 'الصحة والرفاه', '/parents/health-and-wellbeing'], ['utensils', 'Food & nutrition', 'الغذاء والتغذية', '/parents/food-and-nutrition'], ['shirt', 'Uniform & belongings', 'الزي والمتعلقات', '/parents/uniform-and-belongings'], ['moon', 'Nap & rest time', 'القيلولة والراحة', '/parents/nap-and-rest'],
        ['message', 'Staying in touch', 'التواصل', '/parents/parent-communication'], ['shield', 'Our policies', 'سياساتنا', '/parents/policies'], ['help', 'Frequently asked questions', 'الأسئلة الشائعة', '/parents/faqs'],
      ].map(([icon, en, ar, href]) => ({ icon, label: i(en, ar), href })) } },
      ti('Staying in Touch', 'ابقوا على تواصل', 'Open and transparent communication with every family.', 'تواصل مفتوح وشفاف مع كل أسرة.', [
        ['Parents receive photos, messages and reports through the Parents App, weekly newsletters that summarise classroom highlights and upcoming events, and a monthly calendar of key dates and activities.', 'يتلقى الأهل الصور والرسائل والتقارير عبر تطبيق أولياء الأمور، ونشرات أسبوعية تلخّص أبرز ما في الصفوف والفعاليات القادمة، وتقويماً شهرياً بالمواعيد والأنشطة المهمة.'],
        ['Parent-teacher meetings are held three times a year, or on request, and teachers and staff are available for enquiries during nursery hours.', 'تُعقد اجتماعات أولياء الأمور والمعلمات ثلاث مرات في السنة أو عند الطلب، والمعلمات والطاقم متاحون للاستفسارات خلال ساعات الدوام.'],
      ], 'p-day-mom-workshop', 'Parents and children enjoying a craft workshop', 'أولياء أمور وأطفال يستمتعون بورشة أعمال يدوية', { button: btn('Contact Us', 'تواصل معنا', '/contact') }),
      ti('Partnership with Parents', 'الشراكة مع الأهل', 'Family events and ways to get involved.', 'فعاليات عائلية وطرق للمشاركة.', [
        ['We strengthen partnership with parents through activities in the weekly plan to do at home, three official parents’ meetings each year, a Sports Day where parents are invited to take part, a school trip and a Ramadan Iftar that parents can join, and workshops at the nursery.', 'نعزّز الشراكة مع الأهل عبر أنشطة في الخطة الأسبوعية للقيام بها في المنزل، وثلاثة اجتماعات رسمية للأهل كل عام، ويوم رياضي يُدعى إليه الأهل للمشاركة، ورحلة مدرسية وإفطار رمضاني يمكن للأهل الانضمام إليه، وورش عمل في الحضانة.'],
      ], 'p-sports-4', 'Families gathering on the sports day field', 'أسر تجتمع في ميدان اليوم الرياضي', { reverse: true }),
      ti('Healthy Eating', 'التغذية الصحية', 'A nut-free, allergy-conscious campus.', 'حرم خالٍ من المكسرات ويراعي الحساسية.', [
        ['We promote healthy eating habits while keeping every child with a food allergy safe. Peanuts, tree nuts and nut-based products are not allowed. Parents tell us about allergies and dietary needs at enrolment, and we record them.', 'نشجّع العادات الغذائية الصحية مع الحفاظ على سلامة كل طفل لديه حساسية غذائية. لا يُسمح بالفول السوداني والمكسرات ومنتجاتها. يخبرنا الأهل بالحساسية والاحتياجات الغذائية عند التسجيل ونسجّلها.'],
      ], 'p-class-craft', 'A child colouring at a table', 'طفلة تلوّن على طاولة', { bullets: [['Fresh drinking water is always available', 'ماء الشرب العذب متوفر دائماً'], ['Children are encouraged to bring fruit every day', 'نشجّع الأطفال على إحضار الفاكهة كل يوم'], ['No sharing or swapping of food, to protect children with allergies', 'لا مشاركة للطعام ولا تبادله لحماية الأطفال المصابين بالحساسية']], button: btn('Food & nutrition', 'الغذاء والتغذية', '/parents/food-and-nutrition') }),
      faq('Frequently Asked Questions', 'الأسئلة الشائعة', [
        ['What ages do you accept?', 'ما الأعمار التي تقبلونها؟', 'Children from 18 months to 4 years, in the Toddler, Pre-Foundation and Preschool classes.', 'الأطفال من 18 شهراً إلى 4 سنوات في صفوف الدارجين وما قبل التأسيس وما قبل المدرسة.'],
        ['What are the nursery hours?', 'ما ساعات الدوام؟', 'Monday to Thursday: morning shift 8:00 am – 1:00 pm, afternoon shift 1:00 – 5:00 pm. Friday 8:00 am – 12:00 pm. Daycare 1:00 – 5:00 pm. Drop-off 8:00 – 8:30 am; pick-up 1:00 – 1:15 pm.', 'الاثنين إلى الخميس: الفترة الصباحية 8:00 ص – 1:00 م والمسائية 1:00 – 5:00 م. الجمعة 8:00 ص – 12:00 م. الرعاية النهارية 1:00 – 5:00 م. الوصول 8:00 – 8:30 ص والاستلام 1:00 – 1:15 م.'],
        ['What should my child bring each day?', 'ماذا يحضر طفلي كل يوم؟', 'See [Uniform & belongings](/parents/uniform-and-belongings). A backpack, a labelled reusable water bottle, a nut-free lunch box and snacks, a labelled spare set of clothes, and nap items (a small blanket) if staying for the extended day.', 'حقيبة ظهر وزجاجة ماء قابلة لإعادة الاستخدام عليها اسم الطفل ووجبة خالية من المكسرات ومعها وجبات خفيفة ومجموعة ملابس بديلة عليها اسم الطفل، وأغراض القيلولة (بطانية صغيرة) عند البقاء في اليوم الممتد.'],
        ['When should my child stay at home?', 'متى يبقى طفلي في المنزل؟', 'If your child has a fever of 37.5°C or higher (fever-free for 24 hours without medication before returning), vomiting or diarrhoea in the past 24 hours, an unexplained rash, pink eye or a contagious illness, a persistent cough or flu-like symptoms, or head lice.', 'إذا كانت حرارته 37.5 درجة مئوية أو أعلى (ويجب أن يخلو من الحرارة 24 ساعة دون أدوية قبل العودة)، أو تقيّأ أو أصيب بإسهال خلال 24 ساعة، أو ظهر طفح غير مفسَّر أو التهاب في العين أو مرض معدٍ، أو سعال مستمر أو أعراض شبيهة بالإنفلونزا، أو قمل الرأس.'],
        ['Who can collect my child?', 'من يستطيع استلام طفلي؟', 'Only authorised guardians listed on the emergency contact form. A pick-up code is sent monthly. See [School hours & pick-up](/parents/school-hours-and-pick-up).', 'فقط الأوصياء المخوَّلون المسجّلون في نموذج الطوارئ. ويُرسل رمز الاستلام شهرياً.'],
      ]),
      cta('Have a question we have not answered?', 'لديكم سؤال لم نجب عليه؟'),
    ],
  },

  // ───────────────────────── GALLERY ─────────────────────────
  {
    key: 'gallery', slug: 'gallery', title: i('Gallery', 'المعرض'),
    metaTitle: i('Gallery | Life at Seven Oaks British Nursery', 'المعرض | الحياة في حضانة سيفن أوكس البريطانية'),
    metaDescription: i('Photos from Seven Oaks British Nursery in Sharjah: graduation, sports day, animal visits, UAE National Day, classroom learning and celebrations.', 'صور من حضانة سيفن أوكس البريطانية في الشارقة: التخرج واليوم الرياضي وزيارات الحيوانات واليوم الوطني والتعلّم في الصفوف والاحتفالات.'),
    sections: [
      hero('Gallery', 'المعرض', 'Life at Seven Oaks: play, learning, celebration and joy.', 'الحياة في سيفن أوكس: لعب وتعلّم واحتفال وفرح.', 'p-grad-2', 'Children performing on the graduation stage', 'أطفال يؤدّون عرضاً على منصة التخرج'),
      { type: 'entry-list', config: { title: i('Our Galleries', 'معارضنا'), subtitle: i('Choose a gallery to see more photos.', 'اختاروا معرضاً لمشاهدة المزيد من الصور.'), kind: 'GALLERY', group: '', limit: 24, columns: '3', animation: 'rise', showCategories: true, button: { label: i('', ''), href: '', variant: 'primary' } } },
      cta(),
    ],
  },

  // ───────────────────────── ADMISSIONS ─────────────────────────
  {
    key: 'admissions', slug: 'admissions', title: i('Admissions', 'التسجيل'),
    metaTitle: i('Admissions | Seven Oaks British Nursery', 'التسجيل | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('How to join Seven Oaks British Nursery: admissions hours, required documents and how to book a tour.', 'كيف تنضمون إلى حضانة سيفن أوكس البريطانية: ساعات التسجيل والمستندات المطلوبة وكيفية حجز زيارة.'),
    sections: [
      hero('Admissions', 'التسجيل', 'Your child’s Seven Oaks journey starts here.', 'رحلة طفلكم في سيفن أوكس تبدأ هنا.', 'p-entrance', 'The entrance of Seven Oaks British Nursery', 'مدخل حضانة سيفن أوكس البريطانية', [btn('Book a Tour', 'احجز زيارة', '/contact', 'light')]),
      features('What to expect', 'ما الذي تتوقعونه', [
        ['calendar', 'Admissions on Sundays', 'التسجيل أيام الأحد', 'Visit us on Sunday between 10:00 am and 2:00 pm to ask questions and complete your application.', 'زورونا يوم الأحد بين 10:00 صباحاً و2:00 ظهراً لطرح أسئلتكم وإتمام الطلب.'],
        ['users', 'Open and fair', 'مفتوح وعادل', 'Our waiting list follows birth order, first come first served, and may take siblings already at the nursery into account.', 'قائمة الانتظار لدينا حسب تاريخ الميلاد وبأسبقية الحضور، وقد تراعي الإخوة الملتحقين بالحضانة.'],
        ['heart', 'A warm welcome', 'استقبال دافئ', 'Meet our team, see the classrooms and ask anything you like. Tours are friendly and there is no obligation.', 'تعرّفوا على فريقنا وشاهدوا الصفوف واسألوا عما تشاؤون. الزيارات ودّية ودون أي التزام.'],
        ['message', 'Help in your language', 'مساعدة بلغتكم', 'We provide translated written materials and access to an interpreter where families need them.', 'نوفّر مواد مكتوبة مترجمة والاستعانة بمترجم عند حاجة الأسر.'],
      ]),
      steps('How to Join', 'كيف تنضمون', 'Four simple steps.', 'أربع خطوات بسيطة.', [
        ['Enquire & visit', 'استفسروا وزوروا', 'Send the form below, call us or visit on Sunday (10:00 am – 2:00 pm).', 'أرسلوا النموذج أدناه أو اتصلوا بنا أو زورونا يوم الأحد (10:00 ص – 2:00 م).'],
        ['Complete the enrolment form', 'عبّئوا نموذج التسجيل', 'Fill in the enrolment form and submit all required documents.', 'عبّئوا نموذج التسجيل وقدّموا جميع المستندات المطلوبة.'],
        ['Submit the documents', 'قدّموا المستندات', 'Bring the documents listed below to the admissions office.', 'أحضروا المستندات المذكورة أدناه إلى مكتب القبول.'],
        ['Receive your start date', 'استلموا موعد البدء', 'Your child’s start date is given once your registration is complete.', 'يُحدَّد موعد بدء طفلكم عند اكتمال التسجيل.'],
      ]),
      { type: 'table', config: { title: i('Documents you will need', 'المستندات المطلوبة'), subtitle: i('Please fill in the enrolment form and bring all of these.', 'يرجى تعبئة نموذج التسجيل وإحضار جميع هذه المستندات.'), header: i('Document | Who', 'المستند | لمن'), rows: i('Passport-size photos (3, recent) | Child\nBirth certificate | Child\nVaccination booklet | Child\nPassport copies | Father, mother and child\nEmirates ID copies | Father, mother and child', 'صور شخصية (3 حديثة) | الطفل\nشهادة الميلاد | الطفل\nدفتر التطعيمات | الطفل\nنسخ جوازات السفر | الأب والأم والطفل\nنسخ الهوية الإماراتية | الأب والأم والطفل'), style: 'striped', note: i('', '') } },
      faq('Admissions FAQs', 'أسئلة شائعة عن التسجيل', [
        ['When can I visit to register?', 'متى يمكنني الزيارة للتسجيل؟', 'Admissions are on Sundays from 10:00 am to 2:00 pm. You can also call or send an enquiry any time.', 'التسجيل أيام الأحد من 10:00 صباحاً حتى 2:00 ظهراً. ويمكنكم الاتصال أو إرسال استفسار في أي وقت.'],
        ['When can my child start?', 'متى يمكن لطفلي أن يبدأ؟', 'A start date is given once your registration is complete.', 'يُحدَّد موعد البدء عند اكتمال التسجيل.'],
        ['What if I need to cancel or withdraw?', 'ماذا لو أردت الإلغاء أو سحب طفلي؟', 'Written notice is required. Please read [Withdrawing a child](/parents/withdrawing-a-child) and ask the office about the notice period in your enrolment documents.', 'يلزم إشعار كتابي. يرجى قراءة [سحب الطفل من الحضانة](/parents/withdrawing-a-child) وسؤال المكتب عن مدة الإشعار في مستندات التسجيل.'],
        ['Do you support children with additional needs?', 'هل تدعمون الأطفال من ذوي الاحتياجات الإضافية؟', 'Children of determination are welcomed whenever appropriate support can be provided. Please read our [Inclusion page](/inclusion) and talk to us.', 'نرحّب بأصحاب الهمم متى أمكن توفير الدعم المناسب. يرجى قراءة [صفحة الدمج](/inclusion) والتحدث معنا.'],
        ['How is my family’s information used?', 'كيف تُستخدم معلومات عائلتي؟', 'Only to answer your enquiry and manage admissions. Please read our [Privacy Policy](/privacy-policy) for details.', 'فقط للرد على استفساركم وإدارة التسجيل. يرجى قراءة [سياسة الخصوصية](/privacy-policy) لمزيد من التفاصيل.'],
      ]),
      { type: 'enquiry-form', config: { title: i('Book a tour or ask a question', 'احجزوا زيارة أو اطرحوا سؤالاً'), text: i('Tell us a little about your family and we will get back to you personally.', 'أخبرونا قليلاً عن عائلتكم وسنرد عليكم شخصياً.'), showMap: true } },
      cta('Ready to take the first step?', 'هل أنتم مستعدون للخطوة الأولى؟'),
    ],
  },

  // ───────────────────────── CONTACT ─────────────────────────
  {
    key: 'contact', slug: 'contact', title: i('Contact', 'تواصل معنا'),
    metaTitle: i('Contact Seven Oaks British Nursery | Al Khalidiyah, Sharjah', 'تواصل مع حضانة سيفن أوكس البريطانية | الخالدية، الشارقة'),
    metaDescription: i('Contact Seven Oaks British Nursery in Al Khalidiyah, Al Khan, Sharjah: phone numbers, email, opening hours and directions.', 'تواصلوا مع حضانة سيفن أوكس البريطانية في الخالدية بالخان في الشارقة: أرقام الهاتف والبريد وساعات الدوام والاتجاهات.'),
    sections: [
      hero('Contact Us', 'تواصل معنا', 'We would love to hear from you.', 'يسعدنا سماعكم.', 'p-stage-wide', 'Seven Oaks children on the graduation stage', 'أطفال سيفن أوكس على منصة التخرج'),
      { type: 'contact', config: { title: i('Get in Touch', 'تواصلوا معنا'), text: i('Call, message or visit us in Al Khalidiyah, Al Khan, Sharjah.', 'اتصلوا أو راسلونا أو زورونا في الخالدية بالخان في الشارقة.'), showHours: true, showMap: true } },
      rich('Phone numbers', 'أرقام الهاتف', [['You can reach the nursery on any of these numbers during nursery hours:', 'يمكنكم الوصول إلى الحضانة عبر أي من هذه الأرقام خلال ساعات الدوام:']], [
        ['Nursery: +971 6 579 6955', 'الحضانة: ‎+971 6 579 6955'], ['Mobile: +971 54 711 0101', 'الجوال: ‎+971 54 711 0101'], ['Mobile: +971 50 189 3295', 'الجوال: ‎+971 50 189 3295'], ['Email: donna.7oaks@gmail.com', 'البريد: donna.7oaks@gmail.com'],
      ]),
      { type: 'enquiry-form', config: { title: i('Book a visit or ask a question', 'احجزوا زيارة أو اطرحوا سؤالاً'), text: i('Tell us a little about your family and we will get back to you personally.', 'أخبرونا قليلاً عن عائلتكم وسنرد عليكم شخصياً.'), showMap: true } },
      faq('Before You Visit', 'قبل زيارتكم', [
        ['When can I visit?', 'متى يمكنني الزيارة؟', 'Admissions are on Sundays from 10:00 am to 2:00 pm. Please call or message us to confirm a time.', 'التسجيل أيام الأحد من 10:00 صباحاً حتى 2:00 ظهراً. يرجى الاتصال بنا أو مراسلتنا لتأكيد الموعد.'],
        ['Where are you?', 'أين تقعون؟', 'In Al Khalidiyah, Al Khan, Sharjah. Use the map above for directions.', 'في الخالدية بالخان في الشارقة. استخدموا الخريطة أعلاه للاتجاهات.'],
      ]),
    ],
  },

  // ───────────────────────── TESTIMONIALS ─────────────────────────
  {
    key: 'testimonials', slug: 'testimonials', title: i('Parent Reviews', 'آراء أولياء الأمور'),
    metaTitle: i('Parent Reviews | Seven Oaks British Nursery', 'آراء أولياء الأمور | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('What families say about Seven Oaks British Nursery in Sharjah.', 'ماذا تقول العائلات عن حضانة سيفن أوكس البريطانية في الشارقة.'),
    sections: [
      hero('Parent Reviews', 'آراء أولياء الأمور', 'What our families say.', 'ماذا تقول عائلاتنا.', 'p-grad-4', 'Children in graduation gowns', 'أطفال بأثواب التخرج'),
      { type: 'testimonials', config: { title: i('Kind Words From Families', 'كلمات طيبة من العائلات'), source: 'managed', place: 'testimonials', layout: 'grid', limit: 30, link: { label: i('', ''), href: '', variant: 'outline' }, items: [] } },
      cta(),
    ],
  },
  ...legalPages,
];

/** Search keywords per page (English, Arabic). Editable in Admin → Pages → Search appearance. */
export const keywords: Record<string, [string, string]> = {
  home: ['nursery in Sharjah, British nursery, EYFS, preschool Sharjah, early years education, bilingual nursery', 'حضانة في الشارقة, حضانة بريطانية, منهج EYFS, روضة الشارقة, تعليم الطفولة المبكرة, حضانة ثنائية اللغة'],
  'about-us': ['about Seven Oaks British Nursery, nursery vision, nursery team Sharjah', 'عن حضانة سيفن أوكس البريطانية, رؤية الحضانة, فريق الحضانة الشارقة'],
  'our-nursery': ['nursery facilities Sharjah, outdoor play, nursery classrooms, mud garden', 'مرافق الحضانة الشارقة, اللعب في الهواء الطلق, فصول الحضانة, حديقة الطين'],
  learning: ['EYFS curriculum, learning through play, early years learning areas', 'منهج EYFS, التعلم من خلال اللعب, مجالات التعلم في الطفولة المبكرة'],
  classes: ['baby nursery Sharjah, toddler class, nursery class, FS1, FS2, foundation stage', 'حضانة أطفال الشارقة, صف الدارجين, صف الحضانة, FS1, FS2, المرحلة التأسيسية'],
  inclusion: ['inclusive nursery, special educational needs nursery, SEN support Sharjah', 'حضانة دامجة, احتياجات تعليمية خاصة, دعم ذوي الهمم الشارقة'],
  parents: ['nursery parents information, nursery calendar, parent handbook, nursery policies', 'معلومات أولياء الأمور, تقويم الحضانة, دليل أولياء الأمور, سياسات الحضانة'],
  gallery: ['nursery photo gallery, nursery activities, sports day, story time', 'معرض صور الحضانة, أنشطة الحضانة, اليوم الرياضي, وقت القصة'],
  admissions: ['nursery admissions Sharjah, register child nursery, book nursery tour', 'تسجيل الحضانة الشارقة, تسجيل طفل, حجز زيارة الحضانة'],
  contact: ['contact Seven Oaks British Nursery, nursery location Sharjah, nursery phone, directions', 'تواصل مع حضانة سيفن أوكس البريطانية, موقع الحضانة الشارقة, هاتف الحضانة, الاتجاهات'],
  testimonials: ['nursery parent reviews, nursery testimonials Sharjah', 'آراء أولياء الأمور, تقييمات الحضانة الشارقة'],
  'privacy-policy': ['nursery privacy policy, data protection', 'سياسة الخصوصية, حماية البيانات'],
  'cookie-policy': ['cookie policy', 'سياسة ملفات تعريف الارتباط'],
  'terms-and-conditions': ['terms and conditions', 'الشروط والأحكام'],
  'data-protection': ['data protection policy', 'سياسة حماية البيانات'],
  'data-retention': ['data retention policy', 'سياسة الاحتفاظ بالبيانات'],
};

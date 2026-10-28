// Starter DETAIL pages (the pages that open from the Parents page and the policies). DATA, not code: after the first seed every word,
// photo, table and block is edited in Admin → Detail pages. Each page is a stack of designed blocks, the same blocks used on normal pages.
// Wording comes from the nursery's Parent Handbook and Nursery Policies; Arabic is a first draft and needs a native review.
// No fees or prices are shown anywhere on the website.
import { btn, i, im } from './content';

export type DetailSeed = {
  slug: string; group: string; title: { en: string; ar: string }; summary: { en: string; ar: string }; intro: { en: string; ar: string };
  cover: string; style?: 'split' | 'banner' | 'simple'; badge?: [string, string]; blocks: { type: string; config: any; isVisible: boolean }[];
  links?: [string, string, string][]; related?: string[];
};

const B = (type: string, config: any) => ({ type, config, isVisible: true });
const E = i('', '');
type Row = string[];
/** Table block: header and rows per language. Cells are separated by | and rows by new lines (editable that way in the admin). */
const table = (te: string, ta: string, he: Row, ha: Row, re: Row[], ra: Row[], style: 'striped' | 'plain' | 'cards' = 'striped', note: [string, string] = ['', '']) =>
  B('table', { title: i(te, ta), subtitle: E, header: i(he.join(' | '), ha.join(' | ')), rows: i(re.map((r) => r.join(' | ')).join('\n'), ra.map((r) => r.join(' | ')).join('\n')), style, note: i(note[0], note[1]) });
const callout = (tone: 'info' | 'tip' | 'warning' | 'celebrate', icon: string, te: string, ta: string, xe: string, xa: string, button?: any) =>
  B('callout', { tone, icon, title: i(te, ta), text: i(xe, xa), button: button ?? { label: E, href: '', variant: 'primary' } });
/** Feature grid; an item with a photo name shows the real photo instead of the icon. */
const feats = (te: string, ta: string, items: [string, string, string, string, string, string][]) =>
  B('feature-grid', { title: i(te, ta), items: items.map(([icon, photo, tE, tA, xE, xA]) => ({ icon, image: photo ? im(photo, tE, tA) : { url: '', alt: E }, title: i(tE, tA), text: i(xE, xA) })) });
const stepsB = (te: string, ta: string, se: string, sa: string, items: [string, string, string, string, string][]) =>
  B('steps', { title: i(te, ta), subtitle: i(se, sa), items: items.map(([photo, tE, tA, xE, xA]) => ({ image: photo ? im(photo, tE, tA) : { url: '', alt: E }, title: i(tE, tA), text: i(xE, xA) })) });
const rich = (te: string, ta: string, paras: [string, string][], bullets: [string, string][] = []) =>
  B('rich-text', { title: i(te, ta), subtitle: E, paragraphs: paras.map(([a, b]) => i(a, b)), bullets: bullets.map(([a, b]) => i(a, b)) });
const faqB = (te: string, ta: string, items: [string, string, string, string, string?, string?, string?][]) =>
  B('faq', { title: i(te, ta), subtitle: E, items: items.map(([qe, qa, ae, aa, le, la, href]) => ({ q: i(qe, qa), a: i(ae, aa), link: le && href ? { label: i(le, la ?? le), href, variant: 'primary' } : { label: E, href: '', variant: 'primary' } })) });
const ti = (te: string, ta: string, xe: string, xa: string, photo: string, alt: [string, string], reverse = false, bullets: [string, string][] = []) =>
  B('text-image', { title: i(te, ta), subtitle: E, paragraphs: [i(xe, xa)], bullets: bullets.map(([a, b]) => i(a, b)), button: { label: E, href: '', variant: 'primary' }, image: im(photo, alt[0], alt[1]), imageQuote: E, imagePosition: reverse ? 'left' : 'right' });
const list = (te: string, ta: string, group: string) => B('entry-list', { kind: 'DETAIL', group, limit: 24, title: i(te, ta), subtitle: E, columns: 3 });

const PARENT_LABEL = i('', '');
const D = (slug: string, group: string, title: [string, string], summary: [string, string], intro: [string, string], cover: string, blocks: any[], o: Partial<DetailSeed> = {}): DetailSeed =>
  ({ slug, group, title: i(...title), summary: i(...summary), intro: i(...intro), cover, blocks, ...o });
void PARENT_LABEL; void btn;

// ───────────────────────── Parents: everyday information ─────────────────────────
const parentPages: DetailSeed[] = [
  D('school-hours-and-pick-up', 'parents', ['School hours & pick-up', 'ساعات الدوام والاستلام'], ['Opening hours, drop-off and pick-up.', 'ساعات الدوام والوصول والاستلام.'],
    ['Everything you need to know about the nursery day, from the morning welcome to safe collection.', 'كل ما تحتاجون معرفته عن يوم الحضانة، من استقبال الصباح حتى الاستلام الآمن.'], 'p-entrance', [
      table('Nursery time', 'أوقات الحضانة', ['Programme', 'Days', 'Time'], ['البرنامج', 'الأيام', 'الوقت'], [
        ['Morning shift', 'Monday – Thursday', '8:00 am – 1:00 pm'], ['Afternoon shift', 'Monday – Thursday', '1:00 pm – 5:00 pm'], ['Friday', 'Friday', '8:00 am – 12:00 pm'],
        ['Daycare', 'Monday – Thursday', '1:00 pm – 5:00 pm'], ['Admissions office', 'Sunday', '10:00 am – 2:00 pm'],
      ], [
        ['الفترة الصباحية', 'الاثنين – الخميس', '8:00 ص – 1:00 م'], ['الفترة المسائية', 'الاثنين – الخميس', '1:00 م – 5:00 م'], ['يوم الجمعة', 'الجمعة', '8:00 ص – 12:00 م'],
        ['الرعاية النهارية', 'الاثنين – الخميس', '1:00 م – 5:00 م'], ['مكتب القبول', 'الأحد', '10:00 ص – 2:00 م'],
      ], 'striped', ['Times can change during holidays and special events. We will always tell you through the Parents App.', 'قد تتغير الأوقات خلال العطلات والفعاليات الخاصة، وسنُعلمكم دائماً عبر تطبيق أولياء الأمور.']),
      feats('A happy start and a safe finish', 'بداية سعيدة ونهاية آمنة', [
        ['sun', 'p-smile', 'Morning drop-off', 'وصول الصباح', 'Drop-off is 8:00 – 8:30 am. Please arrive on time so your child can join free play with friends.', 'الوصول من 8:00 إلى 8:30 صباحاً. يرجى الحضور في الوقت ليشارك طفلكم أصدقاءه في اللعب الحر.'],
        ['heart', 'p-entrance', 'A warm welcome', 'استقبال دافئ', 'A parent or authorised person brings the child to reception, where a teacher greets them.', 'يرافق أحد الوالدين أو شخص مخوّل الطفل إلى الاستقبال حيث تستقبله المعلمة.'],
        ['doctor', 'p-class-helpers', 'Quick health check', 'فحص صحي سريع', 'We check each child on arrival. If there is a high temperature or signs of infection, we cannot accept the child that day.', 'نفحص كل طفل عند الوصول. وعند ارتفاع الحرارة أو ظهور علامات عدوى لا يمكننا استقبال الطفل في ذلك اليوم.'],
        ['clock', 'p-class-toys', 'Afternoon pick-up', 'استلام فترة الظهيرة', 'Afternoon pick-up is 1:00 – 1:15 pm. Please speak to the office if you may be late.', 'الاستلام من 1:00 إلى 1:15 ظهراً. يرجى إبلاغ المكتب إن كنتم ستتأخرون.'],
        ['shield', 'p-day-mother', 'Authorised people only', 'المخوّلون فقط', 'Only people listed on the emergency contact form may collect your child. A pick-up code is sent every month.', 'لا يستلم الطفل إلا الأشخاص المسجلون في نموذج الاتصال للطوارئ، ويُرسل رمز استلام كل شهر.'],
        ['bell', 'p-class-numbers', 'If a child is not collected', 'إذا لم يُستلم الطفل', 'We keep your child safe and warm, try every contact on the form, and inform the relevant authorities if we cannot reach anyone.', 'نُبقي طفلكم بأمان ونحاول الاتصال بكل الأرقام المسجلة، ونُبلغ الجهات المعنية إن تعذّر الوصول لأي أحد.'],
      ]),
      callout('tip', 'bell', 'Tip for busy mornings', 'نصيحة للصباحات المزدحمة', 'Pack the bag the night before and label everything with your child’s name. A calm start helps children settle quickly.', 'جهّزوا الحقيبة في المساء وضعوا اسم طفلكم على كل شيء. البداية الهادئة تساعد الأطفال على الاندماج بسرعة.'),
    ], { style: 'banner', badge: ['For parents', 'لأولياء الأمور'], related: ['daily-schedule', 'attendance-and-absence'] }),

  D('daily-schedule', 'parents', ['Daily schedule', 'الجدول اليومي'], ['A day at Seven Oaks, hour by hour.', 'يوم في سيفن أوكس، ساعة بساعة.'],
    ['Children love a predictable rhythm. Here is how the day flows, with time to play, learn, eat and rest.', 'يحب الأطفال الإيقاع المتوقع. إليكم كيف يسير اليوم بين اللعب والتعلّم والطعام والراحة.'], 'p-class-roleplay', [
      table('Morning shift', 'الفترة الصباحية', ['Time', 'What we do'], ['الوقت', 'ما نفعله'], [
        ['8:00 – 8:30', 'Arrival and free play, UAE National Anthem'], ['8:30 – 9:15', 'Breakfast'], ['9:15 – 9:45', 'Circle time'], ['9:45 – 10:30', 'Focus activity'], ['10:30 – 11:15', 'Arabic'],
        ['11:15 – 11:45', 'Lunch'], ['11:45 – 12:15', 'Role play / interactive room'], ['12:15 – 12:45', 'Jungle gym / sand room'], ['12:45 – 1:00', 'Story time, music and drama'],
      ], [
        ['8:00 – 8:30', 'الوصول واللعب الحر والنشيد الوطني'], ['8:30 – 9:15', 'الإفطار'], ['9:15 – 9:45', 'وقت الحلقة'], ['9:45 – 10:30', 'نشاط التركيز'], ['10:30 – 11:15', 'اللغة العربية'],
        ['11:15 – 11:45', 'الغداء'], ['11:45 – 12:15', 'لعب الأدوار / غرفة التفاعل'], ['12:15 – 12:45', 'صالة الجنغل / غرفة الرمل'], ['12:45 – 1:00', 'وقت القصة والموسيقى والدراما'],
      ]),
      feats('Our favourite parts of the day', 'أجمل لحظات يومنا', [
        ['users', 'p-class-roleplay', 'Role play', 'لعب الأدوار', 'Doctors, shopkeepers, chefs: children try on new roles and practise talking together.', 'أطباء وبائعون وطهاة: يجرّب الأطفال أدواراً جديدة ويتدرّبون على الحوار.'],
        ['activity', 'p-jungle', 'Jungle gym', 'صالة الجنغل', 'Climbing, balancing and sliding build strong bodies and big confidence.', 'التسلق والتوازن والانزلاق تبني أجساماً قوية وثقة كبيرة.'],
        ['sun', 'p-sand', 'Sand room', 'غرفة الرمل', 'Digging, pouring and building: sensory play that grows little scientists.', 'حفر وسكب وبناء: لعب حسّي ينمّي العلماء الصغار.'],
        ['book', 'p-class-numbers', 'Focus activity', 'نشاط التركيز', 'Short, hands-on tasks with letters, numbers and shapes, matched to each child.', 'مهام قصيرة عملية بالحروف والأرقام والأشكال تناسب كل طفل.'],
      ]),
      table('Daycare (1:00 – 5:00 pm)', 'الرعاية النهارية (1:00 – 5:00 م)', ['Time', 'What we do'], ['الوقت', 'ما نفعله'], [
        ['1:00 – 1:30', 'Story time, music and drama'], ['1:30 – 2:00', 'Free play / library'], ['2:00 – 3:00', 'Snack time'], ['3:00 – 3:30', 'Sleeping, quiet rest'], ['3:30 – 4:00', 'Play outside / role play'], ['4:00 – 5:00', 'Jungle gym / interactive room'],
      ], [
        ['1:00 – 1:30', 'وقت القصة والموسيقى والدراما'], ['1:30 – 2:00', 'لعب حر / المكتبة'], ['2:00 – 3:00', 'وقت الوجبة الخفيفة'], ['3:00 – 3:30', 'النوم والراحة الهادئة'], ['3:30 – 4:00', 'اللعب في الخارج / لعب الأدوار'], ['4:00 – 5:00', 'صالة الجنغل / غرفة التفاعل'],
      ], 'plain'),
      callout('info', 'info', 'Afternoon shift', 'الفترة المسائية', 'The afternoon shift (1:00 – 5:00 pm) follows a similar rhythm: arrival and free play, Arabic, circle time, a focus activity, lunch, role play, jungle gym or sand room, and story time.', 'تسير الفترة المسائية (1:00 – 5:00 م) على إيقاع مشابه: وصول ولعب حر، عربي، حلقة، نشاط تركيز، غداء، لعب أدوار، صالة الجنغل أو غرفة الرمل، ثم وقت القصة.'),
    ], { badge: ['A day with us', 'يوم معنا'], related: ['school-hours-and-pick-up', 'nap-and-rest'] }),

  D('required-documents', 'parents', ['Required documents', 'المستندات المطلوبة'], ['What to bring when you register.', 'ما تحضرونه عند التسجيل.'],
    ['Registering is simple. Please bring these documents to the admissions office on a Sunday between 10:00 am and 2:00 pm.', 'التسجيل بسيط. يرجى إحضار هذه المستندات إلى مكتب القبول يوم الأحد بين 10:00 صباحاً و2:00 ظهراً.'], 'p-entrance', [
      feats('Your registration checklist', 'قائمة التسجيل', [
        ['camera', 'p-smile', '3 passport-size photos', '3 صور شخصية', 'Recent photos of your child.', 'صور حديثة لطفلكم.'],
        ['file', '', 'Birth certificate', 'شهادة الميلاد', 'A copy of your child’s birth certificate.', 'نسخة من شهادة ميلاد طفلكم.'],
        ['doctor', '', 'Vaccination booklet', 'كتيّب التطعيمات', 'A current record is required at enrolment.', 'يلزم سجل تطعيمات محدّث عند التسجيل.'],
        ['user', '', 'Passport copies', 'نسخ جوازات السفر', 'Father, mother and child.', 'الأب والأم والطفل.'],
        ['file', '', 'Emirates ID copies', 'نسخ الهويات الإماراتية', 'Father, mother and child.', 'الأب والأم والطفل.'],
        ['pencil', '', 'Enrolment form', 'استمارة التسجيل', 'Filled in and signed by a parent.', 'تُعبّأ وتُوقّع من أحد الوالدين.'],
      ]),
      callout('celebrate', 'party', 'What happens next', 'ماذا بعد؟', 'Once your registration is complete, the nursery gives you a start date for your child and a warm welcome from the team.', 'عند اكتمال التسجيل تُحدَّد لطفلكم تاريخ البدء ويستقبلكم الفريق بحفاوة.', btn('Book a tour', 'احجزوا زيارة', '/admissions', 'primary')),
    ], { style: 'simple', badge: ['Admissions', 'القبول'], related: ['school-hours-and-pick-up', 'faqs'] }),

  D('attendance-and-absence', 'parents', ['Attendance & absence', 'الحضور والغياب'], ['Why attendance matters and what to do if your child is absent.', 'أهمية الحضور وما يجب فعله عند غياب الطفل.'],
    ['Regular attendance builds friendships, routine and confidence. Here is what to do when your child cannot come.', 'الحضور المنتظم يبني الصداقات والروتين والثقة. إليكم ما يجب فعله إذا تعذّر حضور طفلكم.'], 'p-class-toys', [
      stepsB('If your child is absent', 'إذا غاب طفلكم', 'Three simple steps.', 'ثلاث خطوات بسيطة.', [
        ['p-class-helpers', 'Tell us on day one', 'أخبرونا في اليوم الأول', 'Please call or message the reason for the absence on the first day, as early as you can.', 'يرجى الاتصال أو إرسال سبب الغياب في اليوم الأول وبأسرع وقت.'],
        ['p-class-paint', 'We check in on day two', 'نتواصل في اليوم الثاني', 'If we have not heard from you, a member of staff will phone you on the second day.', 'إن لم نسمع منكم سيتصل بكم أحد الموظفين في اليوم الثاني.'],
        ['p-class-craft', 'We follow up', 'نتابع', 'Repeated single-day absences are followed up by phone or letter, and any absence of more than three weeks is monitored.', 'نتابع الغيابات المتكررة بالهاتف أو بخطاب، ونراقب أي غياب يتجاوز ثلاثة أسابيع.'],
      ]),
      callout('info', 'calendar', 'Planning a family holiday?', 'تخططون لعطلة عائلية؟', 'We encourage family vacations during nursery holidays. If that is not possible, please tell the office the dates one month ahead. No discount is given for vacation or absence.', 'نشجّع على السفر خلال عطلات الحضانة. وإن لم يكن ذلك ممكناً فيرجى إبلاغ المكتب بالتواريخ قبل شهر. لا يُمنح خصم عن الإجازات أو الغياب.'),
    ], { related: ['health-and-wellbeing', 'school-hours-and-pick-up'] }),

  D('health-and-wellbeing', 'parents', ['Health & wellbeing', 'الصحة والرفاه'], ['Illness, medication, allergies and hygiene.', 'المرض والأدوية والحساسية والنظافة.'],
    ['A healthy child is a happy learner. These simple rules keep every child at Seven Oaks safe and well.', 'الطفل السليم متعلّم سعيد. هذه القواعد البسيطة تُبقي كل طفل في سيفن أوكس آمناً وبصحة جيدة.'], 'p-class-craft', [
      table('When to keep your child at home', 'متى يبقى طفلكم في المنزل', ['Symptom', 'What to do'], ['العَرَض', 'ما العمل'], [
        ['Fever of 37.5°C or higher', 'Stay home until fever-free for 24 hours without medication'], ['Vomiting or diarrhoea in the past 24 hours', 'Stay home until symptom-free for 24 hours'], ['Unexplained rash, pink eye or a contagious illness', 'Stay home until a doctor says it is safe to return'],
        ['Persistent cough, difficulty breathing or flu-like symptoms', 'Stay home and tell us as soon as possible'], ['Head lice', 'Treat before coming back'],
      ], [
        ['حرارة 37.5 درجة أو أكثر', 'البقاء في المنزل حتى انخفاض الحرارة 24 ساعة دون أدوية'], ['قيء أو إسهال خلال آخر 24 ساعة', 'البقاء في المنزل حتى زوال الأعراض 24 ساعة'], ['طفح غير مفسَّر أو التهاب العين أو مرض معدٍ', 'البقاء في المنزل حتى يسمح الطبيب بالعودة'],
        ['سعال مستمر أو صعوبة تنفس أو أعراض إنفلونزا', 'البقاء في المنزل وإبلاغنا بأسرع وقت'], ['قمل الرأس', 'العلاج قبل العودة'],
      ], 'striped', ['A current vaccination record is required at enrolment.', 'يلزم سجل تطعيمات محدّث عند التسجيل.']),
      feats('How we look after your child', 'كيف نعتني بطفلكم', [
        ['doctor', 'p-class-helpers', 'Medication', 'الأدوية', 'Prescription medicine needs a doctor’s authorisation form, the original packaging and a hand-over to a member of staff or the nurse. The first dose of any antibiotic should be given at home.', 'الأدوية الموصوفة تحتاج نموذج تفويض من الطبيب وعبوة أصلية وتسليماً مباشراً للموظفة أو الممرضة. وتُعطى الجرعة الأولى من المضاد الحيوي في المنزل.'],
        ['apple', 'p-class-cotton', 'Allergies', 'الحساسية', 'Seven Oaks is a 100% nut-free campus. Tell us about any allergy at enrolment. Parents provide EpiPens or inhalers if needed, and we create an Allergy Action Plan together.', 'سيفن أوكس بيئة خالية من المكسرات بالكامل. أخبرونا بأي حساسية عند التسجيل. يوفّر الأهل أقلام الإبينفرين أو البخاخات عند الحاجة ونضع معاً خطة للتعامل مع الحساسية.'],
        ['water', 'p-class-paint', 'Clean hands, clean spaces', 'أيدٍ نظيفة وأماكن نظيفة', 'Children wash hands on arrival, before eating, after the toilet and after messy play. Toys, tables and handles are disinfected daily with child-safe cleaners.', 'يغسل الأطفال أيديهم عند الوصول وقبل الأكل وبعد الحمّام وبعد اللعب المتسخ. وتُعقَّم الألعاب والطاولات والمقابض يومياً بمنظفات آمنة للأطفال.'],
        ['heart', 'p-softplay', 'If your child feels unwell', 'إذا شعر طفلكم بتوعك', 'A child who becomes unwell during the day rests in a separate area with a caring adult while we contact you straight away.', 'يرتاح الطفل الذي يتوعك أثناء اليوم في مكان منفصل مع شخص راشد يرعاه بينما نتصل بكم فوراً.'],
      ]),
      callout('warning', 'shield', 'No medicine in school bags, please', 'من فضلكم لا أدوية في الحقائب', 'Please do not leave any medication, including cough drops, in your child’s bag. Hand it to a member of staff or the nurse.', 'يرجى عدم ترك أي أدوية، بما فيها أقراص السعال، في حقيبة الطفل، وتسليمها للموظفة أو الممرضة.'),
    ], { badge: ['Staying well', 'صحة وعافية'], links: [['Read the hygiene policy', 'اقرأوا سياسة النظافة', '/parents/hygiene-and-hand-washing']], related: ['food-and-nutrition', 'infectious-diseases'] }),

  D('food-and-nutrition', 'parents', ['Food & nutrition', 'الغذاء والتغذية'], ['Healthy, nut-free meals and snacks.', 'وجبات خفيفة ورئيسية صحية وخالية من المكسرات.'],
    ['We promote healthy eating habits while keeping every child with a food allergy safe.', 'نعزّز عادات الأكل الصحي مع الحفاظ على سلامة كل طفل لديه حساسية غذائية.'], 'p-class-helpers', [
      table('Packing a happy lunch box', 'تجهيز علبة غداء سعيدة', ['Great choices', 'Please avoid'], ['خيارات رائعة', 'يرجى تجنّب'], [
        ['Fruit every day', 'Peanuts, tree nuts and anything with nuts'], ['Sandwiches with a healthy filling', 'Chips, crisps and candy'], ['Yoghurt and milk-based desserts', 'Chocolate and sweet biscuits or cakes'], ['Water in a labelled bottle', 'Soft drinks and sweet juices'], ['Vegetables and cheese sticks', 'Processed fast food'],
      ], [
        ['فاكهة كل يوم', 'الفول السوداني والمكسرات وأي شيء يحتوي عليها'], ['شطائر بحشوة صحية', 'الشيبس والحلويات'], ['الزبادي والحلويات الحليبية', 'الشوكولاتة والبسكويت أو الكعك السكري'], ['ماء في زجاجة عليها الاسم', 'المشروبات الغازية والعصائر المحلّاة'], ['خضروات وأصابع الجبن', 'الوجبات السريعة المصنّعة'],
      ], 'striped', ['Keep perishable food cool: use an ice pack.', 'احفظوا الأطعمة القابلة للتلف باردة باستخدام كيس ثلج.']),
      feats('How we look after mealtimes', 'كيف نعتني بأوقات الطعام', [
        ['apple', 'p-class-cotton', 'We know your child', 'نعرف طفلكم', 'Dietary needs and allergies are recorded at registration and shared with every member of staff.', 'تُسجَّل الاحتياجات الغذائية والحساسية عند التسجيل وتُشارَك مع كل موظفة.'],
        ['water', '', 'Water all day', 'ماء طوال اليوم', 'Fresh drinking water is always available and children can ask for it at any time.', 'ماء الشرب النظيف متاح دائماً ويمكن للأطفال طلبه في أي وقت.'],
        ['users', 'p-class-roleplay', 'Eating together', 'نأكل معاً', 'Staff sit and eat with the children so mealtimes are social and happy, with good manners and ‘please’ and ‘thank you’.', 'تجلس المعلمات مع الأطفال وقت الطعام ليكون اجتماعياً وسعيداً، مع آداب المائدة وكلمتي «من فضلك» و«شكراً».'],
        ['shield', '', 'No sharing food', 'لا تبادل للطعام', 'Children do not share or swap food, to protect those with allergies. Nobody is ever left alone while eating.', 'لا يتبادل الأطفال الطعام لحماية من لديهم حساسية، ولا يُترك أي طفل وحده أثناء الأكل.'],
      ]),
      callout('celebrate', 'cake', 'Birthday cakes', 'كعكات أعياد الميلاد', 'Cakes for special occasions are welcome when they are bought from a shop and handed in unopened in the original box. See the birthday policy for how to book a party.', 'نرحّب بالكعك في المناسبات الخاصة إذا كان مشترى من متجر ومسلَّماً مغلقاً في علبته الأصلية. راجعوا سياسة أعياد الميلاد لمعرفة كيفية حجز الحفل.', btn('Birthday policy', 'سياسة أعياد الميلاد', '/parents/birthday-policy', 'outline')),
    ], { badge: ['Nut-free campus', 'بيئة خالية من المكسرات'], related: ['health-and-wellbeing', 'uniform-and-belongings'] }),

  D('uniform-and-belongings', 'parents', ['Uniform & belongings', 'الزي والمتعلقات'], ['Dress code, shoes and what to bring each day.', 'الزي والأحذية وما يُحضر كل يوم.'],
    ['Comfortable, labelled clothes let children climb, paint and play without worry.', 'الملابس المريحة التي عليها اسم الطفل تتيح له التسلق والرسم واللعب دون قلق.'], 'p-class-dressup', [
      table('What to wear', 'ماذا يرتدي الطفل', ['Weather', 'What to wear'], ['الطقس', 'ماذا يرتدي'], [
        ['Every day', 'The nursery uniform with comfortable shoes for moving indoors and outdoors'], ['Cold weather', 'Coat, gloves, hat and closed-toe shoes'], ['Warm weather', 'Light, sun-protective clothes and a wide-brimmed hat for outdoor play'], ['Shoes', 'Closed-toe with rubber soles. No sandals, flip-flops, heels or shoes with wheels'], ['Spare clothes', 'A labelled set: shirt, trousers, socks and underwear'],
      ], [
        ['كل يوم', 'زي الحضانة مع حذاء مريح للحركة داخل المبنى وخارجه'], ['الطقس البارد', 'معطف وقفازات وقبعة وحذاء مغلق'], ['الطقس الدافئ', 'ملابس خفيفة تحمي من الشمس وقبعة واسعة للعب في الخارج'], ['الأحذية', 'مغلقة بنعل مطاطي. لا صنادل ولا شباشب ولا كعوب ولا أحذية بعجلات'], ['ملابس احتياطية', 'طقم عليه الاسم: قميص وبنطال وجوارب وملابس داخلية'],
      ], 'striped', ['Loose, breathable clothes with elastic waists are easiest for little hands. Please label everything with your child’s name.', 'الملابس الواسعة المريحة ذات الخصر المطاطي الأسهل على الأيدي الصغيرة. يرجى كتابة اسم الطفل على كل شيء.']),
      feats('Every day in the bag', 'في الحقيبة كل يوم', [
        ['backpack', 'p-class-toys', 'A roomy backpack', 'حقيبة واسعة', 'Big enough for a lunch box and spare clothes.', 'تتسع لعلبة الغداء والملابس الاحتياطية.'],
        ['water', '', 'Water bottle', 'زجاجة ماء', 'A reusable bottle with your child’s name on it.', 'زجاجة قابلة لإعادة الاستخدام عليها اسم الطفل.'],
        ['apple', 'p-class-cotton', 'Lunch box', 'علبة الغداء', 'A plastic lunch box with lunch and snacks, nut-free.', 'علبة بلاستيكية فيها الغداء والوجبات الخفيفة وخالية من المكسرات.'],
        ['moon', '', 'Rest-time items', 'أغراض الراحة', 'A blanket, soft toy or pillow if your child rests.', 'بطانية أو دمية ناعمة أو وسادة إن كان طفلكم يرتاح.'],
      ]),
      callout('warning', 'info', 'Please leave at home', 'يرجى تركها في المنزل', 'Dangling earrings, long necklaces and other jewellery; costumes (except on theme days); toys from home (except on sharing days); toy guns; and expensive or sentimental items. The nursery cannot be responsible for lost or damaged items.', 'الأقراط المتدلية والقلائد الطويلة وغيرها من الحُليّ، والأزياء التنكرية (إلا في أيام الموضوع)، والألعاب من المنزل (إلا في أيام المشاركة)، وألعاب المسدسات، والأغراض الغالية أو ذات القيمة العاطفية. لا تتحمل الحضانة مسؤولية فقدان الأغراض أو تلفها.'),
    ], { badge: ['Ready for the day', 'جاهزون لليوم'], related: ['nap-and-rest', 'food-and-nutrition'] }),

  D('nap-and-rest', 'parents', ['Nap & rest time', 'القيلولة والراحة'], ['Rest time for children in extended care.', 'وقت الراحة للأطفال في الرعاية الممتدة.'],
    ['Children need sleep to grow and learn. We follow each child’s routine and keep rest time calm and safe.', 'يحتاج الأطفال إلى النوم لينموا ويتعلموا. نتبع روتين كل طفل ونُبقي وقت الراحة هادئاً وآمناً.'], 'p-softplay', [
      feats('Calm, safe rest', 'راحة هادئة وآمنة', [
        ['moon', 'p-softplay', 'Rest in our daycare', 'الراحة في الرعاية النهارية', 'Children in the extended day may take a 45-minute nap. We arrange nap time with you when we set your child’s schedule.', 'يمكن لأطفال اليوم الممتد أخذ قيلولة مدتها 45 دقيقة، ونرتّب وقتها معكم عند وضع جدول طفلكم.'],
        ['heart', 'p-class-toys', 'Your child’s routine', 'روتين طفلكم', 'Tell us your child’s usual nap and settling routine. We follow it and let you know how your child slept.', 'أخبرونا بروتين نوم طفلكم المعتاد ونتبعه ونُعلمكم كيف نام.'],
        ['shield', '', 'Watched all the time', 'تحت المراقبة دائماً', 'Our nurse monitors the sleeping area, the room is kept comfortably cool and children are always in sight or hearing.', 'تراقب ممرضتنا منطقة النوم وتُحفظ الغرفة بدرجة حرارة مريحة ويكون الأطفال دائماً تحت النظر أو السمع.'],
        ['bell', '', 'Gentle wake-ups', 'استيقاظ لطيف', 'We wake children gently at the end of their sleep time. Children who do not sleep rest quietly.', 'نوقظ الأطفال برفق في نهاية وقت نومهم، ومن لا ينام يرتاح بهدوء.'],
      ]),
      table('Please bring, labelled with your child’s name', 'يرجى إحضارها وعليها اسم الطفل', ['Item', 'Notes'], ['الغرض', 'ملاحظات'], [
        ['Small blanket', 'Required'], ['Nap mat or sheet', 'Required for full-day children'], ['Soft toy or comforter', 'Optional. Dummies must not have cords'],
      ], [
        ['بطانية صغيرة', 'مطلوبة'], ['حصيرة أو شرشف للنوم', 'مطلوبة لأطفال اليوم الكامل'], ['دمية ناعمة أو مهدّئ', 'اختياري. يجب ألا تكون للمصاصة سلاسل'],
      ], 'cards', ['Nap items go home for washing every Friday. For hygiene, the nursery does not provide shared nap supplies.', 'تُرسل أغراض القيلولة للغسيل كل يوم جمعة. ولدواعي النظافة لا توفر الحضانة أغراضاً مشتركة.']),
    ], { badge: ['Rest & recharge', 'راحة وتجدد'], links: [['Sleep and rest policy', 'سياسة النوم والراحة', '/parents/sleep-and-rest']], related: ['daily-schedule', 'uniform-and-belongings'] }),

  D('parent-communication', 'parents', ['Staying in touch', 'التواصل'], ['How the nursery and parents keep in contact.', 'كيف تتواصل الحضانة مع الأهل.'],
    ['We believe in open, friendly communication, so you always know how your child’s day went.', 'نؤمن بتواصل مفتوح وودّي لتعرفوا دائماً كيف كان يوم طفلكم.'], 'p-day-mom-workshop', [
      feats('How we keep you updated', 'كيف نبقيكم على اطلاع', [
        ['message', 'p-day-mother', 'Daily updates', 'تحديثات يومية', 'Photos, messages and reports through the Parents App.', 'صور ورسائل وتقارير عبر تطبيق أولياء الأمور.'],
        ['mail', '', 'Weekly newsletter', 'نشرة أسبوعية', 'Classroom highlights and upcoming events, in the Parents App.', 'أبرز لحظات الصف والفعاليات القادمة في تطبيق أولياء الأمور.'],
        ['calendar', '', 'Monthly calendar', 'تقويم شهري', 'Key dates and activities at the start of each month.', 'التواريخ والأنشطة الرئيسية في بداية كل شهر.'],
        ['users', 'p-day-mom-workshop', 'Parent-teacher meetings', 'لقاءات الأهل والمعلمات', 'Three times a year, or whenever you ask.', 'ثلاث مرات في السنة أو عند طلبكم.'],
      ]),
      stepsB('Ways to get involved', 'طرق المشاركة', 'We love having families around.', 'نحب وجود الأسر بيننا.', [
        ['p-sports-1', 'Sports Day', 'اليوم الرياضي', 'Parents are invited to take part and cheer.', 'نرحّب بمشاركة الأهل وتشجيعهم.'],
        ['p-visit-1', 'Trips and Iftar', 'الرحلات والإفطار', 'A school trip and a Ramadan Iftar that parents can join.', 'رحلة مدرسية وإفطار رمضاني يمكن للأهل الانضمام إليهما.'],
        ['p-day-mom-workshop', 'Parent workshops', 'ورش الأهل', 'Workshops at the nursery to support learning at home.', 'ورش في الحضانة لدعم التعلّم في المنزل.'],
        ['p-class-craft', 'Weekly home activities', 'أنشطة منزلية أسبوعية', 'Simple ideas from the weekly plan to try at home.', 'أفكار بسيطة من الخطة الأسبوعية لتجربتها في المنزل.'],
      ]),
      callout('info', 'phone', 'Questions? Just ask.', 'لديكم سؤال؟ اسألوا.', 'Teachers and staff are available during nursery hours. You can also call or email the office at any time.', 'المعلمات والموظفات متاحات خلال ساعات الحضانة، ويمكنكم الاتصال بالمكتب أو مراسلته في أي وقت.', btn('Contact us', 'تواصلوا معنا', '/contact', 'primary')),
    ], { badge: ['Together', 'معاً'], related: ['faqs', 'policies'] }),

  D('policies', 'parents', ['Our policies', 'سياساتنا'], ['How we keep children safe, healthy and happy.', 'كيف نحافظ على سلامة الأطفال وصحتهم وسعادتهم.'],
    ['These are the policies that guide daily life at Seven Oaks. You can also review them in the Parents App or collect a copy from reception.', 'هذه هي السياسات التي توجّه الحياة اليومية في سيفن أوكس. يمكنكم أيضاً مراجعتها في تطبيق أولياء الأمور أو أخذ نسخة من الاستقبال.'], 'p-entrance', [
      list('Nursery policies', 'سياسات الحضانة', 'policies'),
      feats('Website policies', 'سياسات الموقع', [
        ['shield', '', 'Privacy Policy', 'سياسة الخصوصية', 'What we collect through this website and why.', 'ما نجمعه عبر هذا الموقع ولماذا.'],
        ['file', '', 'Data Protection Policy', 'سياسة حماية البيانات', 'How we protect children’s and families’ information.', 'كيف نحمي معلومات الأطفال والأسر.'],
        ['clock', '', 'Data Retention Policy', 'سياسة الاحتفاظ بالبيانات', 'How long we keep information.', 'المدة التي نحتفظ فيها بالمعلومات.'],
        ['info', '', 'Cookie Policy', 'سياسة ملفات تعريف الارتباط', 'The small files this site may store.', 'الملفات الصغيرة التي قد يحفظها هذا الموقع.'],
      ]),
      callout('info', 'mail', 'Need a printed copy?', 'تحتاجون نسخة مطبوعة؟', 'Ask at reception or email us and we will give you any policy on paper.', 'اطلبوها من الاستقبال أو راسلونا وسنزوّدكم بأي سياسة مطبوعة.', btn('Contact us', 'تواصلوا معنا', '/contact', 'primary')),
    ], { style: 'simple', related: ['faqs', 'health-and-wellbeing'] }),

  D('faqs', 'parents', ['Frequently asked questions', 'الأسئلة الشائعة'], ['Quick answers to common questions.', 'إجابات سريعة عن الأسئلة الشائعة.'],
    ['Open a question to read the answer. Blue underlined words take you to the full page.', 'افتحوا السؤال لقراءة الإجابة. الكلمات الزرقاء المسطَّرة تنقلكم إلى الصفحة الكاملة.'], 'p-smile', [
      faqB('Parents ask us…', 'يسألنا الأهل...', [
        ['What ages do you accept?', 'ما الأعمار المقبولة؟', 'We welcome children from 18 months to 4 years, in our Toddler, Pre-Foundation and Preschool classes. You can read about each class on the [Classes page](/classes).', 'نرحّب بالأطفال من 18 شهراً إلى 4 سنوات في صفوف الدارجين وما قبل التأسيس والتمهيدي. يمكنكم قراءة تفاصيل كل صف في [صفحة الصفوف](/classes).', 'See our classes', 'تعرّفوا على صفوفنا', '/classes'],
        ['What are the nursery hours?', 'ما ساعات الدوام؟', 'Monday to Thursday: morning shift 8:00 am – 1:00 pm and afternoon shift 1:00 – 5:00 pm. Friday 8:00 am – 12:00 pm. Daycare 1:00 – 5:00 pm. Full details are on [School hours & pick-up](/parents/school-hours-and-pick-up).', 'من الاثنين إلى الخميس: الفترة الصباحية 8:00 ص – 1:00 م والمسائية 1:00 – 5:00 م. الجمعة 8:00 ص – 12:00 م. الرعاية النهارية 1:00 – 5:00 م. التفاصيل في [ساعات الدوام والاستلام](/parents/school-hours-and-pick-up).'],
        ['How do I register my child?', 'كيف أسجّل طفلي؟', 'Visit us on a Sunday between 10:00 am and 2:00 pm with the documents listed on [Required documents](/parents/required-documents), or send an enquiry and we will call you.', 'زورونا يوم الأحد بين 10:00 ص و2:00 م ومعكم المستندات المذكورة في [المستندات المطلوبة](/parents/required-documents)، أو أرسلوا استفساراً وسنتصل بكم.', 'Book a tour', 'احجزوا زيارة', '/admissions'],
        ['Can my child bring nuts?', 'هل يمكن لطفلي إحضار المكسرات؟', 'No. Seven Oaks is a nut-free campus to keep children with allergies safe. See [Food & nutrition](/parents/food-and-nutrition) for lunch box ideas.', 'لا. سيفن أوكس بيئة خالية من المكسرات لحماية الأطفال الذين لديهم حساسية. راجعوا [الغذاء والتغذية](/parents/food-and-nutrition) لأفكار علبة الغداء.'],
        ['What if my child is unwell?', 'ماذا لو كان طفلي مريضاً؟', 'Please keep your child at home and tell us as soon as you can. The [Health & wellbeing](/parents/health-and-wellbeing) page explains when children can return.', 'يرجى إبقاء طفلكم في المنزل وإبلاغنا بأسرع وقت. توضح صفحة [الصحة والرفاه](/parents/health-and-wellbeing) متى يمكن للأطفال العودة.'],
        ['How will I hear about my child’s progress?', 'كيف أعرف تقدّم طفلي؟', 'Through daily updates in the Parents App, termly reports and parent-teacher meetings. Learn more in [Staying in touch](/parents/parent-communication).', 'عبر التحديثات اليومية في تطبيق أولياء الأمور والتقارير الفصلية ولقاءات الأهل والمعلمات. المزيد في [التواصل](/parents/parent-communication).'],
        ['Do you support children with special educational needs?', 'هل تدعمون الأطفال ذوي الاحتياجات التعليمية الخاصة؟', 'Yes. We identify needs early, plan together with parents and work with specialists. Read about our [inclusive approach](/inclusion).', 'نعم. نحدّد الاحتياجات مبكراً ونخطط مع الأهل ونعمل مع المختصين. اقرأوا عن [نهجنا الدامج](/inclusion).'],
      ]),
      callout('tip', 'message', 'Still have a question?', 'ما زال لديكم سؤال؟', 'We are happy to help. Call us, send a message or pop in to say hello.', 'يسعدنا مساعدتكم. اتصلوا بنا أو أرسلوا رسالة أو مرّوا للتعرّف علينا.', btn('Contact us', 'تواصلوا معنا', '/contact', 'primary')),
    ], { style: 'simple', badge: ['Good to know', 'مفيد معرفته'], related: ['parent-communication', 'school-hours-and-pick-up'] }),
];

// ───────────────────────── Nursery policies (from the Nursery Policies document) ─────────────────────────
const pol = (slug: string, title: [string, string], summary: [string, string], intro: [string, string], cover: string, blocks: any[], badge: [string, string] = ['Policy', 'سياسة']): DetailSeed =>
  D(slug, 'policies', title, summary, intro, cover, [...blocks, callout('info', 'info', 'Questions about this policy?', 'أسئلة حول هذه السياسة؟', 'Please speak to the nursery manager or the office. A printed copy is always available from reception.', 'يرجى التحدث إلى مديرة الحضانة أو المكتب. تتوفر نسخة مطبوعة دائماً في الاستقبال.', btn('Contact us', 'تواصلوا معنا', '/contact', 'outline'))], { style: 'simple', badge, related: ['policies'] });

const policyPages: DetailSeed[] = [
  pol('admissions-policy', ['Admissions policy', 'سياسة القبول'], ['An open, fair way to join Seven Oaks.', 'طريقة مفتوحة وعادلة للالتحاق بسيفن أوكس.'], ['We want every family in our community to be able to join our nursery through a clear and fair process.', 'نريد أن تتمكن كل أسرة في مجتمعنا من الالتحاق بحضانتنا عبر إجراءات واضحة وعادلة.'], 'p-entrance', [
    feats('How we welcome every family', 'كيف نرحّب بكل أسرة', [
      ['users', 'p-smile', 'Open to all', 'مفتوحة للجميع', 'Our nursery is accessible to children and families from all parts of the community, with clear and fair procedures.', 'حضانتنا متاحة للأطفال والأسر من كل فئات المجتمع بإجراءات واضحة وعادلة.'],
      ['message', '', 'Clear information', 'معلومات واضحة', 'Information is given in written and spoken form, with translated materials and an interpreter if a family needs one.', 'تُقدَّم المعلومات مكتوبة ومنطوقة مع مواد مترجمة ومترجم عند حاجة الأسرة.'],
      ['calendar', '', 'A fair waiting list', 'قائمة انتظار عادلة', 'The waiting list is in birth order, first come first served. Brothers and sisters already at the nursery may also be taken into account.', 'تُرتَّب قائمة الانتظار حسب تاريخ الميلاد وأسبقية الطلب، وقد يُراعى وجود إخوة في الحضانة.'],
      ['heart', '', 'A place for emergencies', 'مقعد للطوارئ', 'When it is possible, we keep one place free for an emergency admission.', 'نُبقي مقعداً شاغراً لحالات القبول الطارئة متى أمكن ذلك.'],
      ['shield', '', 'Everyone belongs', 'الجميع ينتمي', 'We consider each child’s needs, whether they arise from gender, special educational needs, disability, background, religion, ethnicity or learning English as a new language.', 'نراعي احتياجات كل طفل سواء نتجت عن الجنس أو الاحتياجات التعليمية الخاصة أو الإعاقة أو الخلفية أو الدين أو العرق أو تعلّم الإنجليزية كلغة جديدة.'],
      ['clock', '', 'Flexible attendance', 'حضور مرن', 'We talk with families about opening times and are flexible about attendance patterns where we can.', 'نتشاور مع الأسر حول أوقات الدوام ونتحلى بالمرونة في أنماط الحضور قدر الإمكان.'],
    ]),
  ], ['Admissions', 'القبول']),

  pol('withdrawing-a-child', ['Withdrawing a child', 'سحب الطفل من الحضانة'], ['What to do if your child leaves the nursery.', 'ما يجب فعله عند مغادرة الطفل للحضانة.'], ['If your family needs to leave, a clear process helps us plan places and say a proper goodbye.', 'إذا اضطرت أسرتكم للمغادرة فإن الإجراء الواضح يساعدنا على تخطيط المقاعد وتوديع طفلكم كما يليق.'], 'p-class-toys', [
    stepsB('How withdrawal works', 'كيف يتم السحب', 'You agree to these steps in the Conditions of Enrolment when you register.', 'توافقون على هذه الخطوات في شروط التسجيل عند التسجيل.', [
      ['', 'Give written notice', 'قدّموا إشعاراً كتابياً', 'Send the notice to the office by email or hand it to the nursery director. Your Conditions of Enrolment state the notice period.', 'أرسلوا الإشعار إلى المكتب بالبريد الإلكتروني أو سلّموه لمديرة الحضانة. تحدد شروط التسجيل مدة الإشعار.'],
      ['', 'Include the details', 'اذكروا التفاصيل', 'Please write the date of the letter, your child’s last day and the new nursery or school.', 'يرجى كتابة تاريخ الخطاب وآخر يوم حضور لطفلكم واسم الحضانة أو المدرسة الجديدة.'],
      ['', 'We file it safely', 'نحفظه بأمان', 'The letter is placed in your child’s file and archived once they leave.', 'يوضع الخطاب في ملف طفلكم ويُؤرشف بعد مغادرته.'],
      ['', 'Settle the final account', 'تسوية الحساب الختامي', 'The office issues the final account and the form is completed. Please settle it before your child’s last day.', 'يصدر المكتب الحساب الختامي ويُكمل النموذج. يرجى تسويته قبل آخر يوم لطفلكم.'],
    ]),
    callout('info', 'calendar', 'Staying for next year?', 'ستبقون للعام القادم؟', 'Before the end of each year we send an Attendance Changes Form. Please return it to confirm your child’s place for the new year. Parents of children moving to the next class complete a re-enrolment form.', 'قبل نهاية كل عام نرسل نموذج تغيير الحضور. يرجى إعادته لتأكيد مقعد طفلكم للعام الجديد، ويُعبّئ أهل الأطفال المنتقلين للصف التالي نموذج إعادة التسجيل.'),
    callout('info', 'heart', 'If a placement is not working', 'إذا لم يكن المقعد مناسباً', 'If we ever feel we need to talk about whether a placement is right for a child or for other children in our care, we will contact you straight away to discuss every option together.', 'إذا شعرنا يوماً بحاجة لمناقشة ملاءمة المقعد للطفل أو لغيره من الأطفال، فسنتصل بكم فوراً لبحث كل الخيارات معاً.'),
  ]),

  pol('hygiene-and-hand-washing', ['Hygiene & hand washing', 'النظافة وغسل اليدين'], ['Clean hands and clean spaces for healthy children.', 'أيدٍ نظيفة وأماكن نظيفة لأطفال أصحاء.'], ['Good hygiene is the single best way to stop germs spreading, so we make it part of every day.', 'النظافة الجيدة أفضل وسيلة لمنع انتشار الجراثيم، ولذلك نجعلها جزءاً من كل يوم.'], 'p-class-paint', [
    feats('A clean, safe nursery', 'حضانة نظيفة وآمنة', [
      ['water', 'p-class-cotton', 'Hand washing', 'غسل اليدين', 'Everyone washes with soap and water for at least 20 seconds on arrival, before and after eating, after the toilet and after messy play.', 'يغسل الجميع أيديهم بالماء والصابون لمدة 20 ثانية على الأقل عند الوصول وقبل الأكل وبعده وبعد الحمّام وبعد اللعب المتسخ.'],
      ['sparkles', 'p-class-paint', 'Daily cleaning', 'نظافة يومية', 'Tables, toys, handles and toilets are cleaned and disinfected every day with child-safe cleaners. Bedding and towels are washed regularly.', 'تُنظَّف وتُعقَّم الطاولات والألعاب والمقابض ودورات المياه يومياً بمنظفات آمنة للأطفال، وتُغسل الأغطية والمناشف بانتظام.'],
      ['shield', '', 'Staff care', 'عناية الموظفات', 'Staff wash their hands often, wear gloves for cleaning and body fluids, and stay at home when they are ill.', 'تغسل الموظفات أيديهن كثيراً وتلبسن القفازات للتنظيف وسوائل الجسم وتبقين في المنزل عند المرض.'],
      ['heart', '', 'Nappies and toilet learning', 'الحفاضات وتعلّم الحمّام', 'No child is left out for not being toilet trained. We change nappies in a clean, private area and support each child kindly, never making negative comments.', 'لا يُستثنى أي طفل لعدم إتقانه الحمّام. نغيّر الحفاضات في مكان نظيف وخاص وندعم كل طفل بلطف دون تعليقات سلبية.'],
    ]),
    stepsB('Wash like a superstar', 'اغسلوا كالنجوم', 'Sing “Happy Birthday” twice and the germs go down the drain.', 'غنّوا «سنة حلوة يا جميل» مرتين وتذهب الجراثيم مع الماء.', [
      ['', 'Wet', 'بلّلوا', 'Wet hands with clean running water.', 'بلّلوا اليدين بماء جارٍ نظيف.'], ['', 'Soap and rub', 'صابون وفرك', 'Rub palms, backs of hands, between fingers, wrists and under nails.', 'افركوا الراحتين وظهر اليدين وبين الأصابع والمعصمين وتحت الأظافر.'],
      ['', 'Rinse', 'اشطفوا', 'Rinse all the soap off under running water.', 'اشطفوا الصابون كله بماء جارٍ.'], ['', 'Dry well', 'جفّفوا جيداً', 'Dry with a paper towel. Dry hands carry far fewer germs.', 'جفّفوا بمنديل ورقي. الأيدي الجافة تحمل جراثيم أقل بكثير.'],
    ]),
    callout('info', 'info', 'When someone is ill', 'عند المرض', 'Sick children stay home until they have been symptom-free for at least 24 hours without fever-reducing medicine. If a child becomes unwell at nursery they rest in a separate area and we call you immediately.', 'يبقى الطفل المريض في المنزل حتى يخلو من الأعراض 24 ساعة على الأقل دون خافض للحرارة. وإذا مرض الطفل في الحضانة فإنه يرتاح في مكان منفصل ونتصل بكم فوراً.'),
  ], ['Health', 'الصحة']),

  pol('infectious-diseases', ['Infectious diseases', 'الأمراض المعدية'], ['How we prevent and manage the spread of infection.', 'كيف نمنع انتشار العدوى ونتعامل معها.'], ['We work with families to keep infants, children, staff and visitors safe from infection.', 'نعمل مع الأسر لحماية الرضّع والأطفال والموظفين والزوار من العدوى.'], 'p-class-helpers', [
    table('Children who must stay at home', 'أطفال يجب أن يبقوا في المنزل', ['Illness or symptom', 'Why we ask'], ['المرض أو العَرَض', 'لماذا نطلب ذلك'], [
      ['Diarrhoea or vomiting', 'Easily spreads in a group'], ['Fever of 38°C or higher', 'A sign of infection'], ['Conjunctivitis (pink eye)', 'Spreads through touch'], ['Impetigo or other skin infections', 'Spreads through contact'], ['Lice or scabies', 'Spreads through close contact'], ['Measles, mumps, rubella, whooping cough', 'Serious infections, so please tell us at once'], ['Influenza (in the flu season)', 'Spreads through coughs and sneezes'],
    ], [
      ['الإسهال أو القيء', 'ينتقل بسهولة في المجموعة'], ['حرارة 38 درجة أو أكثر', 'علامة على العدوى'], ['التهاب الملتحمة (العين الوردية)', 'ينتقل باللمس'], ['القوباء أو التهابات الجلد الأخرى', 'تنتقل بالملامسة'], ['القمل أو الجرب', 'ينتقلان بالاتصال القريب'], ['الحصبة والنكاف والحصبة الألمانية والسعال الديكي', 'عدوى خطيرة لذا يرجى إبلاغنا فوراً'], ['الإنفلونزا (في موسمها)', 'تنتقل بالسعال والعطس'],
    ]),
    feats('How we protect everyone', 'كيف نحمي الجميع', [
      ['doctor', '', 'Vaccinations', 'التطعيمات', 'Children show proof of up-to-date immunisation before admission, and staff keep their recommended vaccinations up to date.', 'يقدّم الأطفال إثباتاً بتحديث التطعيمات قبل القبول، وتحافظ الموظفات على تطعيماتهن الموصى بها.'],
      ['water', '', 'Hand hygiene first', 'النظافة أولاً', 'Hand washing is our most important measure, with sanitiser when soap and water are not available.', 'غسل اليدين أهم إجراءاتنا، مع المعقّم عند عدم توفر الماء والصابون.'],
      ['shield', '', 'Protective equipment', 'معدات الوقاية', 'Staff wear gloves and masks when caring for a child with a suspected infection and when cleaning body fluids.', 'تلبس الموظفات القفازات والكمامات عند رعاية طفل يُشتبه بإصابته وعند تنظيف سوائل الجسم.'],
      ['sparkles', '', 'Cleaning and safe disposal', 'التنظيف والتخلص الآمن', 'Toys, tables, cots and bathrooms are cleaned regularly, and infectious waste goes into designated containers.', 'تُنظَّف الألعاب والطاولات والأسرّة ودورات المياه بانتظام، وتُوضع النفايات المعدية في حاويات مخصصة.'],
    ]),
    callout('warning', 'bell', 'Parents can help', 'يمكنكم المساعدة', 'Please give us proof of your child’s immunisations and tell us straight away about any infectious illness or exposure, so we can protect other children.', 'يرجى تزويدنا بإثبات تطعيمات طفلكم وإبلاغنا فوراً بأي مرض معدٍ أو مخالطة لنتمكن من حماية الأطفال الآخرين.'),
  ], ['Health', 'الصحة']),

  pol('school-trips', ['School trips', 'الرحلات المدرسية'], ['Safe, joyful outings that bring learning to life.', 'رحلات آمنة وممتعة تُحيي التعلّم.'], ['Trips enrich our curriculum with experiences we could not offer inside the nursery.', 'تثري الرحلات منهجنا بتجارب لا يمكننا تقديمها داخل الحضانة.'], 'p-visit-1', [
    feats('Why we go out', 'لماذا نخرج', [
      ['sparkles', 'p-visit-1', 'Learning in the real world', 'التعلّم في العالم الحقيقي', 'Every trip has an educational purpose linked to what children are learning.', 'لكل رحلة هدف تعليمي مرتبط بما يتعلمه الأطفال.'],
      ['users', 'p-visit-3', 'Growing independence', 'استقلالية متنامية', 'New places help children grow as confident, independent learners.', 'الأماكن الجديدة تساعد الأطفال على النمو كمتعلمين واثقين ومستقلين.'],
      ['bus', 'p-visit-4', 'Planned for at least two trips a year', 'رحلتان على الأقل سنوياً', 'We aim for at least two formal outings each year, and tell you about them in advance.', 'نهدف إلى رحلتين رسميتين على الأقل كل عام ونُبلغكم بها مسبقاً.'],
    ]),
    stepsB('How we keep every trip safe', 'كيف نحافظ على سلامة كل رحلة', 'Careful planning comes first.', 'يبدأ كل شيء بالتخطيط الدقيق.', [
      ['', 'Visit and assess', 'زيارة وتقييم', 'Managers visit the venue first and complete a written risk assessment, including the journey.', 'تزور المديرات المكان أولاً وتُكملن تقييماً مكتوباً للمخاطر يشمل الرحلة.'],
      ['', 'Your consent', 'موافقتكم', 'Parents sign a consent form before every outing.', 'يوقّع الأهل نموذج موافقة قبل كل رحلة.'],
      ['', 'Safe travel', 'سفر آمن', 'Our transport company confirms seat belts, police-vetted drivers, insurance, first aid and breakdown procedures.', 'تؤكد شركة النقل استخدام أحزمة الأمان والسائقين المعتمدين من الشرطة والتأمين والإسعافات الأولية وإجراءات الأعطال.'],
      ['', 'Always watched', 'مراقبة دائمة', 'Children are counted before leaving and throughout. Helpers are always with a member of staff and never alone with a group.', 'يُعدّ الأطفال قبل المغادرة وطوال الرحلة، ولا يُترك أي مساعد وحده مع مجموعة.'],
    ]),
    callout('info', 'heart', 'Every child can join', 'كل طفل يمكنه المشاركة', 'We make reasonable adjustments so children with disabilities can take part, and we include them in the risk assessment.', 'نجري التعديلات المعقولة ليتمكن الأطفال ذوو الإعاقة من المشاركة ونضمّنها في تقييم المخاطر.'),
  ], ['Trips', 'الرحلات']),

  pol('sleep-and-rest', ['Sleep & rest procedures', 'إجراءات النوم والراحة'], ['Safe, calm sleep for every child.', 'نوم آمن وهادئ لكل طفل.'], ['Sleep supports children’s thinking, feelings and growing bodies, so we plan it carefully with you.', 'يدعم النوم تفكير الأطفال ومشاعرهم وأجسامهم النامية، لذلك نخطط له بعناية معكم.'], 'p-softplay', [
    feats('How we keep sleep safe', 'كيف نحافظ على نوم آمن', [
      ['moon', 'p-softplay', 'Your child’s routine', 'روتين طفلكم', 'Before the first day we ask about naps and settling routines at home, and tell you how your child slept.', 'نسأل قبل اليوم الأول عن القيلولة وطريقة التهدئة في المنزل ونخبركم كيف نام طفلكم.'],
      ['shield', '', 'A safe place', 'مكان آمن', 'Beds are in safe positions, with firm, flat mattresses, no cords or plastic bags within reach, and a room temperature of 20–24°C.', 'الأسرّة في أماكن آمنة بمراتب مسطّحة وثابتة ودون حبال أو أكياس بلاستيك في المتناول، مع حرارة غرفة بين 20 و24 درجة.'],
      ['heart', '', 'Watched at all times', 'تحت المراقبة دائماً', 'Children are in sight or hearing at all times and our nurse checks each sleeping child in person.', 'الأطفال تحت النظر أو السمع دائماً وتتفقد ممرضتنا كل طفل نائم شخصياً.'],
      ['bell', '', 'Ready for emergencies', 'جاهزون للطوارئ', 'All staff know to call 991 if a child will not wake, has difficulty breathing, seems very confused or has a seizure.', 'تعرف كل الموظفات الاتصال بـ 991 إذا لم يستيقظ الطفل أو واجه صعوبة في التنفس أو بدا مرتبكاً جداً أو أصيب بنوبة.'],
    ]),
    callout('info', 'moon', 'From home', 'من المنزل', 'Please bring a blanket (we send it home to be washed every Friday). Comforters and dummies come from home and are kept in your child’s belongings; dummies must not have cords. Drinks are not allowed in cots.', 'يرجى إحضار بطانية (نرسلها للغسيل كل جمعة). تأتي المهدّئات والمصاصات من المنزل وتُحفظ مع أغراض الطفل، ويجب ألا يكون للمصاصة سلاسل. لا يُسمح بالمشروبات في الأسرّة.'),
  ]),

  pol('birthday-policy', ['Birthday policy', 'سياسة أعياد الميلاد'], ['How to celebrate your child’s birthday at nursery.', 'كيف تحتفلون بعيد ميلاد طفلكم في الحضانة.'], ['We love a birthday! These simple guidelines keep celebrations happy, healthy and fair for everyone.', 'نحب أعياد الميلاد! هذه الإرشادات البسيطة تُبقي الاحتفالات سعيدة وصحية وعادلة للجميع.'], 'p-day-pink-1', [
    feats('Planning a birthday party', 'تخطيط حفل عيد الميلاد', [
      ['calendar', 'p-day-pink-1', 'Book a week ahead', 'احجزوا قبل أسبوع', 'Please book with your child’s class teacher one week before. We hold one party per week, per class.', 'يرجى الحجز مع معلمة الصف قبل أسبوع. نُقيم حفلاً واحداً في الأسبوع لكل صف.'],
      ['party', 'p-day-pink-2', 'Decorations', 'الزينة', 'Parents bring decorations two days before the party.', 'يحضر الأهل الزينة قبل الحفل بيومين.'],
      ['cake', '', 'Cupcakes or a small cake', 'كب كيك أو كعكة صغيرة', 'To avoid waste, please bring cupcakes or a small cake. No extra snacks and no candy in party bags.', 'تجنباً للهدر يرجى إحضار كب كيك أو كعكة صغيرة. بلا وجبات إضافية وبلا حلوى في أكياس الهدايا.'],
      ['camera', 'p-day-orange', 'Photos for your memories', 'صور لذكرياتكم', 'Parents do not join the class party, but we send you photos and videos to treasure.', 'لا يحضر الأهل حفل الصف لكننا نرسل لكم الصور والفيديوهات لتحتفظوا بها.'],
    ]),
    callout('tip', 'info', 'Gifts', 'الهدايا', 'Gifts should be safe and suitable for children’s ages.', 'يجب أن تكون الهدايا آمنة ومناسبة لأعمار الأطفال.'),
  ], ['Celebrations', 'احتفالات']),

  pol('assessment-policy', ['Assessment policy', 'سياسة التقييم'], ['How we track your child’s progress and plan next steps.', 'كيف نتابع تقدّم طفلكم ونخطط للخطوات التالية.'], ['Assessment helps us see each child’s strengths and plan what to learn next, together with you.', 'يساعدنا التقييم على رؤية نقاط قوة كل طفل وتخطيط ما سيتعلمه لاحقاً بالتعاون معكم.'], 'p-class-numbers', [
    stepsB('How assessment works', 'كيف يعمل التقييم', 'We use ongoing observation and regular reviews.', 'نستخدم الملاحظة المستمرة والمراجعات الدورية.', [
      ['p-class-senses', 'Every day: observation', 'كل يوم: الملاحظة', 'Teachers watch, listen and record through notes, photographs and samples of work.', 'تراقب المعلمات وتستمعن وتسجلن عبر الملاحظات والصور وعيّنات الأعمال.'],
      ['p-class-numbers', 'First 6 weeks: baseline', 'أول 6 أسابيع: التقييم الأولي', 'We complete a starting point assessment within the first six weeks.', 'نُكمل تقييم نقطة البداية خلال الأسابيع الستة الأولى.'],
      ['p-class-craft', 'Each term: review', 'كل فصل: مراجعة', 'A termly progress review looks at overall development.', 'تتناول مراجعة التقدّم الفصلية النمو بشكل عام.'],
      ['p-grad-1', 'End of year: report', 'نهاية العام: التقرير', 'A report summarises progress across the EYFS framework.', 'يلخّص التقرير التقدّم عبر إطار EYFS.'],
    ]),
    feats('Working together', 'نعمل معاً', [
      ['book', '', 'Learning journals', 'سجلات التعلّم', 'Each child has a journal with work samples and development records.', 'لكل طفل سجل فيه عيّنات من أعماله وسجلات نموه.'],
      ['message', '', 'Sharing with parents', 'المشاركة مع الأهل', 'Parents receive termly reports and are invited to talk about progress. Any concern is shared promptly.', 'يتلقى الأهل تقارير فصلية ويُدعون لمناقشة التقدّم، وتُبلَّغ أي ملاحظة بسرعة.'],
      ['heart', '', 'Early support', 'دعم مبكر', 'Children who need extra help are identified early and get an individual learning plan, with specialists and parents.', 'يُحدَّد الأطفال الذين يحتاجون دعماً إضافياً مبكراً ويحصلون على خطة تعلّم فردية بالتعاون مع المختصين والأهل.'],
      ['shield', '', 'Private and secure', 'خصوصية وأمان', 'Records are stored securely and shared only with authorised staff and parents.', 'تُحفظ السجلات بأمان ولا تُشارَك إلا مع الموظفين المخوّلين والأهل.'],
    ]),
  ], ['Learning', 'التعلّم']),

  pol('outdoor-play', ['Outdoor play', 'اللعب في الهواء الطلق'], ['Safe, shaded and inclusive outdoor play every day.', 'لعب آمن ومظلل وشامل في الهواء الطلق كل يوم.'], ['Playing outside builds strong bodies, friendships and a love of nature.', 'اللعب في الخارج يبني أجساماً قوية وصداقات وحبّاً للطبيعة.'], 'p-jungle', [
    feats('Outdoor play at Seven Oaks', 'اللعب الخارجي في سيفن أوكس', [
      ['shield', 'p-jungle', 'A safe space', 'مكان آمن', 'Outdoor areas are securely enclosed, free from hazards and have shade and protection from extreme weather.', 'المساحات الخارجية محاطة بأمان وخالية من المخاطر وفيها ظل وحماية من الطقس القاسي.'],
      ['users', 'p-sports-2', 'Everyone can play', 'الجميع يلعب', 'Facilities welcome children of all abilities, with equipment that suits their age and is regularly inspected.', 'المرافق ترحّب بالأطفال من كل القدرات بمعدات تناسب أعمارهم وتُفحص بانتظام.'],
      ['heart', 'p-sports-3', 'Trained, attentive staff', 'موظفات مدرّبات ومنتبهات', 'Staff trained in child safety and first aid keep good ratios and join in the play.', 'موظفات مدرّبات على سلامة الأطفال والإسعافات الأولية يحافظن على نسب مناسبة ويشاركن في اللعب.'],
      ['trees', 'p-sand', 'Learning outdoors', 'التعلّم في الخارج', 'Outdoor activities support motor skills, teamwork and respect for nature and different cultures.', 'تدعم الأنشطة الخارجية المهارات الحركية والعمل الجماعي واحترام الطبيعة والثقافات المختلفة.'],
    ]),
    callout('info', 'water', 'Hands first', 'الأيدي أولاً', 'Children wash their hands before and after outdoor play, and first aid kits and emergency procedures are always ready.', 'يغسل الأطفال أيديهم قبل اللعب الخارجي وبعده، وتبقى حقائب الإسعاف وإجراءات الطوارئ جاهزة دائماً.'),
  ], ['Outdoors', 'الهواء الطلق']),

  pol('wellbeing-policy', ['Wellbeing policy', 'سياسة الرفاه'], ['Caring for the whole child, and for our team and families.', 'رعاية الطفل بكل جوانبه وكذلك فريقنا وأسرنا.'], ['A child’s learning grows from feeling happy, safe and healthy. This policy explains how we nurture that.', 'ينمو تعلّم الطفل حين يشعر بالسعادة والأمان والصحة. توضح هذه السياسة كيف نرعى ذلك.'], 'p-smile', [
    feats('Our approach to wellbeing', 'نهجنا في الرفاه', [
      ['heart', 'p-smile', 'Emotional wellbeing', 'الرفاه العاطفي', 'Every child has a key person. Daily mindfulness, relaxation and talking about feelings help children manage emotions, and kindness and respect are expected from everyone.', 'لكل طفل معلمة مرجعية. تساعد اليقظة الذهنية والاسترخاء والحديث عن المشاعر الأطفال على إدارة انفعالاتهم، ويُتوقع اللطف والاحترام من الجميع.'],
      ['activity', 'p-sports-1', 'Physical wellbeing', 'الرفاه الجسدي', 'Daily outdoor play, healthy meals and snacks, good hygiene habits and enough rest.', 'لعب يومي في الخارج ووجبات صحية وعادات نظافة جيدة وراحة كافية.'],
      ['shield', '', 'Safety and protection', 'السلامة والحماية', 'Strict safeguarding policies, staff trained in first aid, emergency response and child protection, and a clean, stimulating environment.', 'سياسات صارمة لحماية الأطفال وموظفات مدرّبات على الإسعافات الأولية والاستجابة للطوارئ وحماية الطفل وبيئة نظيفة محفّزة.'],
      ['users', 'p-day-mother', 'Families and staff', 'الأسر والموظفات', 'Workshops, resources and open communication for parents, and wellbeing support, training and fair workloads for staff.', 'ورش وموارد وتواصل مفتوح للأهل ودعم للرفاه وتدريب وأعباء عمل عادلة للموظفات.'],
    ]),
    callout('tip', 'message', 'We always listen', 'نصغي دائماً', 'We ask children, parents and staff for feedback and review our wellbeing work regularly.', 'نطلب آراء الأطفال والأهل والموظفات ونراجع عملنا في الرفاه بانتظام.'),
  ], ['Wellbeing', 'الرفاه']),

  pol('behaviour-policy', ['Behaviour policy', 'سياسة السلوك'], ['A positive, consistent and caring approach.', 'نهج إيجابي ومتسق وراعٍ.'], ['Children behave in different ways at different ages. We guide them kindly and work with parents.', 'يتصرف الأطفال بطرق مختلفة في أعمار مختلفة. نرشدهم بلطف ونعمل مع الأهل.'], 'p-class-roleplay', [
    feats('How we encourage good behaviour', 'كيف نشجّع السلوك الجيد', [
      ['star', 'p-class-helpers', 'Praise and encouragement', 'المدح والتشجيع', 'Smiles, thumbs up, stickers and kind words show children what we love to see.', 'الابتسامات وإبهام الإعجاب والملصقات والكلمات الطيبة تُري الأطفال ما نحب رؤيته.'],
      ['users', 'p-class-roleplay', 'Learning social skills', 'تعلّم المهارات الاجتماعية', 'We model sharing, manners, hygiene and taking turns, and help children say “please don’t do that, I don’t like it”.', 'نقدّم القدوة في المشاركة والآداب والنظافة وانتظار الدور، ونساعد الأطفال على قول «من فضلك لا تفعل ذلك، لا يعجبني».'],
      ['heart', '', 'Age and stage', 'العمر والمرحلة', 'We always consider a child’s age and stage of development. For example, biting is common between 18 months and 2½ years.', 'نراعي دائماً عمر الطفل ومرحلة نموه. فعلى سبيل المثال العضّ شائع بين 18 شهراً وسنتين ونصف.'],
      ['shield', '', 'Never punishment', 'لا عقاب بدني أبداً', 'No child is ever given corporal punishment.', 'لا يتعرض أي طفل للعقاب البدني أبداً.'],
    ]),
    table('If behaviour is a worry', 'إذا كان السلوك مصدر قلق', ['Step', 'What happens'], ['الخطوة', 'ما الذي يحدث'], [
      ['Kind strategies', 'Reminders, explanations, distraction, removing a toy or a short calm break'], ['Talk with you', 'We speak with parents and note it in the child’s record'], ['Extra support', 'An individual behaviour plan may be made, with advice from specialists if needed'],
    ], [
      ['استراتيجيات لطيفة', 'تذكير وشرح وإلهاء وإبعاد لعبة أو استراحة هادئة قصيرة'], ['نتحدث معكم', 'نتحدث مع الأهل ونسجّل ذلك في ملف الطفل'], ['دعم إضافي', 'قد نضع خطة سلوك فردية بمشورة مختصين عند الحاجة'],
    ], 'cards'),
  ], ['Behaviour', 'السلوك']),

  pol('uae-values', ['UAE values', 'قيم دولة الإمارات'], ['Democracy, liberty, respect and tolerance, taught through play.', 'الديمقراطية والحرية والاحترام والتسامح من خلال اللعب.'], ['We help children grow as kind, confident citizens who respect UAE values and every culture.', 'نساعد الأطفال على النمو كمواطنين لطفاء وواثقين يحترمون قيم الإمارات وكل الثقافات.'], 'p-national-1', [
    feats('Values in everyday play', 'قيم في اللعب اليومي', [
      ['users', 'p-national-1', 'Making decisions together', 'اتخاذ القرارات معاً', 'Children help make class rules and vote with a show of hands. Their views count.', 'يشارك الأطفال في وضع قواعد الصف ويصوّتون برفع الأيدي. فآراؤهم مهمة.'],
      ['star', 'p-national-2', 'Individual liberty', 'الحرية الفردية', 'Children grow in self-confidence by choosing, taking safe risks and talking about their feelings.', 'ينمو الأطفال بثقتهم بأنفسهم عبر الاختيار والمخاطرة الآمنة والحديث عن مشاعرهم.'],
      ['heart', 'p-national-3', 'Mutual respect and tolerance', 'الاحترام المتبادل والتسامح', 'We value every faith, culture and family, share stories that show diversity and challenge stereotypes.', 'نقدّر كل دين وثقافة وأسرة ونشارك قصصاً تُظهر التنوع ونتحدى الصور النمطية.'],
      ['shield', 'p-national-4', 'Rules for everyone', 'قواعد للجميع', 'Children learn right from wrong and that the rules apply to everyone.', 'يتعلم الأطفال الصواب من الخطأ وأن القواعد تنطبق على الجميع.'],
    ]),
    callout('celebrate', 'party', 'Celebrating the UAE', 'نحتفل بالإمارات', 'National Day, Flag Day and Haq Al Laila bring these values to life with songs, crafts and costumes.', 'يُحيي اليوم الوطني ويوم العلم وحق الليلة هذه القيم بالأناشيد والأعمال اليدوية والأزياء.', btn('See our gallery', 'شاهدوا معرض الصور', '/gallery', 'outline')),
  ], ['UAE values', 'قيم الإمارات']),
];

export const detailSeeds: DetailSeed[] = [...parentPages, ...policyPages];

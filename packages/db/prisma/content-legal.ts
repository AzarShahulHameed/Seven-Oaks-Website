// Starter website policies for Seven Oaks British Nursery (DATA, not code). Edit them in Admin → Pages (Privacy Policy, Cookie Policy, Terms,
// Data Protection, Data Retention). They describe what this website really does; the tables are normal Table blocks you can change.
// They are written for a UAE nursery with reference to Federal Decree-Law No. 45 of 2021 (Personal Data Protection Law). They are a sound
// starting point, but the nursery should have a legal adviser read them once before relying on them.
import { btn, i, im } from './content';

type Section = { type: string; config: Record<string, any> };
type PageSeed = { key: string; slug: string; title: { en: string; ar: string }; metaTitle: { en: string; ar: string }; metaDescription: { en: string; ar: string }; sections: Section[] };

const E = i('', '');
const hero = (en: string, ar: string, subEn: string, subAr: string): Section => ({
  type: 'hero', config: { eyebrow: i('SEVEN OAKS BRITISH NURSERY', 'حضانة سيفن أوكس البريطانية'), title: i(en, ar), text: i(subEn, subAr), image: im('p-smile', 'A smiling child', 'طفلة مبتسمة'), size: 'compact', buttons: [], location: E, script: E },
});
const rich = (te: string, ta: string, paras: [string, string][], bullets: [string, string][] = []): Section => ({
  type: 'rich-text', config: { title: i(te, ta), subtitle: E, paragraphs: paras.map(([a, b]) => i(a, b)), bullets: bullets.map(([a, b]) => i(a, b)) },
});
const table = (te: string, ta: string, he: string[], ha: string[], re: string[][], ra: string[][], note: [string, string] = ['', '']): Section => ({
  type: 'table', config: { title: i(te, ta), subtitle: E, header: i(he.join(' | '), ha.join(' | ')), rows: i(re.map((r) => r.join(' | ')).join('\n'), ra.map((r) => r.join(' | ')).join('\n')), style: 'striped', note: i(note[0], note[1]) },
});
const callout = (tone: string, icon: string, te: string, ta: string, xe: string, xa: string, button?: any): Section => ({
  type: 'callout', config: { tone, icon, title: i(te, ta), text: i(xe, xa), button: button ?? { label: E, href: '', variant: 'primary' } },
});
const contact = (): Section => ({ type: 'contact', config: { title: i('Questions about this policy?', 'أسئلة حول هذه السياسة؟'), text: i('Please contact us and we will be glad to help.', 'يرجى التواصل معنا ويسعدنا مساعدتكم.'), showHours: false, showMap: false } });
const updated = (): Section => callout('info', 'info', 'Last updated: October 2026', 'آخر تحديث: أكتوبر 2026', 'We may update this page when our practice or the law changes. The newest version is always the one on this website.', 'قد نحدّث هذه الصفحة عند تغيّر ممارساتنا أو القانون. النسخة الأحدث هي دائماً المنشورة على هذا الموقع.');

export const legalPages: PageSeed[] = [
  {
    key: 'privacy-policy', slug: 'privacy-policy', title: i('Privacy Policy', 'سياسة الخصوصية'),
    metaTitle: i('Privacy Policy | Seven Oaks British Nursery', 'سياسة الخصوصية | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('How Seven Oaks British Nursery collects, uses and protects personal information.', 'كيف تجمع حضانة سيفن أوكس البريطانية المعلومات الشخصية وتستخدمها وتحميها.'),
    sections: [
      hero('Privacy Policy', 'سياسة الخصوصية', 'How we look after your information.', 'كيف نحافظ على معلوماتكم.'),
      updated(),
      rich('Who we are', 'من نحن', [['Seven Oaks British Nursery in Al Khalidiyah, Sharjah, is responsible for the personal information described on this page. We follow the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021). This policy covers this website, our enquiry and newsletter forms and the information we hold about enrolled families.', 'حضانة سيفن أوكس البريطانية في الخالدية بالشارقة مسؤولة عن المعلومات الشخصية الموضحة في هذه الصفحة. نلتزم بقانون حماية البيانات الشخصية في دولة الإمارات (المرسوم بقانون اتحادي رقم 45 لسنة 2021). تشمل هذه السياسة هذا الموقع ونماذج الاستفسار والنشرة والمعلومات التي نحتفظ بها عن الأسر المسجّلة.']]),
      table('What we collect and why', 'ما الذي نجمعه ولماذا', ['Information', 'When you give it', 'Why we use it'], ['المعلومات', 'متى تقدمونها', 'لماذا نستخدمها'], [
        ['Name, email, phone, your child’s age, your message', 'When you send an enquiry or book a tour', 'To answer you and arrange a visit'],
        ['Email address', 'When you join our newsletter', 'To send news and updates. You can unsubscribe at any time'],
        ['Child and parent details, documents, health and allergy information', 'When you register your child at the nursery', 'To care for your child safely, meet our legal duties and keep you informed'],
        ['Visit statistics: pages viewed, device type, country', 'Only if you accept analytics on the cookie banner', 'To see which pages are useful and improve the website'],
      ], [
        ['الاسم والبريد الإلكتروني والهاتف وعمر طفلكم ورسالتكم', 'عند إرسال استفسار أو حجز زيارة', 'للرد عليكم وترتيب الزيارة'],
        ['البريد الإلكتروني', 'عند الاشتراك في نشرتنا', 'لإرسال الأخبار والمستجدات. يمكنكم إلغاء الاشتراك في أي وقت'],
        ['بيانات الطفل وولي الأمر والمستندات والمعلومات الصحية والحساسية', 'عند تسجيل طفلكم في الحضانة', 'لرعاية طفلكم بأمان والوفاء بالتزاماتنا القانونية وإبقائكم على اطلاع'],
        ['إحصاءات الزيارة: الصفحات المعروضة ونوع الجهاز والدولة', 'فقط إذا وافقتم على التحليلات في شريط الكوكيز', 'لمعرفة الصفحات المفيدة وتحسين الموقع'],
      ]),
      rich('How we use your information', 'كيف نستخدم معلوماتكم', [['We use personal information only for the reasons above. We never sell it and we never use it for anything you would not expect.', 'نستخدم المعلومات الشخصية فقط للأسباب المذكورة أعلاه. لا نبيعها أبداً ولا نستخدمها فيما لا تتوقعونه.']], [
        ['Photographs and videos of children are published only with written consent from a parent, and you can withdraw consent at any time.', 'لا تُنشر صور الأطفال ومقاطع الفيديو إلا بموافقة خطية من أحد الوالدين، ويمكنكم سحب الموافقة في أي وقت.'],
        ['Health and allergy information is shared only with staff who need it to keep your child safe.', 'لا تُشارك المعلومات الصحية ومعلومات الحساسية إلا مع الموظفات اللواتي يحتجنها لسلامة طفلكم.'],
        ['We keep information only for as long as we need it. See our Data Retention Policy.', 'نحتفظ بالمعلومات فقط للمدة اللازمة. راجعوا سياسة الاحتفاظ بالبيانات.'],
      ]),
      rich('Cookies and analytics', 'ملفات تعريف الارتباط والتحليلات', [['If you click Accept on our cookie banner, we remember your visit with a small anonymous identifier so we can count visitors and see which pages are useful. If you later send an enquiry or join our newsletter, we may link that record to the email address you give us. If you decline, we only count the visit anonymously and keep no identifier. You can decline and still use the whole website. Read the Cookie Policy for details.', 'إذا نقرتم «موافق» على شريط الكوكيز فإننا نتذكر زيارتكم بمعرّف مجهول صغير لنحصي الزوار ونعرف الصفحات المفيدة. وإذا أرسلتم لاحقاً استفساراً أو اشتركتم في النشرة فقد نربط ذلك السجل بالبريد الذي تقدمونه. وإذا رفضتم نكتفي بعدّ الزيارة دون معرّف. يمكنكم الرفض واستخدام الموقع كاملاً. اقرأوا سياسة ملفات تعريف الارتباط للتفاصيل.']]),
      rich('Follow-up emails', 'رسائل المتابعة', [['If you gave us your email address and agreed to hear from us, we may send a few follow-up messages, for example to invite you to visit or to tell you about places for the new term. Every message has an unsubscribe link and we stop as soon as you use it.', 'إذا زودتمونا ببريدكم ووافقتم على التواصل فقد نرسل بضع رسائل متابعة، كدعوتكم للزيارة أو إعلامكم بالأماكن المتاحة للفصل الجديد. في كل رسالة رابط لإلغاء الاشتراك ونتوقف فور استخدامه.']]),
      rich('Who sees your information', 'من يطّلع على معلوماتكم', [['Only nursery staff who need it can see your information. We use trusted providers to run the website, send emails and store pictures. They may only act on our instructions and must protect the data, and some may store it outside the UAE under contracts that keep it safe. We share information with authorities only when the law requires it or to protect a child.', 'لا يطّلع على معلوماتكم إلا موظفو الحضانة الذين يحتاجونها. نستعين بمزوّدين موثوقين لتشغيل الموقع وإرسال البريد وحفظ الصور، ولا يعملون إلا بتعليماتنا ويلتزمون بحماية البيانات، وقد يخزّن بعضهم البيانات خارج الإمارات بموجب عقود تحفظها. ولا نشارك المعلومات مع الجهات الرسمية إلا عندما يوجب القانون ذلك أو لحماية طفل.']]),
      rich('Your rights', 'حقوقكم', [['You have the right to:', 'لكم الحق في:']], [
        ['ask what information we hold about you and your child and receive a copy', 'طلب معرفة المعلومات التي نحتفظ بها عنكم وعن طفلكم والحصول على نسخة'], ['ask us to correct anything that is wrong', 'طلب تصحيح أي معلومة خاطئة'], ['ask us to delete your information or limit how we use it', 'طلب حذف معلوماتكم أو تقييد استخدامها'],
        ['object to a particular use, and withdraw your consent at any time', 'الاعتراض على استخدام معيّن وسحب موافقتكم في أي وقت'], ['complain to the UAE Data Office if you feel we have not handled your data properly', 'تقديم شكوى إلى مكتب الإمارات للبيانات إذا شعرتم أننا لم نتعامل مع بياناتكم بالشكل الصحيح'],
      ]),
      rich('How to use your rights', 'كيف تمارسون حقوقكم', [['Contact us using the details below. We will confirm who you are, answer within a reasonable time and tell you plainly what we can and cannot do. Some records we must keep by law, and we will explain this if it applies.', 'تواصلوا معنا بالبيانات أدناه. سنتحقق من هويتكم ونرد خلال مدة معقولة ونوضح لكم بصراحة ما يمكننا وما لا يمكننا فعله. بعض السجلات يلزمنا القانون بحفظها وسنشرح لكم ذلك عند انطباقه.']]),
      contact(),
    ],
  },
  {
    key: 'cookie-policy', slug: 'cookie-policy', title: i('Cookie Policy', 'سياسة ملفات تعريف الارتباط'),
    metaTitle: i('Cookie Policy | Seven Oaks British Nursery', 'سياسة ملفات تعريف الارتباط | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('How Seven Oaks British Nursery uses cookies and similar storage, and how you can control them.', 'كيف تستخدم حضانة سيفن أوكس البريطانية ملفات تعريف الارتباط والتخزين المشابه وكيف يمكنكم التحكم بها.'),
    sections: [
      hero('Cookie Policy', 'سياسة ملفات تعريف الارتباط', 'The small pieces of information our website may keep on your device.', 'المعلومات الصغيرة التي قد يحفظها موقعنا على جهازكم.'),
      updated(),
      rich('What cookies are', 'ما هي ملفات تعريف الارتباط', [['Cookies and similar storage are small pieces of information saved by your browser. Some are needed for the website to work; others help us understand how the site is used. Nothing optional is switched on until you say yes.', 'ملفات تعريف الارتباط والتخزين المشابه معلومات صغيرة يحفظها متصفحكم. بعضها ضروري لعمل الموقع وبعضها يساعدنا على فهم كيفية استخدامه. ولا يُفعَّل أي شيء اختياري قبل موافقتكم.']]),
      table('What this website stores', 'ما الذي يحفظه هذا الموقع', ['Name', 'Type', 'What it does', 'How long'], ['الاسم', 'النوع', 'وظيفته', 'المدة'], [
        ['so_cookie_consent_v2', 'Necessary', 'Remembers your cookie choice', 'Until you change it or clear your browser'],
        ['so_cid', 'Necessary', 'Anonymous reference so we can prove that a choice was made (no personal details)', 'Until you clear your browser'],
        ['so_vid', 'Analytics', 'Anonymous visitor reference that lets us count visits and pages. Only used if you accept analytics', 'Until you clear your browser or ask us to erase it'],
        ['Marketing tools', 'Marketing', 'Only if the nursery switches them on and you accept them', 'Set by the provider'],
      ], [
        ['so_cookie_consent_v2', 'ضرورية', 'يتذكر اختياركم لملفات تعريف الارتباط', 'حتى تغيّروه أو تمسحوا المتصفح'],
        ['so_cid', 'ضرورية', 'مرجع مجهول يثبت أن اختياراً قد تم (دون بيانات شخصية)', 'حتى تمسحوا المتصفح'],
        ['so_vid', 'تحليلات', 'مرجع زائر مجهول يتيح لنا عدّ الزيارات والصفحات. لا يُستخدم إلا بموافقتكم على التحليلات', 'حتى تمسحوا المتصفح أو تطلبوا حذفه'],
        ['أدوات التسويق', 'تسويق', 'فقط إذا فعّلتها الحضانة ووافقتم عليها', 'يحددها المزوّد'],
      ]),
      rich('Your choices', 'اختياراتكم', [['You decide which optional types to allow in the cookie banner, and you can change your mind at any time.', 'تقررون الأنواع الاختيارية التي تسمحون بها في شريط الكوكيز ويمكنكم تغيير رأيكم في أي وقت.']], [
        ['Open “Cookie settings” at the bottom of any page and choose again.', 'افتحوا «إعدادات الكوكيز» أسفل أي صفحة واختاروا من جديد.'],
        ['Or clear this site’s data in your browser settings.', 'أو امسحوا بيانات هذا الموقع من إعدادات المتصفح.'],
        ['If your browser sends a “Do Not Track” signal, we treat it as a refusal of analytics.', 'إذا أرسل متصفحكم إشارة «عدم التتبع» نعتبرها رفضاً للتحليلات.'],
      ]),
      callout('tip', 'smile', 'You can say no and still use everything', 'يمكنكم الرفض ومواصلة الاستخدام', 'Declining analytics or marketing does not stop any part of the website from working.', 'رفض التحليلات أو التسويق لا يوقف أي جزء من عمل الموقع.'),
      contact(),
    ],
  },
  {
    key: 'terms-and-conditions', slug: 'terms-and-conditions', title: i('Terms & Conditions', 'الشروط والأحكام'),
    metaTitle: i('Terms & Conditions | Seven Oaks British Nursery', 'الشروط والأحكام | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('The terms for using the Seven Oaks British Nursery website.', 'شروط استخدام موقع حضانة سيفن أوكس البريطانية.'),
    sections: [
      hero('Terms & Conditions', 'الشروط والأحكام', 'Please read these terms before using our website.', 'يرجى قراءة هذه الشروط قبل استخدام موقعنا.'),
      updated(),
      rich('Using this website', 'استخدام هذا الموقع', [['The information on this website is general guidance about Seven Oaks British Nursery. It is not a contract. Places, dates and arrangements are confirmed in writing during admissions, and the nursery’s Conditions of Enrolment apply once your child is registered.', 'المعلومات في هذا الموقع إرشادات عامة عن حضانة سيفن أوكس البريطانية وليست عقداً. تُؤكَّد المقاعد والمواعيد والترتيبات كتابياً أثناء التسجيل، وتسري شروط التسجيل بالحضانة بعد تسجيل طفلكم.']]),
      rich('Please do', 'يرجى', [['We ask everyone who uses this website to:', 'نطلب من كل مستخدم لهذا الموقع:']], [
        ['give accurate information in our forms', 'تقديم معلومات صحيحة في نماذجنا'], ['respect the privacy of children and families shown on the website', 'احترام خصوصية الأطفال والأسر الظاهرين في الموقع'], ['not try to damage, overload or gain unauthorised access to the website or its systems', 'عدم محاولة إتلاف الموقع أو أنظمته أو إثقالها أو الدخول إليها دون إذن'],
      ]),
      rich('Our content', 'محتوانا', [['Text, photographs, logos and design on this website belong to Seven Oaks British Nursery or its licensors. Photographs of children are shown with parental consent. Please ask us before copying, sharing outside the website, or reusing any of it.', 'النصوص والصور والشعارات والتصميم في هذا الموقع مملوكة لحضانة سيفن أوكس البريطانية أو لمرخّصيها. وتُعرض صور الأطفال بموافقة أولياء الأمور. يرجى طلب الإذن قبل نسخ أي منها أو مشاركتها خارج الموقع أو إعادة استخدامها.']]),
      rich('Enquiries and your information', 'الاستفسارات ومعلوماتكم', [['When you send an enquiry you agree that we may contact you about it. We handle your information as described in our Privacy Policy.', 'عند إرسال استفسار فإنكم توافقون على أن نتواصل معكم بشأنه. ونتعامل مع معلوماتكم كما هو موضح في سياسة الخصوصية.']]),
      rich('Links and availability', 'الروابط والتوفر', [['We link to other websites for your convenience and are not responsible for their content. We work to keep this website available and accurate, but we cannot promise it will always be free of interruptions or mistakes.', 'نضع روابط لمواقع أخرى لتسهيل الأمر علينا ولسنا مسؤولين عن محتواها. نسعى إلى إبقاء هذا الموقع متاحاً ودقيقاً لكن لا يمكننا ضمان خلوه دائماً من الانقطاع أو الأخطاء.']]),
      rich('Law and changes', 'القانون والتغييرات', [['These terms are governed by the laws of the United Arab Emirates and the Emirate of Sharjah. We may update them from time to time; the date at the top shows the latest version.', 'تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة وإمارة الشارقة. قد نحدّثها من وقت لآخر ويُظهر التاريخ في أعلى الصفحة آخر نسخة.']]),
      contact(),
    ],
  },
  {
    key: 'data-protection', slug: 'data-protection', title: i('Data Protection Policy', 'سياسة حماية البيانات'),
    metaTitle: i('Data Protection Policy | Seven Oaks British Nursery', 'سياسة حماية البيانات | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('How Seven Oaks British Nursery protects personal data.', 'كيف تحمي حضانة سيفن أوكس البريطانية البيانات الشخصية.'),
    sections: [
      hero('Data Protection Policy', 'سياسة حماية البيانات', 'The safeguards that protect children’s and families’ information.', 'الضمانات التي تحمي معلومات الأطفال والأسر.'),
      updated(),
      rich('Our approach', 'نهجنا', [['We collect only what we need, keep it secure and use it only for the reasons we told you. Information about children receives extra care. These are the principles every member of staff follows.', 'نجمع فقط ما نحتاجه ونحفظه بأمان ونستخدمه فقط للأسباب التي أبلغناكم بها. وتحظى معلومات الأطفال بعناية إضافية. هذه هي المبادئ التي تلتزم بها كل موظفة.']], [
        ['Fair and lawful: we explain what we collect and why.', 'العدالة والقانونية: نوضح ما نجمعه ولماذا.'], ['Only what is needed: we do not collect information “just in case”.', 'ما يلزم فقط: لا نجمع معلومات «تحسباً».'], ['Accurate: we correct mistakes when we find them or you tell us.', 'الدقة: نصحح الأخطاء عندما نجدها أو تخبروننا بها.'],
        ['Kept only as long as needed: see our Data Retention Policy.', 'الاحتفاظ للمدة اللازمة فقط: راجعوا سياسة الاحتفاظ بالبيانات.'], ['Secure and confidential: only the right people can see it.', 'الأمان والسرية: لا يراها إلا الأشخاص المناسبون.'],
      ]),
      table('How we keep data safe', 'كيف نحمي البيانات', ['Safeguard', 'What it means in practice'], ['الضمانة', 'ما تعنيه عملياً'], [
        ['Personal accounts', 'Everyone who edits the website has their own account, and can use two-step verification'], ['Least access', 'Staff see only what their role needs'], ['Encrypted secrets', 'Sensitive settings and keys are stored encrypted'],
        ['Activity record', 'Every change in the admin system is recorded with who made it and when'], ['Photo consent', 'Children’s photos are published only with written parental consent'], ['Paper records', 'Locked away and shown only to authorised staff'],
      ], [
        ['حسابات شخصية', 'لكل من يعدّل الموقع حسابه الخاص ويمكنه استخدام التحقق بخطوتين'], ['أقل صلاحية', 'تطّلع الموظفات على ما يحتاجه دورهن فقط'], ['أسرار مشفّرة', 'تُحفظ الإعدادات والمفاتيح الحساسة مشفّرة'],
        ['سجل النشاط', 'يُسجَّل كل تغيير في النظام الإداري مع من أجراه ومتى'], ['موافقة الصور', 'لا تُنشر صور الأطفال إلا بموافقة خطية من الأهل'], ['السجلات الورقية', 'محفوظة بقفل ولا تُعرض إلا على الموظفين المخوّلين'],
      ]),
      rich('If something goes wrong', 'إذا حدث خلل', [['If personal data is ever lost, stolen or seen by someone who should not see it, we act quickly to limit the harm, tell the families affected and report it to the authorities where the law requires, then we learn from it.', 'إذا فُقدت بيانات شخصية أو سُرقت أو اطّلع عليها من لا ينبغي له، نتحرك بسرعة للحد من الضرر ونُبلغ الأسر المتأثرة ونبلّغ الجهات المختصة حيث يوجب القانون ثم نتعلم من ذلك.']]),
      rich('Your rights and who is responsible', 'حقوقكم والمسؤول', [['The nursery manager is responsible for data protection and for answering your requests. You may ask to see, correct, delete or restrict the use of your data, object to its use and withdraw consent at any time. We reply within a reasonable time.', 'مديرة الحضانة مسؤولة عن حماية البيانات والرد على طلباتكم. يمكنكم طلب الاطلاع على بياناتكم أو تصحيحها أو حذفها أو تقييد استخدامها والاعتراض على استخدامها وسحب الموافقة في أي وقت. نرد خلال مدة معقولة.']]),
      contact(),
    ],
  },
  {
    key: 'data-retention', slug: 'data-retention', title: i('Data Retention Policy', 'سياسة الاحتفاظ بالبيانات'),
    metaTitle: i('Data Retention Policy | Seven Oaks British Nursery', 'سياسة الاحتفاظ بالبيانات | حضانة سيفن أوكس البريطانية'),
    metaDescription: i('How long Seven Oaks British Nursery keeps different kinds of information.', 'المدة التي تحتفظ فيها حضانة سيفن أوكس البريطانية بأنواع المعلومات المختلفة.'),
    sections: [
      hero('Data Retention Policy', 'سياسة الاحتفاظ بالبيانات', 'How long we keep information, and when we delete it.', 'المدة التي نحتفظ فيها بالمعلومات ومتى نحذفها.'),
      updated(),
      rich('Why we set time limits', 'لماذا نضع حدوداً زمنية', [['We do not keep personal information for longer than we need it. When the time is up, it is securely deleted or made anonymous.', 'لا نحتفظ بالمعلومات الشخصية لمدة أطول من اللازم. وعند انتهاء المدة تُحذف بأمان أو تُجهَّل هويتها.']]),
      table('How long we keep things', 'كم نحتفظ بالمعلومات', ['Information', 'How long we keep it'], ['المعلومات', 'مدة الاحتفاظ'], [
        ['Website enquiries that do not lead to enrolment', '12 months'], ['Newsletter subscribers', 'Until you unsubscribe'], ['Anonymous visit statistics', '13 months'], ['Cookie choice records', '3 years'],
        ['Enrolled children’s files (registration, health, learning records)', 'While your child attends and afterwards for the period required by education and safeguarding rules'], ['Accident, incident and safeguarding records', 'For the period required by law and safeguarding guidance'], ['Photographs and videos used with consent', 'Until consent is withdrawn, then removed'], ['Admin activity records', '2 years'],
      ], [
        ['استفسارات الموقع التي لا تنتهي بالتسجيل', '12 شهراً'], ['مشتركو النشرة', 'حتى إلغاء الاشتراك'], ['إحصاءات الزيارة المجهولة', '13 شهراً'], ['سجلات اختيار ملفات تعريف الارتباط', '3 سنوات'],
        ['ملفات الأطفال المسجّلين (التسجيل والصحة وسجلات التعلّم)', 'طوال التحاق الطفل وبعده للمدة التي تقتضيها قواعد التعليم وحماية الطفل'], ['سجلات الحوادث وحماية الطفل', 'للمدة التي يقتضيها القانون وإرشادات حماية الطفل'], ['الصور ومقاطع الفيديو المستخدمة بموافقة', 'حتى سحب الموافقة ثم تُزال'], ['سجلات نشاط النظام الإداري', 'سنتان'],
      ], ['These periods can be changed by the nursery if the law or guidance changes. Always check with the office for your own records.', 'يمكن للحضانة تغيير هذه المدد إذا تغيّر القانون أو الإرشادات. يرجى مراجعة المكتب بشأن سجلاتكم الخاصة.']),
      rich('Asking us to delete your information', 'طلب حذف معلوماتكم', [['You can ask us to delete your information sooner. Contact us and we will tell you what we can delete straight away and what we must keep by law, and why.', 'يمكنكم طلب حذف معلوماتكم مبكراً. تواصلوا معنا وسنخبركم بما يمكن حذفه فوراً وما يلزمنا قانوناً بحفظه ولماذا.']]),
      rich('How we delete', 'كيف نحذف', [['Electronic records are permanently deleted from our systems and backups on a regular schedule. Paper records are shredded. Photographs removed from the website are also removed from our picture library.', 'تُحذف السجلات الإلكترونية نهائياً من أنظمتنا ونسخها الاحتياطية وفق جدول منتظم، وتُمزّق السجلات الورقية. وتُزال الصور التي تُسحب من الموقع من مكتبة الصور لدينا أيضاً.']]),
      contact(),
    ],
  },
];
void btn;

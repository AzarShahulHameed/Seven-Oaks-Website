/** Built-in defaults for every email the system sends. The admin can override any of them in Admin → Email templates. */
export type I18n = { en: string; ar: string };
export interface TemplateDef { key: string; name: string; description: string; vars: { name: string; sample: string; help: string }[]; subject: I18n; heading: I18n; body: I18n; buttonLabel?: I18n; hasButton: boolean }

const v = (name: string, sample: string, help: string) => ({ name, sample, help });

export const TEMPLATES: TemplateDef[] = [
  {
    key: 'welcome', name: 'Welcome / team invitation', description: 'Sent when you invite a new person to the admin dashboard.', hasButton: true,
    vars: [v('name', 'Sara', 'The new person’s name'), v('link', 'https://example.com/admin/reset?invite=1', 'Their set-password link (required)')],
    subject: { en: 'Welcome to {{nurseryName}}: set your password', ar: 'مرحباً بك في {{nurseryName}}: عيّن كلمة المرور' },
    heading: { en: 'Welcome, {{name}}!', ar: 'مرحباً {{name}}!' },
    body: { en: 'You have been invited to help manage the {{nurseryName}} website.\n\nUse the button below to choose your password. The link works for 72 hours.', ar: 'تمت دعوتك للمساعدة في إدارة موقع {{nurseryName}}.\n\nاستخدم الزر أدناه لاختيار كلمة المرور. الرابط صالح لمدة 72 ساعة.' },
    buttonLabel: { en: 'Set my password', ar: 'تعيين كلمة المرور' },
  },
  {
    key: 'enquiry-admin', name: 'New enquiry (to your team)', description: 'Sent to the notification recipients when a parent submits the contact form.', hasButton: true,
    vars: [v('parentName', 'Aisha Khan', 'Parent name'), v('childName', 'Omar', 'Child name'), v('email', 'aisha@example.com', 'Parent email'), v('phone', '+971 50 000 0000', 'Parent phone'), v('program', 'Nursery (3–4 years)', 'Programme they chose'), v('visitDate', '2026-11-02', 'Preferred visit date'), v('message', 'We would love to see the nursery.', 'Their message'), v('link', 'https://example.com/admin/leads', 'Link to the enquiry in the dashboard')],
    subject: { en: 'New enquiry from {{parentName}}', ar: 'استفسار جديد من {{parentName}}' },
    heading: { en: 'New enquiry', ar: 'استفسار جديد' },
    body: { en: '**Parent:** {{parentName}}\n**Child:** {{childName}}\n**Email:** {{email}}\n**Phone:** {{phone}}\n**Programme:** {{program}}\n**Preferred visit:** {{visitDate}}\n\n{{message}}', ar: '**ولي الأمر:** {{parentName}}\n**الطفل:** {{childName}}\n**البريد:** {{email}}\n**الهاتف:** {{phone}}\n**البرنامج:** {{program}}\n**الزيارة المفضلة:** {{visitDate}}\n\n{{message}}' },
    buttonLabel: { en: 'Open in dashboard', ar: 'فتح في لوحة التحكم' },
  },
  {
    key: 'enquiry-reply', name: 'Enquiry confirmation (to the parent)', description: 'Automatic reply the parent receives right after sending the contact form.', hasButton: false,
    vars: [v('parentName', 'Aisha', 'Parent name'), v('childName', 'Omar', 'Child name'), v('program', 'Nursery (3–4 years)', 'Programme they chose'), v('nurseryName', 'Seven Oaks British Nursery', 'Your nursery name'), v('phone', '+971 50 000 0000', 'Your phone number')],
    subject: { en: 'Thank you for contacting {{nurseryName}}', ar: 'شكراً لتواصلكم مع {{nurseryName}}' },
    heading: { en: 'Thank you, {{parentName}}', ar: 'شكراً لكم {{parentName}}' },
    body: { en: 'We have received your enquiry about {{childName}} and a member of our team will contact you very soon.\n\nIf you would like to speak to us sooner, please call {{phone}}.\n\nWarm regards,\n{{nurseryName}}', ar: 'استلمنا استفساركم بخصوص {{childName}} وسيتواصل معكم أحد أعضاء فريقنا قريباً جداً.\n\nإذا رغبتم في التحدث إلينا بشكل أسرع، يرجى الاتصال على {{phone}}.\n\nمع خالص التحية،\n{{nurseryName}}' },
  },
  {
    key: 'admissions', name: 'Admissions information', description: 'Sent from a lead when you press “Send admissions info”.', hasButton: true,
    vars: [v('parentName', 'Aisha', 'Parent name'), v('childName', 'Omar', 'Child name'), v('nurseryName', 'Seven Oaks British Nursery', 'Your nursery name'), v('phone', '+971 50 000 0000', 'Your phone number'), v('link', 'https://example.com/en/admissions', 'Your admissions page')],
    subject: { en: 'Admissions at {{nurseryName}}', ar: 'القبول في {{nurseryName}}' },
    heading: { en: 'Joining {{nurseryName}}', ar: 'الانضمام إلى {{nurseryName}}' },
    body: { en: 'Dear {{parentName}},\n\nThank you for your interest in {{nurseryName}} for {{childName}}. You can read how admissions work and the documents you will need on our admissions page.\n\nWe would be delighted to show you around. Reply to this email or call {{phone}} to arrange a visit.', ar: 'عزيزي {{parentName}}،\n\nشكراً لاهتمامكم بـ {{nurseryName}} لـ {{childName}}. يمكنكم الاطلاع على آلية القبول والمستندات المطلوبة في صفحة القبول.\n\nيسعدنا أن نريكم الحضانة. ردوا على هذا البريد أو اتصلوا على {{phone}} لتحديد موعد للزيارة.' },
    buttonLabel: { en: 'Read about admissions', ar: 'اقرأ عن القبول' },
  },
  {
    key: 'password-reset', name: 'Password reset link', description: 'Sent when someone presses “Forgot password”.', hasButton: true,
    vars: [v('name', 'Sara', 'The person’s name'), v('link', 'https://example.com/admin/reset?token=…', 'The reset link (required)')],
    subject: { en: 'Reset your admin password', ar: 'إعادة تعيين كلمة مرور لوحة التحكم' },
    heading: { en: 'Reset your password', ar: 'إعادة تعيين كلمة المرور' },
    body: { en: 'Hello {{name}},\n\nWe received a request to reset your admin password. The link works once and expires in 1 hour.\n\nIf this was not you, you can safely ignore this email.', ar: 'مرحباً {{name}}،\n\nاستلمنا طلباً لإعادة تعيين كلمة مرور لوحة التحكم. الرابط يعمل مرة واحدة وينتهي خلال ساعة.\n\nإذا لم تكن أنت، يمكنك تجاهل هذه الرسالة.' },
    buttonLabel: { en: 'Choose a new password', ar: 'اختيار كلمة مرور جديدة' },
  },
  {
    key: 'verification', name: 'Verification code', description: 'The 6-digit code for changing your email or password.', hasButton: false,
    vars: [v('name', 'Sara', 'The person’s name'), v('code', '482913', 'The 6-digit code (required)'), v('minutes', '10', 'How long it works'), v('purpose', 'change your email address', 'What the code is for')],
    subject: { en: 'Your verification code: {{code}}', ar: 'رمز التحقق الخاص بك: {{code}}' },
    heading: { en: 'Your verification code', ar: 'رمز التحقق الخاص بك' },
    body: { en: 'Hello {{name}},\n\nUse this code to {{purpose}}:\n\n# {{code}}\n\nIt works for {{minutes}} minutes. If you did not ask for it, please change your password.', ar: 'مرحباً {{name}}،\n\nاستخدم هذا الرمز لـ {{purpose}}:\n\n# {{code}}\n\nيعمل لمدة {{minutes}} دقائق. إذا لم تطلبه، يرجى تغيير كلمة المرور.' },
  },
  {
    key: 'newsletter', name: 'Newsletter', description: 'A template for news you send to families. Use “Send a test” to check it.', hasButton: true,
    vars: [v('name', 'Aisha', 'Reader name'), v('nurseryName', 'Seven Oaks British Nursery', 'Your nursery name'), v('link', 'https://example.com/en', 'Where the button goes')],
    subject: { en: 'News from {{nurseryName}}', ar: 'أخبار من {{nurseryName}}' },
    heading: { en: 'This month at {{nurseryName}}', ar: 'هذا الشهر في {{nurseryName}}' },
    body: { en: 'Hello {{name}},\n\nHere is what has been happening in our classrooms and what is coming next.\n\nWe love sharing our little acorns’ journey with you.', ar: 'مرحباً {{name}}،\n\nإليكم ما يحدث في فصولنا وما ينتظرنا.\n\nيسعدنا أن نشارككم رحلة براعمنا الصغيرة.' },
    buttonLabel: { en: 'Visit our website', ar: 'زيارة موقعنا' },
  },
];

export type SocialKey = 'facebook' | 'instagram' | 'whatsapp' | 'youtube' | 'tiktok' | 'x' | 'linkedin' | 'snapchat' | 'website';
export const SOCIAL_KEYS: SocialKey[] = ['instagram', 'facebook', 'whatsapp', 'youtube', 'tiktok', 'x', 'linkedin', 'snapchat', 'website'];
export const FONTS: Record<string, string> = {
  arial: "Arial,Helvetica,sans-serif", tahoma: "Tahoma,Arial,sans-serif", verdana: "Verdana,Geneva,sans-serif", trebuchet: "'Trebuchet MS',Arial,sans-serif", georgia: "Georgia,'Times New Roman',serif",
};
export interface EmailBrand {
  headerBg: string; accent: string; buttonBg: string; buttonText: string; headingColor: string; textColor: string;
  showLogo: boolean; logoUrl: string; logoAlign: 'start' | 'center' | 'end'; logoSize: 'small' | 'medium' | 'large'; logoOnWhite: boolean;
  fontFamily: keyof typeof FONTS; fontSize: number;
  footerText: I18n; address: I18n; phone: string; email: string;
  social: Record<SocialKey, string>; socialStyle: 'brand' | 'dark';
}
export const DEFAULT_BRAND: EmailBrand = {
  headerBg: '#1f4d2b', accent: '#c9a227', buttonBg: '#2f6b3a', buttonText: '#ffffff', headingColor: '#1f4d2b', textColor: '#1f2937',
  showLogo: true, logoUrl: '', logoAlign: 'start', logoSize: 'medium', logoOnWhite: true,
  fontFamily: 'arial', fontSize: 16,
  footerText: { en: 'You are receiving this email because you contacted {{nurseryName}} or have an account with us.', ar: 'تصلك هذه الرسالة لأنك تواصلت مع {{nurseryName}} أو لديك حساب لدينا.' },
  address: { en: '', ar: '' }, phone: '', email: '',
  social: { facebook: '', instagram: '', whatsapp: '', youtube: '', tiktok: '', x: '', linkedin: '', snapchat: '', website: '' }, socialStyle: 'brand',
};

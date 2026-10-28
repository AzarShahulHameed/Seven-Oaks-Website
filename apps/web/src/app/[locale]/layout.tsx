import '../globals.css';
import { notFound } from 'next/navigation';
import { getBootstrap } from '@/lib/api';
import { dirOf, isLocale, localHref, t } from '@/lib/i18n';
import { Beacon } from '@/components/Beacon';
import { MotionProvider, RouteTransitions, ScrollProgress } from '@/components/motion';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Tracking } from '@/components/Tracking';
import { Protect } from '@/components/Protect';
import { fontUrls, tokensToCss } from '@/lib/theme';
import { Announcement, Footer, Header, WhatsAppButton } from '@/components/chrome';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const b = (await getBootstrap()) ?? { theme: {}, settings: {}, menus: {} };
  const maint = b.settings['public.maintenance'];
  const seo = b.settings['public.seo'] ?? {};
  const favicon = String(b.settings['public.branding']?.faviconUrl ?? '');
  const analytics = b.settings['public.analytics'] ?? {};
  const cookies = b.settings['public.cookies'] ?? {};
  const prot = b.settings['public.protection'] ?? {};
  const ar = locale === 'ar';
  const D = (k: string, en: string, arT: string) => t(cookies[k], locale) || (ar ? arT : en);

  return (
    <html lang={locale} dir={dirOf(locale)}>
      <head>
        {fontUrls(b.theme).map((u) => <link key={u} rel="stylesheet" href={u} />)}
        <style dangerouslySetInnerHTML={{ __html: tokensToCss(b.theme) }} />
        {/^(https:\/\/|\/(?!\/))/.test(favicon) && <link rel="icon" href={favicon} />}
        {/^[A-Za-z0-9_-]{10,100}$/.test(String(analytics.searchConsole ?? '')) && <meta name="google-site-verification" content={analytics.searchConsole} />}
        <meta name="application-name" content={t(seo.siteName, locale)} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {maint?.enabled ? (
          <main className="grid min-h-screen place-items-center p-8 text-center"><h1>{t(maint.message, locale)}</h1></main>
        ) : (
          <MotionProvider>
            <ScrollProgress />
            <RouteTransitions />
            <SmoothScroll />
            <Beacon />
            <Announcement locale={locale} b={b as any} />
            <Header locale={locale} b={b as any} />
            {children}
            <Footer locale={locale} b={b as any} />
            <WhatsAppButton locale={locale} b={b as any} />
            {prot.enabled !== false && <Protect rightClick={prot.disableRightClick !== false} drag={prot.disableDrag !== false} saveKey={!!prot.blockSaveShortcut} />}
            {cookies.enabled !== false && (
              <Tracking
                locale={locale} gaId={analytics.enabled !== false ? String(analytics.gaId ?? '') : ''} gtmId={analytics.enabled !== false ? String(analytics.gtmId ?? '') : ''} pixelId={analytics.enabled !== false ? String(analytics.metaPixelId ?? '') : ''} version={String(cookies.version ?? '1')}
                text={D('text', 'We use cookies to make this website work and, only if you agree, to understand how it is used. You choose.', 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع، ولفهم كيفية استخدامه فقط إذا وافقتم. الاختيار لكم.')}
                accept={D('accept', 'Accept all', 'قبول الكل')} decline={D('decline', 'Necessary only', 'الضرورية فقط')} customize={D('customize', 'Customise', 'تخصيص')} save={D('save', 'Save my choices', 'حفظ اختياراتي')}
                policyLabel={D('policyLabel', 'Cookie Policy', 'سياسة الكوكيز')} policyHref={cookies.policyHref ? localHref(cookies.policyHref, locale) : ''}
                labels={{ title: D('title', 'Cookie settings', 'إعدادات الكوكيز'), necessary: D('necessary', 'Necessary', 'ضرورية'), necessaryText: D('necessaryText', 'Keep the site secure and remember your choice. Always on.', 'تحافظ على أمان الموقع وتتذكر اختياركم. مفعّلة دائماً.'), analytics: D('analyticsLabel', 'Analytics', 'التحليلات'), analyticsText: D('analyticsText', 'Lets us count visits and see which pages help families. We keep your IP address and, if you later send us an enquiry, link it to your email so our team can follow up. No advertising.', 'تساعدنا على عدّ الزيارات ومعرفة الصفحات المفيدة للعائلات. نحتفظ بعنوان IP الخاص بكم، وإذا أرسلتم لنا استفساراً لاحقاً نربطه ببريدكم ليتابع فريقنا معكم. بلا إعلانات.'), marketing: D('marketingLabel', 'Marketing', 'التسويق'), marketingText: D('marketingText', 'Measure our advertising (for example Meta Pixel).', 'قياس حملاتنا الإعلانية (مثل Meta Pixel).') }}
              />
            )}
          </MotionProvider>
        )}
      </body>
    </html>
  );
}

'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Keeps the visitor on the same page. When slugs differ per language, the page's hreflang alternates point to the right URL.
export function LangSwitch({ locale }: { locale: string }) {
  const path = usePathname() || `/${locale}`;
  const other = locale === 'ar' ? 'en' : 'ar';
  const href = path.replace(new RegExp(`^/${locale}(?=/|$)`), `/${other}`);
  return (
    <Link href={href} hrefLang={other} lang={other} className="rounded-btn border border-primary px-3 py-1 text-sm font-bold text-primary hover:bg-primary hover:text-white">
      {other === 'ar' ? 'العربية' : 'English'}
    </Link>
  );
}

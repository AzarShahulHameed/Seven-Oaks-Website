import { NextResponse, type NextRequest } from 'next/server';

const locales = ['en', 'ar'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return NextResponse.next();
  const url = req.nextUrl.clone();
  const def = process.env.DEFAULT_LOCALE && locales.includes(process.env.DEFAULT_LOCALE) ? process.env.DEFAULT_LOCALE : 'en';
  url.pathname = `/${def}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!api|admin|preview|m/|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'] };

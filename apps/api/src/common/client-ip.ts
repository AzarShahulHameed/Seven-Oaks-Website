import { isIP } from 'net';
import type { Request } from 'express';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim() ?? '';

/** The visitor's real IP address. Behind Vercel and Render, `req.ip` is the proxy's address, so the proxy headers are read first. */
export function clientIp(req: Request): string {
  const h = req.headers;
  for (const c of [first(h['x-vercel-forwarded-for']), first(h['cf-connecting-ip']), first(h['x-forwarded-for']), req.ip ?? '']) {
    const v = c.replace(/^::ffff:/, '');
    if (isIP(v)) return v;
  }
  return '';
}

/** "full" keeps the address, "masked" hides the last part (203.0.113.0 / 2001:db8:1::), "off" keeps nothing. */
export function shapeIp(ip: string, mode: 'full' | 'masked' | 'off'): string | null {
  if (!ip || mode === 'off') return null;
  if (mode === 'full') return ip;
  if (isIP(ip) === 4) return ip.split('.').slice(0, 3).join('.') + '.0';
  return ip.split(':').slice(0, 3).join(':') + '::';
}

/** A short, friendly "Chrome on Windows" from the User-Agent text. */
export function browserOf(ua = ''): string {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return o ? `${b} on ${o}` : b;
}

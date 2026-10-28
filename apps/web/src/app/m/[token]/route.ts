import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getBootstrap } from '@/lib/api';
import { SAFE_PATH, unb64 } from '@/lib/protect';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';

/** Serves library pictures from Cloudinary through this site.
 *  - Hotlink protection: a request that comes from another website (or opens the address directly in the browser) is refused.
 *  - Optional watermark on large pictures.
 *  Nothing on the web can fully stop someone from saving a picture they can see; this stops casual copying and embedding. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  let path = '';
  try { path = unb64(params.token); } catch { return new NextResponse('Not found', { status: 404 }); }
  const [cloud, ...rest] = path.split('/');
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(cloud ?? '') || !SAFE_PATH.test(rest.join('/')) || rest.join('/').includes('..')) return new NextResponse('Not found', { status: 404 });

  const b = await getBootstrap();
  const prot = b?.settings['public.protection'] ?? {};
  if (prot.enabled !== false && prot.blockHotlinking !== false) {
    const site = req.headers.get('sec-fetch-site');
    const dest = req.headers.get('sec-fetch-dest');
    const ref = req.headers.get('referer');
    const host = req.headers.get('host') ?? '';
    let refHost = ''; try { refHost = ref ? new URL(ref).host : ''; } catch { /* ignore */ }
    const allowedHosts = new Set([host, ...String(prot.allowedDomains ?? '').split(/[\s,]+/).filter(Boolean)]);
    const fromOtherSite = (site && !['same-origin', 'same-site', 'none'].includes(site)) || (refHost && !allowedHosts.has(refHost));
    const typedIntoAddressBar = dest === 'document' || dest === 'iframe' || dest === 'frame';
    if (fromOtherSite || typedIntoAddressBar) return new NextResponse('This picture can only be viewed on our website.', { status: 403, headers: { 'cache-control': 'no-store' } });
  }

  const upstream = await fetch(`https://res.cloudinary.com/${cloud}/image/upload/${rest.join('/')}`, { headers: { accept: req.headers.get('accept') ?? 'image/*' } });
  if (!upstream.ok) return new NextResponse('Not found', { status: upstream.status === 404 ? 404 : 502 });
  let body: Buffer = Buffer.from(await upstream.arrayBuffer());
  let type = upstream.headers.get('content-type') ?? 'image/webp';

  const wm = prot.watermark ?? {};
  const wmText = String(wm.enabled ? t(wm.text, 'en') || t(b?.settings['public.site']?.name, 'en') : '').replace(/[<>&"']/g, '').slice(0, 60);
  if (prot.enabled !== false && wmText && !/\.svg/i.test(type)) {
    try {
      const img = sharp(body); const meta = await img.metadata();
      if ((meta.width ?? 0) >= 700) {
        const w = meta.width!, h = meta.height ?? 400, fs = Math.max(16, Math.round(w / 38));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w - fs}" y="${h - fs}" text-anchor="end" font-family="Arial,sans-serif" font-size="${fs}" font-weight="700" fill="#ffffff" fill-opacity="0.55" stroke="#000000" stroke-opacity="0.25" stroke-width="1">${wmText}</text></svg>`;
        body = await img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).toBuffer();
      }
    } catch { /* if watermarking fails, serve the picture as it is */ }
  }
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'content-type': type,
      // "private": only the visitor's own browser keeps a copy. A shared cache could otherwise hand a cached picture to another website's visitors and bypass the check above.
      'cache-control': 'private, max-age=31536000, immutable',
      'content-disposition': 'inline', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-site',
      vary: 'Accept, Referer, Sec-Fetch-Site, Sec-Fetch-Dest',
    },
  });
}

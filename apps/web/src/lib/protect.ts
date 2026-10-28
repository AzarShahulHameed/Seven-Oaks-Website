/** Turns a Cloudinary picture address into an opaque same-site address (/m/<token>), so the real storage address is never in the page.
 *  The /m route checks where the request comes from (hotlink protection) and can add a watermark. Works in server and browser code. */
const CLOUD = /^https:\/\/res\.cloudinary\.com\/([A-Za-z0-9_-]{2,60})\/image\/upload\/(.+)$/;

const b64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64 = (t: string) => atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4));

export function protectUrl(url: string | undefined): string {
  if (!url) return '';
  const m = url.match(CLOUD);
  if (!m || /[^\x20-\x7e]/.test(url)) return url; // not a library picture (seed pictures etc.): leave untouched
  return `/m/${b64(`${m[1]}/${m[2]}`)}`;
}
export const SAFE_PATH = /^[A-Za-z0-9_,.:/-]{1,300}$/;

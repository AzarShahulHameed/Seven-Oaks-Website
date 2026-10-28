import sharp from 'sharp';
import { SOCIAL_PATHS } from './social-icons';

const cache = new Map<string, Buffer>();

/** A round icon (white brand glyph on a coloured circle) as a PNG, because email apps cannot show SVG. 96 px, shown at 32 px so it is sharp on phones. */
export async function socialIconPng(name: string, hex: string): Promise<Buffer | null> {
  const path = SOCIAL_PATHS[name];
  if (!path || !/^[0-9a-f]{6}$/i.test(hex)) return null;
  const key = `${name}:${hex.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="48" fill="#${hex}"/><g transform="translate(24 24) scale(2)" fill="#ffffff"><path d="${path}"/></g></svg>`;
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  if (cache.size > 200) cache.clear();
  cache.set(key, buf);
  return buf;
}

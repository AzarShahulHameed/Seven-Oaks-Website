'use client';
// Browser upload with a real progress bar. Checks size/type before sending and turns every failure into a plain sentence.
import { describeError } from './admin-api';

export const MAX_MB = 10;
export const MAX_VIDEO_MB = 100;
export const VIDEO_EXT = ['mp4', 'webm', 'mov'];
export const ACCEPT_VIDEO = '.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime';
export const isVideoFile = (f: File) => VIDEO_EXT.includes(ext(f.name)) || f.type.startsWith('video/');
export const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
export const DOC_EXT = ['pdf', 'docx', 'xlsx', 'pptx'];
export const ACCEPT = '.jpg,.jpeg,.png,.webp,.avif,.gif,.pdf,.docx,.xlsx,.pptx,.mp4,.webm,.mov,image/*,video/*,application/pdf';
export const ACCEPT_IMAGES = '.jpg,.jpeg,.png,.webp,.avif,.gif,image/jpeg,image/png,image/webp,image/avif,image/gif';

const ext = (n: string) => n.toLowerCase().split('.').pop() ?? '';
/** Returns a message when the file cannot be accepted, otherwise ''. The server re-checks the real file contents. */
export function precheck(f: File, imagesOnly = false): string {
  if (!f.size) return `“${f.name}” is empty.`;
  if (isVideoFile(f)) { if (imagesOnly) return `“${f.name}” is a video. Videos can be added from the Videos tab.`; return f.size > MAX_VIDEO_MB * 1048576 ? `“${f.name}” is ${(f.size / 1048576).toFixed(0)} MB. The video limit is ${MAX_VIDEO_MB} MB. Please compress or trim it first.` : ''; }
  if (f.size > MAX_MB * 1024 * 1024) return `“${f.name}” is ${(f.size / 1048576).toFixed(1)} MB. The limit is ${MAX_MB} MB, so please choose a smaller file.`;
  const e = ext(f.name);
  if (['heic', 'heif'].includes(e)) return `“${f.name}” is an iPhone HEIC photo. Please export it as JPG first (on iPhone: Settings → Camera → Formats → Most Compatible).`;
  if (e === 'svg') return `“${f.name}” is an SVG. For safety only JPG, PNG, WebP, AVIF and GIF pictures are accepted.`;
  const ok = imagesOnly ? IMAGE_EXT : [...IMAGE_EXT, ...DOC_EXT];
  if (!ok.includes(e) && !(f.type.startsWith('image/') && !imagesOnly)) return `“${f.name}” cannot be uploaded. Allowed: ${ok.join(', ').toUpperCase()}.`;
  return '';
}

export type UploadResult<T = any> = { ok: true; data: T } | { ok: false; error: string };
export function uploadFile<T = any>(url: string, fd: FormData, onProgress: (pct: number) => void): { promise: Promise<UploadResult<T>>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<UploadResult<T>>((resolve) => {
    xhr.open('POST', url); xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    xhr.onerror = () => resolve({ ok: false, error: 'Cannot reach the server. Check your internet connection and try again.' });
    xhr.ontimeout = () => resolve({ ok: false, error: 'The upload took too long. Try a smaller file or a faster connection.' });
    xhr.onabort = () => resolve({ ok: false, error: 'Upload cancelled.' });
    xhr.onload = async () => {
      const body = xhr.responseText;
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); try { resolve({ ok: true, data: JSON.parse(body) }); } catch { resolve({ ok: true, data: {} as T }); } return; }
      resolve({ ok: false, error: await describeError(new Response(body, { status: xhr.status, headers: { 'content-type': 'application/json' } })) });
    };
    xhr.timeout = 120_000;
    xhr.send(fd);
  });
  return { promise, cancel: () => xhr.abort() };
}

/** Uploads a video straight from the browser to Cloudinary (large files never pass through our servers), then adds it to the library. */
export function uploadVideo(f: File, meta: { altEn: string; altAr: string; showsChild: boolean }, onProgress: (pct: number) => void): { promise: Promise<UploadResult>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = (async (): Promise<UploadResult> => {
    const t = await fetch('/api/admin/media/video/ticket', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: f.name, size: f.size }) });
    if (!t.ok) return { ok: false, error: await describeError(t) };
    const k = await t.json();
    const up = await new Promise<UploadResult>((resolve) => {
      const fd = new FormData();
      fd.set('file', f); fd.set('api_key', k.apiKey); fd.set('timestamp', String(k.timestamp)); fd.set('signature', k.signature); fd.set('folder', k.folder); fd.set('public_id', k.public_id); fd.set('allowed_formats', k.allowed_formats);
      xhr.open('POST', k.uploadUrl);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
      xhr.onerror = () => resolve({ ok: false, error: 'The video upload was interrupted. Check your connection and try again.' });
      xhr.onabort = () => resolve({ ok: false, error: 'Upload cancelled.' });
      xhr.onload = () => { let j: any = {}; try { j = JSON.parse(xhr.responseText); } catch { /* not json */ } xhr.status >= 200 && xhr.status < 300 ? resolve({ ok: true, data: j }) : resolve({ ok: false, error: `Cloudinary refused the video: ${j?.error?.message ?? xhr.status}` }); };
      xhr.timeout = 15 * 60_000; xhr.ontimeout = () => resolve({ ok: false, error: 'The video took too long to upload. Try a smaller file or a faster connection.' });
      xhr.send(fd);
    });
    if (!up.ok) return up;
    const r = await fetch('/api/admin/media/video/register', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: k.id, altEn: meta.altEn, altAr: meta.altAr, showsChild: meta.showsChild, filename: f.name }) });
    if (!r.ok) return { ok: false, error: await describeError(r) };
    onProgress(100);
    return { ok: true, data: await r.json() };
  })();
  return { promise, cancel: () => xhr.abort() };
}

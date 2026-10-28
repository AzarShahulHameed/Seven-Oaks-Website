'use client';
import { useEffect } from 'react';

/** Reasonable deterrents against casually copying the nursery's photos: no right-click menu or dragging on pictures, optional save shortcut block.
 *  This cannot stop someone determined (a screenshot always works); it stops casual copying. Switched on/off in Admin → Settings → Photo protection. */
export function Protect({ rightClick, drag, saveKey }: { rightClick: boolean; drag: boolean; saveKey: boolean }) {
  useEffect(() => {
    const onPic = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('img, picture, [data-protect]');
    const ctx = (e: MouseEvent) => { if (rightClick && onPic(e.target)) e.preventDefault(); };
    const dr = (e: DragEvent) => { if (drag && onPic(e.target)) e.preventDefault(); };
    const key = (e: KeyboardEvent) => { if (saveKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault(); };
    document.addEventListener('contextmenu', ctx); document.addEventListener('dragstart', dr); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('contextmenu', ctx); document.removeEventListener('dragstart', dr); document.removeEventListener('keydown', key); };
  }, [rightClick, drag, saveKey]);
  return null;
}

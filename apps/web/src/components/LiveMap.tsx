'use client';
import { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

type Props = { lat: number; lng: number; zoom?: number; apiKey?: string; label?: string; className?: string; locale: string };
const STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f3f6ef' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#5b6b5f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe4ea' }] }, { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d3e6c7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] }, { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f6e7c1' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

let loader: Promise<any> | null = null;
function loadMaps(key: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  return (loader ??= new Promise((res, rej) => {
    w.__soMapsReady = () => res(w.google);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__soMapsReady&loading=async&v=weekly`;
    s.async = true; s.onerror = () => { loader = null; rej(new Error('maps')); };
    document.head.appendChild(s);
  }));
}

const PIN = `<svg viewBox="0 0 48 60" width="44" height="55" aria-hidden="true"><path d="M24 0C10.7 0 0 10.4 0 23.3 0 41 24 60 24 60s24-19 24-36.7C48 10.4 37.3 0 24 0z" fill="var(--colors-primary,#1f4d2b)"/><circle cx="24" cy="23" r="12" fill="#fff"/><path d="M24 15c-4 3-6 6-6 9.5 0 3.6 2.7 6.5 6 6.5s6-2.9 6-6.5c0-3.5-2-6.5-6-9.5z" fill="var(--colors-accent,#c9a227)"/></svg>`;

/** Interactive Google map with a branded, animated marker. Uses the Maps JavaScript API when a key is saved, otherwise Google's simple embed. */
export function LiveMap({ lat, lng, zoom = 16, apiKey, label, className = 'h-80', locale }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!apiKey);
  const [visible, setVisible] = useState(false);
  const dest = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  useEffect(() => {
    const el = host.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!apiKey || !visible || !host.current) return;
    let dead = false;
    (window as any).gm_authFailure = () => setFailed(true); // invalid / unrestricted-key errors fall back to the simple map
    loadMaps(apiKey).then((g) => {
      if (dead || !host.current) return;
      const pos = new g.maps.LatLng(lat, lng);
      const map = new g.maps.Map(host.current, { center: pos, zoom, styles: STYLE, zoomControl: true, fullscreenControl: true, streetViewControl: true, mapTypeControl: false, gestureHandling: 'cooperative', clickableIcons: false });
      const el = document.createElement('div');
      el.className = 'so-pin';
      el.innerHTML = `<span class="so-pin-ring"></span><span class="so-pin-ring" style="animation-delay:1s"></span><span class="so-pin-body">${PIN}</span>${label ? `<span class="so-pin-label"></span>` : ''}`;
      if (label) (el.querySelector('.so-pin-label') as HTMLElement).textContent = label;
      class Pin extends g.maps.OverlayView {
        onAdd() { this.getPanes().overlayMouseTarget.appendChild(el); }
        draw() { const p = this.getProjection().fromLatLngToDivPixel(pos); if (p) { el.style.left = `${p.x}px`; el.style.top = `${p.y}px`; } }
        onRemove() { el.remove(); }
      }
      new Pin().setMap(map);
      try { navigator.sendBeacon?.('/api/public/usage/map'); } catch { /* the meter is best effort */ }
    }).catch(() => setFailed(true));
    return () => { dead = true; };
  }, [apiKey, visible, lat, lng, zoom, label]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {failed ? (
        <iframe title="Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-full w-full border-0" src={`https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`} />
      ) : <div ref={host} className="h-full w-full bg-sage" role="application" aria-label="Map" />}
      <a href={dest} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 start-3 z-10 inline-flex items-center gap-2 rounded-btn bg-surface px-4 py-2 text-sm font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-primary hover:text-white">
        <Navigation className="h-4 w-4" aria-hidden />{locale === 'ar' ? 'احصل على الاتجاهات' : 'Get directions'}
      </a>
    </div>
  );
}

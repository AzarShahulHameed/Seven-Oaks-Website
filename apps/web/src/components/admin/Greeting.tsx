'use client';
import { useEffect, useMemo, useState } from 'react';

type Phase = 'morning' | 'afternoon' | 'evening' | 'night';
const PHASES: Record<Phase, { word: string; emoji: string; sky: string; text: string }> = {
  morning: { word: 'Good Morning', emoji: '☀️', sky: 'linear-gradient(180deg,#8ed0f5 0%,#cfeefb 55%,#fff1c9 100%)', text: '#16384a' },
  afternoon: { word: 'Good Afternoon', emoji: '🌤️', sky: 'linear-gradient(180deg,#4fb3ec 0%,#92d4f7 60%,#d6f0fb 100%)', text: '#0d2f45' },
  evening: { word: 'Good Evening', emoji: '🌇', sky: 'linear-gradient(180deg,#5b4a9a 0%,#d9728a 55%,#ffb36b 100%)', text: '#ffffff' },
  night: { word: 'Good Night', emoji: '🌙', sky: 'linear-gradient(180deg,#0b1535 0%,#18285c 60%,#2b3a77 100%)', text: '#ffffff' },
};
/** Uses the clock of the person's own device, so it follows their time zone wherever they sign in from. */
export const phaseOf = (h: number): Phase => (h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 20 ? 'evening' : 'night');

const STARS = Array.from({ length: 26 }, (_, i) => ({ x: (i * 37 + 11) % 100, y: (i * 53 + 7) % 70, d: (i % 5) * 0.6, s: 1 + (i % 3) }));

export function Greeting({ name }: { name: string }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => { const tick = () => setHour(new Date().getHours()); tick(); const id = setInterval(tick, 60_000); return () => clearInterval(id); }, []);
  const phase = hour === null ? 'morning' : phaseOf(hour);
  const P = PHASES[phase];
  const tz = useMemo(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '); } catch { return ''; } }, []);
  const date = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }), []);
  const dark = phase === 'night' || phase === 'evening';
  return (
    <section aria-label={`${P.word}, ${name}`} className="relative isolate overflow-hidden rounded-2xl p-6 shadow-sm sm:p-8" style={{ background: P.sky, color: P.text, transition: 'background 1.2s ease' }}>
      <div aria-hidden className="a-sky absolute inset-0 -z-10">
        {phase === 'night' && STARS.map((s, i) => <span key={i} className="a-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
        {phase === 'night' && <span className="a-moon" />}
        {phase === 'night' && <span className="a-shoot" />}
        {(phase === 'morning' || phase === 'afternoon') && <span className={`a-sun ${phase === 'morning' ? 'a-sun-rise' : ''}`} />}
        {phase === 'evening' && <span className="a-sun a-sun-set" />}
        {phase !== 'night' && <><span className="a-cloud a-cloud-1" /><span className="a-cloud a-cloud-2" /><span className="a-cloud a-cloud-3" /></>}
        {phase === 'evening' && <><span className="a-cloud a-cloud-1 a-cloud-dusk" /><span className="a-cloud a-cloud-2 a-cloud-dusk" /></>}
        <svg className="absolute inset-x-0 bottom-0 h-16 w-full" viewBox="0 0 800 60" preserveAspectRatio="none"><path d="M0 40 C120 10 240 55 380 30 S650 5 800 35 V60 H0Z" fill={dark ? '#0e2a1d' : '#6fae6a'} opacity=".9" /><path d="M0 50 C160 30 300 60 460 44 S700 30 800 48 V60 H0Z" fill={dark ? '#133a27' : '#4f9a58'} /></svg>
      </div>
      <p className="a-greet-in text-sm font-semibold opacity-80">{date}{tz && <span className="hidden sm:inline"> · {tz}</span>}</p>
      <h1 className="a-greet-in mt-1 text-2xl font-extrabold sm:text-3xl" style={{ animationDelay: '.1s' }}><span className="a-wave me-2 inline-block" aria-hidden>{P.emoji}</span>{P.word}, {name}</h1>
      <p className="a-greet-in mt-1 max-w-xl text-sm opacity-90" style={{ animationDelay: '.2s' }}>{phase === 'night' ? 'Working late? Everything you change is saved as a draft until you publish.' : phase === 'evening' ? 'Wrapping up? Unsaved work is kept safely as a draft.' : 'Here is what needs your attention today.'}</p>
    </section>
  );
}

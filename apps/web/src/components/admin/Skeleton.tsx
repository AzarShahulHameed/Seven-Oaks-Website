// Shimmering placeholders shaped like the real content, so pages never flash a plain "Loading…".
export const Skel = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => <div aria-hidden className={`so-shimmer rounded-md ${className}`} style={style} />;

export function SkelText({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-2" aria-hidden>{Array.from({ length: lines }, (_, n) => <Skel key={n} className="h-3" style={{ width: n === lines - 1 ? '60%' : '100%' }} />)}</div>;
}
export function SkelCard({ lines = 3 }: { lines?: number }) {
  return <div className="a-card space-y-3" aria-hidden><Skel className="h-4 w-1/3" /><SkelText lines={lines} /></div>;
}
export function SkelRows({ rows = 6, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="a-card !p-0 divide-y divide-slate-100" aria-hidden role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, n) => (
        <div key={n} className="flex items-center gap-3 p-3">
          {avatar && <Skel className="h-8 w-8 !rounded-full" />}
          <div className="flex-1 space-y-2"><Skel className="h-3 w-2/5" /><Skel className="h-3 w-4/5" /></div>
          <Skel className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
export function SkelTiles({ n = 4 }: { n?: number }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>{Array.from({ length: n }, (_, k) => <div key={k} className="a-card space-y-2"><Skel className="h-3 w-1/2" /><Skel className="h-7 w-2/3" /></div>)}</div>;
}
export function SkelGallery({ n = 12 }: { n?: number }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-hidden role="status" aria-label="Loading">{Array.from({ length: n }, (_, k) => <Skel key={k} className="aspect-square !rounded-xl" />)}</div>;
}
export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="flex items-center gap-3"><Skel className="h-7 w-48" /><Skel className="ms-auto h-9 w-24" /></div>
      <SkelTiles /><SkelCard lines={4} /><SkelRows rows={4} />
    </div>
  );
}

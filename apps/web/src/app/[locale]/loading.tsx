/** Shown instantly while the next page loads: shimmering placeholders shaped like the real page. */
export default function Loading() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <div className="so-shimmer h-[40vh] w-full" />
      <div className="mx-auto max-w-container space-y-4 px-4 py-12">
        <div className="so-shimmer h-8 w-1/3 rounded-lg" />
        <div className="so-shimmer h-4 w-2/3 rounded" /><div className="so-shimmer h-4 w-1/2 rounded" />
        <div className="grid gap-4 pt-6 sm:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="so-shimmer h-48 rounded-card" />)}</div>
      </div>
    </div>
  );
}

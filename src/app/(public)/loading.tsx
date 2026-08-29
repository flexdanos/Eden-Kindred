/**
 * Streamed placeholder for the public pages.
 *
 * Deliberately quieter than the admin one. Most of these routes are ISR with a
 * five-minute window, so a warm cache paints instantly and this is never seen;
 * it exists for the cold render and for the two dynamic routes. A loud skeleton
 * that flashes for 80ms is worse than a calm one that occasionally holds.
 *
 * Shaped like the hero and first section so nothing jumps on arrival.
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-surface-2 motion-safe:animate-pulse ${className}`} />;
}

export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <section className="section">
        <div className="shell">
          <Bar className="h-[clamp(2.5rem,6vw,4rem)] w-[min(34rem,90%)]" />
          <Bar className="mt-4 h-[clamp(2.5rem,6vw,4rem)] w-[min(24rem,70%)]" />
          <Bar className="mt-8 h-5 w-[min(40rem,95%)]" />
          <Bar className="mt-3 h-5 w-[min(32rem,80%)]" />

          <div className="mt-10 flex flex-wrap gap-3">
            <Bar className="h-13 w-52" />
            <Bar className="h-13 w-40" />
          </div>
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i}>
              <Bar className="aspect-4/3 w-full" />
              <Bar className="mt-4 h-6 w-3/4" />
              <Bar className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

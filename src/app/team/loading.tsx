/**
 * Streamed placeholder for the musicians' area.
 *
 * This route is force-dynamic and gated on assertTeamMember(), so every visit
 * pays for an auth round trip before anything can render. That is exactly the
 * case a loading boundary exists for.
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-surface-2 motion-safe:animate-pulse ${className}`} />;
}

export default function TeamLoading() {
  return (
    <main className="flex-1" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <section className="section">
        <div className="shell">
          <Bar className="h-3.5 w-28" />
          <Bar className="mt-4 h-[clamp(2rem,4vw,3rem)] w-[min(28rem,90%)]" />
          <Bar className="mt-5 h-4 w-[min(24rem,80%)]" />
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          <Bar className="h-6 w-56" />
          <div className="mt-8 border-t border-hairline">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="border-b border-hairline py-6">
                <Bar className="h-5 w-1/2" />
                <Bar className="mt-3 h-4 w-3/4" />
                <Bar className="mt-3 h-8 w-28" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

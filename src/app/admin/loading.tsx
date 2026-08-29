/**
 * Streamed placeholder for every admin page.
 *
 * Without a loading boundary, Next.js holds the whole navigation until the
 * server component tree settles — auth round trip, profile lookup, and each
 * page query — and the browser shows the PREVIOUS page the entire time. The
 * click appears to do nothing, which reads as a hang rather than as loading.
 *
 * With this file the shell paints immediately and the content streams in. It
 * also makes <Link> prefetch worth something on these routes: they are all
 * force-dynamic, so a prefetch cannot fetch the data, but it can fetch this.
 *
 * Skeletons rather than a spinner: matching the shape of what is coming keeps
 * the layout from jumping when it arrives.
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-muted motion-safe:animate-pulse ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="max-w-6xl 2xl:max-w-none" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="mb-7">
        <Bar className="h-7 w-48" />
        <Bar className="mt-2.5 h-4 w-80 max-w-full" />
      </header>

      {/* Mirrors the dashboard stat row; harmless on pages without one. */}
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-background p-4">
            <Bar className="h-3 w-24" />
            <Bar className="mt-2.5 h-6 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 border border-border">
        <div className="border-b border-border bg-muted/50 px-4 py-2.5">
          <Bar className="h-4 w-32" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-0"
          >
            <Bar className="h-4 w-1/3" />
            <Bar className="h-4 w-20" />
            <Bar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small, explicit upcoming/past marker — the sectioned list already implies it, this makes it literal. */
export function ProgramStatusBadge({ isPast }: { isPast: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase ${
        isPast ? "border-hairline text-quiet" : "border-brand/40 text-brand"
      }`}
    >
      {isPast ? "Past" : "Upcoming"}
    </span>
  );
}

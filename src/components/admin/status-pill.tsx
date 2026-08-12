type Status = "pending" | "succeeded" | "failed" | "abandoned" | "reversed";
type PledgeStatus = "active" | "paused" | "ended";
type PeriodStatus = "pending" | "fulfilled" | "missed" | "waived";

/**
 * Restrained by design: a tinted ground with same-hue darker text, rather than
 * a saturated fill. Product register — status is information, not decoration,
 * and a row of loud pills makes a dense table unreadable.
 *
 * Each variant keeps text at or above 4.5:1 on its own tint.
 */
const TONES = {
  neutral: "bg-muted text-muted-foreground",
  good: "bg-[color-mix(in_oklch,var(--brand-success)_14%,var(--background))] text-[color-mix(in_oklch,var(--brand-success)_78%,black)]",
  warn: "bg-[color-mix(in_oklch,var(--brand-warning)_18%,var(--background))] text-[color-mix(in_oklch,var(--brand-warning)_74%,black)]",
  bad: "bg-[color-mix(in_oklch,var(--brand)_12%,var(--background))] text-[var(--brand)]",
} as const;

const DONATION_TONE: Record<Status, keyof typeof TONES> = {
  succeeded: "good",
  pending: "warn",
  failed: "bad",
  abandoned: "neutral",
  reversed: "bad",
};

const DONATION_LABEL: Record<Status, string> = {
  succeeded: "Received",
  pending: "Awaiting",
  failed: "Failed",
  abandoned: "Abandoned",
  reversed: "Reversed",
};

const PLEDGE_TONE: Record<PledgeStatus, keyof typeof TONES> = {
  active: "good",
  paused: "warn",
  ended: "neutral",
};

const PERIOD_TONE: Record<PeriodStatus, keyof typeof TONES> = {
  fulfilled: "good",
  pending: "warn",
  missed: "bad",
  waived: "neutral",
};

function Pill({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: Status }) {
  return <Pill tone={DONATION_TONE[status]}>{DONATION_LABEL[status]}</Pill>;
}

export function PledgePill({ status }: { status: PledgeStatus }) {
  return <Pill tone={PLEDGE_TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Pill>;
}

export function PeriodPill({ status }: { status: PeriodStatus }) {
  return <Pill tone={PERIOD_TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Pill>;
}

export function PublishPill({ published }: { published: boolean }) {
  return (
    <Pill tone={published ? "good" : "neutral"}>{published ? "Live" : "Draft"}</Pill>
  );
}

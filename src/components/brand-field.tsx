/**
 * Generated brand imagery — the honest stand-in until real ministry
 * photography is uploaded through the admin.
 *
 * Why generated rather than stock: this is a real congregation. Shipping a
 * photograph of strangers presented as "our community" would be a lie the
 * design tells on the ministry's behalf. A grey placeholder box would be worse
 * design. So: a composed, on-brand field that reads as deliberate, doesn't
 * pretend to be a photograph, and disappears the moment a real image is set.
 *
 * The composition is the scene DESIGN.md names — a courtyard at dusk, heat off
 * red laterite ground, one strung bulb. Deterministic by `seed`, so server and
 * client render identically and hydration stays quiet.
 */

type BrandFieldProps = {
  /** Varies the composition. Same seed always yields the same field. */
  seed?: number;
  className?: string;
  /** Lighter variant for use behind body copy rather than as a hero. */
  tone?: "deep" | "soft";
};

/** Deterministic pseudo-random in [0,1). No Math.random — that breaks SSR. */
function rand(seed: number, step: number): number {
  const x = Math.sin(seed * 127.1 + step * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function BrandField({ seed = 7, className, tone = "deep" }: BrandFieldProps) {
  const id = `bf${seed}`;
  const horizon = 62 + rand(seed, 1) * 10;
  const glowX = 26 + rand(seed, 2) * 48;
  const glowY = horizon - 14 - rand(seed, 3) * 10;

  const bands = Array.from({ length: 4 }, (_, i) => {
    const t = i / 3;
    const y = horizon + t * (100 - horizon) * 0.9;
    const curve = 6 + rand(seed, 10 + i) * 12;
    return { y, curve, opacity: 0.5 - t * 0.11 };
  });

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="An abstract field in the ministry's colours, standing in for a photograph"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={tone === "deep" ? "oklch(0.26 0.1 14)" : "oklch(0.42 0.13 14)"}
          />
          <stop
            offset="100%"
            stopColor={tone === "deep" ? "oklch(0.46 0.16 18)" : "oklch(0.62 0.13 24)"}
          />
        </linearGradient>

        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.86 0.1 62)" stopOpacity="0.72" />
          <stop offset="55%" stopColor="oklch(0.7 0.13 36)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="oklch(0.5 0.14 20)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.34 0.13 22)" />
          <stop offset="100%" stopColor="oklch(0.19 0.07 18)" />
        </linearGradient>

        {/* Grain. Without it the gradients read as a 2015 CSS backdrop. */}
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={3}
            seed={seed}
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
        </filter>
      </defs>

      <rect width="100" height="100" fill={`url(#${id}-sky)`} />

      {/* The strung bulb. */}
      <circle cx={glowX} cy={glowY} r="34" fill={`url(#${id}-glow)`} />

      {/* Ground. */}
      <path
        d={`M0 ${horizon} Q 50 ${horizon - 4} 100 ${horizon} L100 100 L0 100 Z`}
        fill={`url(#${id}-ground)`}
      />

      {/* Ridges in the laterite. */}
      {bands.map((b, i) => (
        <path
          key={i}
          d={`M0 ${b.y} Q 50 ${b.y - b.curve} 100 ${b.y}`}
          fill="none"
          stroke="oklch(0.56 0.15 28)"
          strokeOpacity={b.opacity * 0.5}
          strokeWidth={0.4}
        />
      ))}

      <rect
        width="100"
        height="100"
        filter={`url(#${id}-grain)`}
        opacity="0.16"
        style={{ mixBlendMode: "overlay" }}
      />
    </svg>
  );
}

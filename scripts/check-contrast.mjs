/**
 * Verifies the brand palette's contrast ratios. Run with `npm run check:contrast`.
 *
 * DESIGN.md quotes measured numbers rather than estimates. If you change a
 * token in src/app/globals.css, change it here too and re-run — a palette
 * whose documented ratios drifted from reality is worse than none.
 *
 * No dependencies: OKLCH -> sRGB -> WCAG relative luminance, by hand.
 */

function oklchToSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const enc = (x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, v));
  };
  const clipped = [lr, lg, lb].some((x) => x < -0.001 || x > 1.001);
  return { rgb: [enc(lr), enc(lg), enc(lb)], clipped };
}

const lum = ([r, g, b]) => {
  const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (A, B) => {
  const a = lum(A);
  const b = lum(B);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");

// Keep in step with :root in src/app/globals.css
const TOKENS = {
  "brand-bg": [1.0, 0.0, 0],
  "brand-surface": [0.968, 0.005, 20],
  "brand-ink": [0.2, 0.018, 20],
  "brand-quiet": [0.5, 0.016, 20],
  brand: [0.38, 0.145, 12],
  "brand-accent": [0.52, 0.115, 252],
  chalk: [0.97, 0.008, 40],
};

const c = {};
console.log("token          oklch                        hex");
console.log("─".repeat(62));
for (const [name, v] of Object.entries(TOKENS)) {
  const { rgb, clipped } = oklchToSrgb(...v);
  c[name] = rgb;
  console.log(
    `${name.padEnd(14)} oklch(${v[0]} ${v[1]} ${v[2]})`.padEnd(46) +
      hex(rgb) +
      (clipped ? "  << OUT OF GAMUT" : ""),
  );
}

const CHECKS = [
  ["body text on bg", c["brand-ink"], c["brand-bg"], 7],
  ["muted text on bg", c["brand-quiet"], c["brand-bg"], 4.5],
  ["body text on surface", c["brand-ink"], c["brand-surface"], 7],
  ["chalk on oxblood", c.chalk, c.brand, 4.5],
  ["white on oxblood", c["brand-bg"], c.brand, 4.5],
  ["oxblood vs accent", c.brand, c["brand-accent"], 1.7],
  ["accent link on bg", c["brand-accent"], c["brand-bg"], 4.5],
];

console.log("\ncheck                          need    got");
console.log("─".repeat(62));

let failures = 0;
for (const [name, fg, bg, need] of CHECKS) {
  const got = ratio(fg, bg);
  const pass = got >= need;
  if (!pass) failures += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${name.padEnd(26)} ${String(need).padEnd(7)} ${got.toFixed(2)}`,
  );
}

console.log("");
if (failures > 0) {
  console.error(`${failures} contrast check(s) failing.`);
  process.exit(1);
}
console.log("All contrast checks pass.");

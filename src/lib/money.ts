/**
 * All money in this codebase is an integer count of PESEWAS (GHS minor units).
 *
 * Two reasons, both practical: Paystack's API speaks minor units, so any
 * conversion at the boundary is a chance to be wrong; and integers make the
 * admin dashboard's SUM() exact rather than approximately exact.
 *
 * Never store or pass a float amount. Convert at the edges only.
 */

export const CURRENCY = "GHS" as const;

/** 250075 -> "₵2,500.75" */
export function formatMinor(
  amountMinor: number,
  options: { showDecimals?: boolean } = {},
): string {
  const { showDecimals = true } = options;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amountMinor / 100);
}

/** 250075 -> "₵2,501" — for dashboard totals where pesewas are noise. */
export function formatMinorCompact(amountMinor: number): string {
  return formatMinor(Math.round(amountMinor / 100) * 100, { showDecimals: false });
}

/** "25.50" | 25.5 -> 2550. Throws on anything that isn't a clean amount. */
export function toMinor(cedis: string | number): number {
  const value = typeof cedis === "string" ? Number(cedis.replace(/[^\d.-]/g, "")) : cedis;
  if (!Number.isFinite(value)) throw new Error(`Not a valid amount: ${cedis}`);
  if (value < 0) throw new Error("Amount cannot be negative");
  return Math.round(value * 100);
}

export function fromMinor(amountMinor: number): number {
  return amountMinor / 100;
}

/** Ghana MoMo networks, as Paystack codes them. */
export const MOMO_NETWORKS = [
  { code: "mtn", label: "MTN MoMo" },
  { code: "vod", label: "Telecel Cash" },
  { code: "atl", label: "AirtelTigo Money" },
] as const;

export type MomoNetwork = (typeof MOMO_NETWORKS)[number]["code"];

/**
 * Normalises the shapes Ghanaian numbers get typed in — 0244123456,
 * +233244123456, 233 244 123 456 — to Paystack's expected 0XXXXXXXXX.
 * Returns null when it isn't a plausible Ghanaian mobile number.
 */
export function normalizeGhanaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local: string | null = null;

  if (digits.length === 10 && digits.startsWith("0")) local = digits;
  else if (digits.length === 12 && digits.startsWith("233")) local = `0${digits.slice(3)}`;
  else if (digits.length === 9) local = `0${digits}`;

  return local && /^0[235][0-9]{8}$/.test(local) ? local : null;
}

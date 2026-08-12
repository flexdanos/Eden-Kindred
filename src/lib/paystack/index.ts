import "server-only";

import crypto from "node:crypto";
import { CURRENCY } from "@/lib/money";

const API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

// ── Types (only the fields we actually rely on) ──────────────────────────

export type PaystackInitResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "pending" | "reversed";
  reference: string;
  amount: number; // minor units
  currency: string;
  channel: string | null;
  paid_at: string | null;
  customer: { email: string | null; phone: string | null } | null;
  authorization: {
    channel: string | null;
    mobile_money_number: string | null;
    bank: string | null;
  } | null;
  metadata: Record<string, unknown> | null;
};

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;

  if (!res.ok || !body?.status) {
    throw new Error(
      `Paystack ${path} failed (${res.status}): ${body?.message ?? "no response body"}`,
    );
  }
  return body.data;
}

/** Collision-resistant, human-scannable in the Paystack dashboard. */
export function newReference(prefix = "ek"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/**
 * Opens a hosted mobile-money checkout and returns the URL to send the giver to.
 *
 * Hosted checkout rather than the raw /charge API on purpose: Paystack owns the
 * OTP-then-PIN handset flow, the network picker, and every failure state that
 * comes with it. Reimplementing that is a lot of surface area for no gain.
 */
export async function initializeMomoCharge(params: {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  return call<PaystackInitResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountMinor,
      currency: CURRENCY,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ["mobile_money"],
      metadata: params.metadata ?? {},
    }),
  });
}

/**
 * The source of truth for whether a gift was actually paid.
 *
 * Always call this before writing `succeeded`. The webhook payload is not
 * trustworthy on its own: signature verification proves Paystack sent it, not
 * that the amount in it matches what was charged.
 */
export async function verifyTransaction(reference: string): Promise<PaystackTransaction> {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Paystack signs each delivery as HMAC-SHA512 of the RAW request body, keyed by
 * the secret key. The raw string matters: parsing to JSON and re-stringifying
 * reorders keys and changes whitespace, and the signature will never match.
 *
 * Compared in constant time — a fast-exit string compare leaks the signature
 * one byte at a time to anyone willing to measure.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Cta } from "@/components/cta";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema";
import { safe } from "@/lib/db/safe";
import { formatMinor } from "@/lib/money";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

// Paystack redirects here immediately after the handset prompt, which can be
// before the webhook lands. Never cache this.
export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref ?? null;

  const gift = reference
    ? await safe(
        "thank-you-lookup",
        async () => {
          const [row] = await db
            .select({
              status: donations.status,
              amountMinor: donations.amountMinor,
              donorName: donations.donorName,
              type: donations.type,
            })
            .from(donations)
            .where(
              and(
                eq(donations.provider, "paystack"),
                eq(donations.providerReference, reference),
              ),
            )
            .limit(1);
          return row ?? null;
        },
        null,
      )
    : null;

  // Deliberately reading our own record rather than calling Paystack's verify
  // endpoint here. Verification is the webhook's job and it is the single
  // writer of payment state; doing it in two places invites them to disagree.
  const state =
    gift?.status === "succeeded"
      ? "succeeded"
      : gift?.status === "failed"
        ? "failed"
        : "pending";

  const copy = {
    succeeded: {
      icon: CheckCircle2,
      title: "Thank you",
      body: gift
        ? `Your gift of ${formatMinor(gift.amountMinor)} came through. A receipt is on its way to your email.`
        : "Your gift came through.",
    },
    pending: {
      icon: Clock,
      title: "Almost there",
      body: "We haven't had confirmation from the network yet. If you approved the prompt on your phone, it usually lands within a minute — you don't need to pay again. We'll email your receipt once it does.",
    },
    failed: {
      icon: XCircle,
      title: "That didn't go through",
      body: "The payment wasn't completed, and nothing has been taken from your account. You're welcome to try again whenever suits.",
    },
  }[state];

  const Icon = copy.icon;

  return (
    <section className="section">
      <div className="shell max-w-[52rem]">
        <Icon
          size={40}
          aria-hidden
          className={state === "succeeded" ? "text-brand-success" : "text-brand"}
        />
        <h1 className="m-0 mt-6 text-step-4">{copy.title}</h1>
        <p className="measure mt-5 text-step-1 text-quiet">{copy.body}</p>

        {gift?.type === "pledge" && state === "succeeded" && (
          <p className="measure mt-5 text-quiet">
            You&apos;re a monthly partner now. We&apos;ll send a reminder when your next
            month comes round — nothing is charged automatically, so it&apos;s always your
            approval on your own phone.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Cta href="/" arrow={false}>
            Back to the site
          </Cta>
          {state === "failed" && (
            <Cta href="/give" variant="outline" arrow={false}>
              Try again
            </Cta>
          )}
        </div>
      </div>
    </section>
  );
}

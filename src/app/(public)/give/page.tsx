import type { Metadata } from "next";
import { GiveForm } from "./give-form";
import { safe } from "@/lib/db/safe";
import { getActiveTiers } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Give once or partner monthly with Eden Kindred by mobile money. Amounts in Ghana cedis.",
};

export default async function GivePage() {
  const tiers = await safe("active-tiers", () => getActiveTiers(), []);

  return (
    <section className="section">
      <div className="shell grid gap-(--space-block) lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h1 className="m-0 text-step-4 max-w-[14ch]">
            Give to the <em>work</em>
          </h1>
          <p className="measure mt-6 text-quiet">
            Every gift is received in Ghana cedis by mobile money — MTN MoMo, Telecel Cash,
            or AirtelTigo Money.
          </p>

          <dl className="mt-10 grid gap-6 border-t border-hairline pt-8">
            <div>
              <dt className="font-semibold">Where it goes</dt>
              <dd className="measure m-0 mt-1 text-step--1 text-quiet">
                The room and its sound, travel for the team, and the people carrying the
                work through the week. The full breakdown is published each quarter.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">What we never do</dt>
              <dd className="measure m-0 mt-1 text-step--1 text-quiet">
                Take a payment you didn&apos;t approve on your own handset. There is no
                standing authorisation on mobile money, and we wouldn&apos;t use one if
                there were.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Your details</dt>
              <dd className="measure m-0 mt-1 text-step--1 text-quiet">
                Your number goes to the payment processor to raise the prompt. It is never
                shown publicly, and neither is the amount.
              </dd>
            </div>
          </dl>
        </div>

        <div className="border border-hairline bg-surface p-6 sm:p-9">
          <h2 className="m-0 text-step-2">Your gift</h2>
          <GiveForm tiers={tiers} />
        </div>
      </div>
    </section>
  );
}

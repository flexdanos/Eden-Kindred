"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { startGiving, type GiveState } from "./actions";
import { formatMinor } from "@/lib/money";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  amountMinor: number;
  cadence: "monthly" | "quarterly" | "annual";
};

const PRESETS_MINOR = [2000, 5000, 10000, 20000, 50000];

const initialState: GiveState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 bg-brand text-chalk px-7 py-4 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70 disabled:cursor-progress"
    >
      {pending && <Loader2 size={17} className="animate-spin" aria-hidden />}
      {pending ? "Taking you to mobile money…" : label}
    </button>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 m-0 text-step--1 text-brand">
      {messages[0]}
    </p>
  );
}

export function GiveForm({ tiers }: { tiers: Tier[] }) {
  const [state, formAction] = useActionState(startGiving, initialState);
  const [cadence, setCadence] = useState<"once" | "monthly" | "quarterly" | "annual">(
    "once",
  );
  const [amount, setAmount] = useState("");
  const [tierId, setTierId] = useState("");
  const ids = {
    amount: useId(),
    name: useId(),
    email: useId(),
    phone: useId(),
  };

  // The server action can't redirect to an external host, so it hands the URL
  // back and the browser navigates.
  useEffect(() => {
    if (state.ok && state.redirectUrl) window.location.assign(state.redirectUrl);
  }, [state]);

  const isPledge = cadence !== "once";

  return (
    <form action={formAction} className="mt-8">
      {state.error && (
        <div
          role="alert"
          className="mb-6 border border-brand/30 bg-brand/5 px-4 py-3 text-step--1"
        >
          {state.error}
        </div>
      )}

      {/* ── How often ───────────────────────────────────────────────── */}
      <fieldset className="m-0 p-0 border-0">
        <legend className="text-step--1 font-semibold mb-3 p-0">How often</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["once", "Once"],
              ["monthly", "Monthly"],
              ["quarterly", "Quarterly"],
              ["annual", "Yearly"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="relative flex cursor-pointer items-center justify-center border px-4 py-3 text-step--1 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-chalk border-hairline hover:border-ink"
            >
              <input
                type="radio"
                name="recurring"
                value={value}
                checked={cadence === value}
                onChange={() => setCadence(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* The single most important sentence on this page. A partner who
          expects auto-debit and doesn't get it will assume the ministry lost
          their money. */}
      {isPledge && (
        <p className="mt-3 m-0 text-step--1 text-quiet border-l-0 bg-surface px-4 py-3">
          Mobile money in Ghana can&apos;t charge you automatically. We&apos;ll remind you
          when your {cadence === "monthly" ? "month" : cadence === "quarterly" ? "quarter" : "year"}{" "}
          comes round, and you approve the prompt on your own phone. Nothing is ever taken
          without you.
        </p>
      )}

      {/* ── Tiers ───────────────────────────────────────────────────── */}
      {isPledge && tiers.length > 0 && (
        <fieldset className="m-0 mt-8 p-0 border-0">
          <legend className="text-step--1 font-semibold mb-3 p-0">
            Choose a partnership level
          </legend>
          <div className="grid gap-2">
            {tiers.map((tier) => (
              <label
                key={tier.id}
                className="flex cursor-pointer items-baseline justify-between gap-4 border border-hairline px-5 py-4 transition-colors has-[:checked]:border-brand has-[:checked]:bg-surface hover:border-ink"
              >
                <span>
                  <input
                    type="radio"
                    name="tierId"
                    value={tier.id}
                    checked={tierId === tier.id}
                    onChange={() => setTierId(tier.id)}
                    className="sr-only"
                  />
                  <span className="block font-medium">{tier.name}</span>
                  {tier.description && (
                    <span className="block text-step--1 text-quiet">{tier.description}</span>
                  )}
                </span>
                <span className="shrink-0 font-medium">
                  {formatMinor(tier.amountMinor, { showDecimals: false })}
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 border border-hairline px-5 py-4 transition-colors has-[:checked]:border-brand has-[:checked]:bg-surface hover:border-ink">
              <input
                type="radio"
                name="tierId"
                value=""
                checked={tierId === ""}
                onChange={() => setTierId("")}
                className="sr-only"
              />
              <span className="font-medium">Another amount</span>
            </label>
          </div>
        </fieldset>
      )}

      {/* ── Amount ──────────────────────────────────────────────────── */}
      {!(isPledge && tierId) && (
        <div className="mt-8">
          <label htmlFor={ids.amount} className="block text-step--1 font-semibold mb-3">
            Amount
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS_MINOR.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset / 100))}
                className="border border-hairline px-4 py-2.5 text-step--1 transition-colors hover:border-ink data-[on=true]:border-brand data-[on=true]:bg-brand data-[on=true]:text-chalk"
                data-on={amount === String(preset / 100)}
              >
                {formatMinor(preset, { showDecimals: false })}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-quiet"
            >
              ₵
            </span>
            <input
              id={ids.amount}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Other amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.amount)}
              aria-describedby={state.fieldErrors?.amount ? `${ids.amount}-err` : undefined}
              className="w-full border border-hairline bg-brand-bg py-3.5 pl-9 pr-4 text-step-0 focus:border-ink"
            />
          </div>
          <FieldError id={`${ids.amount}-err`} messages={state.fieldErrors?.amount} />
        </div>
      )}

      {/* ── Who ─────────────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={ids.name} className="block text-step--1 font-semibold mb-2">
            Your name
          </label>
          <input
            id={ids.name}
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? `${ids.name}-err` : undefined}
            className="w-full border border-hairline bg-brand-bg px-4 py-3.5 focus:border-ink"
          />
          <FieldError id={`${ids.name}-err`} messages={state.fieldErrors?.name} />
        </div>

        <div>
          <label htmlFor={ids.phone} className="block text-step--1 font-semibold mb-2">
            Mobile money number
          </label>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="024 123 4567"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={state.fieldErrors?.phone ? `${ids.phone}-err` : undefined}
            className="w-full border border-hairline bg-brand-bg px-4 py-3.5 focus:border-ink"
          />
          <FieldError id={`${ids.phone}-err`} messages={state.fieldErrors?.phone} />
        </div>

        <div>
          <label htmlFor={ids.email} className="block text-step--1 font-semibold mb-2">
            Email
          </label>
          <input
            id={ids.email}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? `${ids.email}-err` : undefined}
            className="w-full border border-hairline bg-brand-bg px-4 py-3.5 focus:border-ink"
          />
          <FieldError id={`${ids.email}-err`} messages={state.fieldErrors?.email} />
          <p className="mt-1.5 m-0 text-step--1 text-quiet">For your receipt.</p>
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="showPublicly"
          className="mt-1 size-4 accent-[var(--brand)]"
        />
        <span className="text-step--1 text-quiet">
          Show my name on the partners list. Only your name and the date appear — never the
          amount.
        </span>
      </label>

      <div className="mt-8">
        <SubmitButton label={isPledge ? "Start partnering" : "Give now"} />
        <p className="mt-3 m-0 text-center text-step--1 text-quiet">
          You&apos;ll approve the payment on your phone with your MoMo PIN.
        </p>
      </div>
    </form>
  );
}

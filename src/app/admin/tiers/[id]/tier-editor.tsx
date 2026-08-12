"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { saveTier } from "@/app/admin/mutations";
import { fromMinor } from "@/lib/money";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  amountMinor: number;
  cadence: "monthly" | "quarterly" | "annual";
  sortOrder: number;
  isActive: boolean;
};

export function TierEditor({ tier }: { tier: Tier | null }) {
  return (
    <SaveForm action={saveTier} submitLabel={tier ? "Save changes" : "Create tier"}>
      {(state) => (
        <>
          {tier && <input type="hidden" name="id" value={tier.id} />}

          <Field label="Name" name="name" errors={state.fieldErrors?.name}>
            <input
              id="name"
              name="name"
              defaultValue={tier?.name ?? ""}
              className={inputClass}
              placeholder="Sustainer"
              required
            />
          </Field>

          <Field
            label="Description"
            name="description"
            hint="One line. What this level of partnership makes possible."
            errors={state.fieldErrors?.description}
          >
            <input
              id="description"
              name="description"
              defaultValue={tier?.description ?? ""}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field
              label="Amount"
              name="amount"
              hint="In cedis. Stored as pesewas."
              errors={state.fieldErrors?.amount}
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  ₵
                </span>
                <input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  defaultValue={tier ? String(fromMinor(tier.amountMinor)) : ""}
                  className={`${inputClass} pl-7`}
                  required
                />
              </div>
            </Field>

            <Field label="How often" name="cadence" errors={state.fieldErrors?.cadence}>
              <select
                id="cadence"
                name="cadence"
                defaultValue={tier?.cadence ?? "monthly"}
                className={inputClass}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Yearly</option>
              </select>
            </Field>
          </div>

          <Field
            label="Order"
            name="sortOrder"
            hint="Lower numbers appear first."
            errors={state.fieldErrors?.sortOrder}
          >
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={tier?.sortOrder ?? 0}
              className={`${inputClass} max-w-24`}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={tier?.isActive ?? true}
              className="size-4 accent-[var(--brand)]"
            />
            Show on the giving page
          </label>
        </>
      )}
    </SaveForm>
  );
}

export function BackLink() {
  return (
    <Link
      href="/admin/tiers"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All tiers
    </Link>
  );
}

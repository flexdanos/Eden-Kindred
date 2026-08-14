"use client";

import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { recordManualGift } from "@/app/admin/mutations";

/**
 * Records a gift that arrived outside Paystack.
 *
 * Bank transfer, Zelle, and Cash App cannot notify a website — Zelle has no
 * merchant API at all, and the others need a merchant account this project
 * doesn't have. Without this form, every gift on those rails is invisible to
 * the dashboard and the totals quietly understate real income.
 */
export function ManualGiftForm() {
  return (
    <SaveForm action={recordManualGift} submitLabel="Record gift">
      {(state) => (
        <>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="How it arrived" name="provider" errors={state.fieldErrors?.provider}>
              <select
                id="provider"
                name="provider"
                defaultValue="bank_transfer"
                className={inputClass}
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="zelle">Zelle</option>
                <option value="cash_app">Cash App</option>
                <option value="other">Something else</option>
              </select>
            </Field>

            <Field
              label="Reference"
              name="reference"
              hint="From the statement. Recorded once only — a repeat is refused."
              errors={state.fieldErrors?.reference}
            >
              <input
                id="reference"
                name="reference"
                className={`${inputClass} font-mono`}
                required
              />
            </Field>
          </div>

          <div className="grid gap-x-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Amount" name="amount" errors={state.fieldErrors?.amount}>
              <input
                id="amount"
                name="amount"
                inputMode="decimal"
                className={inputClass}
                placeholder="250.00"
                required
              />
            </Field>

            <Field label="Currency" name="currency" errors={state.fieldErrors?.currency}>
              <select id="currency" name="currency" defaultValue="GHS" className={inputClass}>
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="CAD">CAD</option>
              </select>
            </Field>
          </div>

          <Field
            label="When it arrived"
            name="paidAt"
            errors={state.fieldErrors?.paidAt}
          >
            <input
              id="paidAt"
              name="paidAt"
              type="date"
              className={inputClass}
              required
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Giver's name" name="donorName" errors={state.fieldErrors?.donorName}>
              <input id="donorName" name="donorName" className={inputClass} />
            </Field>

            <Field
              label="Email"
              name="donorEmail"
              hint="Optional, for a receipt."
              errors={state.fieldErrors?.donorEmail}
            >
              <input id="donorEmail" name="donorEmail" type="email" className={inputClass} />
            </Field>
          </div>

          <Field
            label="Note"
            name="note"
            hint="Anything you'll want to remember when reconciling later."
            errors={state.fieldErrors?.note}
          >
            <input id="note" name="note" className={inputClass} />
          </Field>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublicDisplay"
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
              Show this name on the public partners list. Only the name and date appear —
              never the amount. Only tick this if the giver asked for it.
            </span>
          </label>
        </>
      )}
    </SaveForm>
  );
}

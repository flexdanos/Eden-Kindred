"use client";

import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { changePassword } from "./actions";

export function PasswordForm() {
  return (
    <SaveForm action={changePassword} submitLabel="Change password">
      {(state) => (
        // Keyed on success so the fields clear once the change lands, and a
        // failed attempt keeps what was typed.
        <div key={state.ok ? state.message : "form"}>
          <Field label="Current password" name="current" errors={state.fieldErrors?.current}>
            <input
              id="current"
              name="current"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </Field>
          <Field
            label="New password"
            name="next"
            hint="At least 8 characters."
            errors={state.fieldErrors?.next}
          >
            <input
              id="next"
              name="next"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Confirm new password" name="confirm" errors={state.fieldErrors?.confirm}>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
          </Field>
        </div>
      )}
    </SaveForm>
  );
}

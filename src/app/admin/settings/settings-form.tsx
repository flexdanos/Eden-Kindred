"use client";

import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { saveSetting } from "@/app/admin/mutations";

export function SettingForm({
  settingKey,
  value,
  hint,
}: {
  settingKey?: string;
  value?: unknown;
  hint?: string;
}) {
  const serialised =
    value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

  return (
    <SaveForm action={saveSetting} submitLabel={settingKey ? "Save" : "Add setting"}>
      {(state) => (
        <>
          <Field
            label="Key"
            name="key"
            hint={settingKey ? undefined : "Lowercase with underscores, e.g. donation_goal_minor"}
            errors={state.fieldErrors?.key}
          >
            <input
              id="key"
              name="key"
              defaultValue={settingKey ?? ""}
              className={`${inputClass} font-mono`}
              readOnly={Boolean(settingKey)}
              required
            />
          </Field>

          <Field
            label="Value"
            name="value"
            hint={hint ?? "Plain text, or JSON for numbers, booleans, lists, and objects."}
            errors={state.fieldErrors?.value}
          >
            <textarea
              id="value"
              name="value"
              rows={3}
              defaultValue={serialised}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>
        </>
      )}
    </SaveForm>
  );
}

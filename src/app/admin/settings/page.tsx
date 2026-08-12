import { assertAdmin } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listSettings } from "@/lib/db/queries/admin-lists";
import { SettingForm } from "./settings-form";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

export default async function SettingsPage() {
  await assertAdmin();
  const settings = await safe("admin-settings", () => listSettings(), []);

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Site-wide values the public pages read by key. Admins only — these change what
          every visitor sees.
        </p>
      </header>

      {settings.length > 0 && (
        <ul className="list-none m-0 mb-8 p-0 flex flex-col gap-6">
          {settings.map((setting) => (
            <li key={setting.key} className="border border-border p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 font-mono text-sm font-semibold">{setting.key}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Updated {dateFmt.format(setting.updatedAt)}
                </span>
              </div>
              <SettingForm settingKey={setting.key} value={setting.value} />
            </li>
          ))}
        </ul>
      )}

      <section className="border border-dashed border-border p-5">
        <h2 className="m-0 mb-4 text-base font-semibold">
          {settings.length === 0 ? "Add your first setting" : "Add a setting"}
        </h2>
        <SettingForm />
      </section>
    </div>
  );
}

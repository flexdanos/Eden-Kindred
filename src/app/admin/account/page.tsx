import { assertStaff } from "@/lib/auth/guard";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const user = await assertStaff();

  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email ?? "—"}</span>, with{" "}
          <span className="capitalize text-foreground">{user.role}</span> access.
        </p>
      </header>

      <section className="border border-border p-5">
        <h2 className="m-0 mb-4 text-base font-semibold">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}

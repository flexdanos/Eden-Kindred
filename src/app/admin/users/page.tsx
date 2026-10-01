import { assertAdmin } from "@/lib/auth/guard";
import { isSuperAdminEmail } from "@/lib/auth/super-admin";
import { safe } from "@/lib/db/safe";
import { listUsers } from "@/lib/db/queries/admin-users";
import { EmptyState } from "@/components/admin/empty-state";
import { RoleForm } from "./role-form";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

/**
 * Every account that has signed up, and who has staff access.
 *
 * Admin-only rather than staff: it lists every member's email, and changing
 * roles is an admin power — an editor has no business on this page.
 */
export default async function AdminUsersPage() {
  const me = await assertAdmin();
  const users = await safe("admin-users", () => listUsers(), []);

  const staff = users.filter((u) => u.role !== "member").length;

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Users</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "account" : "accounts"}, {staff} with admin
          access. <strong className="font-medium text-foreground">Admins</strong> can do
          everything, including managing users.{" "}
          <strong className="font-medium text-foreground">Editors</strong> can edit content but
          not change settings or roles.
        </p>
      </header>

      {users.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          body="When someone creates an account from the sign-in modal on the site, they appear here."
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">Account</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Last sign-in</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isMe = user.id === me.id;
                const isSuper = isSuperAdminEmail(user.email);
                return (
                  <tr key={user.id} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3">
                      <span className="block font-medium">
                        {user.fullName ?? user.email ?? "—"}
                        {isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                      </span>
                      {user.fullName && (
                        <span className="block text-xs text-muted-foreground break-all">
                          {user.email}
                        </span>
                      )}
                      {!user.emailConfirmedAt && (
                        <span className="mt-1 inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
                          Email not confirmed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{dateFmt.format(user.createdAt)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {user.lastSignInAt ? dateFmt.format(user.lastSignInAt) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleForm
                        userId={user.id}
                        role={user.role}
                        locked={isMe || isSuper}
                        lockedReason={
                          isSuper ? "Super admin" : isMe ? "Your own role" : undefined
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

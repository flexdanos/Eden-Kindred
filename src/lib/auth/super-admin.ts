/**
 * The default super admin. Made `admin` automatically on sign-up by the
 * handle_new_user trigger (supabase/rls-policies.sql — is_super_admin_email),
 * and protected in the admin from being demoted.
 *
 * Keep the two in step: change this address and that SQL function together.
 */
export const SUPER_ADMIN_EMAIL = "flexdanso@gmail.com";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

import { redirect } from "next/navigation";
import { signInUrl } from "@/lib/auth/sign-in-url";

/**
 * There is no separate login page any more — everyone signs in through the
 * modal. This route stays so old links and bookmarks still land somewhere
 * useful: it hands over to the home page with the modal open.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  redirect(signInUrl(next, reason));
}

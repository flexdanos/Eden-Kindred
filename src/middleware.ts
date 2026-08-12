import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request, and turns unauthed
 * traffic away from /admin before a page renders.
 *
 * This is a FIRST gate, not the authorisation boundary. It only checks that a
 * session exists — role is checked server-side by assertStaff() in
 * src/lib/auth/guard.ts, because Drizzle bypasses RLS and middleware can be
 * skipped by a direct Server Action invocation. Both layers are required.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Before .env.local exists, createServerClient would throw here — and because
   * middleware runs ahead of routing, that turns every single route into a 500,
   * including the public pages that are designed to render without a database.
   *
   * Degrade instead: skip the session refresh, and keep /admin closed since we
   * cannot verify anyone. Same philosophy as safe() in src/lib/db/safe.ts.
   */
  if (!url || !anonKey) {
    console.warn(
      "[middleware] Supabase env vars missing — skipping session refresh. /admin is closed until .env.local is set.",
    );

    if (request.nextUrl.pathname.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Must be getUser(), not getSession(): getSession only reads the cookie,
  // which the client controls. getUser revalidates the JWT with Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and image files. Notably EXCLUDES
     * /api/paystack/webhook — that route authenticates by HMAC signature, has
     * no session, and must not pay the cost of a Supabase round trip on every
     * delivery.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/paystack|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};

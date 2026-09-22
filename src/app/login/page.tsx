import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;

  // Arrived from an admin gate while holding an emailed-code session: they are
  // signed in as the right person, just not strongly enough for the console.
  // Saying so matters — otherwise a signed-in admin is handed a sign-in form
  // with no explanation and reasonably concludes it is broken.
  const stepUp = reason === "step-up";

  return (
    <main className="flex min-h-svh items-center justify-center px-(--gutter) py-16">
      <div className="w-full max-w-[26rem]">
        <p className="font-display text-step-2 leading-none m-0">
          Eden <em>Kindred</em>
        </p>
        <h1 className="m-0 mt-8 text-step-3">
          {stepUp ? "One more step" : "Sign in"}
        </h1>

        {stepUp ? (
          <p className="mt-3 text-quiet text-step--1">
            You&apos;re already signed in, but the admin console needs your password
            rather than an emailed code. This keeps access to the console from
            resting on inbox access alone.
          </p>
        ) : (
          <p className="mt-3 text-quiet text-step--1">
            Sign in with your password, or have us email you a 6-digit code.
          </p>
        )}

        <LoginForm next={next ?? "/admin"} forcePassword={stepUp} />
      </div>
    </main>
  );
}

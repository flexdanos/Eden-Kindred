import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center px-(--gutter) py-16">
      <div className="w-full max-w-[26rem]">
        <p className="font-display text-step-2 leading-none m-0">
          Eden <em>Kindred</em>
        </p>
        <h1 className="m-0 mt-8 text-step-3">Sign in</h1>
        <p className="mt-3 text-quiet text-step--1">
          We&apos;ll email you a link. No password to remember.
        </p>

        <LoginForm next={next ?? "/admin"} />
      </div>
    </main>
  );
}

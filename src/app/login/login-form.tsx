"use client";

import { useId, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign in. Runs against Supabase Auth from the browser — this is
 * exactly the work supabase-js should keep doing rather than Drizzle.
 */
export function LoginForm({ next }: { next: string }) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mt-8 border border-hairline bg-surface p-6">
        <MailCheck size={24} aria-hidden className="text-brand-success" />
        <h2 className="m-0 mt-4 text-step-1">Check your email</h2>
        <p className="m-0 mt-2 text-step--1 text-quiet">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>. It
          expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8">
      {error && (
        <p role="alert" className="mb-4 m-0 border border-brand/30 bg-brand/5 px-4 py-3 text-step--1">
          {error}
        </p>
      )}

      <label htmlFor={emailId} className="block text-step--1 font-semibold mb-2">
        Email
      </label>
      <input
        id={emailId}
        type="email"
        required
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-hairline bg-brand-bg px-4 py-3.5 focus:border-ink"
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
      >
        {status === "sending" && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {status === "sending" ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}

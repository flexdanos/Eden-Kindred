"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Two sign-in methods, one form:
 *
 *  - Password: the default. No email round-trip, so nothing here depends on
 *    mail deliverability or corporate link-scanners.
 *  - Email code: a 6-digit code, typed in, for accounts with no password set.
 *    Deliberately a code and not a clickable link — several corporate mail
 *    filters (Microsoft Defender Safe Links among them) pre-fetch every link
 *    in an email to scan it, which silently consumes a single-use magic-link
 *    token before the recipient ever clicks. A typed code has no URL for a
 *    scanner to visit, so it survives that. Requires the "Magic Link" email
 *    template in the Supabase dashboard to include `{{ .Token }}` — by
 *    default it only renders the link.
 */
export function LoginForm({ next }: { next: string }) {
  const emailId = useId();
  const passwordId = useId();
  const codeId = useId();

  const [method, setMethod] = useState<"password" | "email-code">("password");
  const [stage, setStage] = useState<"request" | "code">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function switchMethod(newMethod: "password" | "email-code") {
    setMethod(newMethod);
    setStage("request");
    setPassword("");
    setShowPassword(false);
    setCode("");
    setError(null);
    setStatus("idle");
  }

  async function signInWithPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }

    // Full navigation, not router.push: the session cookie @supabase/ssr just
    // set needs to be present on the request that renders `next`, and
    // middleware/server components only see cookies from an actual request.
    window.location.assign(next);
  }

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
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
    setStatus("idle");
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }

    window.location.assign(next);
  }

  const errorBanner = error && (
    <p role="alert" className="mb-4 m-0 border border-brand/30 bg-brand/5 px-4 py-3 text-step--1">
      {error}
    </p>
  );

  const emailField = (
    <div>
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
    </div>
  );

  if (method === "email-code" && stage === "code") {
    return (
      <form onSubmit={verifyCode} className="mt-8">
        {errorBanner}

        <p className="m-0 mb-4 text-step--1 text-quiet">
          Enter the 6-digit code we sent to <strong className="text-ink">{email}</strong>.
        </p>

        <label htmlFor={codeId} className="block text-step--1 font-semibold mb-2">
          Code
        </label>
        <input
          id={codeId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-hairline bg-brand-bg px-4 py-3.5 text-center text-step-1 tracking-[0.3em] focus:border-ink"
        />

        <button
          type="submit"
          disabled={status === "loading" || code.length < 6}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
        >
          {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {status === "loading" ? "Verifying…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={() => switchMethod("email-code")}
          className="mt-3 w-full text-center text-step--1 text-quiet underline underline-offset-2"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex gap-4 border-b border-hairline text-step--1">
        <button
          type="button"
          onClick={() => switchMethod("password")}
          className={
            method === "password"
              ? "border-b-2 border-ink pb-3 font-semibold text-ink"
              : "pb-3 text-quiet"
          }
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => switchMethod("email-code")}
          className={
            method === "email-code"
              ? "border-b-2 border-ink pb-3 font-semibold text-ink"
              : "pb-3 text-quiet"
          }
        >
          Email code
        </button>
      </div>

      {method === "password" ? (
        <form onSubmit={signInWithPassword} className="mt-6 flex flex-col gap-5">
          {errorBanner}
          {emailField}

          <div>
            <label htmlFor={passwordId} className="block text-step--1 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-hairline bg-brand-bg px-4 py-3.5 pr-12 focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-quiet hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden />
                ) : (
                  <Eye size={18} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
          >
            {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={sendCode} className="mt-6 flex flex-col gap-5">
          {errorBanner}
          {emailField}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
          >
            {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {status === "loading" ? "Sending…" : "Email me a code"}
          </button>
        </form>
      )}
    </div>
  );
}

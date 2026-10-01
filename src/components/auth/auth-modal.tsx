"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "signin" | "signup";
/**
 * form          — sign in / create account tabs
 * confirm       — type the code that confirms a new account's email
 * reset-request — "forgot password": ask for the email to send a code to
 * reset         — type that code and choose a new password
 */
type Stage = "form" | "confirm" | "reset-request" | "reset";

const MIN_PASSWORD = 8;

/**
 * The one sign-in surface for everyone — partners, musicians and staff.
 *
 * Email and password, with a "Create account" tab beside "Sign in". There is
 * no separate staff login: the admin gates redirect to signInUrl(), which opens
 * this modal with `next` set, and a password session is what assertStaff()
 * requires anyway.
 *
 * Sign-up has two outcomes depending on the Supabase project's "Confirm email"
 * setting:
 *  - off: signUp() returns a session and the person is signed in at once.
 *  - on: no session yet; Supabase sends the "Confirm signup" email, which
 *    carries a 6-digit {{ .Token }} (supabase/email-templates/confirm-signup.html),
 *    and the modal asks for it. A typed code rather than a link, for the same
 *    link-scanner reason given in the README.
 *
 * Forgotten passwords use the same pattern: resetPasswordForEmail() sends the
 * "Reset Password" email with a 6-digit {{ .Token }}
 * (supabase/email-templates/reset-password.html), verifyOtp({ type:
 * "recovery" }) turns it into a session, and updateUser() sets the new
 * password — all without leaving the modal.
 */
export function AuthModal({
  open,
  onOpenChange,
  reason,
  next,
  initialMode = "signin",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  /** Where to go once signed in. Without it the current page just refreshes. */
  next?: string;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    code: useId(),
    newPassword: useId(),
  };

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [stage, setStage] = useState<Stage>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirror the provider's requested mode each time the modal opens — adjusted
  // during render, not in an effect, so there is no flash of the old tab.
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setMode(initialMode);
  }

  // Reset on close so the next open starts clean.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setStage("form");
      setFullName("");
      setPassword("");
      setShowPassword(false);
      setCode("");
      setNewPassword("");
      setNotice(null);
      setLoading(false);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setError(null);
    setNotice(null);
  }

  function goTo(nextStage: Stage) {
    setStage(nextStage);
    setCode("");
    setNewPassword("");
    setError(null);
  }

  function finish() {
    if (next) {
      // Full navigation: the server needs the fresh session cookie on the
      // request that renders `next` (an admin page, say).
      window.location.assign(next);
      return;
    }
    handleOpenChange(false);
    router.refresh();
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      finish();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Read by the handle_new_user trigger into profiles.full_name.
      options: { data: { full_name: fullName.trim() || null } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      finish();
      return;
    }

    // An existing confirmed address comes back with no error and an empty
    // identities list — Supabase hides it to avoid revealing who has an account.
    if (data.user && data.user.identities?.length === 0) {
      setError("An account with this email already exists. Sign in instead.");
      setMode("signin");
      setPassword("");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStage("confirm");
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    finish();
  }

  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // No redirectTo: the email carries a code to type here, not a link.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    goTo("reset");
  }

  async function completeReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Sign in again with the new password. The recovery session is proof of
    // inbox access only, which the admin gates (hasStrongAuth) rightly refuse;
    // a fresh password session means a staff member lands in the console
    // instead of being asked to sign in a second time.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });
    if (signInError) {
      // The password did change; only the follow-up sign-in failed.
      setStage("form");
      setMode("signin");
      setPassword("");
      setNotice("Password changed. Sign in with your new password.");
      setLoading(false);
      return;
    }
    finish();
  }

  const titles: Record<Stage, string> = {
    form: mode === "signin" ? "Sign in" : "Create an account",
    confirm: "Confirm your email",
    "reset-request": "Reset your password",
    reset: "Choose a new password",
  };
  const title = titles[stage];
  const description =
    stage === "confirm" || stage === "reset"
      ? `We sent a 6-digit code to ${email}.`
      : stage === "reset-request"
        ? "Enter your account's email and we'll send you a code to reset your password."
        : (reason ??
          (mode === "signin"
            ? "Welcome back. Sign in with your email and password."
            : "Join with your email and a password."));

  const inputClass = "w-full border border-hairline bg-brand-bg px-4 py-3.5 focus:border-ink";
  const submitClass =
    "inline-flex items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-control transition-colors hover:bg-brand-hover disabled:opacity-70";

  const linkClass = "text-center text-step--1 text-quiet underline underline-offset-2";

  const codeField = (
    <div>
      <label htmlFor={ids.code} className="block text-step--1 font-semibold mb-2">
        Code
      </label>
      <input
        id={ids.code}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className={`${inputClass} text-center text-step-1 tracking-[0.3em]`}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-hairline bg-brand-bg font-body sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-step-1 font-normal">{title}</DialogTitle>
          <DialogDescription className="text-quiet">{description}</DialogDescription>
        </DialogHeader>

        {stage === "form" && (
          <div role="tablist" className="flex gap-4 border-b border-hairline text-step--1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={
                  mode === m
                    ? "border-b-2 border-ink pb-3 font-semibold text-ink"
                    : "pb-3 text-quiet hover:text-ink"
                }
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="m-0 border border-brand/30 bg-brand/5 px-4 py-3 text-step--1">
            {error}
          </p>
        )}

        {notice && !error && (
          <p role="status" className="m-0 border border-hairline bg-paper px-4 py-3 text-step--1">
            {notice}
          </p>
        )}

        {stage === "form" ? (
          <form onSubmit={submit} className="flex flex-col gap-5">
            {mode === "signup" && (
              <div>
                <label htmlFor={ids.name} className="block text-step--1 font-semibold mb-2">
                  Full name
                </label>
                <input
                  id={ids.name}
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label htmlFor={ids.email} className="block text-step--1 font-semibold mb-2">
                Email
              </label>
              <input
                id={ids.email}
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={ids.password} className="block text-step--1 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id={ids.password}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-quiet hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </div>
              {mode === "signup" ? (
                <p className="m-0 mt-2 text-step--1 text-quiet">
                  At least {MIN_PASSWORD} characters.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    goTo("reset-request");
                  }}
                  className="mt-2 text-step--1 text-quiet underline underline-offset-2 hover:text-ink"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button type="submit" disabled={loading} className={submitClass}>
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {mode === "signin"
                ? loading
                  ? "Signing in…"
                  : "Sign in"
                : loading
                  ? "Creating account…"
                  : "Create account"}
            </button>
          </form>
        ) : stage === "confirm" ? (
          <form onSubmit={confirm} className="flex flex-col gap-5">
            {codeField}
            <button type="submit" disabled={loading || code.length < 6} className={submitClass}>
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {loading ? "Confirming…" : "Confirm"}
            </button>
            <button type="button" onClick={() => goTo("form")} className={linkClass}>
              Use a different email
            </button>
          </form>
        ) : stage === "reset-request" ? (
          <form onSubmit={requestReset} className="flex flex-col gap-5">
            <div>
              <label htmlFor={ids.email} className="block text-step--1 font-semibold mb-2">
                Email
              </label>
              <input
                id={ids.email}
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={loading} className={submitClass}>
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {loading ? "Sending…" : "Email me a code"}
            </button>
            <button type="button" onClick={() => goTo("form")} className={linkClass}>
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={completeReset} className="flex flex-col gap-5">
            {codeField}
            <div>
              <label htmlFor={ids.newPassword} className="block text-step--1 font-semibold mb-2">
                New password
              </label>
              <input
                id={ids.newPassword}
                type="password"
                required
                minLength={MIN_PASSWORD}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <p className="m-0 mt-2 text-step--1 text-quiet">At least {MIN_PASSWORD} characters.</p>
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6 || newPassword.length < MIN_PASSWORD}
              className={submitClass}
            >
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {loading ? "Saving…" : "Set new password"}
            </button>
            <button type="button" onClick={() => goTo("reset-request")} className={linkClass}>
              Didn&apos;t get it? Send another code
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

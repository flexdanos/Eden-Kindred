"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type Stage = "request" | "code";

/**
 * Email-code only, deliberately no password option here.
 *
 * `signInWithOtp` creates the Supabase user on first use, so "sign in" and
 * "sign up" are the same call for this audience — one form instead of two,
 * and nothing for a partner to forget or reset. The admin/staff surface at
 * /login keeps its own password flow; this is a lighter, separate audience.
 *
 * Because `shouldCreateUser` is true, a first-time address gets Supabase's
 * "Confirm signup" email rather than "Magic Link" — a different template with
 * its own link body. Both need the `{{ .Token }}` versions in
 * `supabase/email-templates/` applied, or new partners get a link and
 * returning ones get a code.
 */
export function AuthModal({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}) {
  const router = useRouter();
  const emailId = useId();
  const codeId = useId();

  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Reset to a clean slate on close, so the next open always starts fresh —
  // done here rather than in an effect keyed on `open`, which would set state
  // synchronously during render's commit phase.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setStage("request");
      setEmail("");
      setCode("");
      setStatus("idle");
      setError(null);
    }
    onOpenChange(next);
  }

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
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

    // No full navigation: the page that triggered this stays put and just
    // re-renders now that a session cookie exists.
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-hairline bg-brand-bg font-body sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-step-1 font-normal">
            {stage === "code" ? "Enter your code" : "Sign in"}
          </DialogTitle>
          <DialogDescription className="text-quiet">
            {stage === "code"
              ? `We sent a 6-digit code to ${email}.`
              : (reason ?? "We'll email you a 6-digit code — no password to remember.")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="m-0 border border-brand/30 bg-brand/5 px-4 py-3 text-step--1">
            {error}
          </p>
        )}

        {stage === "request" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-5">
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
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
            >
              {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {status === "loading" ? "Sending…" : "Email me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-5">
            <div>
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
            </div>
            <button
              type="submit"
              disabled={status === "loading" || code.length < 6}
              className="inline-flex items-center justify-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium rounded-[var(--radius)] transition-colors hover:bg-brand-hover disabled:opacity-70"
            >
              {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {status === "loading" ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => setStage("request")}
              className="text-center text-step--1 text-quiet underline underline-offset-2"
            >
              Use a different email
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

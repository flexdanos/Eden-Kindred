"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModal, type AuthMode } from "./auth-modal";
import { SIGN_IN_REASONS, safeNext } from "@/lib/auth/sign-in-url";

type OpenAuthModalOptions = {
  /** Context-specific line shown in place of the generic copy, e.g. "Sign in to manage your pledge." */
  reason?: string;
  /** Path to navigate to once signed in. */
  next?: string;
  /** Which tab to open on. Defaults to sign in. */
  mode?: AuthMode;
};

type AuthModalContextValue = {
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/**
 * Mounted once in the public layout. Any client component anywhere on the
 * public site calls useAuthModal().openAuthModal() — the nav, the give/pledge
 * flow, wherever — without needing to know the modal exists as a component.
 *
 * Server-side gates (admin, /team) cannot call that, so they redirect to
 * signInUrl() instead and AuthQueryOpener below opens the modal from the URL.
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenAuthModalOptions>({});

  const openAuthModal = useCallback((opts?: OpenAuthModalOptions) => {
    setOptions(opts ?? {});
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openAuthModal, closeAuthModal }),
    [openAuthModal, closeAuthModal],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {/* useSearchParams needs a Suspense boundary, or every statically
          rendered public page would bail out to client rendering. */}
      <Suspense fallback={null}>
        <AuthQueryOpener open={openAuthModal} />
      </Suspense>
      <AuthModal
        open={open}
        onOpenChange={setOpen}
        reason={options.reason}
        next={options.next}
        initialMode={options.mode}
      />
    </AuthModalContext.Provider>
  );
}

/** Opens the modal for `?auth=signin|signup&next=…&reason=…`, then tidies the URL. */
function AuthQueryOpener({ open }: { open: (opts: OpenAuthModalOptions) => void }) {
  const params = useSearchParams();
  const auth = params.get("auth");
  const next = params.get("next");
  const reason = params.get("reason");

  useEffect(() => {
    if (auth !== "signin" && auth !== "signup") return;

    open({
      mode: auth,
      next: safeNext(next),
      reason: reason ? SIGN_IN_REASONS[reason] : undefined,
    });

    // Drop the params so a refresh or a shared link doesn't reopen the modal.
    const url = new URL(window.location.href);
    for (const key of ["auth", "next", "reason"]) url.searchParams.delete(key);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [auth, next, reason, open]);

  return null;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}

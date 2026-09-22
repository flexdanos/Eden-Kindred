"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AuthModal } from "./auth-modal";

type OpenAuthModalOptions = {
  /** Context-specific line shown in place of the generic copy, e.g. "Sign in to manage your pledge." */
  reason?: string;
};

type AuthModalContextValue = {
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/**
 * Mounted once in the public layout. Any client component anywhere on the
 * public site calls useAuthModal().openAuthModal() — the nav, the give/pledge
 * flow, /team's gate, wherever — without needing to know the modal exists as
 * a component, or duplicate its markup.
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setReason(options?.reason);
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
      <AuthModal open={open} onOpenChange={setOpen} reason={reason} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}

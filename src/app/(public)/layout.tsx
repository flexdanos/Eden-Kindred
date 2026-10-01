import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { AuthModalProvider } from "@/components/auth/auth-modal-context";
import { AdminShortcut } from "@/components/admin/admin-shortcut";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <SmoothScroll />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-(--z-toast) focus:bg-brand focus:text-chalk focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      {/*
        The paper ground is scoped here rather than set on <body>, because the
        root layout is shared with the admin console and a dense table surface
        gains nothing from a warm background.

        `flex flex-col flex-1` reproduces what <body> was doing for these three
        children, so the footer's `mt-auto` still pins to the bottom on a short
        page. The header stays sticky: this wrapper sets no overflow, so the
        viewport is still the scroll ancestor.
      */}
      <div className="flex flex-1 flex-col bg-paper">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <AdminShortcut />
    </AuthModalProvider>
  );
}

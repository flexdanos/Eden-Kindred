import type { Metadata, Viewport } from "next";
import { Alegreya, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

/**
 * Two families only. `shadcn init` adds Geist and points --font-sans at it;
 * that was removed deliberately — a third family here would be a third font
 * payload on a metered connection for no gain, and --font-sans is mapped to
 * Schibsted in globals.css so shadcn components inherit the body face.
 *
 * Both are served through next/font/google, which self-hosts them at build
 * time. On Ghanaian mobile data that removes a third-party DNS lookup, TLS
 * handshake, and round trip from the critical path.
 */

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Eden Kindred — a worship community",
    template: "%s · Eden Kindred",
  },
  description:
    "A community you belong to, not an audience you join. Programs, teaching, and partnership.",
  openGraph: {
    type: "website",
    siteName: "Eden Kindred",
    locale: "en_GH",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GH"
      className={`${alegreya.variable} ${schibsted.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        {/*
          Marks that JavaScript is available, before first paint.

          Everything that starts hidden and animates in — the split-word
          headings — hides itself behind `html.js`. Without this class the
          content renders plainly visible, so a no-JS visitor, a crawler, or a
          failed bundle gets readable text rather than a blank page. Setting it
          here rather than in the SSR className is the whole point: the server
          must NOT emit it.
        */}
        <Script
          id="mark-js"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

/**
 * Supabase Storage is the only remote image host. Deriving the hostname from
 * the env var rather than hardcoding it keeps staging and production working
 * from the same config.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Stand-in photography (src/lib/placeholder-images.ts). Remove this entry
      // once every section has real uploaded imagery — it exists only so the
      // site looks finished before the ministry's own photographs arrive.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...(supabaseHost
        ? ([
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ])
        : []),
    ],
    // AVIF first: meaningfully smaller than WebP, and the audience is on
    // metered mobile data.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Server Actions receive form posts from the give flow; the default body
    // limit is fine, but the origin allowlist must include the site URL.
    serverActions: {
      allowedOrigins: process.env.NEXT_PUBLIC_SITE_URL
        ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).host]
        : undefined,
    },
  },
};

export default nextConfig;

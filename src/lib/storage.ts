/**
 * Public Storage URL builder.
 *
 * Deliberately NOT in lib/db/queries/public.ts — that module is `server-only`,
 * and the admin's media grid and picker are client components that need this
 * too. Keeping it dependency-free means both sides build the same URL.
 */
export function publicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

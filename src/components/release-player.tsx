/**
 * Streaming embeds, built from an ID rather than pasted markup.
 *
 * The admin stores only a video/playlist id. The <iframe> is constructed here,
 * so an editor can never paste a <script> into a text field and have it render
 * — which is exactly what happens when a CMS accepts "embed code".
 *
 * IDs are additionally filtered to the character set the platforms actually
 * use, so a crafted value cannot break out of the URL and append parameters.
 */

const SAFE_ID = /^[A-Za-z0-9_-]{6,64}$/;

export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  if (!SAFE_ID.test(videoId)) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-(--radius) bg-ink aspect-video">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={`${title} — video`}
        loading="lazy"
        // youtube-nocookie avoids setting tracking cookies until playback,
        // which matters when the page has no consent banner.
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export function SpotifyEmbed({
  embedId,
  kind = "album",
  title,
}: {
  embedId: string;
  kind?: "album" | "track" | "playlist";
  title: string;
}) {
  if (!SAFE_ID.test(embedId)) return null;

  return (
    <iframe
      className="w-full rounded-(--radius)"
      style={{ height: kind === "track" ? 152 : 352 }}
      src={`https://open.spotify.com/embed/${kind}/${embedId}`}
      title={`${title} — Spotify player`}
      loading="lazy"
      allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

/** 214 -> "3:34" */
export function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const RELEASE_TYPE_LABEL: Record<string, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  live_session: "Live session",
};

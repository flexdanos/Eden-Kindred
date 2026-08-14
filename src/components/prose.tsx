/**
 * Renders admin-authored body text as paragraphs.
 *
 * Deliberately not a markdown renderer. Body text is written in the admin's
 * plain textarea, and pulling in a markdown pipeline would mean either shipping
 * a parser to the client or trusting `dangerouslySetInnerHTML` with editor
 * input — a stored-XSS hole for the sake of italics nobody asked for.
 *
 * Splitting on blank lines covers what the editor actually produces. If rich
 * formatting is wanted later, the right move is a structured editor writing to
 * `content_blocks.data`, not HTML in a text column.
 */
export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className={`measure flex flex-col gap-5 ${className}`}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="m-0">
          {/* Single newlines inside a paragraph become line breaks. */}
          {paragraph.split("\n").map((line, j, all) => (
            <span key={j}>
              {line}
              {j < all.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

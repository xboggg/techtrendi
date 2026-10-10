/**
 * Normalise cyber-awareness / creepy-tech post bodies for display on cards.
 *
 * These two tables hold a mix of formats, written at different times:
 *   - 160 posts (80 in each table) store HTML: "<p><strong>You get a MoMo…"
 *   -  34 posts store Markdown: "# Your Phone Is Draining Faster…"
 *   - the rest are plain text
 *
 * The cards rendered `{post.content}` directly, so React escaped the HTML and
 * readers saw literal "<p><strong>" tags on screen from page 5 of
 * /cyber-awareness onward. Plain-text and Markdown posts looked fine, which is
 * why it went unnoticed.
 *
 * These cards clip to 8 lines and expand in place — they are previews, not
 * article pages. So rather than injecting markup, both formats are converted
 * to clean text and rendered normally. That keeps paragraph breaks (via
 * `whitespace-pre-line`), avoids any raw-HTML injection, and reads better at
 * card size than bold runs and nested lists would.
 */

/** Convert an HTML or Markdown post body to readable plain text. */
export function postBodyToText(content: string | null | undefined): string {
  if (!content) return "";

  let text = content;

  // Block-level tags become paragraph breaks so the text keeps its shape.
  text = text.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li\b[^>]*>/gi, "• ");

  // Remaining tags carry no meaning once the text is flattened.
  text = text.replace(/<[^>]+>/g, "");

  // Entities that survive tag-stripping.
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // Markdown markers, for the posts stored that way.
  text = text
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Collapse the runs of blank lines the tag replacements leave behind,
  // without flattening deliberate paragraph breaks.
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

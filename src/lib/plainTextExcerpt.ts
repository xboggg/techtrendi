/**
 * Build a clean plain-text teaser from Markdown or HTML body content.
 *
 * creepy_tech_posts and cyber_awareness_posts have no `excerpt` column, so
 * card previews slice straight from `content`. Any post whose body opens with
 * a Markdown heading showed the raw "#" in the preview — e.g.
 * "# The Helpful Tech Support Blur…". 34 of 266 posts were affected.
 *
 * Shared so every card list is fixed at once, and the next surface that needs
 * a teaser does not reinvent a half-complete version of this.
 */
export function plainTextExcerpt(content: string | null | undefined, maxLength = 160): string {
  if (!content) return "";

  let text = content;

  // Fenced and inline code first — their contents must not be parsed as markup.
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");

  // HTML, in case a post mixes it in.
  text = text.replace(/<[^>]+>/g, " ");

  // Images before links: ![alt](src) would otherwise leave a stray "!".
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Headings, blockquotes and list bullets at line starts.
  // \s* not \s+ : a bare "#" on its own line has no trailing space and would
  // otherwise survive into the teaser.
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, "");
  text = text.replace(/^\s{0,3}\d+\.\s+/gm, "");

  // Horizontal rules.
  text = text.replace(/^\s{0,3}([-*_])\s*(?:\1\s*){2,}$/gm, " ");

  // Emphasis. Bold before italic so ** is not left as a stray *.
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Decode the handful of entities that survive tag-stripping.
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  text = text.replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) return text;

  // Cut on a word boundary rather than mid-word, when one is close enough.
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

// The label a news story shows on cards and badges (owner, 27 Nov 2026): its topic
// ("Money & Fintech", "AI" ...), not the old "Africa Tech" category. Every live story has a
// topic (news.topic, filled on the server); the fallbacks are only for old cached data.
export function newsLabel(item: { topic?: string | null; category?: string | null; slug?: string | null }): string {
  if (item.topic) return item.topic;
  if (item.category === "Big Tech" || item.slug?.startsWith("the-rundown-")) return "The Rundown";
  return item.category || "News";
}

/** The /news page with this story's topic already picked. */
export function newsTopicHref(item: { topic?: string | null; category?: string | null; slug?: string | null }): string {
  return `/news?topic=${encodeURIComponent(newsLabel(item))}`;
}

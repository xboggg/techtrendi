// Feature-image attribution (24 Nov 2026, owner request): where each News/Blog cover picture
// comes from. Stored in news/articles columns image_source_type, image_credit, image_caption
// and image_source_auto (migration supabase/migrations/20261124_image_attribution.sql).
//
// The database fills the label by itself for pictures our pipelines make (AI pictures,
// Pexels/Unsplash stock photos). Anything else stays NOT SET (no label) until an admin picks
// one in the admin panel; the admin lists flag those covers for review.

export type ImageSourceType =
  | "ai_illustration"
  | "photo_illustration"
  | "file_photo"
  | "stock_photo"
  | "courtesy"
  | "none";

export interface ImageAttribution {
  image_source_type?: string | null;
  image_credit?: string | null;
  image_caption?: string | null;
  image_source_auto?: boolean | null;
}

/** Choices in the admin panel, in the order shown. "none" = checked, show no label. */
export const IMAGE_SOURCE_OPTIONS: { value: ImageSourceType; label: string; hint: string }[] = [
  { value: "ai_illustration", label: "AI Illustration", hint: "Picture made by AI" },
  { value: "photo_illustration", label: "Photo Illustration", hint: "Real photo with AI or edited parts added" },
  { value: "file_photo", label: "File Photo", hint: "Real photo from an earlier date or event" },
  { value: "stock_photo", label: "Stock Photo", hint: "From a photo library such as Pexels" },
  { value: "courtesy", label: "Courtesy", hint: "Supplied by someone else - put who in Credit" },
  { value: "none", label: "No Label", hint: "Checked - show no label on the picture" },
];

const LABELS: Record<string, string> = Object.fromEntries(IMAGE_SOURCE_OPTIONS.map((o) => [o.value, o.label]));

/** Text for the small label on the picture, or null for no label. */
export function imageSourceLabel(type?: string | null): string | null {
  if (!type || type === "none") return null;
  return LABELS[type] ?? null;
}

/** The line under the picture: caption, then "Image: <credit>". Null when there is neither. */
export function imageCreditLine(a: ImageAttribution): { caption: string | null; credit: string | null } | null {
  const caption = a.image_caption?.trim() || null;
  const credit = a.image_credit?.trim() || null;
  if (!caption && !credit) return null;
  return { caption, credit };
}

/** True when nobody knows where the cover came from yet (admin lists flag these). */
export function needsImageReview(row: ImageAttribution & { cover_image?: string | null }): boolean {
  return !!row.cover_image && !row.image_source_type;
}

import { SEO_WAVE4_LANDINGS } from "./seo-wave4-pages";
import { SEO_WAVE5_LANDINGS } from "./seo-wave5-pages";

const PENDING_MEDICAL_REVIEW_PATHS = new Set<string>([
  ...SEO_WAVE4_LANDINGS.map((landing) => landing.path),
  ...SEO_WAVE5_LANDINGS.map((landing) => landing.path),
]);

/**
 * New medical/YMYL landing pages are generated and reviewable before launch,
 * but stay out of Google and the sitemap until RESET Clinic confirms medical review.
 *
 * The set is derived from the draft files so a new draft cannot accidentally be
 * rendered as indexable because somebody forgot to update this gate manually.
 */
export function isSeoLandingApprovedForIndex(path: string) {
  return !PENDING_MEDICAL_REVIEW_PATHS.has(path);
}

export const PENDING_MEDICAL_REVIEW = [...PENDING_MEDICAL_REVIEW_PATHS];

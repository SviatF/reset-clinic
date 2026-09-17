import { SEO_WAVE4_LANDINGS } from "./seo-wave4-pages";
import { SEO_WAVE5_LANDINGS } from "./seo-wave5-pages";

const PENDING_MEDICAL_REVIEW_PATHS = new Set<string>([
  ...SEO_WAVE4_LANDINGS.map((landing) => landing.path),
  ...SEO_WAVE5_LANDINGS.map((landing) => landing.path),
]);

/**
 * Medical/YMYL landing pages remain reviewable in production, but stay
 * noindex and out of sitemap until their exact path is explicitly removed
 * from the pending review set after clinical approval.
 */
export function isSeoLandingApprovedForIndex(path: string) {
  return !PENDING_MEDICAL_REVIEW_PATHS.has(path);
}

export const PENDING_MEDICAL_REVIEW = [...PENDING_MEDICAL_REVIEW_PATHS];

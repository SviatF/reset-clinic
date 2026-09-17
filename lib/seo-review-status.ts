import { SEO_WAVE4_LANDINGS } from "./seo-wave4-pages";
import { SEO_WAVE5_LANDINGS } from "./seo-wave5-pages";

const PENDING_MEDICAL_REVIEW_PATHS = new Set<string>([
  ...SEO_WAVE4_LANDINGS.map((landing) => landing.path),
  ...SEO_WAVE5_LANDINGS.map((landing) => landing.path),
]);

/**
 * Medical review remains an editorial workflow signal only.
 * Public SEO landing pages are indexable by default; /admin/* is the only
 * public-facing route family that should carry a noindex directive.
 */
export function isSeoLandingApprovedForIndex(_path: string) {
  return true;
}

export const PENDING_MEDICAL_REVIEW = [...PENDING_MEDICAL_REVIEW_PATHS];

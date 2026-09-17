import { SEO_WAVE4_LANDINGS } from "./seo-wave4-pages";
import { SEO_WAVE5_LANDINGS } from "./seo-wave5-pages";

// Editorial workflow only. These paths may still require clinical review in
// the internal admin process, but public robots policy is independent from
// review status: every public landing is index, follow. noindex is reserved
// exclusively for protected admin routes.
const PENDING_MEDICAL_REVIEW_PATHS = new Set<string>([
  ...SEO_WAVE4_LANDINGS.map((landing) => landing.path),
  ...SEO_WAVE5_LANDINGS.map((landing) => landing.path),
]);

export function isSeoLandingApprovedForIndex(_path: string) {
  return true;
}

export function isSeoLandingPendingMedicalReview(path: string) {
  return PENDING_MEDICAL_REVIEW_PATHS.has(path);
}

export const PENDING_MEDICAL_REVIEW = [...PENDING_MEDICAL_REVIEW_PATHS];

const PENDING_MEDICAL_REVIEW_PATHS = new Set<string>([
  "/dermatology/post-acne-treatment/",
  "/skin-problems/couperose/",
  "/skin-problems/facial-rash/",
  "/skin-problems/itchy-scalp/",
  "/skin-problems/dandruff/",
]);

/**
 * New medical/YMYL landing pages are generated and reviewable before launch,
 * but stay out of Google and the sitemap until RESET Clinic confirms medical review.
 */
export function isSeoLandingApprovedForIndex(path: string) {
  return !PENDING_MEDICAL_REVIEW_PATHS.has(path);
}

export const PENDING_MEDICAL_REVIEW = [...PENDING_MEDICAL_REVIEW_PATHS];

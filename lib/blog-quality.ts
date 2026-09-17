import { DOCTORS } from "./doctors";

type BlogQualityInput = {
  indexable: boolean;
  author_name: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  seo_description?: string | null;
  excerpt?: string | null;
  body: string;
  sources: unknown[];
  faq?: unknown[];
};

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA").replace(/\s+/g, " ");
}

function isVerifiedDoctorName(value?: string | null) {
  if (!value?.trim()) return false;
  const normalized = normalizeName(value);
  return DOCTORS.some((doctor) => normalizeName(doctor.name) === normalized);
}

export function hasVerifiedClinicalAuthor(post: BlogQualityInput) {
  return isVerifiedDoctorName(post.author_name);
}

export function hasVerifiedClinicalReviewer(post: BlogQualityInput) {
  return isVerifiedDoctorName(post.reviewer_name);
}

export function blogWordCount(body: string) {
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

/**
 * Medical/YMYL publication gate.
 * A CMS editor may mark a post as published for preview/editorial workflow,
 * but Google indexing is allowed only after an explicit clinical review.
 */
export function isBlogPostSeoReady(post: BlogQualityInput) {
  if (!post.indexable) return false;
  if (!hasVerifiedClinicalAuthor(post)) return false;
  if (!hasVerifiedClinicalReviewer(post)) return false;
  if (!post.reviewed_at?.trim()) return false;
  if (!(post.seo_description?.trim() || post.excerpt?.trim())) return false;
  if (!Array.isArray(post.sources) || post.sources.length < 2) return false;
  if (blogWordCount(post.body) < 450) return false;

  return true;
}

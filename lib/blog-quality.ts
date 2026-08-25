import { DOCTORS } from "./doctors";

type BlogQualityInput = {
  indexable: boolean;
  author_name: string | null;
  seo_description?: string | null;
  excerpt?: string | null;
  body: string;
  sources: unknown[];
};

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA").replace(/\s+/g, " ");
}

export function hasVerifiedClinicalAuthor(post: BlogQualityInput) {
  if (!post.author_name?.trim()) return false;
  const author = normalizeName(post.author_name);
  return DOCTORS.some((doctor) => normalizeName(doctor.name) === author);
}

export function isBlogPostSeoReady(post: BlogQualityInput) {
  if (!post.indexable) return false;
  if (!hasVerifiedClinicalAuthor(post)) return false;
  if (!(post.seo_description?.trim() || post.excerpt?.trim())) return false;
  if (!Array.isArray(post.sources) || post.sources.length === 0) return false;

  const words = post.body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  return words >= 300;
}

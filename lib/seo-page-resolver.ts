import { SECONDARY_SEO_LANDINGS } from "./seo-secondary-pages";
import { SEO_LANDINGS, normalizeSeoPath } from "./seo-pages";

export const ALL_SEO_LANDINGS = [...SEO_LANDINGS, ...SECONDARY_SEO_LANDINGS];

export function resolveSeoLanding(path: string) {
  const normalized = normalizeSeoPath(path);
  return ALL_SEO_LANDINGS.find((item) => item.path === normalized);
}

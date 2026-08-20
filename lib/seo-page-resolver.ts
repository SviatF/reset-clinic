import { SECONDARY_SEO_LANDINGS } from "./seo-secondary-pages";
import { SEO_WAVE2_LANDINGS } from "./seo-wave2-pages";
import { SEO_LANDINGS, normalizeSeoPath, type SeoLanding } from "./seo-pages";

function normalizeWave2Landing(landing: SeoLanding): SeoLanding {
  const description = landing.description.replace(
    " у Львові у RESET Clinic у Львові",
    " у RESET Clinic у Львові",
  );

  if (
    landing.path.startsWith("/dermatology/dermatitis/") &&
    landing.path !== "/dermatology/dermatitis/"
  ) {
    const current = landing.breadcrumbs[landing.breadcrumbs.length - 1];
    return {
      ...landing,
      description,
      breadcrumbs: [
        { name: "Головна", href: "/" },
        { name: "Дерматологія", href: "/dermatology/" },
        { name: "Дерматити", href: "/dermatology/dermatitis/" },
        current,
      ],
    };
  }

  return { ...landing, description };
}

const NORMALIZED_WAVE2_LANDINGS = SEO_WAVE2_LANDINGS.map(normalizeWave2Landing);

export const ALL_SEO_LANDINGS = [
  ...SEO_LANDINGS,
  ...SECONDARY_SEO_LANDINGS,
  ...NORMALIZED_WAVE2_LANDINGS,
];

export function resolveSeoLanding(path: string) {
  const normalized = normalizeSeoPath(path);
  return ALL_SEO_LANDINGS.find((item) => item.path === normalized);
}

import { SECONDARY_SEO_LANDINGS } from "./seo-secondary-pages";
import { SEO_WAVE2_LANDINGS } from "./seo-wave2-pages";
import { SEO_WAVE3_LANDINGS } from "./seo-wave3-pages";
import { applyMarketingCopy } from "./seo-marketing-copy";
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

function enhanceStructuralLinks(landing: SeoLanding): SeoLanding {
  if (landing.path === "/cosmetology/injection/botulinum-therapy/") {
    const sections = landing.sections.map((section) => {
      if (section.title !== "Які зони можуть коригуватися") return section;
      const bullets = section.bullets ?? [];
      const masseter = "жувальні м’язи (масетери) — лише за показаннями";
      return { ...section, bullets: bullets.includes(masseter) ? bullets : [...bullets, masseter] };
    });

    const hasMasseterSection = sections.some((section) => section.title.includes("Масетери"));
    const nextSections = hasMasseterSection
      ? sections
      : [
          ...sections,
          {
            title: "Масетери та жувальні м’язи",
            text: [
              "Ботулінотерапія жувальних м’язів має окремі анатомічні та функціональні показання. Доцільність корекції визначає лікар після оцінки м’язової активності, анатомії, скарг і очікуваного результату.",
            ],
          },
        ];

    const hasHyperhidrosis = landing.related.some((group) =>
      group.items.some((item) => item.href === "/dermatology/hyperhidrosis-treatment/"),
    );

    return {
      ...landing,
      sections: nextSections,
      related: hasHyperhidrosis
        ? landing.related
        : [
            ...landing.related,
            {
              title: "Інший медичний напрям ботулінотерапії",
              items: [
                { label: "Лікування гіпергідрозу", href: "/dermatology/hyperhidrosis-treatment/" },
              ],
            },
          ],
    };
  }

  if (
    landing.path === "/dermatology/hair-loss-treatment/" ||
    landing.path === "/skin-problems/hair-loss/"
  ) {
    const hasTrichology = landing.related.some((group) =>
      group.items.some((item) => item.href === "/dermatology/trichologist-lviv/"),
    );
    return hasTrichology
      ? landing
      : {
          ...landing,
          related: [
            ...landing.related,
            {
              title: "Трихологія",
              items: [
                { label: "Консультація трихолога", href: "/dermatology/trichologist-lviv/" },
                { label: "Трихоскопія", href: "/dermatology/trichoscopy/" },
              ],
            },
          ],
        };
  }

  return landing;
}

const NORMALIZED_WAVE2_LANDINGS = SEO_WAVE2_LANDINGS.map(normalizeWave2Landing);

export const ALL_SEO_LANDINGS = [
  ...SEO_LANDINGS,
  ...SECONDARY_SEO_LANDINGS,
  ...NORMALIZED_WAVE2_LANDINGS,
  ...SEO_WAVE3_LANDINGS,
]
  .map(enhanceStructuralLinks)
  .map(applyMarketingCopy);

export function resolveSeoLanding(path: string) {
  const normalized = normalizeSeoPath(path);
  return ALL_SEO_LANDINGS.find((item) => item.path === normalized);
}

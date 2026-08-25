import type { SeoLanding } from "./seo-pages";
import { hasMarketingCopy } from "./seo-marketing-copy";
import { hasExtraMarketingCopy } from "./seo-marketing-copy-extra";
import {
  buildCompliantLandingJsonLd as baseBuildCompliantLandingJsonLd,
  supplementalLandingSections as baseSupplementalLandingSections,
} from "./seo-compliance-core";
import { SITE_URL } from "./seo";

export {
  isSeoLandingIndexable,
  displayH1ForLanding,
  buildCompliantLandingMetadata,
  reviewerForLanding,
  priceHrefForLanding,
  blogCategoryForLanding,
} from "./seo-compliance-core";

export function buildCompliantLandingJsonLd(landing: SeoLanding) {
  const schema = baseBuildCompliantLandingJsonLd(landing) as {
    "@context": string;
    "@graph": Record<string, unknown>[];
  };

  if (landing.type !== "procedure") return schema;

  const url = `${SITE_URL}${landing.path}`;
  const serviceId = `${url}#service`;
  if (schema["@graph"].some((node) => node["@id"] === serviceId)) return schema;

  return {
    ...schema,
    "@graph": [
      ...schema["@graph"],
      {
        "@type": "Service",
        "@id": serviceId,
        name: landing.h1,
        description: landing.description,
        url,
        provider: { "@id": `${SITE_URL}/#clinic` },
        areaServed: { "@type": "City", name: "Львів" },
        serviceType: landing.h1,
      },
    ],
  };
}

function cleanPublicMedicalCopy(value: string) {
  return value
    .replace(
      "Корекція масетерів не винесена в окрему thin SEO-page. Вона залишається частиною основної сторінки ботулінотерапії;",
      "Корекція жувальних м’язів розглядається як один із напрямів ботулінотерапії;",
    )
    .replace(
      "Problem page не підміняє консультацію і не прив’язує симптом до однієї процедури.",
      "Інформація на сторінці не підміняє консультацію і не прив’язує симптом до однієї процедури.",
    )
    .replace(/thin SEO-page/gi, "окрему сторінку")
    .replace(/thin landing page/gi, "окремої сторінки")
    .replace(/\bProblem page\b/gi, "Інформація на сторінці");
}

export function supplementalLandingSections(landing: SeoLanding): SeoLanding["sections"] {
  const cleaned = baseSupplementalLandingSections(landing).map((section) => ({
    ...section,
    title: cleanPublicMedicalCopy(section.title),
    text: section.text?.map(cleanPublicMedicalCopy),
    bullets: section.bullets?.map(cleanPublicMedicalCopy),
  }));

  const marketingFirst = hasMarketingCopy(landing.path) || hasExtraMarketingCopy(landing.path);
  if (!marketingFirst) return cleaned;

  // Conversion-focused landings already contain their own unique medical and
  // decision-making sections. Do not append generic filler. The botulinum page
  // keeps only the seven zone-specific H2 sections required by its search structure.
  if (landing.path === "/cosmetology/injection/botulinum-therapy/") {
    return cleaned.slice(0, 7);
  }

  return [];
}

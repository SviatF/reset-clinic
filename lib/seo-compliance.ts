import type { SeoLanding } from "./seo-pages";
import { supplementalLandingSections as baseSupplementalLandingSections } from "./seo-compliance-base";

export {
  isSeoLandingIndexable,
  displayH1ForLanding,
  buildCompliantLandingMetadata,
  reviewerForLanding,
  priceHrefForLanding,
  blogCategoryForLanding,
  buildCompliantLandingJsonLd,
} from "./seo-compliance-base";

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
  return baseSupplementalLandingSections(landing).map((section) => ({
    ...section,
    title: cleanPublicMedicalCopy(section.title),
    text: section.text?.map(cleanPublicMedicalCopy),
    bullets: section.bullets?.map(cleanPublicMedicalCopy),
  }));
}

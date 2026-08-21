import type { SeoLanding } from "./seo-pages";

function sanitizeText(value: string) {
  return value
    .replace(/Problem-based SEO/gi, "Проблеми шкіри")
    .replace(/Skin care hub/gi, "Догляд за шкірою")
    .replace(/SEO[- ]intent/gi, "пошуковий запит")
    .replace(/search intents?/gi, "запити")
    .replace(/commercial intents?/gi, "запити на послугу")
    .replace(/informational intents?/gi, "інформаційні запити")
    .replace(/transactional intents?/gi, "запити на процедуру")
    .replace(/mixed intents?/gi, "змішані запити")
    .replace(/problem-based intents?/gi, "запити про проблему")
    .replace(/symptom-based intents?/gi, "запити про симптоми")
    .replace(/method-based search intents?/gi, "запити про метод")
    .replace(/primary keyword clusters?/gi, "основні теми")
    .replace(/primary keywords?/gi, "основні запити")
    .replace(/keyword clusters?/gi, "теми")
    .replace(/thin SEO-pages?/gi, "окремі слабкі сторінки")
    .replace(/thin pages?/gi, "окремі слабкі сторінки")
    .replace(/landing pages?/gi, "сторінки")
    .replace(/commercial pages?/gi, "сторінки послуг")
    .replace(/treatment pages?/gi, "сторінки лікування")
    .replace(/informational pages?/gi, "інформаційні сторінки")
    .replace(/\bhub-сторінк[аи]\b/gi, "розділ")
    .replace(/\bhub\b/gi, "розділ")
    .replace(/інформаційний кластер/gi, "інформаційний розділ")
    .replace(/симптомний кластер/gi, "група симптомів")
    .replace(/апаратний кластер/gi, "апаратний напрям")
    .replace(/окремий кластер/gi, "окремий напрям")
    .replace(/\bкластер\b/gi, "напрям")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeSeoLandingPublicCopy(landing: SeoLanding): SeoLanding {
  return {
    ...landing,
    title: sanitizeText(landing.title),
    description: sanitizeText(landing.description),
    h1: sanitizeText(landing.h1),
    eyebrow: sanitizeText(landing.eyebrow),
    intro: sanitizeText(landing.intro),
    breadcrumbs: landing.breadcrumbs.map((crumb) => ({ ...crumb, name: sanitizeText(crumb.name) })),
    sections: landing.sections.map((section) => ({
      ...section,
      title: sanitizeText(section.title),
      text: section.text?.map(sanitizeText),
      bullets: section.bullets?.map(sanitizeText),
    })),
    related: landing.related.map((group) => ({
      ...group,
      title: sanitizeText(group.title),
      items: group.items.map((item) => ({ ...item, label: sanitizeText(item.label) })),
    })),
    faq: landing.faq.map((item) => ({
      question: sanitizeText(item.question),
      answer: sanitizeText(item.answer),
    })),
    cta: {
      ...landing.cta,
      title: sanitizeText(landing.cta.title),
      text: sanitizeText(landing.cta.text),
      label: sanitizeText(landing.cta.label),
    },
  };
}

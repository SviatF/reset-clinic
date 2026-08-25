import type { SeoLanding } from "./seo-pages";

function sanitizeText(value: string) {
  return value
    // Remove internal SEO/editorial language before the copy reaches patients.
    .replace(
      /Комерційний фокус цієї сторінки — саме медичний маршрут/gi,
      "Ця сторінка описує медичний маршрут",
    )
    .replace(
      /Ця сторінка відповідає на інформаційний intent про акне\. Вона пояснює проблему і веде користувача до окремої commercial page «Лікування акне у Львові», не конкуруючи з нею за primary transactional keyword\./gi,
      "Тут зібрана базова інформація про акне, його прояви та ситуації, коли варто звернутися до дерматолога. Окремо доступна сторінка про лікування акне у Львові.",
    )
    .replace(
      /Для SEO ми відділяємо його від активного акне, тому що intent користувача вже зміщується від лікування запалення до корекції наслідків\./gi,
      "Постакне відрізняється від активного акне: після контролю запалення фокус переходить на плями, рубці та зміни рельєфу шкіри.",
    )
    .replace(
      /Problem page про розацеа відповідає на запити «що це», «чому червоніє обличчя» та «що робити»\. Для запиту «лікування розацеа Львів» створена окрема commercial treatment page\./gi,
      "Тут пояснюємо, що таке розацеа, чому може червоніти обличчя та коли потрібна консультація. Інформація про лікування розацеа у Львові доступна на окремій сторінці послуги.",
    )
    .replace(
      /Цей розділ відповідає на інформаційні та mixed-intent запити:[^.]*\. Він не дублює commercial treatment pages\./gi,
      "Цей розділ допомагає зорієнтуватися у поширених проблемах шкіри: можливих причинах, симптомах, ситуаціях для звернення до лікаря та доступних напрямах допомоги.",
    )
    .replace(
      /Цей розділ не перетворюємо на шість майже однакових commercial landing pages\. Він працює як інформаційний hub, а детальні запити «догляд при акне», «догляд при розацеа» та інші розкриваються у статтях блогу з посиланнями на problem і treatment pages\./gi,
      "Цей розділ об’єднує базові принципи щоденного догляду за шкірою. Детальні рекомендації для акне, розацеа та інших станів розкриваються в окремих матеріалах і профільних сторінках клініки.",
    )
    .replace(/Експертний інформаційний hub RESET Clinic\./gi, "Практичні рекомендації RESET Clinic.")
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
    .replace(/primary transactional keywords?/gi, "основні запити на лікування")
    .replace(/primary keyword clusters?/gi, "основні теми")
    .replace(/primary keywords?/gi, "основні запити")
    .replace(/keyword clusters?/gi, "теми")
    .replace(/thin SEO-pages?/gi, "окремі слабкі сторінки")
    .replace(/thin pages?/gi, "окремі слабкі сторінки")
    .replace(/commercial treatment pages?/gi, "сторінки лікування")
    .replace(/commercial landing pages?/gi, "сторінки послуг")
    .replace(/commercial pages?/gi, "сторінки послуг")
    .replace(/treatment pages?/gi, "сторінки лікування")
    .replace(/problem pages?/gi, "сторінки про проблему")
    .replace(/informational pages?/gi, "інформаційні сторінки")
    .replace(/landing pages?/gi, "сторінки")
    .replace(/\binformational intent\b/gi, "інформаційний запит")
    .replace(/\bcommercial intent\b/gi, "запит на послугу")
    .replace(/\btransactional intent\b/gi, "запит на процедуру")
    .replace(/\bmixed[- ]intent\b/gi, "змішаний запит")
    .replace(/\bintent\b/gi, "запит")
    .replace(/\bprimary keyword\b/gi, "основний запит")
    .replace(/\bkeyword\b/gi, "запит")
    .replace(/\bSEO\b/gi, "")
    .replace(/\bhub-сторінк[аи]\b/gi, "розділ")
    .replace(/\bhub\b/gi, "розділ")
    .replace(/інформаційний кластер/gi, "інформаційний розділ")
    .replace(/симптомний кластер/gi, "група симптомів")
    .replace(/апаратний кластер/gi, "апаратний напрям")
    .replace(/окремий кластер/gi, "окремий напрям")
    .replace(/\bкластер\b/gi, "напрям")
    .replace(/\s+([,.;:!?])/g, "$1")
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

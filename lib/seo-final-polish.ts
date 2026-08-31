import type { SeoLanding } from "./seo-pages";

export function applyFinalSeoCopyPolish(landing: SeoLanding): SeoLanding {
  if (landing.path === "/nutrition/medical-weight-loss/") {
    return {
      ...landing,
      faq: landing.faq.map((item) =>
        item.question === "Медичне схуднення і схуднення під контролем лікаря — різні послуги?"
          ? {
              ...item,
              answer: "У RESET Clinic це один медичний напрям контролю ваги. Конкретний формат програми, обсяг обстежень і частоту супроводу лікар визначає індивідуально після консультації.",
            }
          : item,
      ),
    };
  }

  if (landing.path === "/cosmetology/hardware/aquapure/") {
    return {
      ...landing,
      faq: landing.faq.map((item) =>
        item.question === "AquaPure і чистка обличчя — одне?"
          ? {
              ...item,
              answer: "AquaPure — це апаратний формат очищення та догляду за шкірою. Комбінована чистка може включати інші етапи, зокрема роботу з окремими комедонами. Оптимальний протокол спеціаліст підбирає після оцінки стану шкіри.",
            }
          : item,
      ),
      cta: {
        ...landing.cta,
        title: "Не знаєте, яка чистка потрібна саме вашій шкірі?",
        text: "Запишіться на оцінку шкіри — спеціаліст допоможе обрати AquaPure, комбіновану чистку або інший доцільний формат догляду.",
        label: "Записатися на чистку",
      },
    };
  }

  return landing;
}

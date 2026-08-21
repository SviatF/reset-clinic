"use client";

import { useLayoutEffect } from "react";

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

type BookingMode = "specialist" | "service";

type BookingState = {
  mode: BookingMode | null;
  specialist: string;
  service: string;
};

type BookingOption = {
  name: string;
  meta: string;
};

const SPECIALISTS: BookingOption[] = [
  { name: "Грицута Тетяна", meta: "Лікар-косметолог" },
  { name: "Мількович Христина", meta: "Лікар-косметолог" },
  { name: "Сохан Адріана", meta: "Лікар-косметолог" },
  { name: "Допоможіть обрати спеціаліста", meta: "Адміністратор підбере лікаря під ваш запит" },
];

const SERVICES: BookingOption[] = [
  { name: "Консультація дерматолога", meta: "Діагностика та персональний план лікування" },
  { name: "Лікування акне", meta: "Комплексна робота з висипаннями та постакне" },
  { name: "Лікування розацеа", meta: "Діагностика, терапія та контроль стану шкіри" },
  { name: "Лікування пігментації", meta: "Підбір лікування та процедур" },
  { name: "Трихологія / випадіння волосся", meta: "Консультація та діагностика волосся і шкіри голови" },
  { name: "Ботулінотерапія", meta: "Корекція мімічних зморшок та інших показань" },
  { name: "Контурна пластика губ", meta: "Корекція форми та об’єму губ" },
  { name: "Контурна пластика обличчя", meta: "Гармонізація рис обличчя" },
  { name: "Біоревіталізація", meta: "Ін’єкційне покращення якості шкіри" },
  { name: "Мезотерапія / полінуклеотиди", meta: "Ін’єкційні програми за показаннями" },
  { name: "IPL-терапія", meta: "Апаратна робота з тоном, почервонінням та пігментацією" },
  { name: "Мікроголковий RF", meta: "Апаратна корекція текстури та якості шкіри" },
  { name: "LED-терапія", meta: "Світлотерапія як частина комплексного догляду" },
  { name: "AquaPure / догляд", meta: "Комплексний догляд та очищення шкіри" },
  { name: "Діагностика шкіри", meta: "Оцінка стану шкіри та підбір догляду" },
  { name: "Консультація нутриціолога", meta: "Оцінка харчування та індивідуальні рекомендації" },
  { name: "Інше / не знаю, що обрати", meta: "Опишіть запит — адміністратор допоможе" },
];

const BOOKING_CSS = `
.ccb-widget [data-ccb-action="mode"]{cursor:pointer}
.ccb-widget [data-ccb-action="mode"]:focus-visible{outline:2px solid var(--ccb-accent,#8a6d3b);outline-offset:4px}
.ccb-native-nav{display:flex;align-items:center;margin:0 0 14px}
.ccb-native-back{appearance:none;border:0;background:transparent;color:#6d5a47;padding:6px 0;font:inherit;font-size:14px;cursor:pointer}
.ccb-native-back:hover{text-decoration:underline}
.ccb-native-options{display:grid;gap:10px}
.ccb-native-option{width:100%;display:flex;align-items:center;justify-content:space-between;gap:18px;text-align:left;border:1px solid rgba(41,32,27,.14);border-radius:14px;background:#fffdf8;color:#29201b;padding:16px 18px;font:inherit;cursor:pointer;transition:border-color .18s ease,transform .18s ease,background .18s ease}
.ccb-native-option:hover{border-color:var(--ccb-accent,#8a6d3b);background:#fff;transform:translateY(-1px)}
.ccb-native-option:focus-visible{outline:2px solid var(--ccb-accent,#8a6d3b);outline-offset:2px}
.ccb-native-option-copy{display:grid;gap:3px}
.ccb-native-option strong{font-size:16px;font-weight:500;line-height:1.3}
.ccb-native-option small{font-size:13px;line-height:1.35;opacity:.65}
.ccb-native-arrow{font-size:20px;line-height:1;color:var(--ccb-accent,#8a6d3b);flex:0 0 auto}
.ccb-native-summary{border:1px solid rgba(41,32,27,.12);border-radius:14px;background:rgba(255,255,255,.5);padding:13px 15px;margin-bottom:16px}
.ccb-native-summary-label{display:block;font-size:12px;line-height:1.2;opacity:.58;margin-bottom:4px}
.ccb-native-summary-value{display:block;font-size:15px;line-height:1.35;color:#29201b}
.ccb-native-form{display:grid;gap:14px}
.ccb-native-field{display:grid;gap:7px;color:#29201b;font-size:13px;line-height:1.3}
.ccb-native-field span{font-weight:500}
.ccb-native-field input,.ccb-native-field select,.ccb-native-field textarea{width:100%;min-height:48px;border:1px solid rgba(41,32,27,.2);border-radius:12px;background:#fff;color:#29201b;padding:12px 14px;font:inherit;font-size:15px;outline:none}
.ccb-native-field textarea{min-height:94px;resize:vertical}
.ccb-native-field input:focus,.ccb-native-field select:focus,.ccb-native-field textarea:focus{border-color:var(--ccb-accent,#8a6d3b);box-shadow:0 0 0 2px rgba(138,109,59,.12)}
.ccb-native-submit{width:100%;min-height:50px;border:1px solid var(--ccb-accent,#8a6d3b);border-radius:999px;background:var(--ccb-accent,#8a6d3b);color:#fff;padding:13px 20px;font:inherit;font-size:15px;font-weight:500;cursor:pointer;transition:opacity .18s ease,transform .18s ease}
.ccb-native-submit:hover{transform:translateY(-1px)}
.ccb-native-submit:disabled{cursor:wait;opacity:.62;transform:none}
.ccb-native-note{margin:0;font-size:12px;line-height:1.45;color:rgba(41,32,27,.62)}
.ccb-native-status{min-height:18px;font-size:13px;line-height:1.35;color:#8b2d21}
.ccb-native-honeypot{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
@media(max-width:767px){.ccb-native-option{padding:14px}.ccb-native-option strong{font-size:15px}.ccb-native-field input,.ccb-native-field select,.ccb-native-field textarea{font-size:16px}}
`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function optionMarkup(options: BookingOption[], action: "specialist" | "service") {
  return options
    .map(
      (option, index) => `
        <button type="button" class="ccb-native-option" data-ccb-action="${action}" data-ccb-index="${index}">
          <span class="ccb-native-option-copy">
            <strong>${escapeHtml(option.name)}</strong>
            <small>${escapeHtml(option.meta)}</small>
          </span>
          <span class="ccb-native-arrow" aria-hidden="true">→</span>
        </button>`,
    )
    .join("");
}

function setupBookingWidget(root: HTMLElement, startedAt: number) {
  const steps = root.querySelector<HTMLElement>(".ccb-steps");
  const title = root.querySelector<HTMLElement>(".ccb-step-title");
  if (!steps || !title) return () => undefined;

  const initialTitle = title.textContent?.trim() || "Як бажаєте записатись?";
  const initialMarkup = steps.innerHTML;
  const state: BookingState = { mode: null, specialist: "", service: "" };

  const decorateInitialChoices = () => {
    const rows = [...steps.querySelectorAll<HTMLElement>(".ccb-choice-row")];
    const specialist = rows[0];
    const service = rows[1];

    if (specialist) {
      specialist.dataset.ccbAction = "mode";
      specialist.dataset.ccbMode = "specialist";
      specialist.setAttribute("role", "button");
      specialist.setAttribute("tabindex", "0");
      specialist.setAttribute("aria-label", "Записатися за спеціалістом");
    }
    if (service) {
      service.dataset.ccbAction = "mode";
      service.dataset.ccbMode = "service";
      service.setAttribute("role", "button");
      service.setAttribute("tabindex", "0");
      service.setAttribute("aria-label", "Записатися за послугою");
    }
  };

  const renderStart = () => {
    state.mode = null;
    state.specialist = "";
    state.service = "";
    title.textContent = initialTitle;
    steps.innerHTML = initialMarkup;
    decorateInitialChoices();
  };

  const renderOptions = (mode: BookingMode) => {
    state.mode = mode;
    state.specialist = "";
    state.service = "";
    const bySpecialist = mode === "specialist";
    title.textContent = bySpecialist ? "Оберіть спеціаліста" : "Оберіть послугу";
    steps.innerHTML = `
      <div class="ccb-native-nav">
        <button type="button" class="ccb-native-back" data-ccb-action="back-start">← Назад</button>
      </div>
      <div class="ccb-native-options">
        ${optionMarkup(bySpecialist ? SPECIALISTS : SERVICES, bySpecialist ? "specialist" : "service")}
      </div>`;
  };

  const renderContactForm = () => {
    const mode = state.mode;
    if (!mode) return renderStart();

    const selectedValue = mode === "specialist" ? state.specialist : state.service;
    const selectedLabel = mode === "specialist" ? "Спеціаліст" : "Послуга";
    const serviceOptions = SERVICES.map(
      (option) => `<option value="${escapeHtml(option.name)}">${escapeHtml(option.name)}</option>`,
    ).join("");

    title.textContent = "Залиште контакти";
    steps.innerHTML = `
      <div class="ccb-native-nav">
        <button type="button" class="ccb-native-back" data-ccb-action="back-options">← Назад</button>
      </div>
      <div class="ccb-native-summary">
        <span class="ccb-native-summary-label">${selectedLabel}</span>
        <span class="ccb-native-summary-value">${escapeHtml(selectedValue)}</span>
      </div>
      <form class="ccb-native-form" data-ccb-booking-form novalidate>
        <label class="ccb-native-field">
          <span>Ваше ім’я *</span>
          <input type="text" name="name" autocomplete="name" maxlength="120" required placeholder="Ім’я">
        </label>
        <label class="ccb-native-field">
          <span>Номер телефону *</span>
          <input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="40" required placeholder="+380">
        </label>
        ${
          mode === "specialist"
            ? `<label class="ccb-native-field">
                <span>Послуга або запит</span>
                <select name="service">
                  <option value="">Поки не знаю / обговорю з лікарем</option>
                  ${serviceOptions}
                </select>
              </label>`
            : ""
        }
        <label class="ccb-native-field">
          <span>Коли вам зручно?</span>
          <input type="text" name="preferredTime" maxlength="160" placeholder="Наприклад, будні після 16:00">
        </label>
        <label class="ccb-native-field">
          <span>Коментар</span>
          <textarea name="message" maxlength="1000" placeholder="За бажанням опишіть ваш запит"></textarea>
        </label>
        <label class="ccb-native-honeypot" aria-hidden="true">
          Website
          <input type="text" name="website" tabindex="-1" autocomplete="off">
        </label>
        <button type="submit" class="ccb-native-submit">Надіслати заявку</button>
        <p class="ccb-native-note">Адміністратор RESET Clinic зв’яжеться з вами, уточнить деталі та підтвердить час запису.</p>
        <div class="ccb-native-status" data-ccb-status role="status" aria-live="polite"></div>
      </form>`;

    window.requestAnimationFrame(() => {
      steps.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
    });
  };

  const handleClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    const actionElement = target?.closest<HTMLElement>("[data-ccb-action]");
    if (!actionElement || !root.contains(actionElement)) return;

    const action = actionElement.dataset.ccbAction;
    if (action === "mode") {
      const mode = actionElement.dataset.ccbMode;
      if (mode === "specialist" || mode === "service") renderOptions(mode);
      return;
    }
    if (action === "back-start") {
      renderStart();
      return;
    }
    if (action === "back-options") {
      if (state.mode) renderOptions(state.mode);
      else renderStart();
      return;
    }
    if (action === "specialist") {
      const index = Number(actionElement.dataset.ccbIndex);
      const option = SPECIALISTS[index];
      if (!option) return;
      state.specialist = option.name;
      renderContactForm();
      return;
    }
    if (action === "service") {
      const index = Number(actionElement.dataset.ccbIndex);
      const option = SERVICES[index];
      if (!option) return;
      state.service = option.name;
      renderContactForm();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target instanceof Element ? event.target : null;
    const actionElement = target?.closest<HTMLElement>('[data-ccb-action="mode"][role="button"]');
    if (!actionElement || !root.contains(actionElement)) return;
    event.preventDefault();
    actionElement.click();
  };

  const handleSubmit = async (event: Event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-ccb-booking-form]")) return;
    event.preventDefault();

    if (!form.reportValidity()) return;
    if (form.dataset.resetSubmitting === "1") return;
    form.dataset.resetSubmitting = "1";

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>("[data-ccb-status]");
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const preferredTime = String(data.get("preferredTime") || "").trim();
    const message = String(data.get("message") || "").trim();
    const specialistService = String(data.get("service") || "").trim();
    const selectedService = state.mode === "service" ? state.service : specialistService;
    const website = String(data.get("website") || "").trim();

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Надсилаємо…";
    }
    if (status) status.textContent = "";

    const payload = {
      name,
      phone,
      message,
      service: selectedService || (state.specialist ? `Запис до ${state.specialist}` : "Запис на прийом"),
      formId: "booking-widget",
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: trackingValue("utm_source"),
      utmMedium: trackingValue("utm_medium"),
      utmCampaign: trackingValue("utm_campaign"),
      utmContent: trackingValue("utm_content"),
      utmTerm: trackingValue("utm_term"),
      gclid: trackingValue("gclid"),
      fbclid: trackingValue("fbclid"),
      ttclid: trackingValue("ttclid"),
      startedAt,
      website,
      fields: {
        booking_mode: state.mode === "specialist" ? "За спеціалістом" : "За послугою",
        specialist: state.specialist || undefined,
        service: selectedService || undefined,
        preferred_time: preferredTime || undefined,
        message: message || undefined,
      },
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Lead API ${response.status}`);
      window.location.assign("/thank-you/");
    } catch (error) {
      console.error("RESET booking submission failed", error);
      form.dataset.resetSubmitting = "0";
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Надіслати заявку";
      }
      if (status) {
        status.textContent = "Не вдалося надіслати заявку. Спробуйте ще раз або зв’яжіться з клінікою телефоном.";
      }
    }
  };

  decorateInitialChoices();
  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleKeydown);
  root.addEventListener("submit", handleSubmit);

  return () => {
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleKeydown);
    root.removeEventListener("submit", handleSubmit);
  };
}

export default function LegacyBookingEnhancer({ bodyClass }: { bodyClass: string }) {
  useLayoutEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const active = document.querySelector<HTMLElement>(isMobile ? ".legacy-mobile" : ".legacy-desktop");
    if (!active) return;

    const startedAt = Date.now();
    const cleanups = [...active.querySelectorAll<HTMLElement>(".ccb-widget")].map((widget) =>
      setupBookingWidget(widget, startedAt),
    );

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [bodyClass]);

  return <style dangerouslySetInnerHTML={{ __html: BOOKING_CSS }} />;
}

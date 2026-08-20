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

function firstValue(form: HTMLFormElement, selectors: string[]) {
  for (const selector of selectors) {
    const node = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
    if (node?.value?.trim()) return node.value.trim();
  }
  return undefined;
}

function rememberTracking() {
  const params = new URLSearchParams(window.location.search);
  TRACKING_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) sessionStorage.setItem(`reset_${key}`, value.slice(0, 500));
  });
}

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function isElementorPopupTrigger(element: HTMLElement) {
  if (element.classList.contains("reset-menu-trigger")) return true;
  if (element.classList.contains("elementor-menu-toggle")) return true;
  if (!(element instanceof HTMLAnchorElement)) return false;

  const rawHref = element.getAttribute("href") || "";
  let href = rawHref;
  try {
    href = decodeURIComponent(rawHref);
  } catch {
    href = rawHref;
  }

  return href.includes("elementor-action:action=popup:open");
}

export default function LegacyEnhancer({ bodyClass }: { bodyClass: string }) {
  useLayoutEffect(() => {
    const clean: Array<() => void> = [];
    const previousBodyClass = document.body.className;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const startedAt = Date.now();

    rememberTracking();

    // Keep only the viewport-specific snapshot in the live DOM. This avoids
    // duplicate Elementor ids/targets from the hidden responsive snapshot.
    const inactive = document.querySelector<HTMLElement>(
      isMobile ? ".legacy-desktop" : ".legacy-mobile",
    );
    inactive?.remove();

    document.body.className = `${bodyClass}${isMobile ? " e--ua-isTouchDevice" : ""}`.trim();

    const active = document.querySelector<HTMLElement>(
      isMobile ? ".legacy-mobile" : ".legacy-desktop",
    );

    // Elementor normally performs these mutations in its frontend runtime.
    // The migrated site keeps the resulting static visual state without
    // loading Elementor/WordPress JavaScript.
    active?.querySelectorAll<HTMLElement>(".elementor-invisible").forEach((element) => {
      element.classList.remove("elementor-invisible");
    });
    active
      ?.querySelectorAll<HTMLElement>(".e-con, [data-settings*='background_background']")
      .forEach((element) => element.classList.add("e-lazyloaded"));

    active?.querySelectorAll<HTMLFormElement>("form").forEach((form, formIndex) => {
      const fn = async (event: Event) => {
        event.preventDefault();

        if (form.dataset.resetSubmitting === "1") return;
        form.dataset.resetSubmitting = "1";

        const submitButtons = [...form.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button[type=submit], input[type=submit]")];
        submitButtons.forEach((button) => (button.disabled = true));

        const data = new FormData(form);
        const fields: Record<string, string | string[]> = {};
        data.forEach((value, key) => {
          if (typeof value !== "string") return;
          const current = fields[key];
          fields[key] = current
            ? Array.isArray(current)
              ? [...current, value]
              : [current, value]
            : value;
        });

        const payload = {
          name: firstValue(form, [
            'input[name*="name" i]',
            'input[name*="ім" i]',
            'input[name*="pib" i]',
            'input[autocomplete="name"]',
          ]),
          phone: firstValue(form, [
            'input[type="tel"]',
            'input[name*="phone" i]',
            'input[name*="tel" i]',
            'input[autocomplete="tel"]',
          ]),
          email: firstValue(form, ['input[type="email"]', 'input[name*="email" i]']),
          message: firstValue(form, ['textarea', 'input[name*="message" i]', 'input[name*="comment" i]']),
          service: firstValue(form, ['select[name*="service" i]', 'input[name*="service" i]', 'select']),
          formId: form.id || form.getAttribute("name") || `legacy-form-${formIndex + 1}`,
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
          website: typeof fields.website === "string" ? fields.website : undefined,
          fields,
        };

        try {
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error(`Lead API ${response.status}`);
          window.location.href = "/thank-you/";
        } catch (error) {
          console.error("RESET lead submission failed", error);
          form.dataset.resetSubmitting = "0";
          submitButtons.forEach((button) => (button.disabled = false));
          window.alert("Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.");
        }
      };

      form.addEventListener("submit", fn);
      clean.push(() => form.removeEventListener("submit", fn));
    });

    active?.querySelectorAll<HTMLElement>(".e-n-tabs").forEach((root) => {
      const tabs = [...root.querySelectorAll<HTMLElement>("[role=tab]")];
      tabs.forEach((tab) => {
        const fn = () => {
          tabs.forEach((item) => {
            const selected = item === tab;
            item.setAttribute("aria-selected", selected ? "true" : "false");
            item.classList.toggle("e-active", selected);
            const id = item.getAttribute("aria-controls");
            if (id) {
              root
                .querySelector<HTMLElement>(`#${CSS.escape(id)}`)
                ?.classList.toggle("e-active", selected);
            }
          });
        };
        tab.addEventListener("click", fn);
        clean.push(() => tab.removeEventListener("click", fn));
      });
    });

    const overlay = document.getElementById("reset-menu-overlay");
    const closeButton = document.getElementById("reset-menu-close");
    const triggers = active
      ? [...active.querySelectorAll<HTMLElement>(".reset-menu-trigger, .elementor-menu-toggle, a[href*='elementor-action']")]
          .filter(isElementorPopupTrigger)
      : [];
    const previousOverflow = document.body.style.overflow;

    const setExpanded = (expanded: boolean) => {
      triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", expanded ? "true" : "false"));
    };

    const open = (event?: Event) => {
      event?.preventDefault();
      if (!overlay) return;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setExpanded(true);
      closeButton?.focus({ preventScroll: true });
    };

    const close = () => {
      overlay?.classList.remove("is-open");
      overlay?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = previousOverflow;
      setExpanded(false);
    };

    triggers.forEach((item) => {
      const click = (event: Event) => open(event);
      const keydown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") open(event);
      };
      item.addEventListener("click", click);
      item.addEventListener("keydown", keydown);
      clean.push(() => item.removeEventListener("click", click));
      clean.push(() => item.removeEventListener("keydown", keydown));
    });

    const closeClick = () => close();
    closeButton?.addEventListener("click", closeClick);
    clean.push(() => closeButton?.removeEventListener("click", closeClick));

    const overlayClick = (event: MouseEvent) => {
      if (event.target === overlay) close();
    };
    overlay?.addEventListener("click", overlayClick);
    clean.push(() => overlay?.removeEventListener("click", overlayClick));

    overlay?.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      link.addEventListener("click", close);
      clean.push(() => link.removeEventListener("click", close));
    });

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", key);
    clean.push(() => window.removeEventListener("keydown", key));

    return () => {
      clean.forEach((fn) => fn());
      document.body.style.overflow = previousOverflow;
      document.body.className = previousBodyClass;
    };
  }, [bodyClass]);

  return null;
}

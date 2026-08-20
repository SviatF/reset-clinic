"use client";

import { useLayoutEffect } from "react";

export default function LegacyEnhancer({ bodyClass }: { bodyClass: string }) {
  useLayoutEffect(() => {
    const clean: Array<() => void> = [];
    const previousBodyClass = document.body.className;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

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

    active?.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
      const fn = (event: Event) => {
        event.preventDefault();
        window.location.href = "/thank-you/";
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
    const open = (event: Event) => {
      event.preventDefault();
      overlay?.classList.add("is-open");
    };
    const close = () => overlay?.classList.remove("is-open");

    active?.querySelectorAll<HTMLElement>(".reset-menu-trigger").forEach((item) => {
      item.addEventListener("click", open);
      clean.push(() => item.removeEventListener("click", open));
    });

    const button = document.getElementById("reset-menu-close");
    button?.addEventListener("click", close);
    clean.push(() => button?.removeEventListener("click", close));

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", key);
    clean.push(() => window.removeEventListener("keydown", key));

    return () => {
      clean.forEach((fn) => fn());
      document.body.className = previousBodyClass;
    };
  }, [bodyClass]);

  return null;
}

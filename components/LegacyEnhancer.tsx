"use client";

import { useLayoutEffect } from "react";

export default function LegacyEnhancer({ bodyClass }: { bodyClass: string }) {
  useLayoutEffect(() => {
    const clean: Array<() => void> = [];
    const previousBodyClass = document.body.className;

    const applyBodyClasses = () => {
      const mobileTouchClass = window.matchMedia("(max-width: 767px)").matches
        ? " e--ua-isTouchDevice"
        : "";
      document.body.className = `${bodyClass}${mobileTouchClass}`.trim();
    };

    applyBodyClasses();
    const media = window.matchMedia("(max-width: 767px)");
    const onMediaChange = () => applyBodyClasses();
    media.addEventListener("change", onMediaChange);
    clean.push(() => media.removeEventListener("change", onMediaChange));

    document.querySelectorAll<HTMLFormElement>(".legacy-page form").forEach((form) => {
      const fn = (event: Event) => {
        event.preventDefault();
        window.location.href = "/thank-you/";
      };
      form.addEventListener("submit", fn);
      clean.push(() => form.removeEventListener("submit", fn));
    });

    document.querySelectorAll<HTMLElement>(".e-n-tabs").forEach((root) => {
      const tabs = [...root.querySelectorAll<HTMLElement>("[role=tab]")];
      tabs.forEach((tab) => {
        const fn = () => {
          tabs.forEach((item) => {
            const active = item === tab;
            item.setAttribute("aria-selected", active ? "true" : "false");
            item.classList.toggle("e-active", active);
            const id = item.getAttribute("aria-controls");
            if (id) {
              root
                .querySelector<HTMLElement>(`#${CSS.escape(id)}`)
                ?.classList.toggle("e-active", active);
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

    document.querySelectorAll<HTMLElement>(".reset-menu-trigger").forEach((item) => {
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

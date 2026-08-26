"use client";

import { useLayoutEffect } from "react";

const ABOUT_GALLERY_IMAGES = [
  "/assets/desktop-47d0752051af2be99173977e7f35d39cab004f6b.jpg",
  "/assets/desktop-d37ca7b60b86de4310777a91975507cb15579fef.jpg",
  "/assets/desktop-99e75ae79a298de217fa5086c24f4bbe91e6341e.jpg",
  "/assets/desktop-3febdea9eeb32b25099c039d28f1c2a2fd197d0f.jpg",
  "/assets/desktop-c65be15cfb9648d4bc419e7965dec68355592ca6.jpg",
] as const;

function activeLegacyPage() {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  return document.querySelector<HTMLElement>(isMobile ? ".legacy-mobile" : ".legacy-desktop");
}

function repairAboutMobileCarousel(active: HTMLElement | null) {
  if (!active?.classList.contains("legacy-mobile")) return;

  const carousel =
    active.querySelector<HTMLElement>('.e-widget-swiper[data-id="153f2e1"]') ??
    [...active.querySelectorAll<HTMLElement>(".e-widget-swiper")].find((node) =>
      node.querySelector(".elementor-carousel-image"),
    ) ??
    null;

  if (!carousel) return;

  const slides = [...carousel.querySelectorAll<HTMLElement>(".swiper-slide")].filter(
    (slide) => !slide.classList.contains("swiper-slide-duplicate"),
  );

  slides.forEach((slide, index) => {
    const image = slide.querySelector<HTMLElement>(".elementor-carousel-image");
    if (!image) return;

    const src = ABOUT_GALLERY_IMAGES[index % ABOUT_GALLERY_IMAGES.length];
    image.style.setProperty("background-image", `url("${src}")`, "important");
    image.style.setProperty("background-size", "cover", "important");
    image.style.setProperty("background-position", "center", "important");
    image.style.setProperty("background-repeat", "no-repeat", "important");
    image.style.setProperty("display", "block", "important");
    image.style.setProperty("width", "100%", "important");
    image.style.setProperty("height", "clamp(300px, 72vw, 520px)", "important");
    image.style.setProperty("min-height", "280px", "important");
    image.setAttribute("aria-label", `Інтер’єр RESET Clinic — фото ${index + 1}`);
  });

  const viewport = carousel.querySelector<HTMLElement>(".elementor-main-swiper, .swiper");
  const wrapper = carousel.querySelector<HTMLElement>(".swiper-wrapper");
  viewport?.style.setProperty("min-height", "280px", "important");
  wrapper?.style.setProperty("align-items", "stretch", "important");
}

function hideElementAndFollowingSiblings(element: HTMLElement) {
  element.style.setProperty("display", "none", "important");

  let sibling = element.nextElementSibling;
  while (sibling) {
    if (sibling instanceof HTMLElement) {
      sibling.style.setProperty("display", "none", "important");
    }
    sibling = sibling.nextElementSibling;
  }
}

function trimDoctorsPage(active: HTMLElement | null) {
  if (!active) return;

  active.style.setProperty("min-height", "0", "important");
  active.style.setProperty("height", "auto", "important");

  const certificateHeading = [...active.querySelectorAll<HTMLElement>("h1, h2, h3")].find((heading) =>
    (heading.textContent || "").replace(/\s+/g, " ").trim().toLowerCase().includes("сертифікати лікарів"),
  );

  const certificateContainer =
    active.querySelector<HTMLElement>('[data-id="4dbfdc6"]') ??
    certificateHeading?.closest<HTMLElement>("[data-element_type='container']") ??
    active.querySelector<HTMLElement>(".masonry-gallery")?.closest<HTMLElement>("[data-element_type='container']") ??
    null;

  if (certificateContainer) {
    const certificateSection = certificateContainer.closest<HTMLElement>(".scale-wrapper") ?? certificateContainer;
    hideElementAndFollowingSiblings(certificateSection);
  }

  active.querySelectorAll<HTMLElement>(".scale-wrapper").forEach((wrapper) => {
    const text = (wrapper.textContent || "").replace(/\s+/g, " ").toLowerCase();
    if (text.includes("сертифікати лікарів") || wrapper.querySelector(".masonry-gallery")) {
      wrapper.style.setProperty("display", "none", "important");
      wrapper.style.setProperty("height", "0", "important");
      wrapper.style.setProperty("min-height", "0", "important");
    }
  });
}

export default function LegacyRouteFixes({ route }: { route: string }) {
  useLayoutEffect(() => {
    const clean: Array<() => void> = [];
    const active = activeLegacyPage();

    if (route === "/about/") repairAboutMobileCarousel(active);
    if (route === "/doctors/") trimDoctorsPage(active);

    const pages = [...document.querySelectorAll<HTMLElement>(".legacy-page")];
    const reveal = () => {
      pages.forEach((page) => {
        page.classList.remove("legacy-styles-pending");
        page.style.removeProperty("visibility");
      });
    };

    const styleLinks = [
      ...document.querySelectorAll<HTMLLinkElement>('link[data-reset-legacy-stylesheet="true"]'),
    ];
    const pending = styleLinks.filter((link) => !link.sheet);

    if (pending.length === 0) {
      const frame = window.requestAnimationFrame(reveal);
      clean.push(() => window.cancelAnimationFrame(frame));
    } else {
      let remaining = pending.length;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) window.requestAnimationFrame(reveal);
      };

      pending.forEach((link) => {
        link.addEventListener("load", done, { once: true });
        link.addEventListener("error", done, { once: true });
        clean.push(() => link.removeEventListener("load", done));
        clean.push(() => link.removeEventListener("error", done));
      });

      const fallback = window.setTimeout(reveal, 4000);
      clean.push(() => window.clearTimeout(fallback));
    }

    return () => clean.forEach((fn) => fn());
  }, [route]);

  return null;
}

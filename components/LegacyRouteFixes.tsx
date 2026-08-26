"use client";

import { useLayoutEffect } from "react";

const ABOUT_GALLERY_IMAGES = [
  "/assets/desktop-47d0752051af2be99173977e7f35d39cab004f6b.jpg",
  "/assets/desktop-d37ca7b60b86de4310777a91975507cb15579fef.jpg",
  "/assets/desktop-99e75ae79a298de217fa5086c24f4bbe91e6341e.jpg",
  "/assets/desktop-3febdea9eeb32b25099c039d28f1c2a2fd197d0f.jpg",
  "/assets/desktop-c65be15cfb9648d4bc419e7965dec68355592ca6.jpg",
] as const;

const HOME_PHILOSOPHY_IMAGES = [
  "/assets/mobile-6dff7433211d4169812cea0cec5bf9be74ba951c.png",
  "/assets/mobile-6d26d14a32f0be45401e2fdef7c09430326c0db2.jpg",
  "/assets/mobile-abedf6979a778b5ef07f2d35ddb83ffffba432d4.jpg",
  "/assets/desktop-47d0752051af2be99173977e7f35d39cab004f6b.jpg",
  "/assets/desktop-d37ca7b60b86de4310777a91975507cb15579fef.jpg",
] as const;

const HOME_CATEGORY_TITLES = new Set([
  "ДЕРМАТОЛОГІЯ",
  "ДОГЛЯДОВА КОСМЕТОЛОГІЯ",
  "ІН’ЄКЦІЙНА КОСМЕТОЛОГІЯ",
  "ІН'ЄКЦІЙНА КОСМЕТОЛОГІЯ",
  "АПАРАТНА КОСМЕТОЛОГІЯ",
  "ТРИХОЛОГІЯ",
  "СІМЕЙНА МЕДИЦИНА ТА НУТРИЦІОЛОГІЯ",
]);

function activeLegacyPage() {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  return document.querySelector<HTMLElement>(isMobile ? ".legacy-mobile" : ".legacy-desktop");
}

function normalizedText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
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

function findHomepageCategoryCard(link: HTMLAnchorElement, active: HTMLElement) {
  const heading = link.closest<HTMLElement>("h1, h2, h3, h4, h5, h6");
  const headingText = normalizedText(heading?.textContent || link.textContent);
  let node = heading?.parentElement ?? link.parentElement;

  while (node && node !== active) {
    if (
      node.matches(
        ".e-con, [data-element_type='container'], .elementor-column, .elementor-widget-wrap",
      )
    ) {
      const text = normalizedText(node.textContent);
      const headingCount = node.querySelectorAll("h1, h2, h3, h4, h5, h6").length;
      if (text.length >= headingText.length + 20 && headingCount <= 2) return node;
    }
    node = node.parentElement;
  }

  return heading?.closest<HTMLElement>(".e-con, [data-element_type='container']") ?? null;
}

function setupHomepageCategoryCards(active: HTMLElement, clean: Array<() => void>) {
  const generatedLinks = [...active.querySelectorAll<HTMLAnchorElement>("a.reset-home-category-link[href]")];
  const links = generatedLinks.length
    ? generatedLinks
    : [...active.querySelectorAll<HTMLAnchorElement>("h1 a[href], h2 a[href], h3 a[href], h4 a[href]")].filter(
        (link) => HOME_CATEGORY_TITLES.has(normalizedText(link.textContent).toUpperCase()),
      );

  links.forEach((link) => {
    const card = findHomepageCategoryCard(link, active);
    const href = link.getAttribute("href");
    if (!card || !href || card.dataset.resetHomeCategoryCard === "1") return;

    card.dataset.resetHomeCategoryCard = "1";
    card.style.setProperty("cursor", "pointer", "important");
    if (!card.hasAttribute("role")) card.setAttribute("role", "link");
    if (!card.hasAttribute("tabindex")) card.tabIndex = 0;

    const navigate = () => {
      window.location.assign(href);
    };

    const click = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("a, button, input, textarea, select, label, [role='button']")
      ) {
        return;
      }
      navigate();
    };

    const keydown = (event: KeyboardEvent) => {
      if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      navigate();
    };

    card.addEventListener("click", click);
    card.addEventListener("keydown", keydown);
    clean.push(() => card.removeEventListener("click", click));
    clean.push(() => card.removeEventListener("keydown", keydown));
  });
}

function findHomepagePhilosophyCarousel(active: HTMLElement) {
  if (active.classList.contains("legacy-mobile")) {
    const exact = active.querySelector<HTMLElement>('.e-widget-swiper[data-id="153f2e1"]');
    if (exact) return exact;
  }

  const heading = [...active.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, .elementor-heading-title")].find(
    (element) => normalizedText(element.textContent).toUpperCase() === "НАША ФІЛОСОФІЯ",
  );

  let node = heading?.parentElement ?? null;
  while (node && node !== active) {
    const carousel = node.querySelector<HTMLElement>(".e-widget-swiper");
    if (
      carousel?.querySelector(".swiper-wrapper") &&
      carousel.querySelector(
        ".elementor-swiper-button-prev, .elementor-swiper-button-next, .swiper-button-prev, .swiper-button-next",
      )
    ) {
      return carousel;
    }
    node = node.parentElement;
  }

  return [...active.querySelectorAll<HTMLElement>(".e-widget-swiper")].find((candidate) => {
    const bullets = candidate.querySelectorAll(".swiper-pagination-bullet").length;
    return (
      bullets >= 3 &&
      !!candidate.querySelector(".swiper-wrapper") &&
      !!candidate.querySelector(
        ".elementor-swiper-button-prev, .elementor-swiper-button-next, .swiper-button-prev, .swiper-button-next",
      )
    );
  }) ?? null;
}

function setupHomepagePhilosophyCarousel(active: HTMLElement, clean: Array<() => void>) {
  if (!active.classList.contains("legacy-mobile")) return;

  const carousel = findHomepagePhilosophyCarousel(active);
  if (!carousel || carousel.dataset.resetHomepageCarousel === "1") return;
  carousel.dataset.resetHomepageCarousel = "1";

  const wrapper = carousel.querySelector<HTMLElement>(".swiper-wrapper");
  if (!wrapper) return;

  const viewport = wrapper.closest<HTMLElement>(".elementor-main-swiper, .swiper") ?? wrapper.parentElement;
  if (!viewport) return;

  const allSlides = [...wrapper.children].filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.classList.contains("swiper-slide"),
  );
  const slides = allSlides.filter((slide) => !slide.classList.contains("swiper-slide-duplicate"));
  if (slides.length < 2) return;

  allSlides
    .filter((slide) => slide.classList.contains("swiper-slide-duplicate"))
    .forEach((slide) => slide.style.setProperty("display", "none", "important"));

  viewport.style.setProperty("overflow", "hidden", "important");
  viewport.style.setProperty("touch-action", "pan-y", "important");
  wrapper.style.setProperty("display", "flex", "important");
  wrapper.style.setProperty("width", "100%", "important");
  wrapper.style.setProperty("transition", "transform 500ms ease", "important");
  wrapper.style.setProperty("will-change", "transform", "important");

  slides.forEach((slide, slideIndex) => {
    slide.style.setProperty("flex", "0 0 100%", "important");
    slide.style.setProperty("width", "100%", "important");
    slide.style.setProperty("margin-right", "0", "important");

    const image = slide.querySelector<HTMLElement>(".elementor-carousel-image");
    const src = HOME_PHILOSOPHY_IMAGES[slideIndex % HOME_PHILOSOPHY_IMAGES.length];
    if (image && src) {
      image.style.setProperty("background-image", `url("${src}")`, "important");
      image.style.setProperty("background-size", "cover", "important");
      image.style.setProperty("background-position", "center", "important");
      image.style.setProperty("background-repeat", "no-repeat", "important");
      image.setAttribute("aria-label", `RESET Clinic — фото ${slideIndex + 1}`);
    }
  });

  const previous = carousel.querySelector<HTMLElement>(
    ".elementor-swiper-button-prev, .swiper-button-prev",
  );
  const next = carousel.querySelector<HTMLElement>(
    ".elementor-swiper-button-next, .swiper-button-next",
  );
  const bullets = [...carousel.querySelectorAll<HTMLElement>(".swiper-pagination-bullet")].slice(
    0,
    slides.length,
  );

  [previous, next].forEach((control) => {
    control?.style.setProperty("pointer-events", "auto", "important");
    control?.style.setProperty("cursor", "pointer", "important");
    control?.style.setProperty("z-index", "50", "important");
    control?.removeAttribute("aria-disabled");
  });
  bullets.forEach((bullet) => {
    bullet.style.setProperty("pointer-events", "auto", "important");
    bullet.style.setProperty("cursor", "pointer", "important");
  });

  let index = Math.max(
    0,
    slides.findIndex((slide) => slide.classList.contains("swiper-slide-active")),
  );
  let lastPointerAction = 0;

  const render = () => {
    wrapper.style.setProperty("transform", `translate3d(-${index * 100}%, 0, 0)`, "important");
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("swiper-slide-active", slideIndex === index);
      slide.classList.toggle(
        "swiper-slide-prev",
        slideIndex === (index - 1 + slides.length) % slides.length,
      );
      slide.classList.toggle("swiper-slide-next", slideIndex === (index + 1) % slides.length);
      slide.setAttribute("aria-label", `${slideIndex + 1} / ${slides.length}`);
    });
    bullets.forEach((bullet, bulletIndex) => {
      const activeBullet = bulletIndex === index;
      bullet.classList.toggle("swiper-pagination-bullet-active", activeBullet);
      bullet.setAttribute("aria-current", activeBullet ? "true" : "false");
    });
  };

  const syncIndex = () => {
    const current = slides.findIndex((slide) => slide.classList.contains("swiper-slide-active"));
    if (current >= 0) index = current;
  };

  const go = (delta: number) => {
    syncIndex();
    index = (index + delta + slides.length) % slides.length;
    render();
  };

  const bindControl = (control: HTMLElement | null, delta: number) => {
    if (!control) return;

    const activate = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();

      const now = Date.now();
      if (event.type === "click" && now - lastPointerAction < 500) return;
      if (event.type === "pointerup") lastPointerAction = now;
      go(delta);
    };

    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      activate(event);
    };

    control.addEventListener("pointerup", activate, true);
    control.addEventListener("click", activate, true);
    control.addEventListener("keydown", keydown, true);
    clean.push(() => control.removeEventListener("pointerup", activate, true));
    clean.push(() => control.removeEventListener("click", activate, true));
    clean.push(() => control.removeEventListener("keydown", keydown, true));
  };

  bindControl(previous, -1);
  bindControl(next, 1);

  bullets.forEach((bullet, bulletIndex) => {
    const click = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
      index = bulletIndex;
      render();
    };
    bullet.addEventListener("click", click, true);
    clean.push(() => bullet.removeEventListener("click", click, true));
  });

  let pointerStart: number | null = null;
  const pointerDown = (event: PointerEvent) => {
    pointerStart = event.clientX;
  };
  const pointerUp = (event: PointerEvent) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 45) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    go(distance < 0 ? 1 : -1);
  };
  const pointerCancel = () => {
    pointerStart = null;
  };

  viewport.addEventListener("pointerdown", pointerDown, true);
  viewport.addEventListener("pointerup", pointerUp, true);
  viewport.addEventListener("pointercancel", pointerCancel, true);
  clean.push(() => viewport.removeEventListener("pointerdown", pointerDown, true));
  clean.push(() => viewport.removeEventListener("pointerup", pointerUp, true));
  clean.push(() => viewport.removeEventListener("pointercancel", pointerCancel, true));

  render();
}

function setupHomepageInteractions(active: HTMLElement | null, clean: Array<() => void>) {
  if (!active) return;
  setupHomepageCategoryCards(active, clean);
  setupHomepagePhilosophyCarousel(active, clean);
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
    if (route === "/") {
      const frame = window.requestAnimationFrame(() => setupHomepageInteractions(active, clean));
      clean.push(() => window.cancelAnimationFrame(frame));
    }

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

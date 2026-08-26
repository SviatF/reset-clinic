"use client";

import { useLayoutEffect } from "react";

const MOBILE_HOME_IMAGES = [
  "/assets/desktop-8ea811cc94cda769fbabb0e70b3baefda2d847ff.png",
  "/assets/desktop-47d0752051af2be99173977e7f35d39cab004f6b.jpg",
  "/assets/desktop-d37ca7b60b86de4310777a91975507cb15579fef.jpg",
  "/assets/desktop-99e75ae79a298de217fa5086c24f4bbe91e6341e.jpg",
  "/assets/desktop-3febdea9eeb32b25099c039d28f1c2a2fd197d0f.jpg",
] as const;

export default function HomepageMobileCarouselAutoplay({ route }: { route: string }) {
  useLayoutEffect(() => {
    if (route !== "/" || !window.matchMedia("(max-width: 767px)").matches) return;

    const carousel = document.querySelector<HTMLElement>(
      '.legacy-mobile .e-widget-swiper[data-id="153f2e1"]',
    );
    if (!carousel) return;

    const wrapper = carousel.querySelector<HTMLElement>(".swiper-wrapper");
    if (!wrapper) return;

    const allSlides = [...wrapper.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.classList.contains("swiper-slide"),
    );
    const slides = allSlides.filter((slide) => !slide.classList.contains("swiper-slide-duplicate"));
    if (slides.length < 2) return;

    allSlides
      .filter((slide) => slide.classList.contains("swiper-slide-duplicate"))
      .forEach((slide) => slide.style.setProperty("display", "none", "important"));

    carousel
      .querySelectorAll<HTMLElement>(
        ".elementor-swiper-button-prev, .elementor-swiper-button-next, .swiper-button-prev, .swiper-button-next",
      )
      .forEach((button) => button.style.setProperty("display", "none", "important"));

    const bullets = [...carousel.querySelectorAll<HTMLElement>(".swiper-pagination-bullet")].slice(
      0,
      slides.length,
    );
    bullets.forEach((bullet) => {
      bullet.style.setProperty("pointer-events", "none", "important");
      bullet.style.setProperty("cursor", "default", "important");
    });

    const viewport = wrapper.closest<HTMLElement>(".elementor-main-swiper, .swiper");
    viewport?.style.setProperty("overflow", "hidden", "important");
    wrapper.style.setProperty("display", "flex", "important");
    wrapper.style.setProperty("width", "100%", "important");
    wrapper.style.setProperty("transition", "transform 600ms ease", "important");
    wrapper.style.setProperty("align-items", "stretch", "important");

    slides.forEach((slide, slideIndex) => {
      slide.style.setProperty("flex", "0 0 100%", "important");
      slide.style.setProperty("width", "100%", "important");
      slide.style.setProperty("margin-right", "0", "important");
      slide.style.setProperty("display", "block", "important");

      const image = slide.querySelector<HTMLElement>(".elementor-carousel-image");
      const src = MOBILE_HOME_IMAGES[slideIndex % MOBILE_HOME_IMAGES.length];
      if (!image || !src) return;

      image.style.setProperty("background-image", `url("${src}")`, "important");
      image.style.setProperty("background-size", "cover", "important");
      image.style.setProperty("background-position", "center", "important");
      image.style.setProperty("background-repeat", "no-repeat", "important");
      image.style.setProperty("display", "block", "important");
      image.style.setProperty("width", "100%", "important");
      image.style.setProperty("aspect-ratio", "1.6 / 1", "important");
      image.style.setProperty("min-height", "280px", "important");
      image.style.setProperty("opacity", "1", "important");
      image.style.setProperty("visibility", "visible", "important");
      image.setAttribute("aria-label", `RESET Clinic — інтер’єр ${slideIndex + 1}`);
    });

    let index = 0;

    const render = () => {
      wrapper.style.setProperty("transform", `translate3d(-${index * 100}%, 0, 0)`, "important");
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("swiper-slide-active", slideIndex === index);
        slide.classList.toggle(
          "swiper-slide-prev",
          slideIndex === (index - 1 + slides.length) % slides.length,
        );
        slide.classList.toggle("swiper-slide-next", slideIndex === (index + 1) % slides.length);
      });
      bullets.forEach((bullet, bulletIndex) => {
        const isActive = bulletIndex === index;
        bullet.classList.toggle("swiper-pagination-bullet-active", isActive);
        if (isActive) bullet.setAttribute("aria-current", "true");
        else bullet.removeAttribute("aria-current");
      });
    };

    render();

    const timer = window.setInterval(() => {
      index = (index + 1) % slides.length;
      render();
    }, 4500);

    return () => window.clearInterval(timer);
  }, [route]);

  return null;
}

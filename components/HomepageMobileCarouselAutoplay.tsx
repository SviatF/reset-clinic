"use client";

import { useLayoutEffect } from "react";

export default function HomepageMobileCarouselAutoplay({ route }: { route: string }) {
  useLayoutEffect(() => {
    if (route !== "/" || !window.matchMedia("(max-width: 767px)").matches) return;

    const carousel = document.querySelector<HTMLElement>(
      '.legacy-mobile .e-widget-swiper[data-id="153f2e1"]',
    );
    if (!carousel) return;

    const wrapper = carousel.querySelector<HTMLElement>(".swiper-wrapper");
    if (!wrapper) return;

    const slides = [...wrapper.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        node.classList.contains("swiper-slide") &&
        !node.classList.contains("swiper-slide-duplicate"),
    );
    if (slides.length < 2) return;

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

    slides.forEach((slide) => {
      slide.style.setProperty("flex", "0 0 100%", "important");
      slide.style.setProperty("width", "100%", "important");
      slide.style.setProperty("margin-right", "0", "important");
    });

    let index = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains("swiper-slide-active")),
    );

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

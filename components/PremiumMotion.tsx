"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SECTION_SELECTOR = [
  ".seo-site main > section",
  ".reset-blog main > section",
  ".legacy-page .elementor-element.e-con.e-parent",
].join(",");

const CARD_SELECTOR = [
  ".seo-process-grid > div",
  ".seo-directory-link",
  ".seo-related-card",
  ".seo-doctor-card",
  ".seo-faq details",
  ".reset-blog-category-card",
  ".reset-blog-empty-state",
  ".reset-blog-section-heading",
  ".reset-blog-article-card",
].join(",");

const HERO_COPY_SELECTOR = [
  ".seo-hero-copy > *",
  ".reset-blog-hero-copy > *",
  ".reset-blog-article-hero-copy > *",
].join(",");

const MEDIA_SELECTOR = [
  ".seo-hero-visual > img",
  ".reset-blog-hero-visual > img",
  ".reset-blog-article-cover img",
].join(",");

const SPOTLIGHT_SELECTOR = ".seo-hero-visual,.reset-blog-hero-visual,.reset-blog-article-cover";

function isLegacyChrome(node: HTMLElement) {
  return Boolean(
    node.closest("header,footer,.elementor-location-header,.elementor-location-footer") ||
      node.querySelector("header,footer,.elementor-location-header,.elementor-location-footer"),
  );
}

function setMotion(
  node: HTMLElement,
  variant: "section" | "card" | "hero",
  delay = 0,
) {
  if (node.dataset.resetMotion) return;
  node.dataset.resetMotion = variant;
  node.style.setProperty("--reset-motion-delay", `${delay}ms`);
}

export default function PremiumMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touched = new Set<HTMLElement>();
    const cleanups: Array<() => void> = [];

    const sections = [...document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)].filter(
      (node) => !node.matches(".legacy-page .elementor-element.e-con.e-parent") || !isLegacyChrome(node),
    );
    sections.forEach((node) => {
      setMotion(node, "section");
      touched.add(node);
    });

    [...document.querySelectorAll<HTMLElement>(CARD_SELECTOR)].forEach((node, index) => {
      setMotion(node, "card", (index % 4) * 55);
      touched.add(node);
    });

    [...document.querySelectorAll<HTMLElement>(HERO_COPY_SELECTOR)].forEach((node, index) => {
      setMotion(node, "hero", index * 85);
      touched.add(node);
    });

    const media = [...document.querySelectorAll<HTMLElement>(MEDIA_SELECTOR)];
    media.forEach((node) => {
      node.dataset.resetMedia = "true";
      node.dataset.resetParallax = "true";
      touched.add(node);
    });

    const revealTargets = [...touched];
    document.documentElement.classList.add("reset-motion-ready");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((node) => node.classList.add("reset-motion-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (entry.target as HTMLElement).classList.add("reset-motion-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -7% 0px",
        },
      );

      revealTargets.forEach((node) => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    }

    if (!reducedMotion) {
      let frame = 0;
      const updateParallax = () => {
        frame = 0;
        const viewport = window.innerHeight;
        media.forEach((node) => {
          const rect = node.parentElement?.getBoundingClientRect() ?? node.getBoundingClientRect();
          if (rect.bottom < -100 || rect.top > viewport + 100) return;
          const center = rect.top + rect.height / 2;
          const distance = viewport / 2 - center;
          const offset = Math.max(-14, Math.min(14, distance * 0.018));
          node.style.setProperty("--reset-parallax-y", `${offset.toFixed(2)}px`);
        });
      };
      const onScroll = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(updateParallax);
      };

      updateParallax();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (frame) window.cancelAnimationFrame(frame);
      });

      document.querySelectorAll<HTMLElement>(SPOTLIGHT_SELECTOR).forEach((node) => {
        node.dataset.resetSpotlight = "true";
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          const rect = node.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          node.style.setProperty("--reset-pointer-x", `${x.toFixed(1)}%`);
          node.style.setProperty("--reset-pointer-y", `${y.toFixed(1)}%`);
        };
        node.addEventListener("pointermove", move);
        cleanups.push(() => node.removeEventListener("pointermove", move));
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      touched.forEach((node) => {
        node.classList.remove("reset-motion-visible");
        delete node.dataset.resetMotion;
        delete node.dataset.resetMedia;
        delete node.dataset.resetParallax;
        node.style.removeProperty("--reset-motion-delay");
        node.style.removeProperty("--reset-parallax-y");
      });
      document.querySelectorAll<HTMLElement>("[data-reset-spotlight]").forEach((node) => {
        delete node.dataset.resetSpotlight;
        node.style.removeProperty("--reset-pointer-x");
        node.style.removeProperty("--reset-pointer-y");
      });
    };
  }, [pathname]);

  return null;
}

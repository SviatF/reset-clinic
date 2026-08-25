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

const HERO_HEADING_SELECTOR = [
  ".seo-hero-copy h1",
  ".seo-hero-copy h2",
  ".reset-blog-hero-copy h1",
  ".reset-blog-article-hero-copy h1",
  ".legacy-page h1",
].join(",");

const HEADING_SELECTOR = [
  ".seo-site main h1",
  ".seo-site main h2",
  ".seo-site main h3",
  ".reset-blog main h1",
  ".reset-blog main h2",
  ".reset-blog main h3",
  ".legacy-page h1",
  ".legacy-page h2",
].join(",");

const MEDIA_SELECTOR = [
  ".seo-site main img:not(.seo-brand-logo)",
  ".reset-blog main img:not(.seo-brand-logo)",
  ".legacy-page img",
].join(",");

const HERO_MEDIA_SELECTOR = [
  ".seo-hero-visual > img",
  ".reset-blog-hero-visual > img",
  ".reset-blog-article-cover img",
].join(",");

const SPOTLIGHT_SELECTOR = ".seo-hero-visual,.reset-blog-hero-visual,.reset-blog-article-cover";

const CHROME_SELECTOR = [
  ".seo-header .seo-brand",
  ".seo-header .seo-nav > a",
  ".seo-header .seo-header-cta",
  ".reset-blog header a",
  ".reset-blog header button",
].join(",");

const BUTTON_SELECTOR = [
  ".seo-button",
  ".seo-header-cta",
  ".reset-blog-empty-actions a",
  ".reset-blog a[class*='cta']",
  ".reset-blog a[class*='action']",
].join(",");

type MotionVariant =
  | "section"
  | "card"
  | "hero"
  | "heading"
  | "heading-hero"
  | "chrome";

function isLegacyChrome(node: HTMLElement) {
  return Boolean(
    node.closest("header,footer,.elementor-location-header,.elementor-location-footer") ||
      node.querySelector("header,footer,.elementor-location-header,.elementor-location-footer"),
  );
}

function setMotion(node: HTMLElement, variant: MotionVariant, delay = 0) {
  if (node.dataset.resetMotion) return;
  node.dataset.resetMotion = variant;
  node.style.setProperty("--reset-motion-delay", `${delay}ms`);
}

function isUsableMedia(node: HTMLElement) {
  if (node.closest("header,footer,.elementor-location-header,.elementor-location-footer")) return false;
  const rect = node.getBoundingClientRect();
  return rect.width >= 150 && rect.height >= 100;
}

export default function PremiumMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touched = new Set<HTMLElement>();
    const mediaTouched = new Set<HTMLElement>();
    const cleanups: Array<() => void> = [];

    const sections = [...document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)].filter(
      (node) => !node.matches(".legacy-page .elementor-element.e-con.e-parent") || !isLegacyChrome(node),
    );
    sections.forEach((node) => {
      setMotion(node, "section");
      touched.add(node);
    });

    [...document.querySelectorAll<HTMLElement>(HERO_HEADING_SELECTOR)]
      .filter((node) => !node.closest(".legacy-page") || !isLegacyChrome(node))
      .forEach((node, index) => {
        setMotion(node, "heading-hero", 65 + index * 70);
        touched.add(node);
      });

    [...document.querySelectorAll<HTMLElement>(HEADING_SELECTOR)]
      .filter((node) => !node.closest(".legacy-page") || !isLegacyChrome(node))
      .forEach((node, index) => {
        setMotion(node, "heading", (index % 3) * 45);
        touched.add(node);
      });

    [...document.querySelectorAll<HTMLElement>(HERO_COPY_SELECTOR)].forEach((node, index) => {
      setMotion(node, "hero", 120 + index * 90);
      touched.add(node);
    });

    [...document.querySelectorAll<HTMLElement>(CARD_SELECTOR)].forEach((node, index) => {
      setMotion(node, "card", (index % 4) * 70);
      touched.add(node);
    });

    [...document.querySelectorAll<HTMLElement>(CHROME_SELECTOR)].forEach((node, index) => {
      setMotion(node, "chrome", 35 + index * 45);
      touched.add(node);
    });

    const media = [...document.querySelectorAll<HTMLElement>(MEDIA_SELECTOR)].filter(isUsableMedia);
    media.forEach((node) => {
      const isHero = node.matches(HERO_MEDIA_SELECTOR) || Boolean(node.closest(".seo-hero-visual,.reset-blog-hero-visual,.reset-blog-article-cover"));
      node.dataset.resetMedia = isHero ? "hero" : "content";
      if (isHero) node.dataset.resetParallax = "true";
      mediaTouched.add(node);
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
          threshold: 0.07,
          rootMargin: "0px 0px -5% 0px",
        },
      );

      revealTargets.forEach((node) => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    }

    if (!reducedMotion) {
      let frame = 0;
      const heroMedia = media.filter((node) => node.dataset.resetParallax === "true");
      const updateParallax = () => {
        frame = 0;
        const viewport = window.innerHeight;
        heroMedia.forEach((node) => {
          const rect = node.parentElement?.getBoundingClientRect() ?? node.getBoundingClientRect();
          if (rect.bottom < -120 || rect.top > viewport + 120) return;
          const center = rect.top + rect.height / 2;
          const distance = viewport / 2 - center;
          const offset = Math.max(-18, Math.min(18, distance * 0.022));
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

      document.querySelectorAll<HTMLElement>(BUTTON_SELECTOR).forEach((node) => {
        node.dataset.resetMagnetic = "true";
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          const rect = node.getBoundingClientRect();
          const dx = (event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, 1);
          const dy = (event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height, 1);
          node.style.setProperty("--reset-magnetic-x", `${(dx * 5).toFixed(2)}px`);
          node.style.setProperty("--reset-magnetic-y", `${(dy * 3).toFixed(2)}px`);
        };
        const leave = () => {
          node.style.setProperty("--reset-magnetic-x", "0px");
          node.style.setProperty("--reset-magnetic-y", "0px");
        };
        node.addEventListener("pointermove", move);
        node.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          node.removeEventListener("pointermove", move);
          node.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      touched.forEach((node) => {
        node.classList.remove("reset-motion-visible");
        delete node.dataset.resetMotion;
        node.style.removeProperty("--reset-motion-delay");
      });
      mediaTouched.forEach((node) => {
        delete node.dataset.resetMedia;
        delete node.dataset.resetParallax;
        node.style.removeProperty("--reset-parallax-y");
      });
      document.querySelectorAll<HTMLElement>("[data-reset-spotlight]").forEach((node) => {
        delete node.dataset.resetSpotlight;
        node.style.removeProperty("--reset-pointer-x");
        node.style.removeProperty("--reset-pointer-y");
      });
      document.querySelectorAll<HTMLElement>("[data-reset-magnetic]").forEach((node) => {
        delete node.dataset.resetMagnetic;
        node.style.removeProperty("--reset-magnetic-x");
        node.style.removeProperty("--reset-magnetic-y");
      });
    };
  }, [pathname]);

  return null;
}

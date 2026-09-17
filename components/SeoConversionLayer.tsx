"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { trackContactConversion, trackPromoCustomEvent } from "../lib/marketing-pixels";

type ConversionState = {
  active: boolean;
  bookingHref: string;
  doctorName?: string;
  doctorImage?: string;
  topic?: string;
  midMount?: HTMLElement;
};

const INITIAL_STATE: ConversionState = {
  active: false,
  bookingHref: "/booking/",
};

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function ctaSurface(anchor: HTMLAnchorElement) {
  if (anchor.dataset.seoCro) return anchor.dataset.seoCro;
  if (anchor.closest(".seo-hero-actions")) return "hero";
  if (anchor.classList.contains("seo-header-cta")) return "header";
  if (anchor.closest(".seo-final-cta")) return "final";
  if (anchor.closest(".seo-doctor-card")) return "doctor_card";
  if (anchor.closest(".seo-footer")) return "footer";
  if (anchor.closest(".seo-side")) return "sidebar";
  return "seo_page";
}

function doctorFromBookingHref(href: string) {
  try {
    return cleanText(new URL(href, window.location.origin).searchParams.get("doctor"));
  } catch {
    return undefined;
  }
}

export default function SeoConversionLayer() {
  const pathname = usePathname();
  const [state, setState] = useState<ConversionState>(INITIAL_STATE);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".seo-site");
    if (!root) {
      document.body.classList.remove("seo-cro-active");
      setState(INITIAL_STATE);
      return;
    }

    const seoRoot = root;
    document.body.classList.add("seo-cro-active");

    const heroBooking = seoRoot.querySelector<HTMLAnchorElement>(".seo-hero-actions a[href*='/booking/']");
    const doctorCard = seoRoot.querySelector<HTMLAnchorElement>(".seo-doctor-card");
    const doctorNameFromCard = cleanText(doctorCard?.querySelector("strong")?.textContent);
    const doctorName = doctorFromBookingHref(heroBooking?.getAttribute("href") || "") || doctorNameFromCard;
    const doctorImage = doctorCard?.querySelector<HTMLImageElement>("img")?.currentSrc || doctorCard?.querySelector<HTMLImageElement>("img")?.src;
    const topic = cleanText(seoRoot.querySelector("h1")?.textContent);
    const bookingHref = heroBooking?.getAttribute("href") || "/booking/";

    const sections = seoRoot.querySelectorAll<HTMLElement>(".seo-article .seo-section");
    const anchorSection = sections[Math.min(2, Math.max(0, sections.length - 1))];
    let midMount: HTMLDivElement | undefined;

    if (anchorSection) {
      midMount = document.createElement("div");
      midMount.className = "seo-cro-mid-mount";
      anchorSection.insertAdjacentElement("afterend", midMount);
    }

    setState({
      active: true,
      bookingHref,
      doctorName,
      doctorImage,
      topic,
      midMount,
    });

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a");
      if (!anchor) return;

      const isSeoAnchor = seoRoot.contains(anchor) || Boolean(anchor.dataset.seoCro);
      if (!isSeoAnchor) return;

      const href = anchor.getAttribute("href") || "";
      const surface = ctaSurface(anchor);
      const bookingDoctor = doctorFromBookingHref(href) || doctorName;

      if (href.startsWith("tel:")) {
        trackContactConversion({
          source_surface: surface,
          seo_landing: pathname,
          seo_topic: topic,
          doctor_name: bookingDoctor,
        });
        return;
      }

      if (href.includes("/booking/")) {
        trackPromoCustomEvent("seo_cta_click", {
          source_surface: surface,
          seo_landing: pathname,
          seo_topic: topic,
          target_href: href,
          doctor_name: bookingDoctor,
        });
        trackPromoCustomEvent("seo_booking_started", {
          source_surface: surface,
          seo_landing: pathname,
          doctor_name: bookingDoctor,
        });
        return;
      }

      if (anchor.closest(".seo-doctor-card") || href.startsWith("/doctors/")) {
        trackPromoCustomEvent("seo_doctor_profile_click", {
          source_surface: surface,
          seo_landing: pathname,
          doctor_name: cleanText(anchor.querySelector("strong")?.textContent) || bookingDoctor,
          target_href: href,
        });
      }
    }

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      midMount?.remove();
      document.body.classList.remove("seo-cro-active");
    };
  }, [pathname]);

  if (!state.active) return null;

  const doctorLabel = state.doctorName ? `до ${state.doctorName}` : "на консультацію";

  const midContent = state.midMount ? createPortal(
    <aside className="seo-cro-mid" aria-label="Запис на консультацію">
      {state.doctorImage ? (
        <div className="seo-cro-mid-photo" aria-hidden="true">
          <img src={state.doctorImage} alt="" />
        </div>
      ) : null}
      <div className="seo-cro-mid-copy">
        <span>Наступний крок · RESET Clinic</span>
        <h3>Не підбирайте рішення навмання — запишіться {doctorLabel}</h3>
        <p>
          {state.topic
            ? `На консультації розберемо ваш запит «${state.topic}», визначимо доцільний маршрут і пояснимо, з чого варто почати саме у вашій ситуації.`
            : "На консультації лікар оцінить ваш запит, визначить доцільний маршрут і пояснить наступні кроки."}
        </p>
      </div>
      <div className="seo-cro-mid-actions">
        <a className="seo-cro-primary" data-seo-cro="mid_content" href={state.bookingHref}>
          {state.doctorName ? "Обрати час до лікаря" : "Обрати час"}
        </a>
        <a className="seo-cro-secondary" data-seo-cro="mid_phone" href="tel:+380932828888">Подзвонити</a>
      </div>
    </aside>,
    state.midMount,
  ) : null;

  const sticky = createPortal(
    <div className="seo-cro-sticky" role="region" aria-label="Швидкий запис">
      <a className="seo-cro-sticky-phone" data-seo-cro="sticky_phone" href="tel:+380932828888" aria-label="Зателефонувати в RESET Clinic">☎</a>
      <a className="seo-cro-sticky-book" data-seo-cro="sticky_mobile" href={state.bookingHref}>
        <span>{state.doctorName ? "Запис до лікаря" : "Онлайн-запис"}</span>
        <strong>Обрати час →</strong>
      </a>
    </div>,
    document.body,
  );

  return <>{midContent}{sticky}</>;
}

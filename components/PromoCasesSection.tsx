"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PromoServiceConfig } from "../lib/promo-data";

type CaseImage = {
  type: "image";
  src: string;
  alt: string;
  label: string;
};

type CaseVideo = {
  type: "video";
  src: string;
  poster: string;
  alt: string;
  label: string;
};

type CaseItem = CaseImage | CaseVideo;

type CaseSet = {
  kicker: string;
  title: string;
  lead: string;
  items: CaseItem[];
};

const CASE_SETS: Partial<Record<PromoServiceConfig["slug"], CaseSet>> = {
  botulinotherapy: {
    kicker: "REAL CASES · BOTULINOTHERAPY",
    title: "Природний результат видно краще, ніж його можна описати.",
    lead: "Реальні кейси RESÉT clinic: робота з мімікою без шаблонного ефекту маски. Результат індивідуальний і залежить від анатомії, зон та дозування.",
    items: [
      { type: "image", src: "/assets/img-landings/botox-case1.webp", alt: "Реальний кейс ботулінотерапії RESÉT clinic", label: "CASE 01" },
      { type: "video", src: "/assets/img-landings/botox-videocase3.webm", poster: "/assets/img-landings/botox.webp", alt: "Відеокейс ботулінотерапії RESÉT clinic", label: "VIDEO CASE" },
      { type: "image", src: "/assets/img-landings/botox-case2.webp", alt: "Реальний кейс ботулінотерапії RESÉT clinic", label: "CASE 02" },
    ],
  },
  lips: {
    kicker: "REAL CASES · LIPS",
    title: "Губи, які залишаються вашими.",
    lead: "Реальні результати корекції форми, пропорцій та об’єму у RESÉT clinic. Завдання — гармонізувати риси, а не зробити однаковий результат для всіх.",
    items: [
      { type: "image", src: "/assets/img-landings/lips-case1.webp", alt: "Реальний кейс корекції губ RESÉT clinic", label: "CASE 01" },
      { type: "image", src: "/assets/img-landings/lips-case2.webp", alt: "Реальний кейс корекції губ RESÉT clinic", label: "CASE 02" },
      { type: "image", src: "/assets/img-landings/lips-case3.webp", alt: "Реальний кейс корекції губ RESÉT clinic", label: "CASE 03" },
    ],
  },
  "ipl-face": {
    kicker: "REAL CASES · IPL",
    title: "Реальні зміни шкіри — без фільтрів у презентації.",
    lead: "Кейси пацієнтів RESÉT clinic після індивідуально підібраної роботи зі шкірою. Ефект і кількість процедур залежать від вихідного стану та показань.",
    items: [
      { type: "image", src: "/assets/img-landings/face-case1.webp", alt: "Реальний кейс IPL-терапії RESÉT clinic", label: "CASE 01" },
      { type: "image", src: "/assets/img-landings/face-case2.webp", alt: "Реальний кейс IPL-терапії RESÉT clinic", label: "CASE 02" },
      { type: "image", src: "/assets/img-landings/face-case3.webp", alt: "Реальний кейс IPL-терапії RESÉT clinic", label: "CASE 03" },
    ],
  },
};

function track(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const target = window as typeof window & {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, ...payload });
  if (typeof target.fbq === "function") target.fbq("trackCustom", event, payload);
}

export default function PromoCasesSection({ config }: { config: PromoServiceConfig }) {
  const caseSet = CASE_SETS[config.slug];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = useMemo(() => activeIndex === null || !caseSet ? null : caseSet.items[activeIndex], [activeIndex, caseSet]);

  const close = useCallback(() => setActiveIndex(null), []);
  const move = useCallback((direction: -1 | 1) => {
    if (!caseSet || activeIndex === null) return;
    setActiveIndex((activeIndex + direction + caseSet.items.length) % caseSet.items.length);
  }, [activeIndex, caseSet]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, move]);

  if (!caseSet) return null;

  function openCase(index: number) {
    setActiveIndex(index);
    const item = caseSet!.items[index];
    track("promo_case_open", {
      promo_service: config.slug,
      case_number: index + 1,
      case_type: item.type,
    });
  }

  return (
    <section className={`promo-cases-section promo-cases-${config.slug}`} aria-labelledby={`promo-cases-title-${config.slug}`}>
      <div className="promo-cases-ghost" aria-hidden="true">REAL RESULTS</div>
      <div className="promo-shell promo-cases-shell">
        <header className="promo-cases-heading">
          <div>
            <p className="promo-kicker">{caseSet.kicker}</p>
            <h2 id={`promo-cases-title-${config.slug}`}>{caseSet.title}</h2>
          </div>
          <div className="promo-cases-heading-side">
            <p>{caseSet.lead}</p>
            <span>Натисніть на кейс, щоб відкрити повністю</span>
          </div>
        </header>

        <div className="promo-cases-gallery" role="list" aria-label="Реальні кейси RESÉT clinic">
          {caseSet.items.map((item, index) => (
            <button
              type="button"
              role="listitem"
              key={`${item.type}-${item.src}`}
              className={`promo-case-card promo-case-card-${index + 1} ${item.type === "video" ? "is-video" : ""}`}
              onClick={() => openCase(index)}
              aria-label={`${item.label}: відкрити кейс`}
            >
              <span className="promo-case-media">
                <Image
                  src={item.type === "video" ? item.poster : item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 760px) 84vw, 30vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="promo-case-shade" />
                {item.type === "video" ? <span className="promo-case-play" aria-hidden="true"><b>▶</b><small>WATCH CASE</small></span> : null}
              </span>
              <span className="promo-case-meta"><small>{item.label}</small><strong>{config.serviceName}</strong><b>VIEW CASE ↗</b></span>
              <span className="promo-case-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <div className="promo-cases-footer">
          <div><small>REAL PEOPLE · REAL REQUESTS</small><strong>Подобається такий підхід до результату?</strong></div>
          <Link
            className="promo-cases-cta"
            href={`/promo/${config.slug}/quiz/`}
            onClick={() => track("promo_cases_quiz_click", { promo_service: config.slug })}
          >
            Підібрати рішення для мене <span>→</span>
          </Link>
          <p>Фото та відео демонструють окремі клінічні кейси. Індивідуальний результат може відрізнятися.</p>
        </div>
      </div>

      {activeItem && activeIndex !== null ? (
        <div className="promo-case-lightbox" role="dialog" aria-modal="true" aria-label={`Кейс ${activeIndex + 1}`} onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <button type="button" className="promo-case-lightbox-close" onClick={close} aria-label="Закрити кейс">×</button>
          <button type="button" className="promo-case-lightbox-nav promo-case-lightbox-prev" onClick={() => move(-1)} aria-label="Попередній кейс">←</button>
          <div className="promo-case-lightbox-stage">
            <div className="promo-case-lightbox-top"><span>{caseSet.kicker}</span><strong>{String(activeIndex + 1).padStart(2, "0")} / {String(caseSet.items.length).padStart(2, "0")}</strong></div>
            <div className={`promo-case-lightbox-media ${activeItem.type === "video" ? "is-video" : ""}`}>
              {activeItem.type === "video" ? (
                <video key={activeItem.src} controls autoPlay playsInline preload="metadata" poster={activeItem.poster}>
                  <source src={activeItem.src} type="video/webm" />
                </video>
              ) : (
                <Image src={activeItem.src} alt={activeItem.alt} fill sizes="90vw" style={{ objectFit: "contain" }} priority />
              )}
            </div>
            <div className="promo-case-lightbox-bottom"><strong>{activeItem.label}</strong><span>{config.serviceName} · RESÉT clinic</span></div>
          </div>
          <button type="button" className="promo-case-lightbox-nav promo-case-lightbox-next" onClick={() => move(1)} aria-label="Наступний кейс">→</button>
        </div>
      ) : null}
    </section>
  );
}

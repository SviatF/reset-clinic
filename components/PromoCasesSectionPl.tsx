"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PromoServiceConfig } from "../lib/promo-data";
import "./PromoCasesSection.css";

type CaseItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  label: string;
};

const CASES: Partial<Record<PromoServiceConfig["slug"], {
  kicker: string;
  title: string;
  lead: string;
  items: CaseItem[];
}>> = {
  botulinotherapy: {
    kicker: "PRAWDZIWE EFEKTY · TOKSYNA BOTULINOWA",
    title: "Naturalny rezultat lepiej zobaczyć niż opisywać.",
    lead: "Wybrane przypadki RESÉT clinic pokazują pracę z mimiką bez schematycznego efektu maski. Rezultat jest indywidualny i zależy od anatomii, obszarów i dawkowania.",
    items: [
      { type: "image", src: "/assets/img-landings/botox-case1.webp", alt: "Przypadek terapii toksyną botulinową w RESÉT clinic", label: "CASE 01" },
      { type: "video", src: "/assets/img-landings/botox-videocase3.webm", poster: "/assets/img-landings/botox.webp", alt: "Wideo przypadku terapii toksyną botulinową w RESÉT clinic", label: "VIDEO CASE" },
      { type: "image", src: "/assets/img-landings/botox-case2.webp", alt: "Przypadek terapii toksyną botulinową w RESÉT clinic", label: "CASE 02" },
    ],
  },
  lips: {
    kicker: "PRAWDZIWE EFEKTY · USTA",
    title: "Usta, które nadal wyglądają jak Twoje.",
    lead: "Wybrane efekty modelowania kształtu, proporcji i objętości w RESÉT clinic. Celem jest harmonizacja rysów, a nie jeden identyczny rezultat dla wszystkich.",
    items: [
      { type: "image", src: "/assets/img-landings/lips-case1.webp", alt: "Przypadek modelowania ust w RESÉT clinic", label: "CASE 01" },
      { type: "image", src: "/assets/img-landings/lips-case2.webp", alt: "Przypadek modelowania ust w RESÉT clinic", label: "CASE 02" },
      { type: "image", src: "/assets/img-landings/lips-case3.webp", alt: "Przypadek modelowania ust w RESÉT clinic", label: "CASE 03" },
    ],
  },
  "ipl-face": {
    kicker: "PRAWDZIWE EFEKTY · IPL",
    title: "Zmiany skóry pokazane bez filtrów prezentacyjnych.",
    lead: "Wybrane przypadki pacjentów RESÉT clinic po indywidualnie dobranej pracy ze skórą. Efekt i liczba zabiegów zależą od stanu wyjściowego oraz wskazań.",
    items: [
      { type: "image", src: "/assets/img-landings/face-case1.webp", alt: "Przypadek terapii IPL w RESÉT clinic", label: "CASE 01" },
      { type: "image", src: "/assets/img-landings/face-case2.webp", alt: "Przypadek terapii IPL w RESÉT clinic", label: "CASE 02" },
      { type: "image", src: "/assets/img-landings/face-case3.webp", alt: "Przypadek terapii IPL w RESÉT clinic", label: "CASE 03" },
    ],
  },
};

export default function PromoCasesSectionPl({
  config,
  quizPath,
}: {
  config: PromoServiceConfig;
  quizPath: string;
}) {
  const set = CASES[config.slug];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = useMemo(() => activeIndex === null || !set ? null : set.items[activeIndex], [activeIndex, set]);

  if (!set) return null;

  return (
    <section className={`promo-cases-section promo-cases-${config.slug}`} lang="pl-PL">
      <div className="promo-cases-ghost" aria-hidden="true">REAL RESULTS</div>
      <div className="promo-shell promo-cases-shell">
        <header className="promo-cases-heading">
          <div>
            <p className="promo-kicker">{set.kicker}</p>
            <h2>{set.title}</h2>
          </div>
          <div className="promo-cases-heading-side">
            <p>{set.lead}</p>
            <span>Kliknij przypadek, aby zobaczyć go w pełnym widoku</span>
          </div>
        </header>

        <div className="promo-cases-gallery" role="list" aria-label="Przypadki RESÉT clinic">
          {set.items.map((item, index) => (
            <button
              type="button"
              role="listitem"
              key={`${item.type}-${item.src}`}
              className={`promo-case-card promo-case-card-${index + 1} ${item.type === "video" ? "is-video" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${item.label}: otwórz przypadek`}
            >
              <span className="promo-case-media">
                <Image
                  src={item.type === "video" ? item.poster! : item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 760px) 84vw, 30vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="promo-case-shade" />
                {item.type === "video" ? <span className="promo-case-play"><b>▶</b><small>WATCH CASE</small></span> : null}
              </span>
              <span className="promo-case-meta">
                <small>{item.label}</small>
                <strong>{config.serviceName}</strong>
                <b>ZOBACZ ↗</b>
              </span>
              <span className="promo-case-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <div className="promo-cases-footer">
          <div>
            <small>REAL PEOPLE · REAL REQUESTS</small>
            <strong>Podoba Ci się takie podejście do rezultatu?</strong>
          </div>
          <Link className="promo-cases-cta" href={quizPath}>
            Dobierz rozwiązanie dla mnie <span>→</span>
          </Link>
          <p>Zdjęcia i wideo przedstawiają wybrane przypadki kliniczne. Indywidualny rezultat może się różnić.</p>
        </div>
      </div>

      {active && activeIndex !== null ? (
        <div className="promo-case-lightbox" role="dialog" aria-modal="true" aria-label={`Przypadek ${activeIndex + 1}`} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveIndex(null);
        }}>
          <button type="button" className="promo-case-lightbox-close" onClick={() => setActiveIndex(null)} aria-label="Zamknij">×</button>
          <button type="button" className="promo-case-lightbox-nav promo-case-lightbox-prev" onClick={() => setActiveIndex((activeIndex - 1 + set.items.length) % set.items.length)} aria-label="Poprzedni">←</button>
          <div className="promo-case-lightbox-stage">
            <div className="promo-case-lightbox-top">
              <span>{set.kicker}</span>
              <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(set.items.length).padStart(2, "0")}</strong>
            </div>
            <div className={`promo-case-lightbox-media ${active.type === "video" ? "is-video" : ""}`}>
              {active.type === "video" ? (
                <video key={active.src} controls autoPlay playsInline preload="metadata" poster={active.poster}>
                  <source src={active.src} type="video/webm" />
                </video>
              ) : (
                <Image src={active.src} alt={active.alt} fill sizes="90vw" style={{ objectFit: "contain" }} priority />
              )}
            </div>
            <div className="promo-case-lightbox-bottom">
              <strong>{active.label}</strong><span>{config.serviceName} · RESÉT clinic</span>
            </div>
          </div>
          <button type="button" className="promo-case-lightbox-nav promo-case-lightbox-next" onClick={() => setActiveIndex((activeIndex + 1) % set.items.length)} aria-label="Następny">→</button>
        </div>
      ) : null}
    </section>
  );
}

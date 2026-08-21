"use client";

import { useEffect } from "react";

const PRICE_ANCHORS: Array<{ id: string; patterns: string[] }> = [
  { id: "dermatology", patterns: ["дерматолог"] },
  { id: "trichology", patterns: ["трихолог", "трихоскоп"] },
  { id: "botulinum", patterns: ["ботулінотерап"] },
  { id: "contouring", patterns: ["контурна пластика"] },
  { id: "biorevitalization", patterns: ["біоревітал"] },
  { id: "polynucleotides", patterns: ["полінуклеот"] },
  { id: "mesotherapy", patterns: ["мезотерап"] },
  { id: "needle-free-mesotherapy", patterns: ["безін’єкційн", "безін'єкційн"] },
  { id: "ipl", patterns: ["ipl"] },
  { id: "microneedle-rf", patterns: ["мікроголков", "rf-ліфт", "rf ліфт"] },
  { id: "led", patterns: ["led"] },
  { id: "aquapure", patterns: ["aquapure"] },
  { id: "skin-diagnostics", patterns: ["діагностика стану шкіри", "діагностика шкіри"] },
  { id: "nutrition", patterns: ["нутриціолог"] },
];

function normalize(value: string) {
  return value.toLocaleLowerCase("uk-UA").replace(/\s+/g, " ").trim();
}

function installPriceAnchors() {
  if (window.location.pathname !== "/price/") return;

  const candidates = [...document.querySelectorAll<HTMLElement>(
    "h1, h2, h3, h4, .section-title, .elementor-heading-title, [class*='service-name']",
  )];

  PRICE_ANCHORS.forEach(({ id, patterns }) => {
    if (document.getElementById(id)) return;
    const target = candidates.find((node) => {
      const text = normalize(node.textContent || "");
      return patterns.some((pattern) => text.includes(pattern));
    });
    if (target) target.id = id;
  });

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;
  const target = document.getElementById(hash);
  target?.scrollIntoView({ block: "start" });
}

export default function SeoComplianceClient() {
  useEffect(() => {
    installPriceAnchors();
    const timer = window.setTimeout(installPriceAnchors, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

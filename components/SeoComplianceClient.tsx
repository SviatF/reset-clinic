"use client";

import { useEffect } from "react";

const PRICE_ANCHORS: Array<{ id: string; patterns: string[] }> = [
  { id: "dermatology", patterns: ["дерматолог"] },
  { id: "trichology", patterns: ["трихолог", "трихоскоп"] },
  { id: "botulinum", patterns: ["ботулінотерап"] },
  { id: "contouring", patterns: ["контурна пластика"] },
  { id: "biorevitalization", patterns: ["біоревітал"] },
  { id: "polynucleotides", patterns: ["полінуклеот"] },
  { id: "needle-free-mesotherapy", patterns: ["безін’єкційн", "безін'єкційн"] },
  { id: "mesotherapy", patterns: ["мезотерап"] },
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
  const claimed = new Set<HTMLElement>();

  PRICE_ANCHORS.forEach(({ id, patterns }) => {
    if (document.getElementById(id)) return;
    const target = candidates.find((node) => {
      if (claimed.has(node)) return false;
      const text = normalize(node.textContent || "");
      return patterns.some((pattern) => text.includes(pattern));
    });
    if (!target) return;

    claimed.add(target);
    const marker = document.createElement("span");
    marker.id = id;
    marker.setAttribute("aria-hidden", "true");
    marker.style.display = "block";
    marker.style.position = "relative";
    marker.style.top = "-96px";
    marker.style.visibility = "hidden";
    target.before(marker);
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

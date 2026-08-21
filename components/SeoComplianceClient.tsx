"use client";

import { useEffect } from "react";

type AnchorDefinition = { id: string; patterns: string[] };

const PRICE_ANCHORS: AnchorDefinition[] = [
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

const BOTULINUM_ANCHORS: AnchorDefinition[] = [
  { id: "upper-third", patterns: ["ботулінотерапія верхньої третини обличчя"] },
  { id: "forehead", patterns: ["ботулінотерапія лоба"] },
  { id: "glabella", patterns: ["корекція міжбрів’я", "корекція міжбрів'я"] },
  { id: "crows-feet", patterns: ["ботулінотерапія зони навколо очей"] },
  { id: "lower-face", patterns: ["ботулінотерапія нижньої третини"] },
  { id: "platysma", patterns: ["корекція платизми"] },
  { id: "masseter", patterns: ["ботулінотерапія жувальних м’язів", "ботулінотерапія жувальних м'язів"] },
];

function normalize(value: string) {
  return value.toLocaleLowerCase("uk-UA").replace(/\s+/g, " ").trim();
}

function addAnchors(
  definitions: AnchorDefinition[],
  candidates: HTMLElement[],
  claimed = new Set<HTMLElement>(),
) {
  definitions.forEach(({ id, patterns }) => {
    if (document.getElementById(id)) return;
    const target = candidates.find((node) => {
      if (claimed.has(node)) return false;
      const text = normalize(node.textContent || "");
      return patterns.some((pattern) => text.includes(normalize(pattern)));
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
}

function scrollToHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;
  document.getElementById(hash)?.scrollIntoView({ block: "start" });
}

function installSeoAnchors() {
  const pathname = window.location.pathname;

  if (pathname === "/price/") {
    const candidates = [...document.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, .section-title, .elementor-heading-title, [class*='service-name']",
    )];
    addAnchors(PRICE_ANCHORS, candidates);
    scrollToHash();
    return;
  }

  if (pathname === "/cosmetology/injection/botulinum-therapy/") {
    const candidates = [...document.querySelectorAll<HTMLElement>("h2")];
    addAnchors(BOTULINUM_ANCHORS, candidates);
    scrollToHash();
  }
}

export default function SeoComplianceClient() {
  useEffect(() => {
    installSeoAnchors();
    const timer = window.setTimeout(installSeoAnchors, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

type AnchorDefinition = { id: string; patterns: string[] };
type PriceRow = { service: string; price: string };

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
  return value
    .toLocaleLowerCase("uk-UA")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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

function priceTermsForPath(pathname: string): string[] {
  if (pathname.includes("botulinum-therapy")) return ["міжбрів", "чоло", "очі", "верхня третина", "платизма"];
  if (pathname.includes("hyperhidrosis")) return ["гіпергідроз"];
  if (pathname.includes("lip-contouring")) return ["губ", "контурна пластика губ"];
  if (pathname.includes("face-contouring")) return ["контурна пластика", "підборід", "вилиц"];
  if (pathname.includes("biorevitalization")) return ["біоревітал"];
  if (pathname.includes("polynucleotides")) return ["полінуклеот"];
  if (pathname.includes("needle-free-mesotherapy")) return ["безін'єкційн"];
  if (pathname.includes("mesotherapy")) return ["мезотерап"];
  if (pathname.includes("microneedle-rf")) return ["мікроголков", "rf"];
  if (pathname.includes("/ipl/")) return ["ipl"];
  if (pathname.includes("led-therapy")) return ["led"];
  if (pathname.includes("aquapure")) return ["aquapure"];
  if (pathname.includes("skin-diagnostics")) return ["діагностика шкіри", "діагностика стану шкіри"];
  if (pathname.includes("trichoscopy")) return ["трихоскоп"];
  if (pathname.includes("trichologist")) return ["трихолог"];
  if (pathname.includes("dermoscopy")) return ["дерматоскоп"];
  if (pathname.includes("dermatologist-lviv")) return ["дерматолог"];
  if (pathname.includes("nutritionist-lviv")) return ["нутриціолог"];
  return [];
}

function readPriceRows(html: string): PriceRow[] {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const rows = [...parsed.querySelectorAll<HTMLElement>(".price-row")].flatMap((row) => {
    const service = row.querySelector<HTMLElement>(".service-name")?.textContent?.trim();
    const price = row.querySelector<HTMLElement>(".service-price")?.textContent?.trim();
    return service && price ? [{ service, price }] : [];
  });

  return rows.filter(
    (row, index, list) =>
      list.findIndex(
        (candidate) =>
          normalize(candidate.service) === normalize(row.service) &&
          normalize(candidate.price) === normalize(row.price),
      ) === index,
  );
}

function findPriceCard() {
  return [...document.querySelectorAll<HTMLElement>(".seo-related-card")].find((card) => {
    const heading = card.querySelector<HTMLElement>(":scope > p");
    return normalize(heading?.textContent || "") === "вартість";
  });
}

function renderLivePrices(card: HTMLElement, rows: PriceRow[]) {
  if (!rows.length || card.querySelector("[data-live-price-list]")) return;

  const list = document.createElement("div");
  list.dataset.livePriceList = "true";
  list.setAttribute("aria-label", "Актуальні ціни з прайсу RESET Clinic");
  list.style.display = "grid";
  list.style.gap = "8px";
  list.style.margin = "12px 0 4px";

  rows.slice(0, 5).forEach((row) => {
    const item = document.createElement("div");
    item.style.display = "grid";
    item.style.gridTemplateColumns = "minmax(0, 1fr) auto";
    item.style.gap = "12px";
    item.style.alignItems = "start";
    item.style.padding = "10px 0";
    item.style.borderTop = "1px solid rgba(41,32,27,.12)";

    const service = document.createElement("span");
    service.textContent = row.service;
    service.style.fontSize = "12px";
    service.style.lineHeight = "1.45";

    const price = document.createElement("strong");
    price.textContent = row.price;
    price.style.fontSize = "13px";
    price.style.whiteSpace = "nowrap";

    item.append(service, price);
    list.append(item);
  });

  const note = card.querySelector("small");
  if (note) card.insertBefore(list, note);
  else card.append(list);
}

async function installLivePricePreview() {
  const pathname = window.location.pathname;
  const terms = priceTermsForPath(pathname).map(normalize);
  if (!terms.length) return;

  const card = findPriceCard();
  if (!card || card.dataset.livePriceLoaded === "true") return;
  card.dataset.livePriceLoaded = "true";

  try {
    const response = await fetch("/price/", { credentials: "same-origin" });
    if (!response.ok) return;
    const rows = readPriceRows(await response.text());
    const matches = rows.filter((row) => {
      const service = normalize(row.service);
      return terms.some((term) => service.includes(term));
    });
    renderLivePrices(card, matches);
  } catch {
    // The canonical price link remains visible if live preview cannot load.
  }
}

export default function SeoComplianceClient() {
  useEffect(() => {
    installSeoAnchors();
    void installLivePricePreview();
    const timer = window.setTimeout(() => {
      installSeoAnchors();
      void installLivePricePreview();
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

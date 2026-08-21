import pages from "./pages.json";

export type PublishedPriceRow = {
  section: string;
  service: string;
  price: string;
};

type LegacyPageRecord = Record<string, { html?: string }>;

const PRICE_HTML = (pages as LegacyPageRecord)["/price/"]?.html || "";

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("uk-UA")
    .replace(/[’ʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePublishedPrices(html: string): PublishedPriceRow[] {
  const headings: { index: number; text: string }[] = [];
  const headingPattern = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(html))) {
    headings.push({ index: headingMatch.index, text: decodeHtml(headingMatch[1]) });
  }

  const rows: PublishedPriceRow[] = [];
  const rowPattern = /<div\s+class=["'][^"']*price-row[^"']*["'][^>]*>[\s\S]*?<div\s+class=["'][^"']*service-name[^"']*["'][^>]*>([\s\S]*?)<\/div>[\s\S]*?<div\s+class=["'][^"']*service-price[^"']*["'][^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/div>/gi;
  let rowMatch: RegExpExecArray | null;
  let headingCursor = 0;
  let currentHeading = "";

  while ((rowMatch = rowPattern.exec(html))) {
    while (headingCursor < headings.length && headings[headingCursor].index < rowMatch.index) {
      currentHeading = headings[headingCursor].text;
      headingCursor += 1;
    }

    const service = decodeHtml(rowMatch[1]);
    const price = decodeHtml(rowMatch[2]);
    if (!service || !price) continue;
    rows.push({ section: currentHeading, service, price });
  }

  return rows.filter((row, index, list) => {
    const key = `${normalize(row.section)}|${normalize(row.service)}|${normalize(row.price)}`;
    return list.findIndex((candidate) =>
      `${normalize(candidate.section)}|${normalize(candidate.service)}|${normalize(candidate.price)}` === key,
    ) === index;
  });
}

const PUBLISHED_PRICES = parsePublishedPrices(PRICE_HTML);

function termsForLanding(path: string): string[] {
  if (path.includes("botulinum-therapy")) return ["ботулінотерап"];
  if (path.includes("hyperhidrosis")) return ["гіпергідроз"];
  if (path.includes("lip-contouring")) return ["контурна пластика губ"];
  if (path.includes("face-contouring")) return ["контурна пластика обличчя"];
  if (path.includes("biorevitalization")) return ["біоревітал"];
  if (path.includes("polynucleotides")) return ["полінуклеот"];
  if (path.includes("needle-free-mesotherapy")) return ["безін'єкційн", "безінʼєкційн"];
  if (path.includes("/mesotherapy/")) return ["мезотерап"];
  if (path.includes("microneedle-rf")) return ["мікроголковий rf"];
  if (path.includes("/ipl/")) return ["ipl терап"];
  if (path.includes("led-therapy")) return ["led терап"];
  if (path.includes("aquapure")) return ["aquapure"];
  if (path.includes("skin-diagnostics")) return ["діагностика стану шкіри", "діагностика шкіри"];
  if (path.includes("trichoscopy") || path.includes("trichologist")) return ["трихолог", "трихоскоп"];
  if (path.includes("dermoscopy")) return ["дерматоскоп"];
  if (path.includes("dermatologist-lviv")) return ["дерматолог"];
  if (path.includes("nutritionist-lviv")) return ["нутриціолог"];
  return [];
}

export function getPublishedPricesForLanding(path: string, limit = 5): PublishedPriceRow[] {
  const terms = termsForLanding(path).map(normalize);
  if (!terms.length) return [];

  const matches = PUBLISHED_PRICES.filter((row) => {
    const haystack = `${normalize(row.section)} ${normalize(row.service)}`;
    return terms.some((term) => haystack.includes(term));
  });

  if (path.includes("needle-free-mesotherapy")) {
    return matches.slice(0, limit);
  }
  if (path.includes("/mesotherapy/") && !path.includes("needle-free-mesotherapy")) {
    return matches.filter((row) => !normalize(row.section).includes("безін'єкційн")).slice(0, limit);
  }

  return matches.slice(0, limit);
}

const INDEXABLE_SERVICE_LINKS = [
  {
    href: "/dermatology/dermatologist-lviv/",
    match: (value: string) => value.includes("консультац") && value.includes("дерматолог"),
  },
  {
    href: "/dermatology/trichologist-lviv/",
    match: (value: string) => value.includes("консультац") && value.includes("трихолог"),
  },
  {
    href: "/nutrition/nutritionist-lviv/",
    match: (value: string) => value.includes("консультац") && value.includes("нутриціолог"),
  },
  {
    href: "/dermatology/dermoscopy/",
    match: (value: string) => value.includes("дерматоскоп"),
  },
  {
    href: "/dermatology/trichoscopy/",
    match: (value: string) => value.includes("трихоскоп"),
  },
  {
    href: "/cosmetology/hardware/needle-free-mesotherapy/",
    match: (value: string) => value.includes("мезотерап") && value.includes("безін'єкційн"),
  },
  {
    href: "/cosmetology/injection/botulinum-therapy/",
    match: (value: string) => value.includes("ботулінотерап"),
  },
  {
    href: "/cosmetology/injection/lip-contouring/",
    match: (value: string) =>
      (value.includes("контурна пластика") && value.includes("губ")) ||
      (value.includes("корекц") && value.includes("губ")),
  },
  {
    href: "/cosmetology/injection/face-contouring/",
    match: (value: string) => value.includes("контурна пластика") && value.includes("облич"),
  },
  {
    href: "/cosmetology/injection/biorevitalization/",
    match: (value: string) => value.includes("біоревітал"),
  },
  {
    href: "/cosmetology/injection/polynucleotides/",
    match: (value: string) => value.includes("полінуклеот"),
  },
  {
    href: "/cosmetology/injection/mesotherapy/",
    match: (value: string) => value.includes("мезотерап"),
  },
  {
    href: "/cosmetology/hardware/microneedle-rf/",
    match: (value: string) => value.includes("мікроголков") && value.includes("rf"),
  },
  {
    href: "/cosmetology/hardware/ipl/",
    match: (value: string) => /(^|\s)ipl(\s|$)/.test(value) || value.includes("ipl терап"),
  },
  {
    href: "/cosmetology/hardware/led-therapy/",
    match: (value: string) => /(^|\s)led(\s|$)/.test(value) || value.includes("led терап"),
  },
  {
    href: "/cosmetology/hardware/aquapure/",
    match: (value: string) => value.includes("aquapure"),
  },
  {
    href: "/cosmetology/hardware/skin-diagnostics/",
    match: (value: string) => value.includes("діагностик") && value.includes("шкір"),
  },
  {
    href: "/dermatology/acne-treatment/",
    match: (value: string) => value.includes("лікуван") && value.includes("акне"),
  },
  {
    href: "/dermatology/rosacea-treatment/",
    match: (value: string) => value.includes("лікуван") && value.includes("розаце"),
  },
  {
    href: "/dermatology/pigmentation-treatment/",
    match: (value: string) => value.includes("лікуван") && value.includes("пігментац"),
  },
] as const;

function normalizeVisibleHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0?39;/gi, "'")
    .replace(/[’ʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("uk-UA");
}

function serviceLandingHref(innerHtml: string) {
  const visible = normalizeVisibleHtml(innerHtml);
  if (!visible || visible.includes("biopatid")) return null;
  return INDEXABLE_SERVICE_LINKS.find((rule) => rule.match(visible))?.href ?? null;
}

export function linkLegacyMoneyPageServices(html: string, route: string) {
  if (route !== "/services/" && route !== "/price/") return html;

  return html.replace(
    /<div(\s+class=["'][^"']*\bservice-name\b[^"']*["'][^>]*)>([\s\S]*?)<\/div>/gi,
    (full, attrs: string, inner: string) => {
      if (/<a\b/i.test(inner)) return full;
      const href = serviceLandingHref(inner);
      if (!href) return full;
      return `<div${attrs}><a class="reset-seo-service-link" href="${href}">${inner}</a></div>`;
    },
  );
}

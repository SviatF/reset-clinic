import type { PromoServiceSlug } from "./promo-data";

/**
 * Each hreflang pair points only at an indexable, canonical, non-redirecting
 * page. Keep this mapping synchronized with the PL routes and UK SEO metadata.
 * BIOPATID has no live core medical-weight-loss URL: use its UA promo landing.
 */
export const PROMO_LOCALE_PAIRS: Record<PromoServiceSlug, { uk: string; pl: string }> = {
  botulinotherapy: {
    uk: "/cosmetology/injection/botulinum-therapy/",
    pl: "/pl/promo/botoks-lwow/",
  },
  lips: {
    uk: "/cosmetology/injection/lip-contouring/",
    pl: "/pl/promo/modelowanie-ust-lwow/",
  },
  "ipl-face": {
    uk: "/cosmetology/hardware/ipl/",
    pl: "/pl/promo/ipl-twarz-lwow/",
  },
  "facial-cleaning": {
    uk: "/cosmetology/hardware/aquapure/",
    pl: "/pl/promo/oczyszczanie-twarzy-lwow/",
  },
  biopatid: {
    uk: "/promo/biopatid/",
    pl: "/pl/promo/kontrola-wagi-lwow/",
  },
  nutrition: {
    uk: "/nutrition/nutritionist-lviv/",
    pl: "/pl/promo/dietetyk-lwow/",
  },
};

export function alternateForUkrainianCorePath(path: string) {
  return Object.values(PROMO_LOCALE_PAIRS).find((pair) =>
    pair.uk === path && !pair.uk.startsWith("/promo/")
  )?.pl;
}

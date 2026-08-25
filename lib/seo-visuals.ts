import { DEFAULT_OG_IMAGE } from "./seo";

export type SeoLandingVisual = {
  src: string;
  alt: string;
};

const DEFAULT_VISUAL: SeoLandingVisual = {
  src: DEFAULT_OG_IMAGE,
  alt: "Інтер’єр RESET Clinic у Львові",
};

const HARDWARE_VISUAL: SeoLandingVisual = {
  src: "/assets/aparatna-kosmelogia.webp",
  alt: "Апаратна косметологія в RESET Clinic у Львові",
};

const INJECTION_VISUAL: SeoLandingVisual = {
  src: "/assets/injekcijna-kosmelogia.webp",
  alt: "Ін’єкційна косметологія в RESET Clinic у Львові",
};

const CARE_VISUAL: SeoLandingVisual = {
  src: "/assets/doglyadova-kosmetologia.webp",
  alt: "Доглядова косметологія в RESET Clinic у Львові",
};

const HOME_CARE_VISUAL: SeoLandingVisual = {
  src: "/assets/doglyad.webp",
  alt: "Професійний догляд за шкірою в RESET Clinic",
};

const COSMETOLOGY_INTERIOR_VISUAL: SeoLandingVisual = {
  src: "/assets/interier-cosmetologia.webp",
  alt: "Інтер’єр косметології RESET Clinic у Львові",
};

const CONSULTATION_VISUAL: SeoLandingVisual = {
  src: "/assets/konsulatcija2.webp",
  alt: "Консультація лікаря з пацієнткою в RESET Clinic",
};

const CONSULTATION_PATHS = new Set([
  "/dermatology/dermatologist-lviv/",
  "/dermatology/trichologist-lviv/",
  "/nutrition/nutritionist-lviv/",
  "/nutrition/deficiency-diagnostics/",
]);

const HOME_CARE_PATHS = new Set([
  "/skin-problems/dry-skin/",
  "/skin-problems/sensitive-skin/",
]);

export function seoLandingVisual(path: string): SeoLandingVisual {
  if (path === "/cosmetology/") return COSMETOLOGY_INTERIOR_VISUAL;
  if (path.startsWith("/cosmetology/injection/")) return INJECTION_VISUAL;
  if (path.startsWith("/cosmetology/hardware/")) return HARDWARE_VISUAL;
  if (path === "/skin-care/") return CARE_VISUAL;
  if (HOME_CARE_PATHS.has(path)) return HOME_CARE_VISUAL;
  if (CONSULTATION_PATHS.has(path)) return CONSULTATION_VISUAL;
  return DEFAULT_VISUAL;
}

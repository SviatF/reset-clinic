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

const PRIORITY_VISUALS: Partial<Record<string, SeoLandingVisual>> = {
  "/cosmetology/injection/lip-contouring/": {
    src: "/assets/img-landings/lips.webp",
    alt: "Збільшення та контурна пластика губ у RESET Clinic у Львові",
  },
  "/nutrition/medical-weight-loss/": {
    src: "/assets/img-landings/biobatud.webp",
    alt: "Медична програма контролю ваги БІОПАТИД у RESET Clinic у Львові",
  },
  "/nutrition/nutritionist-lviv/": {
    src: "/assets/img-landings/nutriciology.webp",
    alt: "Консультація нутриціолога у RESET Clinic у Львові",
  },
  "/cosmetology/hardware/aquapure/": {
    src: "/assets/img-landings/chystka-face.webp",
    alt: "Чистка обличчя та AquaPure у RESET Clinic у Львові",
  },
  "/cosmetology/hardware/ipl/": {
    src: "/assets/img-landings/irl.webp",
    alt: "IPL обличчя у RESET Clinic у Львові",
  },
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
  const priority = PRIORITY_VISUALS[path];
  if (priority) return priority;
  if (path === "/cosmetology/") return COSMETOLOGY_INTERIOR_VISUAL;
  if (path.startsWith("/cosmetology/injection/")) return INJECTION_VISUAL;
  if (path.startsWith("/cosmetology/hardware/")) return HARDWARE_VISUAL;
  if (path === "/skin-care/") return CARE_VISUAL;
  if (HOME_CARE_PATHS.has(path)) return HOME_CARE_VISUAL;
  if (CONSULTATION_PATHS.has(path)) return CONSULTATION_VISUAL;
  return DEFAULT_VISUAL;
}

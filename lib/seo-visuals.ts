import { DEFAULT_OG_IMAGE } from "./seo";

export type SeoLandingVisual = {
  src: string;
  alt: string;
  position?: string;
};

const DEFAULT_VISUAL: SeoLandingVisual = {
  src: DEFAULT_OG_IMAGE,
  alt: "Інтер’єр RESET Clinic у Львові",
};

const CLINIC_VISUAL: SeoLandingVisual = {
  src: "/assets/home-clinic.jpg",
  alt: "RESET Clinic у Львові",
};

const ABOUT_VISUAL: SeoLandingVisual = {
  src: "/assets/about-01.jpg",
  alt: "Простір RESET Clinic у Львові",
};

const HARDWARE_VISUAL: SeoLandingVisual = {
  src: "/assets/aparatna-kosmelogia.webp",
  alt: "Апаратна косметологія в RESET Clinic у Львові",
};

const EQUIPMENT_VISUAL: SeoLandingVisual = {
  src: "/assets/obladnania.webp",
  alt: "Обладнання RESET Clinic у Львові",
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
  alt: "Консультація в RESET Clinic у Львові",
};

const CLEANING_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/chystka-face.webp",
  alt: "Професійний догляд за шкірою обличчя в RESET Clinic",
};

const IPL_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/irl.webp",
  alt: "IPL-процедура в RESET Clinic у Львові",
};

const LIPS_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/lips.webp",
  alt: "Контурна пластика губ у RESET Clinic у Львові",
};

const BOTOX_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/botox.webp",
  alt: "Ботулінотерапія в RESET Clinic у Львові",
};

const NUTRITION_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/nutriciology.webp",
  alt: "Консультація з нутриціології в RESET Clinic у Львові",
};

const BOTOX_CASE_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/botox-case1.webp",
  alt: "Матеріал кейсу ботулінотерапії RESET Clinic",
};

const LIPS_CASE_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/lips-case1.webp",
  alt: "Матеріал кейсу контурної пластики губ RESET Clinic",
};

const FACE_CASE_VISUAL: SeoLandingVisual = {
  src: "/assets/img-landings/face-case1.webp",
  alt: "Матеріал кейсу естетичної корекції обличчя RESET Clinic",
};

const CONSULTATION_POOL = [
  CONSULTATION_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  ABOUT_VISUAL,
  CLINIC_VISUAL,
] as const;

const SKIN_CARE_POOL = [
  CARE_VISUAL,
  HOME_CARE_VISUAL,
  CLEANING_VISUAL,
  CONSULTATION_VISUAL,
] as const;

const HARDWARE_POOL = [
  HARDWARE_VISUAL,
  EQUIPMENT_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  CONSULTATION_VISUAL,
] as const;

const HAIR_SCALP_POOL = [
  CONSULTATION_VISUAL,
  EQUIPMENT_VISUAL,
  ABOUT_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
] as const;

const VASCULAR_PIGMENT_POOL = [
  IPL_VISUAL,
  HARDWARE_VISUAL,
  CONSULTATION_VISUAL,
  EQUIPMENT_VISUAL,
] as const;

const INJECTION_POOL = [
  INJECTION_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  CONSULTATION_VISUAL,
] as const;

const NUTRITION_POOL = [
  NUTRITION_VISUAL,
  CONSULTATION_VISUAL,
  ABOUT_VISUAL,
  CLINIC_VISUAL,
] as const;

// These are the highest-intent landing pages. Their hero visuals are curated
// explicitly instead of being selected from a cluster-level fallback pool.
const PRIORITY_VISUALS: Partial<Record<string, SeoLandingVisual>> = {
  "/dermatology/dermatologist-lviv/": CONSULTATION_VISUAL,
  "/dermatology/acne-treatment/": CARE_VISUAL,
  "/dermatology/rosacea-treatment/": CLINIC_VISUAL,
  "/dermatology/pigmentation-treatment/": COSMETOLOGY_INTERIOR_VISUAL,
  "/dermatology/hair-loss-treatment/": ABOUT_VISUAL,
  "/dermatology/trichologist-lviv/": CONSULTATION_VISUAL,
  "/dermatology/post-acne-treatment/": HARDWARE_VISUAL,
  "/dermatology/hair-loss-diagnostics/": EQUIPMENT_VISUAL,
  "/cosmetology/injection/botulinum-therapy/": BOTOX_VISUAL,
  "/cosmetology/injection/lip-contouring/": LIPS_VISUAL,
  "/cosmetology/injection/face-contouring/": INJECTION_VISUAL,
  "/cosmetology/injection/biorevitalization/": COSMETOLOGY_INTERIOR_VISUAL,
  "/cosmetology/hardware/ipl/": IPL_VISUAL,
  "/cosmetology/hardware/microneedle-rf/": HARDWARE_VISUAL,
  "/cosmetology/hardware/skin-diagnostics/": EQUIPMENT_VISUAL,
  "/cosmetology/hardware/aquapure/": CLEANING_VISUAL,
  "/skin-problems/acne/": HOME_CARE_VISUAL,
  "/skin-problems/post-acne/": CARE_VISUAL,
  "/skin-problems/acne-scars/": HARDWARE_VISUAL,
  "/nutrition/nutritionist-lviv/": NUTRITION_VISUAL,
};

// Supporting visuals are curated separately so long-form pages do not repeat
// their hero image. Case assets are used only where their filename/context is explicit.
const PRIORITY_SUPPORTING_VISUALS: Partial<Record<string, SeoLandingVisual>> = {
  "/dermatology/dermatologist-lviv/": CLINIC_VISUAL,
  "/dermatology/acne-treatment/": CONSULTATION_VISUAL,
  "/dermatology/rosacea-treatment/": CONSULTATION_VISUAL,
  "/dermatology/pigmentation-treatment/": HARDWARE_VISUAL,
  "/dermatology/hair-loss-treatment/": EQUIPMENT_VISUAL,
  "/dermatology/trichologist-lviv/": ABOUT_VISUAL,
  "/dermatology/post-acne-treatment/": CARE_VISUAL,
  "/dermatology/hair-loss-diagnostics/": CLINIC_VISUAL,
  "/cosmetology/injection/botulinum-therapy/": BOTOX_CASE_VISUAL,
  "/cosmetology/injection/lip-contouring/": LIPS_CASE_VISUAL,
  "/cosmetology/injection/face-contouring/": FACE_CASE_VISUAL,
  "/cosmetology/injection/biorevitalization/": INJECTION_VISUAL,
  "/cosmetology/hardware/ipl/": EQUIPMENT_VISUAL,
  "/cosmetology/hardware/microneedle-rf/": EQUIPMENT_VISUAL,
  "/cosmetology/hardware/skin-diagnostics/": CONSULTATION_VISUAL,
  "/cosmetology/hardware/aquapure/": HOME_CARE_VISUAL,
  "/skin-problems/acne/": CONSULTATION_VISUAL,
  "/skin-problems/post-acne/": HOME_CARE_VISUAL,
  "/skin-problems/acne-scars/": CONSULTATION_VISUAL,
  "/nutrition/nutritionist-lviv/": ABOUT_VISUAL,
};

function stableIndex(path: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < path.length; index += 1) {
    hash ^= path.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function pick(path: string, pool: readonly SeoLandingVisual[], offset = 0) {
  return pool[(stableIndex(path, pool.length) + offset) % pool.length];
}

function includesAny(path: string, values: readonly string[]) {
  return values.some((value) => path.includes(value));
}

const HAIR_SCALP_TOKENS = [
  "hair",
  "scalp",
  "dandruff",
  "trich",
  "alopecia",
] as const;

const ACNE_CARE_TOKENS = [
  "acne",
  "comedon",
  "blackhead",
  "pores",
  "oily-skin",
] as const;

const VASCULAR_PIGMENT_TOKENS = [
  "rosacea",
  "couperose",
  "spider-veins",
  "redness",
  "pigment",
  "melasma",
  "dark-spots",
  "uneven-skin-tone",
] as const;

const DERMATITIS_TOKENS = [
  "dermatitis",
  "eczema",
  "rash",
  "psoriasis",
  "folliculitis",
  "skin-infections",
] as const;

const DRY_SENSITIVE_TOKENS = [
  "dry-skin",
  "sensitive-skin",
  "dehydrated-skin",
] as const;

const DIAGNOSTIC_TOKENS = [
  "dermoscopy",
  "diagnostics",
  "moles",
  "skin-lesions",
] as const;

const TEXTURE_REJUVENATION_TOKENS = [
  "wrinkles",
  "skin-laxity",
  "loss-of-firmness",
  "scars",
  "uneven-skin-texture",
] as const;

export function seoLandingVisual(path: string): SeoLandingVisual {
  const priority = PRIORITY_VISUALS[path];
  if (priority) return priority;

  if (path === "/cosmetology/") return COSMETOLOGY_INTERIOR_VISUAL;
  if (path === "/skin-care/") return CARE_VISUAL;
  if (path === "/nutrition/") return NUTRITION_VISUAL;
  if (path === "/dermatology/") return CONSULTATION_VISUAL;
  if (path === "/skin-problems/") return HOME_CARE_VISUAL;

  if (path.startsWith("/cosmetology/injection/")) return pick(path, INJECTION_POOL);
  if (path.startsWith("/cosmetology/hardware/")) return pick(path, HARDWARE_POOL);
  if (path.startsWith("/nutrition/")) return pick(path, NUTRITION_POOL);

  if (includesAny(path, HAIR_SCALP_TOKENS)) return pick(path, HAIR_SCALP_POOL);
  if (includesAny(path, ACNE_CARE_TOKENS)) return pick(path, SKIN_CARE_POOL);
  if (includesAny(path, VASCULAR_PIGMENT_TOKENS)) return pick(path, VASCULAR_PIGMENT_POOL);
  if (includesAny(path, DERMATITIS_TOKENS)) return pick(path, CONSULTATION_POOL);
  if (includesAny(path, DRY_SENSITIVE_TOKENS)) return pick(path, SKIN_CARE_POOL);
  if (includesAny(path, DIAGNOSTIC_TOKENS)) return pick(path, HARDWARE_POOL);
  if (includesAny(path, TEXTURE_REJUVENATION_TOKENS)) return pick(path, HARDWARE_POOL);

  if (path.startsWith("/dermatology/")) return pick(path, CONSULTATION_POOL);
  if (path.startsWith("/skin-problems/")) return pick(path, [...SKIN_CARE_POOL, ...CONSULTATION_POOL]);
  if (path.startsWith("/cosmetology/")) return pick(path, [...HARDWARE_POOL, ...INJECTION_POOL]);

  return DEFAULT_VISUAL;
}

export function seoLandingSupportingVisual(path: string): SeoLandingVisual {
  const priority = PRIORITY_SUPPORTING_VISUALS[path];
  if (priority) return priority;

  if (path.startsWith("/cosmetology/injection/")) return pick(path, INJECTION_POOL, 1);
  if (path.startsWith("/cosmetology/hardware/")) return pick(path, HARDWARE_POOL, 1);
  if (path.startsWith("/nutrition/")) return pick(path, NUTRITION_POOL, 1);

  if (includesAny(path, HAIR_SCALP_TOKENS)) return pick(path, HAIR_SCALP_POOL, 1);
  if (includesAny(path, ACNE_CARE_TOKENS)) return pick(path, SKIN_CARE_POOL, 1);
  if (includesAny(path, VASCULAR_PIGMENT_TOKENS)) return pick(path, VASCULAR_PIGMENT_POOL, 1);
  if (includesAny(path, DERMATITIS_TOKENS)) return pick(path, CONSULTATION_POOL, 1);
  if (includesAny(path, DRY_SENSITIVE_TOKENS)) return pick(path, SKIN_CARE_POOL, 1);
  if (includesAny(path, DIAGNOSTIC_TOKENS)) return pick(path, HARDWARE_POOL, 1);
  if (includesAny(path, TEXTURE_REJUVENATION_TOKENS)) return pick(path, HARDWARE_POOL, 1);

  if (path.startsWith("/dermatology/")) return pick(path, CONSULTATION_POOL, 1);
  if (path.startsWith("/skin-problems/")) return pick(path, [...SKIN_CARE_POOL, ...CONSULTATION_POOL], 1);
  if (path.startsWith("/cosmetology/")) return pick(path, [...HARDWARE_POOL, ...INJECTION_POOL], 1);

  return ABOUT_VISUAL;
}

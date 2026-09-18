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

const ABOUT_VISUAL_02: SeoLandingVisual = {
  src: "/assets/about-02.png",
  alt: "Простір RESET Clinic у Львові",
};

const ABOUT_VISUAL_03: SeoLandingVisual = {
  src: "/assets/about-03.jpg",
  alt: "Простір RESET Clinic у Львові",
};

const ABOUT_VISUAL_04: SeoLandingVisual = {
  src: "/assets/about-04.png",
  alt: "RESET Clinic у Львові",
};

const ABOUT_VISUAL_05: SeoLandingVisual = {
  src: "/assets/about-05.png",
  alt: "RESET Clinic у Львові",
};

const ABOUT_VISUAL_06: SeoLandingVisual = {
  src: "/assets/about-06.png",
  alt: "Простір RESET Clinic у Львові",
};

const SERVICE_VISUAL: SeoLandingVisual = {
  src: "/assets/service-9165.jpg",
  alt: "RESET Clinic у Львові",
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

// Real clinic photos already present in the legacy site. Their exact medical
// scene is intentionally not inferred; neutral alt text keeps the usage honest.
const CLINIC_STORY_POOL = [
  ABOUT_VISUAL,
  ABOUT_VISUAL_02,
  ABOUT_VISUAL_03,
  ABOUT_VISUAL_04,
  ABOUT_VISUAL_05,
  ABOUT_VISUAL_06,
  CLINIC_VISUAL,
  SERVICE_VISUAL,
] as const;

const CONSULTATION_POOL = [
  CONSULTATION_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  ...CLINIC_STORY_POOL,
] as const;

const SKIN_CARE_POOL = [
  CARE_VISUAL,
  HOME_CARE_VISUAL,
  CLEANING_VISUAL,
  CONSULTATION_VISUAL,
  ABOUT_VISUAL_02,
  ABOUT_VISUAL_03,
  ABOUT_VISUAL_04,
] as const;

const HARDWARE_POOL = [
  HARDWARE_VISUAL,
  EQUIPMENT_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  CONSULTATION_VISUAL,
  ABOUT_VISUAL_05,
  SERVICE_VISUAL,
] as const;

const HAIR_SCALP_POOL = [
  CONSULTATION_VISUAL,
  EQUIPMENT_VISUAL,
  ABOUT_VISUAL,
  ABOUT_VISUAL_02,
  ABOUT_VISUAL_03,
  ABOUT_VISUAL_04,
  ABOUT_VISUAL_05,
  ABOUT_VISUAL_06,
  SERVICE_VISUAL,
] as const;

const VASCULAR_PIGMENT_POOL = [
  IPL_VISUAL,
  HARDWARE_VISUAL,
  CONSULTATION_VISUAL,
  EQUIPMENT_VISUAL,
  ABOUT_VISUAL_05,
  ABOUT_VISUAL_06,
] as const;

const INJECTION_POOL = [
  INJECTION_VISUAL,
  COSMETOLOGY_INTERIOR_VISUAL,
  CONSULTATION_VISUAL,
  ABOUT_VISUAL_04,
  ABOUT_VISUAL_05,
] as const;

const NUTRITION_POOL = [
  NUTRITION_VISUAL,
  CONSULTATION_VISUAL,
  ABOUT_VISUAL,
  ABOUT_VISUAL_02,
  ABOUT_VISUAL_03,
  CLINIC_VISUAL,
] as const;

// High-intent landing pages receive explicit image assignments. Named
// procedure assets are used where their semantics are known. Dermatology and
// trichology pages use real clinic photos with neutral descriptions instead of
// pretending a hash-named photo depicts a specific diagnosis or examination.
const PRIORITY_VISUALS: Partial<Record<string, SeoLandingVisual>> = {
  "/dermatology/dermatologist-lviv/": CONSULTATION_VISUAL,
  "/dermatology/acne-treatment/": CARE_VISUAL,
  "/dermatology/rosacea-treatment/": CLINIC_VISUAL,
  "/dermatology/pigmentation-treatment/": COSMETOLOGY_INTERIOR_VISUAL,
  "/dermatology/hair-loss-treatment/": ABOUT_VISUAL,
  "/dermatology/trichologist-lviv/": CONSULTATION_VISUAL,
  "/dermatology/post-acne-treatment/": HARDWARE_VISUAL,
  "/dermatology/hair-loss-diagnostics/": EQUIPMENT_VISUAL,

  "/dermatology/eczema-treatment/": ABOUT_VISUAL_02,
  "/dermatology/contact-dermatitis-treatment/": ABOUT_VISUAL_03,
  "/dermatology/skin-rash-treatment/": ABOUT_VISUAL_04,
  "/dermatology/post-inflammatory-hyperpigmentation-treatment/": IPL_VISUAL,
  "/dermatology/diffuse-hair-loss-treatment/": ABOUT_VISUAL_05,
  "/dermatology/androgenetic-alopecia-treatment/": ABOUT_VISUAL_06,
  "/dermatology/scalp-seborrhea-treatment/": SERVICE_VISUAL,

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
  "/skin-problems/couperose/": IPL_VISUAL,
  "/skin-problems/facial-rash/": ABOUT_VISUAL_03,
  "/skin-problems/itchy-scalp/": ABOUT_VISUAL_04,
  "/skin-problems/dandruff/": ABOUT_VISUAL_05,
  "/skin-problems/closed-comedones/": CLEANING_VISUAL,
  "/skin-problems/enlarged-pores/": CARE_VISUAL,
  "/skin-problems/oily-skin/": HOME_CARE_VISUAL,
  "/skin-problems/dark-spots/": HARDWARE_VISUAL,
  "/skin-problems/spider-veins-face/": IPL_VISUAL,
  "/skin-problems/sensitive-skin/": ABOUT_VISUAL_02,
  "/skin-problems/dehydrated-skin/": ABOUT_VISUAL_06,
  "/skin-problems/blackheads/": CLEANING_VISUAL,
  "/skin-problems/rash-around-mouth/": ABOUT_VISUAL_05,
  "/skin-problems/post-acne-red-marks/": CARE_VISUAL,
  "/skin-problems/skin-laxity/": INJECTION_VISUAL,
  "/skin-problems/oily-scalp/": SERVICE_VISUAL,
  "/skin-problems/dry-scalp/": ABOUT_VISUAL_03,
  "/skin-problems/hair-thinning/": ABOUT_VISUAL_04,

  "/nutrition/nutritionist-lviv/": NUTRITION_VISUAL,
};

// Supporting visuals are curated independently so the long-form content does
// not simply repeat the hero. Case assets are used only where their context is explicit.
const PRIORITY_SUPPORTING_VISUALS: Partial<Record<string, SeoLandingVisual>> = {
  "/dermatology/dermatologist-lviv/": CLINIC_VISUAL,
  "/dermatology/acne-treatment/": CONSULTATION_VISUAL,
  "/dermatology/rosacea-treatment/": ABOUT_VISUAL_02,
  "/dermatology/pigmentation-treatment/": HARDWARE_VISUAL,
  "/dermatology/hair-loss-treatment/": EQUIPMENT_VISUAL,
  "/dermatology/trichologist-lviv/": ABOUT_VISUAL_03,
  "/dermatology/post-acne-treatment/": CARE_VISUAL,
  "/dermatology/hair-loss-diagnostics/": ABOUT_VISUAL_04,

  "/dermatology/eczema-treatment/": CONSULTATION_VISUAL,
  "/dermatology/contact-dermatitis-treatment/": ABOUT_VISUAL_05,
  "/dermatology/skin-rash-treatment/": CLINIC_VISUAL,
  "/dermatology/post-inflammatory-hyperpigmentation-treatment/": HARDWARE_VISUAL,
  "/dermatology/diffuse-hair-loss-treatment/": ABOUT_VISUAL_02,
  "/dermatology/androgenetic-alopecia-treatment/": EQUIPMENT_VISUAL,
  "/dermatology/scalp-seborrhea-treatment/": ABOUT_VISUAL_06,

  "/cosmetology/injection/botulinum-therapy/": BOTOX_CASE_VISUAL,
  "/cosmetology/injection/lip-contouring/": LIPS_CASE_VISUAL,
  "/cosmetology/injection/face-contouring/": FACE_CASE_VISUAL,
  "/cosmetology/injection/biorevitalization/": INJECTION_VISUAL,
  "/cosmetology/hardware/ipl/": EQUIPMENT_VISUAL,
  "/cosmetology/hardware/microneedle-rf/": SERVICE_VISUAL,
  "/cosmetology/hardware/skin-diagnostics/": CONSULTATION_VISUAL,
  "/cosmetology/hardware/aquapure/": HOME_CARE_VISUAL,

  "/skin-problems/acne/": CONSULTATION_VISUAL,
  "/skin-problems/post-acne/": ABOUT_VISUAL_02,
  "/skin-problems/acne-scars/": ABOUT_VISUAL_03,
  "/skin-problems/couperose/": CONSULTATION_VISUAL,
  "/skin-problems/facial-rash/": ABOUT_VISUAL_06,
  "/skin-problems/itchy-scalp/": SERVICE_VISUAL,
  "/skin-problems/dandruff/": CONSULTATION_VISUAL,
  "/skin-problems/closed-comedones/": ABOUT_VISUAL_04,
  "/skin-problems/enlarged-pores/": CLEANING_VISUAL,
  "/skin-problems/oily-skin/": CARE_VISUAL,
  "/skin-problems/dark-spots/": ABOUT_VISUAL_05,
  "/skin-problems/spider-veins-face/": EQUIPMENT_VISUAL,
  "/skin-problems/sensitive-skin/": HOME_CARE_VISUAL,
  "/skin-problems/dehydrated-skin/": HOME_CARE_VISUAL,
  "/skin-problems/blackheads/": ABOUT_VISUAL_02,
  "/skin-problems/rash-around-mouth/": CONSULTATION_VISUAL,
  "/skin-problems/post-acne-red-marks/": ABOUT_VISUAL_06,
  "/skin-problems/skin-laxity/": HARDWARE_VISUAL,
  "/skin-problems/oily-scalp/": ABOUT_VISUAL_03,
  "/skin-problems/dry-scalp/": SERVICE_VISUAL,
  "/skin-problems/hair-thinning/": EQUIPMENT_VISUAL,

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

function pickSupportingDifferentFromHero(path: string, pool: readonly SeoLandingVisual[]) {
  const hero = seoLandingVisual(path);
  for (let offset = 1; offset <= pool.length; offset += 1) {
    const candidate = pick(path, pool, offset);
    if (candidate.src !== hero.src) return candidate;
  }
  return ABOUT_VISUAL;
}

export function seoLandingSupportingVisual(path: string): SeoLandingVisual {
  const priority = PRIORITY_SUPPORTING_VISUALS[path];
  if (priority && priority.src !== seoLandingVisual(path).src) return priority;

  if (path.startsWith("/cosmetology/injection/")) return pickSupportingDifferentFromHero(path, INJECTION_POOL);
  if (path.startsWith("/cosmetology/hardware/")) return pickSupportingDifferentFromHero(path, HARDWARE_POOL);
  if (path.startsWith("/nutrition/")) return pickSupportingDifferentFromHero(path, NUTRITION_POOL);

  if (includesAny(path, HAIR_SCALP_TOKENS)) return pickSupportingDifferentFromHero(path, HAIR_SCALP_POOL);
  if (includesAny(path, ACNE_CARE_TOKENS)) return pickSupportingDifferentFromHero(path, SKIN_CARE_POOL);
  if (includesAny(path, VASCULAR_PIGMENT_TOKENS)) return pickSupportingDifferentFromHero(path, VASCULAR_PIGMENT_POOL);
  if (includesAny(path, DERMATITIS_TOKENS)) return pickSupportingDifferentFromHero(path, CONSULTATION_POOL);
  if (includesAny(path, DRY_SENSITIVE_TOKENS)) return pickSupportingDifferentFromHero(path, SKIN_CARE_POOL);
  if (includesAny(path, DIAGNOSTIC_TOKENS)) return pickSupportingDifferentFromHero(path, HARDWARE_POOL);
  if (includesAny(path, TEXTURE_REJUVENATION_TOKENS)) return pickSupportingDifferentFromHero(path, HARDWARE_POOL);

  if (path.startsWith("/dermatology/")) return pickSupportingDifferentFromHero(path, CONSULTATION_POOL);
  if (path.startsWith("/skin-problems/")) return pickSupportingDifferentFromHero(path, [...SKIN_CARE_POOL, ...CONSULTATION_POOL]);
  if (path.startsWith("/cosmetology/")) return pickSupportingDifferentFromHero(path, [...HARDWARE_POOL, ...INJECTION_POOL]);

  return ABOUT_VISUAL;
}

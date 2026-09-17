import { ALL_SEO_LANDINGS } from "./seo-page-resolver";
import { SEO_WAVE4_LANDINGS } from "./seo-wave4-pages";

export type SeoMarketCluster =
  | "dermatology"
  | "acne-postacne"
  | "rosacea-vessels"
  | "pigmentation"
  | "trichology"
  | "injection"
  | "hardware"
  | "skin-care"
  | "nutrition"
  | "local-core";

export type SeoMarketAsset =
  | "money"
  | "problem"
  | "diagnostic"
  | "procedure"
  | "support"
  | "comparison"
  | "aftercare"
  | "local";

export type SeoMarketPriority = "P0" | "P1" | "P2" | "P3";
export type SeoMarketStatus =
  | "live"
  | "draft-review"
  | "planned"
  | "confirm-service"
  | "hold-cannibalization";

export type SeoMarketPage = {
  path: string;
  title: string;
  cluster: SeoMarketCluster;
  asset: SeoMarketAsset;
  priority: SeoMarketPriority;
  status: SeoMarketStatus;
  conversionPath: string;
  reviewRequired: boolean;
  notes?: string;
};

const p = (
  path: string,
  title: string,
  cluster: SeoMarketCluster,
  asset: SeoMarketAsset,
  priority: SeoMarketPriority,
  conversionPath: string,
  status: SeoMarketStatus = "planned",
  notes?: string,
): SeoMarketPage => ({
  path,
  title,
  cluster,
  asset,
  priority,
  status,
  conversionPath,
  reviewRequired: true,
  ...(notes ? { notes } : {}),
});

function clusterForExisting(path: string): SeoMarketCluster {
  if (path.startsWith("/nutrition/")) return "nutrition";
  if (path.includes("hair") || path.includes("trich")) return "trichology";
  if (path.includes("acne") || path.includes("comedon") || path.includes("post-acne")) return "acne-postacne";
  if (path.includes("rosacea") || path.includes("redness") || path.includes("couperose") || path.includes("vascular")) return "rosacea-vessels";
  if (path.includes("pigment") || path.includes("melasma") || path.includes("tone")) return "pigmentation";
  if (path.startsWith("/cosmetology/injection/")) return "injection";
  if (path.startsWith("/cosmetology/hardware/")) return "hardware";
  if (path.startsWith("/skin-care/")) return "skin-care";
  if (path.startsWith("/dermatology/") || path.startsWith("/skin-problems/")) return "dermatology";
  return "local-core";
}

function assetForExisting(type: string): SeoMarketAsset {
  if (type === "problem") return "problem";
  if (type === "procedure") return "procedure";
  if (type === "category") return "local";
  return "money";
}

const LIVE_PAGES: SeoMarketPage[] = ALL_SEO_LANDINGS.map((landing) => ({
  path: landing.path,
  title: landing.h1,
  cluster: clusterForExisting(landing.path),
  asset: assetForExisting(landing.type),
  priority: landing.priority >= 0.85 ? "P0" : landing.priority >= 0.7 ? "P1" : landing.priority >= 0.5 ? "P2" : "P3",
  status: "live",
  conversionPath: "/booking/",
  reviewRequired: false,
}));

const WAVE4_DRAFTS: SeoMarketPage[] = SEO_WAVE4_LANDINGS.map((landing) => ({
  path: landing.path,
  title: landing.h1,
  cluster: clusterForExisting(landing.path),
  asset: assetForExisting(landing.type),
  priority: "P1",
  status: "draft-review",
  conversionPath: "/booking/",
  reviewRequired: true,
  notes: "Content draft is prepared in code; publish only after explicit medical review.",
}));

const PLANNED_PAGES: SeoMarketPage[] = [
  // Dermatology: conditions, symptom intent and commercial consultation intent.
  p("/dermatology/eczema-treatment/", "Лікування екземи у Львові", "dermatology", "money", "P1", "/booking/"),
  p("/dermatology/contact-dermatitis-treatment/", "Лікування контактного дерматиту у Львові", "dermatology", "money", "P1", "/booking/"),
  p("/dermatology/urticaria-consultation/", "Кропив’янка: консультація дерматолога у Львові", "dermatology", "money", "P2", "/booking/", "confirm-service"),
  p("/dermatology/fungal-skin-infection-treatment/", "Грибкові ураження шкіри: консультація у Львові", "dermatology", "money", "P2", "/booking/", "confirm-service"),
  p("/dermatology/skin-rash-treatment/", "Лікування висипу на шкірі у Львові", "dermatology", "money", "P1", "/booking/"),
  p("/dermatology/itchy-skin-consultation/", "Свербіж шкіри: консультація дерматолога у Львові", "dermatology", "money", "P2", "/booking/"),
  p("/dermatology/viral-warts-treatment/", "Бородавки: консультація та лікування у Львові", "dermatology", "money", "P2", "/booking/", "confirm-service"),
  p("/dermatology/skin-tags-consultation/", "Папіломи та шкірні утворення: консультація у Львові", "dermatology", "money", "P2", "/booking/", "confirm-service"),
  p("/dermatology/seborrheic-keratosis-consultation/", "Себорейний кератоз: консультація дерматолога", "dermatology", "money", "P3", "/booking/", "confirm-service"),
  p("/dermatology/adult-acne-treatment/", "Лікування акне у дорослих у Львові", "acne-postacne", "money", "P1", "/dermatology/acne-treatment/", "hold-cannibalization", "Use only if GSC/SERP proves distinct intent from the main acne treatment page."),
  p("/dermatology/back-acne-treatment/", "Лікування акне на спині у Львові", "acne-postacne", "money", "P2", "/dermatology/acne-treatment/", "hold-cannibalization"),
  p("/dermatology/post-inflammatory-hyperpigmentation-treatment/", "Лікування постзапальної пігментації у Львові", "pigmentation", "money", "P1", "/booking/"),
  p("/dermatology/facial-redness-consultation/", "Почервоніння обличчя: консультація дерматолога", "rosacea-vessels", "diagnostic", "P1", "/booking/", "hold-cannibalization"),
  p("/dermatology/skin-check-lviv/", "Огляд шкіри та родимок у Львові", "dermatology", "diagnostic", "P1", "/dermatology/dermoscopy/", "hold-cannibalization"),

  // Problem pages: long-tail symptoms that can feed dermatology consultations.
  p("/skin-problems/closed-comedones/", "Закриті комедони: причини та що робити", "acne-postacne", "problem", "P1", "/dermatology/acne-treatment/"),
  p("/skin-problems/enlarged-pores/", "Розширені пори на обличчі", "skin-care", "problem", "P1", "/booking/"),
  p("/skin-problems/oily-skin/", "Жирна шкіра обличчя: причини та догляд", "skin-care", "problem", "P1", "/booking/"),
  p("/skin-problems/flaky-skin/", "Лущення шкіри обличчя", "dermatology", "problem", "P1", "/dermatology/dermatologist-lviv/"),
  p("/skin-problems/uneven-texture/", "Нерівна текстура шкіри обличчя", "skin-care", "problem", "P1", "/booking/"),
  p("/skin-problems/dull-skin/", "Тьмяна шкіра обличчя", "skin-care", "problem", "P2", "/booking/"),
  p("/skin-problems/dark-spots/", "Темні плями на обличчі", "pigmentation", "problem", "P1", "/dermatology/pigmentation-treatment/"),
  p("/skin-problems/post-inflammatory-pigmentation/", "Постзапальна пігментація", "pigmentation", "problem", "P1", "/dermatology/post-inflammatory-hyperpigmentation-treatment/"),
  p("/skin-problems/acne-scars/", "Рубці після акне", "acne-postacne", "problem", "P1", "/dermatology/post-acne-treatment/"),
  p("/skin-problems/atrophic-scars/", "Атрофічні рубці на обличчі", "acne-postacne", "problem", "P2", "/dermatology/post-acne-treatment/"),
  p("/skin-problems/forehead-acne/", "Акне на лобі", "acne-postacne", "problem", "P2", "/dermatology/acne-treatment/"),
  p("/skin-problems/chin-acne/", "Акне на підборідді", "acne-postacne", "problem", "P2", "/dermatology/acne-treatment/"),
  p("/skin-problems/back-acne/", "Акне на спині", "acne-postacne", "problem", "P2", "/dermatology/acne-treatment/"),
  p("/skin-problems/adult-acne/", "Акне у дорослих", "acne-postacne", "problem", "P1", "/dermatology/acne-treatment/"),
  p("/skin-problems/red-spots-face/", "Червоні плями на обличчі", "rosacea-vessels", "problem", "P1", "/dermatology/dermatologist-lviv/"),
  p("/skin-problems/spider-veins-face/", "Судинні зірочки на обличчі", "rosacea-vessels", "problem", "P1", "/cosmetology/hardware/ipl/"),
  p("/skin-problems/burning-skin/", "Печіння шкіри обличчя", "dermatology", "problem", "P2", "/dermatology/dermatologist-lviv/"),
  p("/skin-problems/peeling-skin/", "Шкіра обличчя лущиться: можливі причини", "dermatology", "problem", "P2", "/dermatology/dermatologist-lviv/"),

  // Trichology cluster.
  p("/dermatology/diffuse-hair-loss-treatment/", "Дифузне випадіння волосся: лікування у Львові", "trichology", "money", "P1", "/dermatology/trichologist-lviv/"),
  p("/dermatology/androgenetic-alopecia-treatment/", "Андрогенетична алопеція: консультація трихолога", "trichology", "money", "P1", "/dermatology/trichologist-lviv/"),
  p("/dermatology/telogen-effluvium-treatment/", "Телогенове випадіння волосся: діагностика і тактика", "trichology", "money", "P2", "/dermatology/trichologist-lviv/"),
  p("/dermatology/alopecia-areata-consultation/", "Осередкова алопеція: консультація у Львові", "trichology", "money", "P2", "/dermatology/trichologist-lviv/", "confirm-service"),
  p("/dermatology/postpartum-hair-loss-treatment/", "Випадіння волосся після пологів: консультація трихолога", "trichology", "money", "P2", "/dermatology/trichologist-lviv/"),
  p("/dermatology/scalp-seborrhea-treatment/", "Себорея шкіри голови: консультація трихолога", "trichology", "money", "P1", "/dermatology/trichologist-lviv/"),
  p("/dermatology/scalp-folliculitis-treatment/", "Фолікуліт шкіри голови: консультація дерматолога", "trichology", "money", "P2", "/dermatology/trichologist-lviv/"),
  p("/dermatology/hair-loss-diagnostics/", "Діагностика випадіння волосся у Львові", "trichology", "diagnostic", "P0", "/dermatology/trichoscopy/"),
  p("/dermatology/scalp-diagnostics/", "Діагностика шкіри голови у Львові", "trichology", "diagnostic", "P1", "/dermatology/trichoscopy/"),
  p("/dermatology/mesotherapy-hair/", "Мезотерапія волосистої частини голови у Львові", "trichology", "procedure", "P2", "/booking/", "confirm-service"),
  p("/skin-problems/oily-scalp/", "Жирна шкіра голови", "trichology", "problem", "P1", "/dermatology/trichologist-lviv/"),
  p("/skin-problems/dry-scalp/", "Суха шкіра голови", "trichology", "problem", "P1", "/dermatology/trichologist-lviv/"),
  p("/skin-problems/hair-thinning/", "Порідіння волосся", "trichology", "problem", "P1", "/dermatology/trichologist-lviv/"),
  p("/skin-problems/hair-breakage/", "Ламкість волосся: коли потрібен трихолог", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),
  p("/skin-problems/postpartum-hair-loss/", "Випадіння волосся після пологів", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),
  p("/skin-problems/stress-hair-loss/", "Випадіння волосся після стресу", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),

  // Injection cosmetology. Zone pages are held until cannibalization is validated.
  p("/cosmetology/injection/lip-augmentation/", "Збільшення губ у Львові", "injection", "procedure", "P0", "/cosmetology/injection/lip-contouring/", "hold-cannibalization", "Likely synonym intent with lip-contouring; validate in GSC before separate indexation."),
  p("/cosmetology/injection/lip-asymmetry-correction/", "Корекція асиметрії губ у Львові", "injection", "procedure", "P2", "/cosmetology/injection/lip-contouring/"),
  p("/cosmetology/injection/chin-contouring/", "Контурна пластика підборіддя у Львові", "injection", "procedure", "P1", "/cosmetology/injection/face-contouring/"),
  p("/cosmetology/injection/cheekbone-contouring/", "Контурна пластика вилиць у Львові", "injection", "procedure", "P1", "/cosmetology/injection/face-contouring/"),
  p("/cosmetology/injection/jawline-contouring/", "Контур нижньої щелепи філерами у Львові", "injection", "procedure", "P2", "/cosmetology/injection/face-contouring/"),
  p("/cosmetology/injection/nasolabial-folds-filler/", "Корекція носогубних складок філером", "injection", "procedure", "P2", "/cosmetology/injection/face-contouring/"),
  p("/cosmetology/injection/botulinum-forehead/", "Ботулінотерапія лоба у Львові", "injection", "procedure", "P1", "/cosmetology/injection/botulinum-therapy/", "hold-cannibalization"),
  p("/cosmetology/injection/botulinum-glabella/", "Ботулінотерапія міжбрів’я у Львові", "injection", "procedure", "P2", "/cosmetology/injection/botulinum-therapy/", "hold-cannibalization"),
  p("/cosmetology/injection/botulinum-crows-feet/", "Ботулінотерапія зони навколо очей", "injection", "procedure", "P2", "/cosmetology/injection/botulinum-therapy/", "hold-cannibalization"),
  p("/cosmetology/injection/botulinum-full-face/", "Full Face ботулінотерапія у Львові", "injection", "procedure", "P2", "/cosmetology/injection/botulinum-therapy/", "hold-cannibalization"),
  p("/cosmetology/injection/botulinum-masseter/", "Ботулінотерапія жувальних м’язів у Львові", "injection", "procedure", "P1", "/cosmetology/injection/botulinum-therapy/"),
  p("/cosmetology/injection/botulinum-platysma/", "Ботулінотерапія платизми у Львові", "injection", "procedure", "P2", "/cosmetology/injection/botulinum-therapy/"),
  p("/cosmetology/injection/botulinum-gummy-smile/", "Корекція ясенної посмішки ботулінотерапією", "injection", "procedure", "P3", "/cosmetology/injection/botulinum-therapy/", "confirm-service"),
  p("/cosmetology/injection/polynucleotides-under-eyes/", "Полінуклеотиди під очі у Львові", "injection", "procedure", "P1", "/cosmetology/injection/polynucleotides/"),
  p("/cosmetology/injection/polynucleotides-face/", "Полінуклеотиди для обличчя у Львові", "injection", "procedure", "P2", "/cosmetology/injection/polynucleotides/", "hold-cannibalization"),
  p("/cosmetology/injection/biorevitalization-under-eyes/", "Біоревіталізація зони навколо очей", "injection", "procedure", "P2", "/cosmetology/injection/biorevitalization/"),
  p("/cosmetology/injection/biorevitalization-neck-decollete/", "Біоревіталізація шиї та декольте", "injection", "procedure", "P2", "/cosmetology/injection/biorevitalization/"),
  p("/cosmetology/injection/mesotherapy-face/", "Мезотерапія обличчя у Львові", "injection", "procedure", "P1", "/cosmetology/injection/mesotherapy/", "hold-cannibalization"),

  // Hardware / care procedures.
  p("/cosmetology/hardware/photorejuvenation/", "Фотоомолодження IPL у Львові", "hardware", "procedure", "P0", "/cosmetology/hardware/ipl/", "hold-cannibalization", "Likely same intent as IPL. Prefer a strong section unless SERP/GSC proves separation."),
  p("/cosmetology/hardware/vascular-treatment-face/", "Видалення судин на обличчі у Львові", "rosacea-vessels", "procedure", "P0", "/cosmetology/hardware/ipl/", "confirm-service"),
  p("/cosmetology/hardware/couperose-ipl/", "IPL при куперозі у Львові", "rosacea-vessels", "procedure", "P1", "/cosmetology/hardware/ipl/"),
  p("/cosmetology/hardware/pigmentation-ipl/", "IPL від пігментації у Львові", "pigmentation", "procedure", "P1", "/cosmetology/hardware/ipl/"),
  p("/cosmetology/hardware/acne-ipl/", "IPL при акне: консультація та показання", "acne-postacne", "procedure", "P2", "/cosmetology/hardware/ipl/", "confirm-service"),
  p("/cosmetology/hardware/microneedle-rf-face/", "Мікроголковий RF обличчя у Львові", "hardware", "procedure", "P1", "/cosmetology/hardware/microneedle-rf/", "hold-cannibalization"),
  p("/cosmetology/hardware/microneedle-rf-neck/", "Мікроголковий RF шиї та декольте", "hardware", "procedure", "P2", "/cosmetology/hardware/microneedle-rf/"),
  p("/cosmetology/hardware/microneedle-rf-post-acne/", "Мікроголковий RF при постакне у Львові", "acne-postacne", "procedure", "P1", "/dermatology/post-acne-treatment/"),
  p("/cosmetology/hardware/microneedle-rf-scars/", "Мікроголковий RF для рубців", "hardware", "procedure", "P2", "/cosmetology/hardware/microneedle-rf/"),
  p("/cosmetology/hardware/facial-cleansing/", "Чистка обличчя у Львові", "skin-care", "procedure", "P0", "/booking/", "confirm-service"),
  p("/cosmetology/hardware/combined-facial-cleansing/", "Комбінована чистка обличчя у Львові", "skin-care", "procedure", "P1", "/booking/", "confirm-service"),
  p("/cosmetology/hardware/ultrasonic-facial-cleansing/", "Ультразвукова чистка обличчя у Львові", "skin-care", "procedure", "P2", "/booking/", "confirm-service"),
  p("/cosmetology/hardware/chemical-peeling/", "Хімічний пілінг обличчя у Львові", "skin-care", "procedure", "P1", "/booking/", "confirm-service"),
  p("/cosmetology/hardware/prx-t33/", "PRX-T33 у Львові", "skin-care", "procedure", "P2", "/booking/", "confirm-service"),
  p("/cosmetology/hardware/skin-analysis-lviv/", "Апаратна діагностика шкіри у Львові", "hardware", "diagnostic", "P0", "/cosmetology/hardware/skin-diagnostics/", "hold-cannibalization"),
  p("/cosmetology/hardware/aquapure-facial-cleansing/", "AquaPure чистка обличчя у Львові", "hardware", "procedure", "P1", "/cosmetology/hardware/aquapure/", "hold-cannibalization"),

  // Nutrition / deficiency intent. Commercial treatment claims require medical review.
  p("/nutrition/iron-deficiency/", "Дефіцит заліза: консультація нутриціолога", "nutrition", "money", "P1", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/vitamin-d-deficiency/", "Дефіцит вітаміну D: консультація у Львові", "nutrition", "money", "P2", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/vitamin-b12-deficiency/", "Дефіцит вітаміну B12: консультація", "nutrition", "money", "P2", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/low-ferritin/", "Низький феритин: коли потрібна консультація", "nutrition", "money", "P1", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/fatigue-deficiencies/", "Втома та можливі дефіцити: діагностичний маршрут", "nutrition", "diagnostic", "P2", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/hair-loss-deficiencies/", "Випадіння волосся та нутрієнтні дефіцити", "nutrition", "diagnostic", "P1", "/nutrition/deficiency-diagnostics/"),
  p("/nutrition/skin-nutrition-consultation/", "Харчування та стан шкіри: консультація нутриціолога", "nutrition", "money", "P2", "/nutrition/nutritionist-lviv/"),
  p("/nutrition/lab-results-consultation/", "Розбір аналізів із нутриціологом у Львові", "nutrition", "money", "P2", "/nutrition/nutritionist-lviv/", "confirm-service"),

  // Support / editorial pages. These capture long-tail informational queries and feed money pages.
  p("/blog/akne-u-doroslykh-prychyny/", "Акне у дорослих: чому з’являється після 25 років", "acne-postacne", "support", "P0", "/dermatology/acne-treatment/"),
  p("/blog/zakryti-komedony-prychyny/", "Закриті комедони: чому з’являються", "acne-postacne", "support", "P0", "/skin-problems/closed-comedones/"),
  p("/blog/akne-na-pidboriddi/", "Акне на підборідді: можливі причини", "acne-postacne", "support", "P1", "/dermatology/acne-treatment/"),
  p("/blog/akne-na-lobi/", "Акне на лобі: причини та помилки догляду", "acne-postacne", "support", "P1", "/dermatology/acne-treatment/"),
  p("/blog/akne-na-spyni/", "Акне на спині: чому виникає", "acne-postacne", "support", "P1", "/dermatology/acne-treatment/"),
  p("/blog/postakne-pliamy-chy-rubtsi/", "Постакне: плями чи рубці — у чому різниця", "acne-postacne", "comparison", "P0", "/dermatology/post-acne-treatment/"),
  p("/blog/chystka-oblychchia-pry-akne/", "Чи можна робити чистку обличчя при акне", "acne-postacne", "support", "P1", "/dermatology/acne-treatment/"),
  p("/blog/akne-i-kharchuvannia/", "Акне та харчування: що відомо", "acne-postacne", "support", "P2", "/dermatology/acne-treatment/"),

  p("/blog/kuperoz-chy-rozatsea/", "Купероз чи розацеа: у чому різниця", "rosacea-vessels", "comparison", "P0", "/skin-problems/rosacea/"),
  p("/blog/rozatsea-tryhery/", "Тригери розацеа: що може посилювати почервоніння", "rosacea-vessels", "support", "P1", "/dermatology/rosacea-treatment/"),
  p("/blog/dohliad-pry-rozatsea/", "Догляд за шкірою при розацеа", "rosacea-vessels", "support", "P1", "/dermatology/rosacea-treatment/"),
  p("/blog/ipl-pry-rozatsea/", "IPL при розацеа: коли метод може розглядатися", "rosacea-vessels", "support", "P1", "/cosmetology/hardware/ipl/"),
  p("/blog/chomu-chervoniie-oblychchia/", "Чому червоніє обличчя", "rosacea-vessels", "support", "P1", "/dermatology/dermatologist-lviv/"),
  p("/blog/sudynni-zirochky-na-oblychchi/", "Судинні зірочки на обличчі: причини та корекція", "rosacea-vessels", "support", "P1", "/cosmetology/hardware/ipl/"),

  p("/blog/melazma-chy-pihmentatsiia/", "Мелазма чи пігментація: як відрізняються", "pigmentation", "comparison", "P0", "/dermatology/pigmentation-treatment/"),
  p("/blog/postzapalna-pihmentatsiia/", "Постзапальна пігментація після акне", "pigmentation", "support", "P1", "/dermatology/post-inflammatory-hyperpigmentation-treatment/"),
  p("/blog/soniachni-pliamy-na-oblychchi/", "Сонячні плями на обличчі", "pigmentation", "support", "P1", "/dermatology/pigmentation-treatment/"),
  p("/blog/spf-pry-pihmentatsii/", "SPF при пігментації: чому фотозахист важливий", "pigmentation", "support", "P1", "/dermatology/pigmentation-treatment/"),
  p("/blog/ipl-chy-pilinh-pihmentatsiia/", "IPL чи пілінг при пігментації", "pigmentation", "comparison", "P2", "/dermatology/pigmentation-treatment/"),

  p("/blog/koli-zvertatysia-do-dermatoloha/", "Коли варто звертатися до дерматолога", "dermatology", "support", "P0", "/dermatology/dermatologist-lviv/"),
  p("/blog/dermatoskopiia-shcho-pokazuie/", "Дерматоскопія: що показує обстеження", "dermatology", "support", "P0", "/dermatology/dermoscopy/"),
  p("/blog/rodymka-zminylasia-shcho-robyty/", "Родимка змінилася: коли потрібен огляд", "dermatology", "support", "P0", "/dermatology/dermoscopy/"),
  p("/blog/yak-chasto-pereviriaty-rodymky/", "Як часто перевіряти родимки", "dermatology", "support", "P1", "/dermatology/dermoscopy/"),
  p("/blog/atopichnyi-dermatyt-dohliad/", "Догляд при атопічному дерматиті", "dermatology", "support", "P1", "/dermatology/dermatitis/atopic-dermatitis-treatment/"),
  p("/blog/kontaktnyi-chy-atopichnyi-dermatyt/", "Контактний чи атопічний дерматит", "dermatology", "comparison", "P2", "/dermatology/dermatitis/"),
  p("/blog/seboreinyi-dermatyt-chy-lupa/", "Себорейний дерматит чи лупа", "dermatology", "comparison", "P0", "/dermatology/dermatitis/seborrheic-dermatitis-treatment/"),
  p("/blog/chomu-lushchytsia-shkira-oblychchia/", "Чому лущиться шкіра обличчя", "dermatology", "support", "P1", "/dermatology/dermatologist-lviv/"),

  p("/blog/trykhoskopiia-pry-vypadinni-volossia/", "Трихоскопія при випадінні волосся", "trichology", "support", "P0", "/dermatology/trichoscopy/"),
  p("/blog/skilky-volossia-normalno-vypadaie/", "Скільки волосся нормально втрачається за день", "trichology", "support", "P1", "/dermatology/trichologist-lviv/"),
  p("/blog/dyfuzne-chy-androhenetychne-vypadinnia/", "Дифузне чи андрогенетичне випадіння волосся", "trichology", "comparison", "P1", "/dermatology/trichologist-lviv/"),
  p("/blog/vypadinnia-volossia-pislia-polohiv/", "Випадіння волосся після пологів", "trichology", "support", "P1", "/dermatology/trichologist-lviv/"),
  p("/blog/ferrytin-i-vypadinnia-volossia/", "Феритин і випадіння волосся", "trichology", "support", "P1", "/nutrition/deficiency-diagnostics/"),
  p("/blog/vypadinnia-volossia-pislia-stresu/", "Випадіння волосся після стресу", "trichology", "support", "P1", "/dermatology/trichologist-lviv/"),
  p("/blog/zhyrna-shkira-holovy/", "Жирна шкіра голови: можливі причини", "trichology", "support", "P2", "/dermatology/trichologist-lviv/"),
  p("/blog/lupa-chy-seboreinyi-dermatyt/", "Лупа чи себорейний дерматит", "trichology", "comparison", "P1", "/dermatology/trichologist-lviv/"),

  p("/blog/botoks-vpershe/", "Ботулінотерапія вперше: що варто знати", "injection", "support", "P0", "/cosmetology/injection/botulinum-therapy/"),
  p("/blog/pislia-botoksu-shcho-ne-mozhna/", "Після ботулінотерапії: що не варто робити", "injection", "aftercare", "P0", "/cosmetology/injection/botulinum-therapy/"),
  p("/blog/botoks-chy-filery/", "Ботулінотерапія чи філери: у чому різниця", "injection", "comparison", "P0", "/cosmetology/injection/botulinum-therapy/"),
  p("/blog/zbilshennia-hub-vpershe/", "Збільшення губ вперше: підготовка до процедури", "injection", "support", "P0", "/cosmetology/injection/lip-contouring/"),
  p("/blog/nabriak-pislia-zbilshennia-hub/", "Набряк після збільшення губ: що очікувати", "injection", "aftercare", "P1", "/cosmetology/injection/lip-contouring/"),
  p("/blog/biorevitalizatsiia-chy-mezoterapiia/", "Біоревіталізація чи мезотерапія", "injection", "comparison", "P0", "/cosmetology/injection/biorevitalization/"),
  p("/blog/polinukleotydy-shcho-tse/", "Полінуклеотиди в косметології: що це", "injection", "support", "P1", "/cosmetology/injection/polynucleotides/"),

  p("/blog/mikroholkovyi-rf-vidnovlennia/", "Мікроголковий RF: відновлення після процедури", "hardware", "aftercare", "P0", "/cosmetology/hardware/microneedle-rf/"),
  p("/blog/rf-chy-lazerne-shlifuvannia/", "Мікроголковий RF чи лазерне шліфування", "hardware", "comparison", "P1", "/cosmetology/hardware/microneedle-rf/"),
  p("/blog/ipl-chy-lazer/", "IPL чи лазер: у чому різниця", "hardware", "comparison", "P0", "/cosmetology/hardware/ipl/"),
  p("/blog/koli-robyty-ipl/", "Коли краще робити IPL", "hardware", "support", "P1", "/cosmetology/hardware/ipl/"),
  p("/blog/diahnostyka-shkiry-shcho-pokazuie/", "Апаратна діагностика шкіри: що показує", "hardware", "support", "P0", "/cosmetology/hardware/skin-diagnostics/"),
  p("/blog/vydy-chystky-oblychchia/", "Види чистки обличчя: як відрізняються", "skin-care", "comparison", "P1", "/cosmetology/hardware/facial-cleansing/"),
  p("/blog/khimichnyi-pilinh-yak-obraty/", "Хімічний пілінг: як обирають метод", "skin-care", "support", "P2", "/cosmetology/hardware/chemical-peeling/"),

  p("/blog/yaki-defitsyty-pereviriaty/", "Які дефіцити обговорити з лікарем при втомі", "nutrition", "support", "P1", "/nutrition/deficiency-diagnostics/"),
  p("/blog/nyzkyi-ferrytin-shcho-oznachaie/", "Низький феритин: що може означати", "nutrition", "support", "P0", "/nutrition/low-ferritin/"),
  p("/blog/defitsyt-vitaminu-d/", "Дефіцит вітаміну D: що варто знати", "nutrition", "support", "P1", "/nutrition/vitamin-d-deficiency/"),
  p("/blog/defitsyt-vitaminu-b12/", "Дефіцит вітаміну B12: базова інформація", "nutrition", "support", "P2", "/nutrition/vitamin-b12-deficiency/"),
  p("/blog/insulinorezystentnist-shcho-tse/", "Інсулінорезистентність: що це означає", "nutrition", "support", "P0", "/nutrition/insulin-resistance/"),

  // Broad local intents: research/hold until cannibalization is proven safe.
  p("/dermatology/dermatologist-cosmetologist-lviv/", "Дерматолог-косметолог у Львові", "local-core", "local", "P1", "/dermatology/dermatologist-lviv/", "hold-cannibalization"),
  p("/cosmetology/cosmetologist-doctor-lviv/", "Лікар-косметолог у Львові", "local-core", "local", "P0", "/doctors/", "hold-cannibalization"),
  p("/cosmetology/aesthetic-medicine-clinic-lviv/", "Клініка естетичної медицини у Львові", "local-core", "local", "P1", "/", "hold-cannibalization"),
  p("/dermatology/acne-clinic-lviv/", "Клініка лікування акне у Львові", "acne-postacne", "local", "P1", "/dermatology/acne-treatment/", "hold-cannibalization"),
  p("/dermatology/trichology-clinic-lviv/", "Клініка трихології у Львові", "trichology", "local", "P1", "/dermatology/trichologist-lviv/", "hold-cannibalization"),
];

const merged = new Map<string, SeoMarketPage>();
for (const item of [...PLANNED_PAGES, ...WAVE4_DRAFTS, ...LIVE_PAGES]) merged.set(item.path, item);

export const SEO_MARKET_MAP = [...merged.values()].sort((a, b) => {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 } as const;
  const statusOrder: Record<SeoMarketStatus, number> = {
    live: 0,
    "draft-review": 1,
    planned: 2,
    "confirm-service": 3,
    "hold-cannibalization": 4,
  };
  return priorityOrder[a.priority] - priorityOrder[b.priority] || statusOrder[a.status] - statusOrder[b.status] || a.path.localeCompare(b.path);
});

export const SEO_MARKET_STATS = {
  total: SEO_MARKET_MAP.length,
  live: SEO_MARKET_MAP.filter((item) => item.status === "live").length,
  drafts: SEO_MARKET_MAP.filter((item) => item.status === "draft-review").length,
  planned: SEO_MARKET_MAP.filter((item) => item.status === "planned").length,
  confirmService: SEO_MARKET_MAP.filter((item) => item.status === "confirm-service").length,
  cannibalizationHold: SEO_MARKET_MAP.filter((item) => item.status === "hold-cannibalization").length,
  p0p1: SEO_MARKET_MAP.filter((item) => item.priority === "P0" || item.priority === "P1").length,
};

export const SEO_MARKET_CLUSTERS = Object.entries(
  SEO_MARKET_MAP.reduce<Record<string, number>>((acc, item) => {
    acc[item.cluster] = (acc[item.cluster] || 0) + 1;
    return acc;
  }, {}),
).sort((a, b) => b[1] - a[1]);

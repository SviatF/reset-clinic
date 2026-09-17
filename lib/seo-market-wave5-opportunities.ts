import type { SeoMarketPage } from "./seo-market-map";

const opportunity = (
  path: string,
  title: string,
  cluster: SeoMarketPage["cluster"],
  asset: SeoMarketPage["asset"],
  priority: SeoMarketPage["priority"],
  conversionPath: string,
  status: SeoMarketPage["status"] = "planned",
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

/**
 * Wave 5 is research inventory, not a publication list.
 * Nothing in this file is automatically added to ALL_SEO_LANDINGS or sitemap.
 * Medical claims/services marked confirm-service require clinic confirmation first.
 * Pages marked hold-cannibalization need GSC/SERP intent separation before indexation.
 */
export const SEO_WAVE5_OPPORTUNITIES: SeoMarketPage[] = [
  // Dermatology — additional condition / consultation intent.
  opportunity("/dermatology/psoriasis-consultation/", "Псоріаз: консультація дерматолога у Львові", "dermatology", "money", "P1", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/perioral-dermatitis-treatment/", "Періоральний дерматит: консультація у Львові", "dermatology", "money", "P1", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/seborrheic-dermatitis-face-treatment/", "Себорейний дерматит обличчя: консультація у Львові", "dermatology", "money", "P1", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/adult-atopic-dermatitis/", "Атопічний дерматит у дорослих: консультація у Львові", "dermatology", "money", "P2", "/dermatology/dermatologist-lviv/", "hold-cannibalization", "Separate only if intent differs materially from the existing atopic dermatitis landing."),
  opportunity("/dermatology/hand-eczema-treatment/", "Екзема кистей рук: консультація дерматолога", "dermatology", "money", "P2", "/dermatology/eczema-treatment/", "hold-cannibalization"),
  opportunity("/dermatology/dyshidrotic-eczema-consultation/", "Дисгідротична екзема: консультація дерматолога", "dermatology", "money", "P3", "/dermatology/eczema-treatment/", "confirm-service"),
  opportunity("/dermatology/tinea-versicolor-consultation/", "Різнокольоровий лишай: консультація дерматолога", "dermatology", "money", "P3", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/nail-fungus-consultation/", "Грибок нігтів: консультація дерматолога у Львові", "dermatology", "money", "P2", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/vitiligo-consultation/", "Вітиліго: консультація дерматолога у Львові", "dermatology", "money", "P2", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/demodicosis-consultation/", "Демодекоз: консультація дерматолога у Львові", "dermatology", "money", "P2", "/dermatology/dermatologist-lviv/", "confirm-service"),
  opportunity("/dermatology/mole-check-consultation/", "Перевірка родимок у Львові", "dermatology", "diagnostic", "P0", "/dermatology/dermoscopy/", "hold-cannibalization", "Likely belongs as a strong intent section on dermoscopy unless SERP/GSC shows a distinct result set."),
  opportunity("/dermatology/suspicious-mole-consultation/", "Підозріла родимка: огляд дерматолога у Львові", "dermatology", "diagnostic", "P1", "/dermatology/dermoscopy/", "hold-cannibalization"),

  // Skin problems — informational/problem intent feeding medical or cosmetic money pages.
  opportunity("/skin-problems/sensitive-skin/", "Чутлива шкіра обличчя: причини та догляд", "skin-care", "problem", "P1", "/booking/"),
  opportunity("/skin-problems/dehydrated-skin/", "Зневоднена шкіра обличчя", "skin-care", "problem", "P1", "/booking/"),
  opportunity("/skin-problems/blackheads/", "Чорні цятки на обличчі", "skin-care", "problem", "P1", "/booking/"),
  opportunity("/skin-problems/whiteheads/", "Білі комедони на обличчі", "acne-postacne", "problem", "P2", "/skin-problems/closed-comedones/", "hold-cannibalization"),
  opportunity("/skin-problems/milia/", "Міліуми на обличчі", "skin-care", "problem", "P2", "/booking/", "confirm-service"),
  opportunity("/skin-problems/rash-around-mouth/", "Висип навколо рота", "dermatology", "problem", "P1", "/dermatology/dermatologist-lviv/"),
  opportunity("/skin-problems/itchy-face/", "Свербіж шкіри обличчя", "dermatology", "problem", "P2", "/dermatology/dermatologist-lviv/"),
  opportunity("/skin-problems/post-acne-red-marks/", "Червоні плями після акне", "acne-postacne", "problem", "P1", "/dermatology/post-acne-treatment/"),
  opportunity("/skin-problems/skin-laxity/", "Втрата пружності шкіри обличчя", "hardware", "problem", "P1", "/cosmetology/hardware/microneedle-rf/"),
  opportunity("/skin-problems/forehead-wrinkles/", "Зморшки на лобі", "injection", "problem", "P1", "/cosmetology/injection/botulinum-therapy/"),
  opportunity("/skin-problems/crows-feet/", "Зморшки навколо очей", "injection", "problem", "P1", "/cosmetology/injection/botulinum-therapy/"),
  opportunity("/skin-problems/nasolabial-folds/", "Носогубні складки", "injection", "problem", "P1", "/cosmetology/injection/face-contouring/"),
  opportunity("/skin-problems/marionette-lines/", "Зморшки маріонетки", "injection", "problem", "P2", "/cosmetology/injection/face-contouring/"),
  opportunity("/skin-problems/dark-circles-under-eyes/", "Темні кола під очима", "skin-care", "problem", "P1", "/booking/", "confirm-service"),

  // Trichology — gender, pattern and trigger-specific intent.
  opportunity("/dermatology/hair-loss-women/", "Випадіння волосся у жінок: консультація трихолога у Львові", "trichology", "money", "P1", "/dermatology/trichologist-lviv/", "hold-cannibalization"),
  opportunity("/dermatology/hair-loss-men/", "Випадіння волосся у чоловіків: консультація трихолога", "trichology", "money", "P2", "/dermatology/trichologist-lviv/", "hold-cannibalization"),
  opportunity("/dermatology/seasonal-hair-loss/", "Сезонне випадіння волосся: консультація трихолога", "trichology", "money", "P2", "/dermatology/trichologist-lviv/"),
  opportunity("/dermatology/hair-loss-after-illness/", "Випадіння волосся після хвороби: консультація трихолога", "trichology", "money", "P2", "/dermatology/trichologist-lviv/"),
  opportunity("/dermatology/traction-alopecia-consultation/", "Тракційна алопеція: консультація трихолога", "trichology", "money", "P3", "/dermatology/trichologist-lviv/", "confirm-service"),
  opportunity("/dermatology/scalp-psoriasis-consultation/", "Псоріаз шкіри голови: консультація у Львові", "trichology", "money", "P2", "/dermatology/trichologist-lviv/", "confirm-service"),
  opportunity("/skin-problems/slow-hair-growth/", "Повільний ріст волосся", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),
  opportunity("/skin-problems/frontal-hair-thinning/", "Порідіння волосся у лобній зоні", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),
  opportunity("/skin-problems/receding-hairline/", "Волосся рідшає біля скронь", "trichology", "problem", "P2", "/dermatology/trichologist-lviv/"),

  // Injection cosmetology — new high-intent procedure/zone opportunities.
  opportunity("/cosmetology/injection/hyperhidrosis-botulinum/", "Ботулінотерапія гіпергідрозу у Львові", "injection", "procedure", "P1", "/cosmetology/injection/botulinum-therapy/", "confirm-service"),
  opportunity("/cosmetology/injection/filler-dissolving/", "Розчинення філера гіалуронідазою у Львові", "injection", "procedure", "P1", "/booking/", "confirm-service"),
  opportunity("/cosmetology/injection/tear-trough-filler/", "Корекція носослізної борозни філером у Львові", "injection", "procedure", "P2", "/cosmetology/injection/face-contouring/", "confirm-service"),
  opportunity("/cosmetology/injection/marionette-lines-filler/", "Корекція зморшок маріонетки філером", "injection", "procedure", "P2", "/cosmetology/injection/face-contouring/", "confirm-service"),
  opportunity("/cosmetology/injection/biorevitalization-hands/", "Біоревіталізація рук у Львові", "injection", "procedure", "P2", "/cosmetology/injection/biorevitalization/", "confirm-service"),
  opportunity("/cosmetology/injection/mesotherapy-under-eyes/", "Мезотерапія зони навколо очей", "injection", "procedure", "P2", "/cosmetology/injection/mesotherapy/", "confirm-service"),
  opportunity("/cosmetology/injection/collagen-stimulation/", "Колагеностимуляція обличчя у Львові", "injection", "procedure", "P1", "/booking/", "confirm-service"),
  opportunity("/cosmetology/injection/polylactic-acid/", "Полімолочна кислота у косметології Львів", "injection", "procedure", "P2", "/booking/", "confirm-service"),
  opportunity("/cosmetology/injection/calcium-hydroxylapatite/", "Гідроксиапатит кальцію у косметології Львів", "injection", "procedure", "P3", "/booking/", "confirm-service"),

  // Hardware / care — intent variants that competitors actively expose.
  opportunity("/cosmetology/hardware/ipl-facial-redness/", "IPL від почервоніння обличчя у Львові", "rosacea-vessels", "procedure", "P1", "/cosmetology/hardware/ipl/", "hold-cannibalization"),
  opportunity("/cosmetology/hardware/ipl-sun-spots/", "IPL від сонячних плям у Львові", "pigmentation", "procedure", "P2", "/cosmetology/hardware/ipl/", "hold-cannibalization"),
  opportunity("/cosmetology/hardware/microneedle-rf-pores/", "Мікроголковий RF при розширених порах", "hardware", "procedure", "P1", "/cosmetology/hardware/microneedle-rf/", "hold-cannibalization"),
  opportunity("/cosmetology/hardware/microneedle-rf-skin-tightening/", "Мікроголковий RF для пружності шкіри", "hardware", "procedure", "P2", "/cosmetology/hardware/microneedle-rf/", "hold-cannibalization"),
  opportunity("/cosmetology/hardware/led-acne/", "LED-терапія при акне у Львові", "hardware", "procedure", "P2", "/booking/", "confirm-service"),
  opportunity("/cosmetology/hardware/led-recovery/", "LED-терапія для відновлення шкіри", "hardware", "procedure", "P3", "/booking/", "confirm-service"),
  opportunity("/cosmetology/hardware/hydropeeling/", "Гідропілінг обличчя у Львові", "skin-care", "procedure", "P2", "/cosmetology/hardware/aquapure/", "hold-cannibalization"),
  opportunity("/cosmetology/hardware/peeling-acne/", "Пілінг при акне у Львові", "acne-postacne", "procedure", "P2", "/dermatology/acne-treatment/", "confirm-service"),
  opportunity("/cosmetology/hardware/peeling-pigmentation/", "Пілінг при пігментації у Львові", "pigmentation", "procedure", "P2", "/dermatology/pigmentation-treatment/", "confirm-service"),

  // Nutrition — supportive intent; avoid disease-treatment claims.
  opportunity("/nutrition/zinc-deficiency/", "Дефіцит цинку: консультація та оцінка раціону", "nutrition", "diagnostic", "P2", "/nutrition/deficiency-diagnostics/", "confirm-service"),
  opportunity("/nutrition/protein-deficiency-hair/", "Недостатнє споживання білка та стан волосся", "nutrition", "support", "P2", "/nutrition/nutritionist-lviv/"),
  opportunity("/nutrition/nutrition-acne/", "Харчування при акне: консультація нутриціолога", "nutrition", "money", "P2", "/nutrition/nutritionist-lviv/", "confirm-service"),
  opportunity("/nutrition/nutrition-hair-loss/", "Харчування при випадінні волосся: консультація", "nutrition", "money", "P2", "/nutrition/nutritionist-lviv/", "hold-cannibalization"),

  // Editorial support — low-risk long-tail pages that strengthen hubs.
  opportunity("/blog/perioralnyi-dermatyt-shcho-tse/", "Періоральний дерматит: що це і коли звертатися до лікаря", "dermatology", "support", "P1", "/dermatology/dermatologist-lviv/"),
  opportunity("/blog/psoriaz-chy-seboreinyi-dermatyt/", "Псоріаз чи себорейний дерматит шкіри голови", "trichology", "comparison", "P1", "/dermatology/trichologist-lviv/"),
  opportunity("/blog/chorni-tsiatky-chy-komedony/", "Чорні цятки чи комедони: у чому різниця", "acne-postacne", "comparison", "P1", "/skin-problems/closed-comedones/"),
  opportunity("/blog/chutlyva-chy-znevodnena-shkira/", "Чутлива чи зневоднена шкіра: як відрізняються", "skin-care", "comparison", "P1", "/booking/"),
  opportunity("/blog/chomu-vypadaye-volossia-u-zhinok/", "Чому випадає волосся у жінок: основні групи причин", "trichology", "support", "P0", "/dermatology/trichologist-lviv/"),
  opportunity("/blog/vypadinnia-volossia-pislia-khvoroby/", "Випадіння волосся після хвороби: коли звертатися до трихолога", "trichology", "support", "P1", "/dermatology/trichologist-lviv/"),
  opportunity("/blog/hiperhidroz-botulinoterapiia/", "Ботулінотерапія при гіпергідрозі: що варто знати", "injection", "support", "P2", "/cosmetology/injection/botulinum-therapy/", "confirm-service"),
  opportunity("/blog/rozchynennia-filera-koly-potribne/", "Коли розглядають розчинення філера", "injection", "support", "P2", "/booking/", "confirm-service"),
  opportunity("/blog/rf-pry-rozshyrenykh-porakh/", "Мікроголковий RF при розширених порах: що обговорити з лікарем", "hardware", "support", "P1", "/cosmetology/hardware/microneedle-rf/"),
  opportunity("/blog/ipl-pry-chervoninni-oblychchia/", "IPL при почервонінні обличчя: коли метод може розглядатися", "rosacea-vessels", "support", "P1", "/cosmetology/hardware/ipl/"),
];

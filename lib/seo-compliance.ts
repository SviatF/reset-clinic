import type { Metadata } from "next";
import type { BlogCategorySlug } from "./blog-categories";
import { DOCTORS, doctorPath, type DoctorProfile } from "./doctors";
import { SITE_URL } from "./seo";
import {
  buildSeoLandingJsonLd,
  buildSeoLandingMetadata,
  type SeoLanding,
} from "./seo-pages";

const UNVERIFIED_MEDICAL_PATHS = new Set([
  "/dermatology/perioral-dermatitis-treatment/",
  "/dermatology/psoriasis-treatment/",
  "/dermatology/folliculitis-treatment/",
  "/dermatology/skin-infections-treatment/",
  "/dermatology/melasma-treatment/",
  "/nutrition/medical-weight-loss/",
  "/nutrition/insulin-resistance/",
]);

export function isSeoLandingIndexable(landing: SeoLanding) {
  return !UNVERIFIED_MEDICAL_PATHS.has(landing.path);
}

export function buildCompliantLandingMetadata(landing: SeoLanding): Metadata {
  const base = buildSeoLandingMetadata(landing);
  const index = isSeoLandingIndexable(landing);

  return {
    ...base,
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function reviewerForLanding(landing: SeoLanding): DoctorProfile | null {
  return DOCTORS.find((doctor) => doctor.relatedPaths.includes(landing.path)) ?? null;
}

export function priceHrefForLanding(landing: SeoLanding) {
  const path = landing.path;
  if (path.includes("botulinum-therapy")) return "/price/#botulinum";
  if (path.includes("lip-contouring") || path.includes("face-contouring")) return "/price/#contouring";
  if (path.includes("biorevitalization")) return "/price/#biorevitalization";
  if (path.includes("polynucleotides")) return "/price/#polynucleotides";
  if (path.includes("needle-free-mesotherapy")) return "/price/#needle-free-mesotherapy";
  if (path.includes("mesotherapy")) return "/price/#mesotherapy";
  if (path.includes("microneedle-rf")) return "/price/#microneedle-rf";
  if (path.includes("/ipl/")) return "/price/#ipl";
  if (path.includes("led-therapy")) return "/price/#led";
  if (path.includes("aquapure")) return "/price/#aquapure";
  if (path.includes("skin-diagnostics")) return "/price/#skin-diagnostics";
  if (path.includes("trichologist") || path.includes("trichoscopy") || path.includes("hair-loss")) return "/price/#trichology";
  if (path.startsWith("/nutrition/")) return "/price/#nutrition";
  if (path.startsWith("/dermatology/")) return "/price/#dermatology";
  return "/price/";
}

export function blogCategoryForLanding(path: string): BlogCategorySlug | null {
  if (path.includes("acne") || path.includes("comedones-blackheads")) return "acne";
  if (path.includes("rosacea") || path.includes("redness")) return "rosacea";
  if (path.includes("pigmentation") || path.includes("melasma") || path.includes("uneven-skin-tone")) return "pigmentation";
  if (path.startsWith("/cosmetology/")) return "cosmetology";
  if (path === "/skin-care/" || path.includes("dry-skin") || path.includes("sensitive-skin")) return "skin-care";
  if (path.startsWith("/nutrition/")) return "nutrition";
  if (path.startsWith("/dermatology/") || path.startsWith("/skin-problems/")) return "dermatology";
  return null;
}

export function buildCompliantLandingJsonLd(landing: SeoLanding) {
  const base = buildSeoLandingJsonLd(landing) as {
    "@context": string;
    "@graph": Record<string, unknown>[];
  };
  const url = `${SITE_URL}${landing.path}`;
  const reviewer = reviewerForLanding(landing);
  const entityId = landing.type === "procedure" ? `${url}#procedure` : `${url}#service`;

  const graph = base["@graph"].flatMap((node) => {
    const id = node["@id"];

    if (landing.type === "procedure" && id === `${url}#service`) {
      return [{
        "@type": "MedicalProcedure",
        "@id": entityId,
        name: landing.h1,
        description: landing.description,
        url,
      }];
    }

    if (id === `${url}#webpage`) {
      return [{
        ...node,
        ...(landing.type === "service" || landing.type === "procedure" ? { mainEntity: { "@id": entityId } } : {}),
        ...(reviewer ? { reviewedBy: { "@id": `${SITE_URL}${doctorPath(reviewer)}#person` } } : {}),
      }];
    }

    return [node];
  });

  if (reviewer) {
    graph.push({
      "@type": "Person",
      "@id": `${SITE_URL}${doctorPath(reviewer)}#person`,
      name: reviewer.name,
      jobTitle: reviewer.role,
      url: `${SITE_URL}${doctorPath(reviewer)}`,
      image: `${SITE_URL}${reviewer.image}`,
      worksFor: { "@id": `${SITE_URL}/#clinic` },
    });
  }

  return { "@context": base["@context"], "@graph": graph };
}

export function supplementalLandingSections(landing: SeoLanding) {
  if (landing.type === "category") return [];

  if (landing.type === "problem") {
    return [
      {
        title: "Коли потрібна консультація лікаря",
        text: [
          `Якщо прояви, пов’язані з темою «${landing.h1}», зберігаються, посилюються, повторюються або викликають дискомфорт, доцільна професійна оцінка. Онлайн-опис не замінює діагноз.`,
        ],
      },
      {
        title: "Як проводиться діагностика",
        text: [
          "Діагностичний маршрут починається зі збору анамнезу та огляду. Додаткові методи, аналізи чи апаратна діагностика призначаються лише тоді, коли вони можуть змінити подальшу тактику.",
        ],
      },
      {
        title: "Які методи лікування або корекції можуть розглядатися",
        text: [
          "Метод залежить від причини, активності процесу, стану шкіри, супутніх факторів і попереднього лікування. Problem page не підміняє консультацію і не прив’язує симптом до однієї процедури.",
        ],
      },
    ];
  }

  if (landing.type === "procedure") {
    return [
      {
        title: "Показання та для кого підходить",
        text: [
          "Доцільність процедури визначає спеціаліст після оцінки задачі, стану шкіри, анамнезу та очікувань. Показання мають бути конкретними, а не формуватися лише з назви проблеми.",
        ],
      },
      {
        title: "Протипоказання та обмеження",
        text: [
          "Перед процедурою спеціаліст уточнює медичний анамнез, поточні стани, препарати та інші фактори, які можуть впливати на безпеку. Остаточний перелік обмежень визначається індивідуально.",
        ],
      },
      {
        title: "Підготовка",
        text: [
          "Якщо для конкретного протоколу потрібна підготовка, пацієнт отримує персональні рекомендації до візиту. Не варто самостійно скасовувати призначені лікарем препарати або починати нові засоби лише заради процедури.",
        ],
      },
      {
        title: "Тривалість, кількість процедур і результат",
        text: [
          "Тривалість візиту, кількість процедур і строки оцінки результату залежать від методу, зони, вихідного стану та індивідуальної відповіді. Реалістичний план обговорюється до початку курсу.",
        ],
      },
      {
        title: "Відновлення та можливі реакції",
        text: [
          "Період відновлення та допустимі реакції відрізняються між методиками. Після процедури RESET Clinic надає рекомендації щодо догляду, обмежень і ситуацій, у яких потрібно зв’язатися зі спеціалістом.",
        ],
      },
    ];
  }

  return [
    {
      title: "Кому може бути рекомендована консультація або послуга",
      text: [
        `Звернення щодо «${landing.h1}» доцільне, коли потрібна професійна оцінка, уточнення причини, план лікування або контроль динаміки, а самостійні рішення не дають зрозумілого результату.`,
      ],
    },
    {
      title: "Діагностика та персональний план",
      text: [
        "Спеціаліст збирає анамнез, оцінює клінічну картину та визначає, чи потрібні додаткові дослідження. Після цього формується персональний маршрут без універсальних схем і гарантій результату.",
      ],
    },
    {
      title: "Показання, протипоказання та безпека",
      text: [
        "Конкретні показання та обмеження залежать від діагнозу, стану здоров’я, препаратів і запланованого методу. Перед будь-яким процедурним етапом вони перевіряються окремо.",
      ],
    },
    {
      title: "Очікуваний результат, тривалість і кількість візитів",
      text: [
        "Очікуваний результат, строки та кількість контрольних візитів залежать від вихідного стану і відповіді на план. Для медичних станів коректною метою є контроль і покращення, а не шаблонна обіцянка повного вилікування.",
      ],
    },
  ];
}

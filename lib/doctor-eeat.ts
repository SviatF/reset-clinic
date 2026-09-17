import type { Metadata } from "next";
import { doctorJsonLd, doctorMetadata, doctorPath, type DoctorProfile } from "./doctors";
import { SITE_URL } from "./seo";

type PublishedDoctorEeat = {
  expertise: string[];
  consultationReasons: string[];
  approach: string;
};

const DOCTOR_EEAT: Record<string, PublishedDoctorEeat> = {
  "tetiana-hrytsuta": {
    expertise: [
      "Інʼєкційна косметологія",
      "Профілактика та корекція вікових змін",
      "Акне та постакне",
      "Розацеа і судинні прояви",
      "Пігментація",
      "Підбір косметологічних процедур",
    ],
    consultationReasons: [
      "акне, постакне, комедони та зміни текстури шкіри",
      "розацеа, стійке почервоніння та видимі судини",
      "пігментація, темні плями та нерівний тон",
      "вікові зміни та запит на природну естетичну корекцію",
      "підбір інʼєкційних або апаратних процедур за показаннями",
    ],
    approach: "Оцінює клінічний та естетичний запит у комплексі, враховує анатомічні особливості й формує послідовний план без універсальних схем.",
  },
  "khrystyna-milkovych": {
    expertise: [
      "Естетична корекція стану шкіри",
      "Інʼєкційна косметологія",
      "Індивідуальні плани догляду",
      "Оцінка випадіння та порідіння волосся",
      "Трихоскопія",
      "Проблеми шкіри голови",
    ],
    consultationReasons: [
      "посилене випадіння або поступове порідіння волосся",
      "свербіж, лущення, жирність або сухість шкіри голови",
      "потреба у трихоскопічній оцінці та контролі динаміки",
      "підбір індивідуального догляду за шкірою",
      "інʼєкційні та апаратні процедури відповідно до стану шкіри",
    ],
    approach: "Поєднує оцінку стану шкіри або волосся з персональним планом догляду та процедур, роблячи акцент на безпеці й природному результаті.",
  },
  "adriana-sokhan": {
    expertise: [
      "Дерматологічні проблеми шкіри",
      "Акне та запальні висипання",
      "Дерматити й порушення шкірного барʼєра",
      "Інʼєкційна косметологія",
      "Апаратна косметологія",
      "Доглядові процедури",
    ],
    consultationReasons: [
      "висипання, подразнення або повторювані реакції шкіри",
      "екзема, контактний або інший дерматит",
      "акне, розацеа та пігментація",
      "сухість, зневоднення та порушення шкірного барʼєра",
      "підбір апаратних, інʼєкційних або доглядових процедур",
    ],
    approach: "Працює з естетичними та дерматологічними запитами, віддаючи пріоритет науково обґрунтованим рішенням, безпеці та довготривалій якості шкіри.",
  },
  "olha-hrytsuta": {
    expertise: [
      "Сімейна медицина",
      "Нутриціологія",
      "Профілактика захворювань",
      "Контроль ваги",
      "Метаболічні порушення",
      "Корекція способу життя та харчування",
    ],
    consultationReasons: [
      "потреба у персональному плані харчування без універсальних дієт",
      "контроль ваги та аналіз причин повторного набору",
      "підозра на дефіцити та потреба у доцільній діагностиці",
      "метаболічні фактори, що впливають на самопочуття",
      "профілактичний план і реалістичні зміни способу життя",
    ],
    approach: "Оцінює харчування, спосіб життя й медичний контекст разом та формує реалістичні рекомендації на принципах доказової медицини.",
  },
};

const FALLBACK_EEAT: PublishedDoctorEeat = {
  expertise: [],
  consultationReasons: [],
  approach: "План консультації та подальших дій формується індивідуально після оцінки запиту.",
};

export function doctorEeat(doctor: DoctorProfile) {
  return DOCTOR_EEAT[doctor.slug] ?? FALLBACK_EEAT;
}

export function doctorBookingHref(doctor: DoctorProfile, surface = "doctor_profile") {
  const params = new URLSearchParams({
    doctor: doctor.name,
    utm_source: "doctor_profile",
    utm_medium: "organic",
    utm_campaign: "doctor_booking",
    utm_content: `${doctor.slug}:${surface}`,
  });
  return `/booking/?${params.toString()}`;
}

export type DoctorEeatAudit = {
  doctor: DoctorProfile;
  expertiseCount: number;
  relatedPageCount: number;
  verifiedFields: string[];
  missingCredentialFields: string[];
  readyForReviewerAttribution: boolean;
};

export function auditDoctorEeat(doctor: DoctorProfile): DoctorEeatAudit {
  const verifiedFields = [
    doctor.name ? "ПІБ" : "",
    doctor.role ? "Роль" : "",
    doctor.bio ? "Професійний опис" : "",
    doctor.image ? "Фото" : "",
    doctor.relatedPaths.length ? "Профільні сторінки" : "",
    doctorEeat(doctor).expertise.length ? "Напрями експертизи" : "",
  ].filter(Boolean);

  const missingCredentialFields = [
    doctor.education?.length ? "" : "Освіта",
    doctor.certifications?.length ? "" : "Сертифікації / підвищення кваліфікації",
    doctor.experience?.trim() ? "" : "Підтверджений стаж / досвід",
    doctor.schedule?.trim() ? "" : "Графік прийому",
  ].filter(Boolean);

  return {
    doctor,
    expertiseCount: doctorEeat(doctor).expertise.length,
    relatedPageCount: doctor.relatedPaths.length,
    verifiedFields,
    missingCredentialFields,
    readyForReviewerAttribution: missingCredentialFields.length === 0,
  };
}

export function doctorEeatMetadata(doctor: DoctorProfile): Metadata {
  const base = doctorMetadata(doctor) as Metadata;
  const expertise = doctorEeat(doctor).expertise.slice(0, 4).join(", ");
  const description = `${doctor.name} — ${doctor.role} RESET Clinic у Львові. Напрями: ${expertise}. Профіль лікаря, повʼязані послуги та онлайн-запис.`;

  return {
    ...base,
    description,
    openGraph: { ...base.openGraph, description },
    twitter: { ...base.twitter, description },
  };
}

export function doctorEeatJsonLd(doctor: DoctorProfile) {
  const base = doctorJsonLd(doctor) as {
    "@context": string;
    "@graph": Record<string, unknown>[];
  };
  const url = `${SITE_URL}${doctorPath(doctor)}`;
  const eeat = doctorEeat(doctor);

  const graph = base["@graph"].map((node) => {
    if (node["@id"] !== `${url}#person`) return node;

    return {
      ...node,
      mainEntityOfPage: { "@id": `${url}#profilepage` },
      affiliation: { "@id": `${SITE_URL}/#clinic` },
      hasOccupation: {
        "@type": "Occupation",
        name: doctor.role,
        occupationLocation: { "@type": "City", name: "Львів" },
      },
      knowsAbout: eeat.expertise,
      ...(doctor.certifications?.length
        ? {
            hasCredential: doctor.certifications.map((name) => ({
              "@type": "EducationalOccupationalCredential",
              name,
            })),
          }
        : {}),
    };
  });

  return { ...base, "@graph": graph };
}

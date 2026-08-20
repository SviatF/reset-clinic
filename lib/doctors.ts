import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "./seo";

export type DoctorProfile = {
  slug: string;
  name: string;
  role: string;
  subtitle?: string;
  bio: string;
  image: string;
  relatedPaths: string[];
};

export const DOCTORS: DoctorProfile[] = [
  {
    slug: "tetiana-hrytsuta",
    name: "Грицута Тетяна",
    role: "Лікар-косметолог",
    subtitle: "Засновниця RESÉT clinic",
    image: "/assets/desktop-d861343ce904ae1965e8494dfe69c5f1abaa95ab.jpg",
    bio: "Лікар-косметолог, який спеціалізується на ін’єкційних методиках омолодження та гармонізації обличчя. Працює за принципами доказової медицини, враховуючи анатомічні особливості та індивідуальні потреби кожного пацієнта. Спеціалізується на профілактиці вікових змін, лікуванні акне, розацеа, пігментації та підборі ефективних косметологічних процедур. Головна мета — природний результат, здоров’я та якість шкіри.",
    relatedPaths: [
      "/cosmetology/injection/",
      "/cosmetology/injection/botulinum-therapy/",
      "/cosmetology/injection/lip-contouring/",
      "/cosmetology/injection/face-contouring/",
      "/cosmetology/injection/biorevitalization/",
      "/cosmetology/injection/mesotherapy/",
      "/cosmetology/injection/polynucleotides/",
      "/dermatology/acne-treatment/",
      "/dermatology/rosacea-treatment/",
      "/dermatology/pigmentation-treatment/",
      "/skin-problems/acne/",
      "/skin-problems/rosacea/",
      "/skin-problems/pigmentation/",
    ],
  },
  {
    slug: "khrystyna-milkovych",
    name: "Мількович Христина",
    role: "Лікар-косметолог",
    image: "/assets/desktop-fe61304e70ad3ef400e93d146b5a73242ab43ced.jpg",
    bio: "Допомагає зберегти здоров’я та красу шкіри завдяки комплексному підходу до діагностики, лікування та естетичної корекції. Спеціалізується на ін’єкційних процедурах, складає індивідуальні плани догляду та працює з урахуванням анатомічних особливостей і побажань кожного пацієнта. Пріоритет у роботі — природний результат, безпека та довготривалий ефект.",
    relatedPaths: [
      "/cosmetology/injection/",
      "/cosmetology/injection/botulinum-therapy/",
      "/cosmetology/injection/lip-contouring/",
      "/cosmetology/injection/face-contouring/",
      "/cosmetology/injection/biorevitalization/",
      "/cosmetology/injection/mesotherapy/",
      "/cosmetology/injection/polynucleotides/",
    ],
  },
  {
    slug: "adriana-sokhan",
    name: "Сохан Адріана",
    role: "Лікар-косметолог",
    image: "/assets/desktop-7a51274a2930bf3e2161010d9c7e813cb53f660c.jpg",
    bio: "Допомагає вирішувати як естетичні, так і дерматологічні проблеми шкіри. Основний принцип роботи — безпечні процедури, науково обґрунтовані рішення та довготривалий результат, що підкреслює природну красу пацієнта. Спеціалізується на інʼєкційних, апаратних та доглядових процедурах.",
    relatedPaths: [
      "/cosmetology/injection/",
      "/cosmetology/hardware/",
      "/cosmetology/hardware/ipl/",
      "/cosmetology/hardware/microneedle-rf/",
      "/cosmetology/hardware/led-therapy/",
      "/cosmetology/hardware/aquapure/",
      "/cosmetology/hardware/skin-diagnostics/",
      "/cosmetology/hardware/needle-free-mesotherapy/",
      "/skin-care/",
    ],
  },
];

export function getDoctor(slug: string) {
  return DOCTORS.find((doctor) => doctor.slug === slug);
}

export function doctorPath(doctor: DoctorProfile) {
  return `/doctors/${doctor.slug}/`;
}

export function doctorMetadata(doctor: DoctorProfile) {
  const path = doctorPath(doctor);
  const title = `${doctor.name} — ${doctor.role.toLowerCase()} у Львові | ${SITE_NAME}`;
  const description = `${doctor.name} — ${doctor.role} RESET Clinic у Львові. Напрямки роботи, професійний підхід, пов’язані процедури та запис на консультацію.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile" as const,
      locale: "uk_UA",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: doctor.image || DEFAULT_OG_IMAGE, alt: `${doctor.name} — RESET Clinic` }],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: [doctor.image || DEFAULT_OG_IMAGE] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export function doctorJsonLd(doctor: DoctorProfile) {
  const path = doctorPath(doctor);
  const url = `${SITE_URL}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profilepage`,
        url,
        name: `${doctor.name} — ${doctor.role}`,
        inLanguage: "uk-UA",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${url}#person` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: doctor.name,
        jobTitle: doctor.role,
        description: doctor.bio,
        image: `${SITE_URL}${doctor.image}`,
        worksFor: { "@id": `${SITE_URL}/#clinic` },
        url,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Головна", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Лікарі", item: `${SITE_URL}/doctors/` },
          { "@type": "ListItem", position: 3, name: doctor.name, item: url },
        ],
      },
    ],
  };
}

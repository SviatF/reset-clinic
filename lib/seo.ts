import type { Metadata } from "next";

export const SITE_URL = "https://resetclinic.org";
export const SITE_NAME = "RESET Clinic";
export const DEFAULT_OG_IMAGE = "/assets/6dff7433211d4169812cea0cec5bf9be74ba951c.png";

const clinicId = `${SITE_URL}/#clinic`;
const websiteId = `${SITE_URL}/#website`;

export type SeoRoute =
  | "/"
  | "/price/"
  | "/doctors/"
  | "/contacts/"
  | "/about/"
  | "/services/"
  | "/thank-you/"
  | "/booking/";

type SeoEntry = {
  title: string;
  description: string;
  index: boolean;
  follow: boolean;
  schemaType: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  breadcrumbName: string;
};

export const SEO_BY_ROUTE: Record<SeoRoute, SeoEntry> = {
  "/": {
    title: "RESET Clinic Львів — клініка естетичної медицини",
    description:
      "RESET Clinic у Львові: дерматологія, ін’єкційна, апаратна й доглядова косметологія, трихологія та сімейна медицина. Доказовий підхід і сертифіковане обладнання.",
    index: true,
    follow: true,
    schemaType: "WebPage",
    breadcrumbName: "Головна",
  },
  "/price/": {
    title: "Ціни на косметологію у Львові — прайс | RESET Clinic",
    description:
      "Актуальні ціни RESET Clinic у Львові: консультації лікарів, дерматологія, ін’єкційна й апаратна косметологія, доглядові процедури, пілінги та інші послуги.",
    index: true,
    follow: true,
    schemaType: "CollectionPage",
    breadcrumbName: "Прайс",
  },
  "/doctors/": {
    title: "Лікарі-косметологи та дерматологи у Львові | RESET Clinic",
    description:
      "Команда лікарів RESET Clinic у Львові: дерматологи, косметологи, трихологи, нутриціологи та сімейні лікарі з профільною освітою й регулярним підвищенням кваліфікації.",
    index: true,
    follow: true,
    schemaType: "CollectionPage",
    breadcrumbName: "Лікарі",
  },
  "/contacts/": {
    title: "Контакти RESET Clinic у Львові — Кульпарківська, 93/2",
    description:
      "RESET Clinic: м. Львів, вул. Кульпарківська, 93/2. Телефон +380 93 282 88 88. Пн–сб 10:00–20:00, нд 11:00–17:00. Запис на консультацію та процедури.",
    index: true,
    follow: true,
    schemaType: "ContactPage",
    breadcrumbName: "Контакти",
  },
  "/about/": {
    title: "Про RESET Clinic — клініка естетичної медицини у Львові",
    description:
      "Про RESET Clinic у Львові: доказова медицина, безпека, індивідуальні рішення, сертифіковане обладнання та комплексний підхід до здоров’я й естетики шкіри.",
    index: true,
    follow: true,
    schemaType: "AboutPage",
    breadcrumbName: "Про клініку",
  },
  "/services/": {
    title: "Косметологія та дерматологія у Львові — RESET Clinic",
    description:
      "Послуги RESET Clinic у Львові: дерматологія, ін’єкційна, апаратна й доглядова косметологія, трихологія, діагностика шкіри, нутриціологія та сімейна медицина.",
    index: true,
    follow: true,
    schemaType: "CollectionPage",
    breadcrumbName: "Послуги",
  },
  "/thank-you/": {
    title: "Дякуємо за заявку | RESET Clinic",
    description: "Заявку успішно отримано. Команда RESET Clinic зв’яжеться з вами найближчим часом.",
    index: false,
    follow: false,
    schemaType: "WebPage",
    breadcrumbName: "Дякуємо за заявку",
  },
  "/booking/": {
    title: "Записатися на прийом | RESET Clinic",
    description:
      "Онлайн-запис на консультацію або процедуру в RESET Clinic у Львові. Оберіть зручний час та запишіться на прийом.",
    index: false,
    follow: true,
    schemaType: "WebPage",
    breadcrumbName: "Запис на прийом",
  },
};

export function getSeo(route: string): SeoEntry | undefined {
  return SEO_BY_ROUTE[route as SeoRoute];
}

export function buildMetadata(route: string, fallbackTitle = SITE_NAME): Metadata {
  const seo = getSeo(route);
  if (!seo) return { title: fallbackTitle };

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: route,
    },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: route,
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 2446,
          height: 1314,
          alt: "Інтер’єр RESET Clinic у Львові",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: seo.index,
      follow: seo.follow,
      googleBot: {
        index: seo.index,
        follow: seo.follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

const serviceNames = [
  "Дерматологія",
  "Ін’єкційна косметологія",
  "Апаратна косметологія",
  "Доглядова косметологія",
  "Трихологія",
  "Сімейна медицина",
  "Нутриціологія",
  "Діагностика стану шкіри",
];

export const clinicJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  "@id": clinicId,
  name: SITE_NAME,
  alternateName: "Reset",
  url: SITE_URL,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description:
    "Клініка естетичної медицини у Львові: дерматологія, косметологія, трихологія, нутриціологія та сімейна медицина.",
  telephone: "+380932828888",
  email: "reset.clinic.lviv@gmail.com",
  priceRange: "₴₴",
  address: {
    "@type": "PostalAddress",
    streetAddress: "вул. Кульпарківська, 93/2",
    addressLocality: "Львів",
    addressRegion: "Львівська область",
    addressCountry: "UA",
  },
  areaServed: {
    "@type": "City",
    name: "Львів",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "11:00",
      closes: "17:00",
    },
  ],
  sameAs: ["https://www.instagram.com/reset.clinic.lviv"],
  medicalSpecialty: ["Dermatology", "PrimaryCare"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Послуги RESET Clinic",
    itemListElement: serviceNames.map((name) => ({
      "@type": "OfferCatalog",
      name,
    })),
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "uk-UA",
  publisher: { "@id": clinicId },
};

export function buildPageJsonLd(route: string) {
  const seo = getSeo(route);
  if (!seo) return [];

  const pageId = `${SITE_URL}${route}#webpage`;
  const breadcrumb =
    route === "/"
      ? undefined
      : {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}${route}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Головна",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: seo.breadcrumbName,
              item: `${SITE_URL}${route}`,
            },
          ],
        };

  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": seo.schemaType,
    "@id": pageId,
    url: `${SITE_URL}${route}`,
    name: seo.title,
    description: seo.description,
    inLanguage: "uk-UA",
    isPartOf: { "@id": websiteId },
    about: { "@id": clinicId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
      width: 2446,
      height: 1314,
    },
  };

  if (breadcrumb) page.breadcrumb = { "@id": breadcrumb["@id"] };

  if (route === "/services/") {
    page.mainEntity = {
      "@type": "ItemList",
      itemListElement: serviceNames.map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          name,
          provider: { "@id": clinicId },
          areaServed: { "@type": "City", name: "Львів" },
        },
      })),
    };
  }

  return breadcrumb ? [page, breadcrumb] : [page];
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

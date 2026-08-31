import type { Metadata } from "next";
import PromoHubClient, { type PromoHubCard } from "../../components/PromoHubClient";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "../../lib/seo";

const META_TITLE = "Оберіть процедуру за вашим запитом | RESÉT clinic";
const META_DESCRIPTION = "Навігатор RESÉT clinic у Львові: ботулінотерапія, збільшення губ, IPL, чистка обличчя, БІОПАТИД і нутриціологія. Оберіть запит або пройдіть короткий підбір.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  alternates: { canonical: "/promo/" },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "/promo/",
    siteName: SITE_NAME,
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: "RESÉT clinic у Львові — вибір процедур" }],
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const cards: PromoHubCard[] = [
  {
    slug: "botulinotherapy",
    index: "01",
    family: "Обличчя та риси",
    service: "Ботулінотерапія",
    title: "Молодший і свіжіший вигляд без ефекту маски",
    text: "Делікатна робота з активною мімікою, лобом, міжбрів’ям і зоною навколо очей.",
    image: "/assets/injekcijna-kosmelogia.webp",
    imageAlt: "Ботулінотерапія у RESÉT clinic",
    tags: ["Зморшки", "Міміка", "Свіжіший вигляд"],
    group: "face",
  },
  {
    slug: "lips",
    index: "02",
    family: "Обличчя та риси",
    service: "Контурна пластика губ",
    title: "Губи, які ідеально пасують вашому обличчю",
    text: "Форма, симетрія, контур і делікатний об’єм без шаблонного результату.",
    image: "/assets/img-landings/lips.webp",
    imageAlt: "Контурна пластика губ у RESÉT clinic",
    tags: ["Губи", "Форма", "Симетрія"],
    group: "face",
  },
  {
    slug: "ipl-face",
    index: "03",
    family: "Якість шкіри",
    service: "IPL обличчя",
    title: "Рівний тон шкіри без постійного маскування",
    text: "Для запитів, пов’язаних із почервонінням, судинами, пігментацією та нерівним тоном.",
    image: "/assets/img-landings/irl.webp",
    imageAlt: "IPL обличчя у RESÉT clinic",
    tags: ["Почервоніння", "Пігментація", "Тон"],
    group: "skin",
  },
  {
    slug: "facial-cleaning",
    index: "04",
    family: "Якість шкіри",
    service: "Чистка обличчя",
    title: "Поверніть шкірі чистоту та природне сяйво",
    text: "Коли турбують забиті пори, комедони, чорні цятки або тьмяний вигляд шкіри.",
    image: "/assets/img-landings/chystka-face.webp",
    imageAlt: "Чистка обличчя у RESÉT clinic",
    tags: ["Пори", "Комедони", "Тьмяність"],
    group: "skin",
  },
  {
    slug: "biopatid",
    index: "05",
    family: "Вага та метаболізм",
    service: "БІОПАТИД",
    title: "Схуднення без постійної боротьби з голодом",
    text: "Медична програма контролю ваги після оцінки показань, протипоказань і вашого запиту.",
    image: "/assets/img-landings/biobatud.webp",
    imageAlt: "Програма БІОПАТИД у RESÉT clinic",
    tags: ["Голод", "Контроль ваги", "Медичний супровід"],
    group: "weight",
  },
  {
    slug: "nutrition",
    index: "06",
    family: "Вага та харчування",
    service: "Нутриціологія",
    title: "Схуднення без життя на дієті",
    text: "Розбір реального раціону, режиму й звичок із планом, який можна підтримувати у звичайному житті.",
    image: "/assets/img-landings/nutriciology.webp",
    imageAlt: "Нутриціологія у RESÉT clinic",
    tags: ["Харчування", "Зриви", "Режим"],
    group: "weight",
  },
];

export default function PromoHubPage() {
  return <PromoHubClient cards={cards} />;
}

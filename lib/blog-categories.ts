export const BLOG_CATEGORY_MIN_INDEXABLE_POSTS = 4;

export const BLOG_CATEGORIES = [
  {
    slug: "dermatology",
    name: "Дерматологія",
    title: "Блог про дерматологію | RESET Clinic",
    description: "Доказові матеріали RESET Clinic про захворювання шкіри, консультацію дерматолога, діагностику та профілактику.",
    landingPath: "/dermatology/",
  },
  {
    slug: "acne",
    name: "Акне",
    title: "Блог про акне та постакне | RESET Clinic",
    description: "Матеріали RESET Clinic про причини акне, догляд, лікування, комедони та постакне з переходом до відповідних медичних сторінок.",
    landingPath: "/skin-problems/acne/",
  },
  {
    slug: "rosacea",
    name: "Розацеа",
    title: "Блог про розацеа та почервоніння | RESET Clinic",
    description: "Матеріали RESET Clinic про розацеа, тригери, почервоніння, догляд і професійний маршрут при стійких симптомах.",
    landingPath: "/skin-problems/rosacea/",
  },
  {
    slug: "pigmentation",
    name: "Пігментація",
    title: "Блог про пігментацію та мелазму | RESET Clinic",
    description: "Матеріали RESET Clinic про пігментацію, мелазму, фотозахист, причини плям і професійні методи корекції.",
    landingPath: "/skin-problems/pigmentation/",
  },
  {
    slug: "cosmetology",
    name: "Косметологія",
    title: "Блог про косметологію та процедури | RESET Clinic",
    description: "Пояснення процедур RESET Clinic: ін’єкційна та апаратна косметологія, показання, підготовка, відновлення і вибір методу.",
    landingPath: "/cosmetology/",
  },
  {
    slug: "skin-care",
    name: "Догляд за шкірою",
    title: "Блог про догляд за шкірою | RESET Clinic",
    description: "Практичні матеріали RESET Clinic про догляд за жирною, сухою, чутливою шкірою та догляд при акне, розацеа й пігментації.",
    landingPath: "/skin-care/",
  },
  {
    slug: "nutrition",
    name: "Нутриціологія",
    title: "Блог про нутриціологію та харчування | RESET Clinic",
    description: "Матеріали RESET Clinic про нутриціологію, дефіцити, харчування, контроль ваги та пов’язані медичні питання.",
    landingPath: "/nutrition/",
  },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export function getBlogCategory(slug?: string | null) {
  return BLOG_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function normalizeBlogCategory(value?: string | null): BlogCategorySlug | null {
  return getBlogCategory(value)?.slug ?? null;
}

export function blogCategoryPath(slug: BlogCategorySlug) {
  return `/blog/${slug}/`;
}

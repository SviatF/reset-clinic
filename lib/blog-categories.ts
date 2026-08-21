export const BLOG_ROOT_MIN_INDEXABLE_POSTS = 4;
export const BLOG_CATEGORY_MIN_INDEXABLE_POSTS = 4;

export const BLOG_CATEGORIES = [
  {
    slug: "dermatology",
    publicSlug: "dermatolohiya",
    name: "Дерматологія",
    title: "Блог про дерматологію | RESET Clinic",
    description: "Доказові матеріали RESET Clinic про захворювання шкіри, консультацію дерматолога, діагностику та профілактику.",
    landingPath: "/dermatology/",
  },
  {
    slug: "acne",
    publicSlug: "akne",
    name: "Акне",
    title: "Блог про акне та постакне | RESET Clinic",
    description: "Матеріали RESET Clinic про причини акне, догляд, лікування, комедони та постакне з переходом до відповідних медичних сторінок.",
    landingPath: "/skin-problems/acne/",
  },
  {
    slug: "rosacea",
    publicSlug: "rozatsea",
    name: "Розацеа",
    title: "Блог про розацеа та почервоніння | RESET Clinic",
    description: "Матеріали RESET Clinic про розацеа, тригери, почервоніння, догляд і професійний маршрут при стійких симптомах.",
    landingPath: "/skin-problems/rosacea/",
  },
  {
    slug: "pigmentation",
    publicSlug: "pihmentatsiya",
    name: "Пігментація",
    title: "Блог про пігментацію та мелазму | RESET Clinic",
    description: "Матеріали RESET Clinic про пігментацію, мелазму, фотозахист, причини плям і професійні методи корекції.",
    landingPath: "/skin-problems/pigmentation/",
  },
  {
    slug: "cosmetology",
    publicSlug: "kosmetolohiya",
    name: "Косметологія",
    title: "Блог про косметологію та процедури | RESET Clinic",
    description: "Пояснення процедур RESET Clinic: ін’єкційна та апаратна косметологія, показання, підготовка, відновлення і вибір методу.",
    landingPath: "/cosmetology/",
  },
  {
    slug: "skin-care",
    publicSlug: "dohlyad-za-shkiroyu",
    name: "Догляд за шкірою",
    title: "Блог про догляд за шкірою | RESET Clinic",
    description: "Практичні матеріали RESET Clinic про догляд за жирною, сухою, чутливою шкірою та догляд при акне, розацеа й пігментації.",
    landingPath: "/skin-care/",
  },
  {
    slug: "nutrition",
    publicSlug: "nutrytsiolohiya",
    name: "Нутриціологія",
    title: "Блог про нутриціологію та харчування | RESET Clinic",
    description: "Матеріали RESET Clinic про нутриціологію, дефіцити, харчування, контроль ваги та пов’язані медичні питання.",
    landingPath: "/nutrition/",
  },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export function getBlogCategory(slug?: string | null) {
  return BLOG_CATEGORIES.find((category) => category.slug === slug || category.publicSlug === slug) ?? null;
}

export function normalizeBlogCategory(value?: string | null): BlogCategorySlug | null {
  return getBlogCategory(value)?.slug ?? null;
}

export function blogCategoryPath(slug: BlogCategorySlug) {
  const category = BLOG_CATEGORIES.find((item) => item.slug === slug);
  return category ? `/blog/${category.publicSlug}/` : "/blog/";
}

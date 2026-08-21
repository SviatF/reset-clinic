import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter, PublicSiteHeader } from "../../components/PublicSiteChrome";
import { blogPostPath, getPublishedPosts } from "../../lib/blog";
import { BLOG_CATEGORIES, blogCategoryPath } from "../../lib/blog-categories";
import { DEFAULT_OG_IMAGE, SITE_URL } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог RESET Clinic — косметологія, дерматологія та здоров’я шкіри",
  description: "Доказові матеріали RESET Clinic про косметологію, дерматологію, трихологію та здоров’я шкіри. Автори й медичні рецензенти клініки у Львові.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: `${SITE_URL}/blog/`,
    siteName: "RESET Clinic",
    title: "Блог RESET Clinic",
    description: "Доказові матеріали про косметологію, дерматологію, трихологію та здоров’я шкіри.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 2446, height: 1314, alt: "Блог RESET Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Блог RESET Clinic",
    description: "Доказові матеріали про косметологію, дерматологію, трихологію та здоров’я шкіри.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts(100);
  return (
    <div className="seo-site">
      <PublicSiteHeader />
      <main>
        <section className="reset-blog-hero">
          <div className="reset-blog-eyebrow">Knowledge · RESET Clinic</div>
          <h1>Блог про шкіру, естетику та здоров’я.</h1>
          <p className="reset-blog-lead">Матеріали з медичним review, зрозумілими поясненнями процедур і відповідями на реальні пошукові запити.</p>
        </section>

        <section className="reset-blog-grid" aria-label="Категорії блогу">
          {BLOG_CATEGORIES.map((category) => (
            <Link className="reset-blog-card" href={blogCategoryPath(category.slug)} key={category.slug}>
              <div>
                <div className="reset-blog-meta">Тематичний розділ</div>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </div>
              <div className="reset-blog-meta">Переглянути →</div>
            </Link>
          ))}
        </section>

        <section className="reset-blog-grid" aria-label="Останні матеріали">
          {posts.length ? posts.map((post) => (
            <Link className="reset-blog-card" href={blogPostPath(post)} key={post.id}>
              <div><div className="reset-blog-meta">{post.published_at ? new Date(post.published_at).toLocaleDateString("uk-UA") : "RESET Clinic"}</div><h2>{post.title}</h2><p>{post.excerpt || "Читати матеріал RESET Clinic."}</p></div>
              <div className="reset-blog-meta">{post.author_name || "RESET Clinic"} →</div>
            </Link>
          )) : <div className="reset-blog-card"><div><div className="reset-blog-meta">CMS ready</div><h2>Матеріали готуються</h2><p>Після публікації в RESET Admin статті автоматично з’являться тут.</p></div></div>}
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteChrome";
import { blogPostPath, getPublishedPostsByCategory } from "../lib/blog";
import {
  BLOG_CATEGORY_MIN_INDEXABLE_POSTS,
  blogCategoryPath,
  getBlogCategory,
  type BlogCategorySlug,
} from "../lib/blog-categories";
import { DEFAULT_OG_IMAGE, jsonLd, SITE_NAME, SITE_URL } from "../lib/seo";

const categoryState = cache(async (slug: BlogCategorySlug) => {
  const category = getBlogCategory(slug);
  if (!category) return null;
  const posts = await getPublishedPostsByCategory(slug, 200);
  const indexablePosts = posts.filter((post) => post.indexable);
  const indexable = indexablePosts.length >= BLOG_CATEGORY_MIN_INDEXABLE_POSTS;
  return { category, posts, indexablePosts, indexable };
});

export async function buildBlogCategoryMetadata(slug: BlogCategorySlug): Promise<Metadata> {
  const state = await categoryState(slug);
  if (!state) return { title: SITE_NAME, robots: { index: false, follow: false } };
  const path = blogCategoryPath(slug);
  return {
    title: state.category.title,
    description: state.category.description,
    alternates: { canonical: path },
    robots: {
      index: state.indexable,
      follow: true,
      googleBot: {
        index: state.indexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      title: state.category.title,
      description: state.category.description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 2446, height: 1314, alt: `${state.category.name} — ${SITE_NAME}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: state.category.title,
      description: state.category.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function BlogCategoryPage({ slug }: { slug: BlogCategorySlug }) {
  const state = await categoryState(slug);
  if (!state) return null;
  const path = blogCategoryPath(slug);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: state.category.title,
        description: state.category.description,
        inLanguage: "uk-UA",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": `${SITE_URL}${path}#breadcrumb` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: state.indexablePosts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}${blogPostPath(post)}`,
            name: post.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}${path}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Головна", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Блог", item: `${SITE_URL}/blog/` },
          { "@type": "ListItem", position: 3, name: state.category.name, item: `${SITE_URL}${path}` },
        ],
      },
    ],
  };

  return (
    <div className="seo-site reset-blog-page reset-blog-category-page">
      <PublicSiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

        <section className="reset-blog-category-hero">
          <div className="reset-blog-shell">
            <nav className="reset-blog-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/blog/">Блог</Link><span>/</span><span aria-current="page">{state.category.name}</span>
            </nav>
            <div className="reset-blog-category-hero-grid">
              <div>
                <p className="reset-blog-eyebrow">Тематичний розділ</p>
                <h1>{state.category.name}</h1>
                <p className="reset-blog-lead">{state.category.description}</p>
              </div>
              <aside className="reset-blog-category-context">
                <p className="reset-blog-eyebrow">RESET Clinic</p>
                <strong>Від пояснення — до професійної оцінки.</strong>
                <p>Якщо потрібен не загальний матеріал, а рішення для вашої ситуації, перейдіть до профільного напряму клініки.</p>
                <Link href={state.category.landingPath}>Відкрити медичний розділ <span>↗</span></Link>
              </aside>
            </div>
          </div>
        </section>

        <section className="reset-blog-category-content">
          <div className="reset-blog-shell">
            <div className="reset-blog-section-heading">
              <div>
                <p className="reset-blog-eyebrow">Матеріали</p>
                <h2>Пояснюємо без зайвої складності</h2>
              </div>
              <p>Практичні тексти про симптоми, догляд, лікування та рішення, які варто обговорити зі спеціалістом.</p>
            </div>

            {state.posts.length ? (
              <div className="reset-blog-post-grid">
                {state.posts.map((post, index) => (
                  <Link className={`reset-blog-post-card${index === 0 ? " reset-blog-post-card-featured" : ""}`} href={blogPostPath(post)} key={post.id}>
                    <div className="reset-blog-post-meta">
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("uk-UA") : state.category.name}</span>
                      <span>{post.author_name || SITE_NAME}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt || "Практичний матеріал від команди RESET Clinic."}</p>
                    <div className="reset-blog-post-link">Читати матеріал <span>↗</span></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="reset-blog-empty-state reset-blog-empty-state-light">
                <div>
                  <p className="reset-blog-eyebrow">Редакція в роботі</p>
                  <h3>Матеріали цього розділу готуються.</h3>
                </div>
                <p>Поки ми наповнюємо розділ, профільна сторінка RESET Clinic уже містить інформацію про підхід, пов’язані методи та запис на консультацію.</p>
                <div className="reset-blog-empty-actions">
                  <Link href={state.category.landingPath}>Перейти до напряму</Link>
                  <Link href="/booking/">Записатися</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

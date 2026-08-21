import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { PublicSiteFooter, PublicSiteHeader } from "../../components/PublicSiteChrome";
import { blogPostPath, getPublishedPosts } from "../../lib/blog";
import {
  BLOG_CATEGORIES,
  BLOG_ROOT_MIN_INDEXABLE_POSTS,
  blogCategoryPath,
} from "../../lib/blog-categories";
import { DEFAULT_OG_IMAGE, SITE_URL, jsonLd } from "../../lib/seo";

export const dynamic = "force-dynamic";

const getBlogState = cache(async () => {
  const posts = await getPublishedPosts(100);
  const indexablePosts = posts.filter((post) => post.indexable);
  return {
    posts,
    indexablePosts,
    indexable: indexablePosts.length >= BLOG_ROOT_MIN_INDEXABLE_POSTS,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { indexable } = await getBlogState();
  const title = "Блог RESET Clinic — косметологія, дерматологія та здоров’я шкіри";
  const description = "Доказові матеріали RESET Clinic про косметологію, дерматологію, трихологію та здоров’я шкіри. Пояснення від команди клініки у Львові.";

  return {
    title,
    description,
    alternates: { canonical: "/blog/" },
    robots: {
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
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
}

export default async function BlogIndexPage() {
  const { posts, indexablePosts, indexable } = await getBlogState();
  const collectionSchema = indexable
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog/#webpage`,
        url: `${SITE_URL}/blog/`,
        name: "Блог RESET Clinic",
        inLanguage: "uk-UA",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#clinic` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: indexablePosts.slice(0, 20).map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}${blogPostPath(post)}`,
            name: post.title,
          })),
        },
      }
    : null;

  return (
    <div className="seo-site">
      {collectionSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionSchema) }} /> : null}
      <PublicSiteHeader />
      <main>
        <section className="reset-blog-hero">
          <div className="reset-blog-eyebrow">Знання · RESET Clinic</div>
          <h1>Блог про шкіру, естетику та здоров’я.</h1>
          <p className="reset-blog-lead">Зрозумілі матеріали про стан шкіри, сучасні методи діагностики, косметологічні процедури, догляд і ситуації, коли варто звернутися до спеціаліста.</p>
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
              <div>
                <div className="reset-blog-meta">{post.published_at ? new Date(post.published_at).toLocaleDateString("uk-UA") : "RESET Clinic"}</div>
                <h2>{post.title}</h2>
                <p>{post.excerpt || "Читати матеріал RESET Clinic."}</p>
              </div>
              <div className="reset-blog-meta">{post.author_name || "RESET Clinic"} →</div>
            </Link>
          )) : (
            <div className="reset-blog-card">
              <div>
                <div className="reset-blog-meta">RESET Clinic</div>
                <h2>Нові матеріали готуються</h2>
                <p>Ми поступово додаємо практичні пояснення про здоров’я шкіри, процедури та догляд.</p>
              </div>
            </div>
          )}
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteChrome";
import { getPublishedPostsByCategory } from "../lib/blog";
import {
  BLOG_CATEGORY_MIN_INDEXABLE_POSTS,
  blogCategoryPath,
  getBlogCategory,
  type BlogCategorySlug,
} from "../lib/blog-categories";
import { jsonLd, SITE_NAME, SITE_URL } from "../lib/seo";

async function categoryState(slug: BlogCategorySlug) {
  const category = getBlogCategory(slug);
  if (!category) return null;
  const posts = await getPublishedPostsByCategory(slug, 200);
  const indexablePosts = posts.filter((post) => post.indexable);
  const indexable = indexablePosts.length >= BLOG_CATEGORY_MIN_INDEXABLE_POSTS;
  return { category, posts, indexablePosts, indexable };
}

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
          itemListElement: state.posts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/blog/${post.slug}/`,
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
    <div className="seo-site">
      <PublicSiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
        <section className="reset-blog-hero">
          <div className="reset-blog-eyebrow"><Link href="/blog/">Блог</Link> · {state.category.name}</div>
          <h1>{state.category.name}</h1>
          <p className="reset-blog-lead">{state.category.description}</p>
          <p className="reset-blog-meta">
            <Link href={state.category.landingPath}>Перейти до основного тематичного розділу →</Link>
          </p>
        </section>
        <section className="reset-blog-grid">
          {state.posts.length ? state.posts.map((post) => (
            <Link className="reset-blog-card" href={`/blog/${post.slug}/`} key={post.id}>
              <div>
                <div className="reset-blog-meta">{post.published_at ? new Date(post.published_at).toLocaleDateString("uk-UA") : state.category.name}</div>
                <h2>{post.title}</h2>
                <p>{post.excerpt || "Читати матеріал RESET Clinic."}</p>
              </div>
              <div className="reset-blog-meta">{post.author_name || SITE_NAME} →</div>
            </Link>
          )) : (
            <div className="reset-blog-card">
              <div><div className="reset-blog-meta">Категорія підготовлена</div><h2>Матеріали готуються</h2><p>Сторінка залишається noindex, доки тут не буде щонайменше {BLOG_CATEGORY_MIN_INDEXABLE_POSTS} якісних indexable матеріалів.</p></div>
            </div>
          )}
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

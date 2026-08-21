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
    <div className="seo-site reset-blog-page reset-blog-home">
      {collectionSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionSchema) }} /> : null}
      <PublicSiteHeader />
      <main>
        <section className="reset-blog-hero reset-blog-home-hero">
          <div className="reset-blog-shell reset-blog-hero-grid">
            <div className="reset-blog-hero-copy">
              <div className="reset-blog-eyebrow">Редакція RESET Clinic · Львів</div>
              <h1>Про шкіру й естетичну медицину — зрозуміло.</h1>
              <p className="reset-blog-lead">
                Пояснюємо симптоми, лікування, процедури й догляд без зайвої складності. Матеріали створюються як орієнтир перед консультацією, а не як заміна персональної діагностики.
              </p>
              <div className="reset-blog-hero-notes" aria-label="Принципи редакції">
                <span>Медичний контекст</span>
                <span>Практичні пояснення</span>
                <span>Без універсальних обіцянок</span>
              </div>
            </div>
            <figure className="reset-blog-hero-visual">
              <img src={DEFAULT_OG_IMAGE} alt="Інтер’єр RESET Clinic у Львові" width="2446" height="1314" decoding="async" />
              <figcaption>
                <span>RESET Clinic · knowledge</span>
                <strong>Доказовий підхід до шкіри</strong>
                <small>Кульпарківська, 93/2 · Львів</small>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="reset-blog-topics">
          <div className="reset-blog-shell">
            <div className="reset-blog-section-heading">
              <div>
                <p className="reset-blog-eyebrow">Теми</p>
                <h2>Оберіть те, що вас турбує</h2>
              </div>
              <p>Від симптомів і щоденного догляду — до процедур та медичних напрямів RESET Clinic.</p>
            </div>
            <div className="reset-blog-category-grid" aria-label="Категорії блогу">
              {BLOG_CATEGORIES.map((category, index) => (
                <Link className="reset-blog-category-card" href={blogCategoryPath(category.slug)} key={category.slug}>
                  <div className="reset-blog-card-index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="reset-blog-card-copy">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                  </div>
                  <span className="reset-blog-card-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="reset-blog-latest">
          <div className="reset-blog-shell">
            <div className="reset-blog-section-heading reset-blog-section-heading-light">
              <div>
                <p className="reset-blog-eyebrow">Матеріали</p>
                <h2>Нове від редакції RESET</h2>
              </div>
              <p>Розбір питань, які пацієнти найчастіше ставлять на консультаціях.</p>
            </div>

            {posts.length ? (
              <div className="reset-blog-post-grid" aria-label="Останні матеріали">
                {posts.map((post, index) => (
                  <Link className={`reset-blog-post-card${index === 0 ? " reset-blog-post-card-featured" : ""}`} href={blogPostPath(post)} key={post.id}>
                    <div className="reset-blog-post-meta">
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("uk-UA") : "RESET Clinic"}</span>
                      <span>{post.author_name || "RESET Clinic"}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt || "Практичний матеріал від команди RESET Clinic."}</p>
                    <div className="reset-blog-post-link">Читати матеріал <span>↗</span></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="reset-blog-empty-state">
                <div>
                  <p className="reset-blog-eyebrow">Редакція в роботі</p>
                  <h3>Перші матеріали вже готуються.</h3>
                </div>
                <p>Поки блог наповнюється, ви можете перейти до медичних напрямів RESET Clinic або записатися на консультацію, якщо потрібна персональна оцінка.</p>
                <div className="reset-blog-empty-actions">
                  <Link href="/dermatology/">Перейти до дерматології</Link>
                  <Link href="/booking/">Записатися на консультацію</Link>
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

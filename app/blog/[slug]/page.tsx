import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteFooter, PublicSiteHeader } from "../../../components/PublicSiteChrome";
import { getPublishedPost } from "../../../lib/blog";
import { blogCategoryPath, getBlogCategory } from "../../../lib/blog-categories";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, jsonLd } from "../../../lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: SITE_NAME, robots: { index: false, follow: false } };
  const canonical = post.canonical_url || `${SITE_URL}/blog/${post.slug}/`;
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Матеріал ${SITE_NAME}.`;
  const image = post.og_image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: post.indexable, follow: true, googleBot: { index: post.indexable, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "article", locale: "uk_UA", url: canonical, siteName: SITE_NAME, title, description, publishedTime: post.published_at || undefined, modifiedTime: post.updated_at, authors: post.author_name ? [post.author_name] : undefined, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const url = post.canonical_url || `${SITE_URL}/blog/${post.slug}/`;
  const category = getBlogCategory(post.category);
  const categoryPath = category ? blogCategoryPath(category.slug) : null;
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Головна", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Блог", item: `${SITE_URL}/blog/` },
    ...(category && categoryPath
      ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}${categoryPath}` }]
      : []),
    {
      "@type": "ListItem",
      position: category ? 4 : 3,
      name: post.title,
      item: url,
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": post.schema_type || "MedicalWebPage",
        "@id": `${url}#article`,
        url,
        headline: post.title,
        description: post.seo_description || post.excerpt || undefined,
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at,
        inLanguage: "uk-UA",
        author: post.author_name ? { "@type": "Person", name: post.author_name } : { "@type": "Organization", name: SITE_NAME },
        reviewedBy: post.reviewer_name ? { "@type": "Person", name: post.reviewer_name, jobTitle: post.reviewer_title || undefined } : undefined,
        publisher: { "@id": `${SITE_URL}/#clinic` },
        image: post.og_image ? `${post.og_image}` : `${SITE_URL}${DEFAULT_OG_IMAGE}`,
        about: post.target_keyword || undefined,
        articleSection: category?.name,
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
    ],
  };

  const paragraphs = post.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return (
    <div className="seo-site">
      <PublicSiteHeader />
      <main className="reset-blog-article">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
        <div className="reset-blog-eyebrow">
          <Link href="/blog/">Блог</Link>
          {category && categoryPath ? <><span> · </span><Link href={categoryPath}>{category.name}</Link></> : null}
        </div>
        <h1>{post.title}</h1>
        {post.excerpt ? <p className="intro">{post.excerpt}</p> : null}
        <div className="reset-blog-author">
          <strong>{post.author_name || SITE_NAME}</strong>
          {post.reviewer_name ? <><br /><span>Медичний рецензент: {post.reviewer_name}{post.reviewer_title ? ` · ${post.reviewer_title}` : ""}</span></> : null}
          <br /><span className="reset-blog-meta">Оновлено: {new Date(post.updated_at).toLocaleDateString("uk-UA")}</span>
        </div>
        <article className="reset-blog-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </article>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

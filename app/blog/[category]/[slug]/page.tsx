import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BlogArticlePage from "../../../../components/BlogArticlePage";
import { blogPostPath, getPublishedPost } from "../../../../lib/blog";
import { getBlogCategory } from "../../../../lib/blog-categories";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../../../../lib/seo";

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const post = await getPublishedPost(slug);
  const category = getBlogCategory(categorySlug);
  if (!post || !category || post.category !== category.slug) {
    return { title: SITE_NAME, robots: { index: false, follow: false } };
  }

  const canonical = `${SITE_URL}${blogPostPath(post)}`;
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Матеріал ${SITE_NAME}.`;
  const image = post.og_image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: post.indexable,
      follow: true,
      googleBot: {
        index: post.indexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "article",
      locale: "uk_UA",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function NestedBlogArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const category = getBlogCategory(categorySlug);
  if (!category || post.category !== category.slug) {
    permanentRedirect(blogPostPath(post));
  }

  return <BlogArticlePage post={post} />;
}

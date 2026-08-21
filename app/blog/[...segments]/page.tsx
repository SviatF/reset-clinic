import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BlogArticlePage from "../../../components/BlogArticlePage";
import BlogCategoryPage, { buildBlogCategoryMetadata } from "../../../components/BlogCategoryPage";
import { blogPostPath, getPublishedPost } from "../../../lib/blog";
import { blogCategoryPath, getBlogCategory } from "../../../lib/blog-categories";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../../../lib/seo";

type Props = { params: Promise<{ segments: string[] }> };

async function resolveArticle(segments: string[]) {
  if (segments.length === 1) {
    const post = await getPublishedPost(segments[0]);
    return { post, canonicalRoute: Boolean(post && !post.category) };
  }

  if (segments.length === 2) {
    const [categorySlug, slug] = segments;
    const post = await getPublishedPost(slug);
    const category = getBlogCategory(categorySlug);
    return {
      post,
      canonicalRoute: Boolean(
        post &&
        category &&
        post.category === category.slug &&
        categorySlug === category.publicSlug,
      ),
    };
  }

  return { post: null, canonicalRoute: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;

  if (segments.length === 1) {
    const category = getBlogCategory(segments[0]);
    if (category && segments[0] === category.publicSlug) {
      return buildBlogCategoryMetadata(category.slug);
    }
  }

  const { post, canonicalRoute } = await resolveArticle(segments);
  if (!post) return { title: SITE_NAME, robots: { index: false, follow: false } };

  const canonical = `${SITE_URL}${blogPostPath(post)}`;
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Матеріал ${SITE_NAME}.`;
  const image = post.og_image || DEFAULT_OG_IMAGE;
  const index = post.indexable && canonicalRoute;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
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

export default async function BlogDynamicArticlePage({ params }: Props) {
  const { segments } = await params;

  if (segments.length === 1) {
    const category = getBlogCategory(segments[0]);
    if (category) {
      if (segments[0] !== category.publicSlug) permanentRedirect(blogCategoryPath(category.slug));
      return <BlogCategoryPage slug={category.slug} />;
    }
  }

  const { post, canonicalRoute } = await resolveArticle(segments);
  if (!post) notFound();

  const canonicalPath = blogPostPath(post);
  if (!canonicalRoute) permanentRedirect(canonicalPath);

  return <BlogArticlePage post={post} />;
}

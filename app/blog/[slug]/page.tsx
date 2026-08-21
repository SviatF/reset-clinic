import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BlogArticlePage from "../../../components/BlogArticlePage";
import { blogPostPath, getPublishedPost } from "../../../lib/blog";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../../../lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: SITE_NAME, robots: { index: false, follow: false } };

  const canonical = `${SITE_URL}${blogPostPath(post)}`;
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Матеріал ${SITE_NAME}.`;
  const image = post.og_image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: { type: "article", locale: "uk_UA", url: canonical, siteName: SITE_NAME, title, description, images: [image] },
  };
}

export default async function LegacyBlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const canonicalPath = blogPostPath(post);
  if (post.category && canonicalPath !== `/blog/${post.slug}/`) {
    permanentRedirect(canonicalPath);
  }

  return <BlogArticlePage post={post} />;
}

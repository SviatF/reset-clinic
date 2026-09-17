import type { MetadataRoute } from "next";
import { blogPostPath, getPublishedPosts } from "../lib/blog";
import { BLOG_CATEGORIES, blogCategoryPath } from "../lib/blog-categories";
import { DOCTORS, doctorPath } from "../lib/doctors";
import { SITE_URL } from "../lib/seo";
import { isSeoLandingIndexable } from "../lib/seo-compliance";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/services/` },
    { url: `${SITE_URL}/doctors/` },
    { url: `${SITE_URL}/price/` },
    { url: `${SITE_URL}/about/` },
    { url: `${SITE_URL}/contacts/` },
    { url: `${SITE_URL}/blog/` },
  ];

  const seo: MetadataRoute.Sitemap = ALL_SEO_LANDINGS
    .filter(isSeoLandingIndexable)
    .map((landing) => ({ url: `${SITE_URL}${landing.path}` }));

  const doctors: MetadataRoute.Sitemap = DOCTORS.map((doctor) => ({
    url: `${SITE_URL}${doctorPath(doctor)}`,
  }));

  const posts = await getPublishedPosts(1000);

  const categories: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((category) => {
    const categoryPosts = posts.filter((post) => post.category === category.slug);
    const newestUpdate = categoryPosts.reduce(
      (latest, post) => Math.max(latest, new Date(post.updated_at).getTime()),
      0,
    );
    return {
      url: `${SITE_URL}${blogCategoryPath(category.slug)}`,
      lastModified: newestUpdate ? new Date(newestUpdate) : undefined,
    };
  });

  const blog: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${blogPostPath(post)}`,
    lastModified: new Date(post.updated_at),
  }));

  return [...base, ...seo, ...doctors, ...categories, ...blog];
}

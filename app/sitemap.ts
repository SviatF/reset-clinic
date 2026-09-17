import type { MetadataRoute } from "next";
import { blogPostPath, getPublishedPosts } from "../lib/blog";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_MIN_INDEXABLE_POSTS,
  BLOG_ROOT_MIN_INDEXABLE_POSTS,
  blogCategoryPath,
} from "../lib/blog-categories";
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
  ];

  const seo: MetadataRoute.Sitemap = ALL_SEO_LANDINGS
    .filter(isSeoLandingIndexable)
    .map((landing) => ({ url: `${SITE_URL}${landing.path}` }));

  const doctors: MetadataRoute.Sitemap = DOCTORS.map((doctor) => ({
    url: `${SITE_URL}${doctorPath(doctor)}`,
  }));

  const published = await getPublishedPosts(1000);
  const posts = published.filter((post) => post.indexable);
  const newestBlogUpdate = posts.reduce(
    (latest, post) => Math.max(latest, new Date(post.updated_at).getTime()),
    0,
  );

  const blogRoot: MetadataRoute.Sitemap = posts.length >= BLOG_ROOT_MIN_INDEXABLE_POSTS
    ? [{
        url: `${SITE_URL}/blog/`,
        lastModified: newestBlogUpdate ? new Date(newestBlogUpdate) : undefined,
      }]
    : [];

  const categories: MetadataRoute.Sitemap = BLOG_CATEGORIES.flatMap((category) => {
    const categoryPosts = posts.filter((post) => post.category === category.slug);
    if (categoryPosts.length < BLOG_CATEGORY_MIN_INDEXABLE_POSTS) return [];
    const newestUpdate = categoryPosts.reduce(
      (latest, post) => Math.max(latest, new Date(post.updated_at).getTime()),
      0,
    );
    return [{
      url: `${SITE_URL}${blogCategoryPath(category.slug)}`,
      lastModified: newestUpdate ? new Date(newestUpdate) : undefined,
    }];
  });

  const blog: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${blogPostPath(post)}`,
    lastModified: new Date(post.updated_at),
  }));

  return [...base, ...seo, ...doctors, ...blogRoot, ...categories, ...blog];
}

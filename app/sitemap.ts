import type { MetadataRoute } from "next";
import { getPublishedPosts } from "../lib/blog";
import { SITE_URL } from "../lib/seo";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date("2026-08-20T00:00:00+03:00");
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services/`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/doctors/`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/price/`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about/`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/contacts/`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog/`, lastModified, changeFrequency: "weekly", priority: 0.75 },
  ];

  const seo: MetadataRoute.Sitemap = ALL_SEO_LANDINGS.map((landing) => ({
    url: `${SITE_URL}${landing.path}`,
    lastModified,
    changeFrequency: landing.type === "category" ? "weekly" : "monthly",
    priority: landing.priority,
  }));

  const posts = await getPublishedPosts(1000);
  const blog: MetadataRoute.Sitemap = posts
    .filter((post) => post.indexable)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}/`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...base, ...seo, ...blog];
}

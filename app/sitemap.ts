import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-20T00:00:00+03:00");

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/doctors/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/price/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/contacts/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}

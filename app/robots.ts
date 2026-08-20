import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

/**
 * Public crawl policy.
 *
 * Important: robots.txt is only a crawl directive for compliant crawlers.
 * Private/admin routes are additionally protected with X-Robots-Tag headers
 * and authentication/authorization at the application layer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/preview/",
          "/internal/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

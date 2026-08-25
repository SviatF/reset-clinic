import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getSeoPages, saveSeoAudit } from "../../../../lib/admin-data";
import { isSeoLandingIndexable } from "../../../../lib/seo-compliance";
import { ALL_SEO_LANDINGS } from "../../../../lib/seo-page-resolver";

function first(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function metaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"))?.[1]?.trim() ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i"))?.[1]?.trim() ||
    ""
  );
}

function audit(html: string, indexable: boolean, expectedPath: string) {
  const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = metaContent(html, "description");
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i)?.[1] || "";
  const robots = metaContent(html, "robots").toLowerCase();
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  const schemaCount = (html.match(/application\/ld\+json/gi) || []).length;
  const langOk = /<html[^>]+lang=["']uk(?:-UA)?["']/i.test(html);
  const internalLinks = (html.match(/href=["']\/(?!\/|#)/gi) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const imagesMissingAlt = imageTags.filter((tag) => !/\balt=["'][^"']*["']/i.test(tag)).length;
  const ogTitle = metaContent(html, "og:title");
  const ogDescription = metaContent(html, "og:description");
  const twitterCard = metaContent(html, "twitter:card");
  const issues: string[] = [];
  let score = 0;

  if (title.length >= 20 && title.length <= 70) score += 15; else issues.push("Title: перевірити довжину/наявність");
  if (title && (title.length < 50 || title.length > 60)) issues.push(`Title: ${title.length} символів; редакційна ціль 50–60`);

  if (description.length >= 80 && description.length <= 180) score += 15; else issues.push("Meta description: перевірити довжину/наявність");
  if (description && (description.length < 150 || description.length > 160)) issues.push(`Meta description: ${description.length} символів; редакційна ціль 150–160`);

  if (canonical) {
    try {
      const canonicalPath = new URL(canonical, "https://resetclinic.org").pathname;
      if (canonicalPath === expectedPath) score += 10;
      else issues.push(`Canonical веде на ${canonicalPath}, очікується ${expectedPath}`);
    } catch {
      issues.push("Canonical некоректний");
    }
  } else {
    issues.push("Canonical відсутній");
  }

  if (h1Matches.length === 1 && h1) score += 15;
  else if (!h1Matches.length || !h1) issues.push("H1 відсутній");
  else issues.push(`H1 має бути один: знайдено ${h1Matches.length}`);

  if (schemaCount >= 1) score += 10; else issues.push("JSON-LD schema відсутня");
  if (langOk) score += 5; else issues.push("html lang не uk-UA");
  if (internalLinks >= 3) score += 10; else issues.push("Замало внутрішніх посилань");
  if (wordCount >= 250 || !indexable) score += 10; else issues.push(`Thin content: ${wordCount} слів`);

  const noindex = robots.includes("noindex");
  if ((indexable && !noindex) || (!indexable && noindex)) score += 10;
  else issues.push(indexable ? "Сторінка випадково noindex" : "Noindex-сторінка не має noindex");

  if (imagesMissingAlt > 0) issues.push(`Зображення без alt: ${imagesMissingAlt}`);
  if (!ogTitle || !ogDescription) issues.push("Open Graph: відсутній og:title або og:description");
  if (!twitterCard) issues.push("Twitter Card metadata відсутня");

  return { score: Math.min(score, 100), issues, wordCount, internalLinks, h1: h1 || null };
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const registeredPages = (await getSeoPages())
    .filter((page) => page.status === "published")
    .map((page) => ({ path: page.path, indexable: page.indexable }));
  const landingPages = ALL_SEO_LANDINGS.map((landing) => ({
    path: landing.path,
    indexable: isSeoLandingIndexable(landing),
  }));
  const pages = Array.from(
    new Map([...registeredPages, ...landingPages].map((page) => [page.path, page])).values(),
  );

  const base = process.env.SEO_AUDIT_BASE_URL || request.nextUrl.origin;
  let audited = 0;
  let failed = 0;

  for (const page of pages) {
    try {
      const response = await fetch(new URL(page.path, base), {
        cache: "no-store",
        headers: { "User-Agent": "RESET-SEO-Auditor/1.1" },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = audit(await response.text(), page.indexable, page.path);
      await saveSeoAudit(page.path, result);
      audited += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.redirect(new URL(`/admin/seo/?audited=${audited}&failed=${failed}`, request.url), 303);
}

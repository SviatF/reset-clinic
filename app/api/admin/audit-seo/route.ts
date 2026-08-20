import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { supabaseRest } from "../../../../lib/supabase";

type SeoRow = { id: string; path: string; indexable: boolean };

function first(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function audit(html: string, indexable: boolean) {
  const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]?.trim() || "";
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i)?.[1] || "";
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]?.toLowerCase() || "";
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  const schemaCount = (html.match(/application\/ld\+json/gi) || []).length;
  const langOk = /<html[^>]+lang=["']uk(?:-UA)?["']/i.test(html);
  const internalLinks = (html.match(/href=["']\/(?!\/|#)/gi) || []).length;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = text ? text.split(" ").length : 0;
  const issues: string[] = [];
  let score = 0;

  if (title.length >= 20 && title.length <= 70) score += 15; else issues.push("Title: перевірити довжину/наявність");
  if (description.length >= 80 && description.length <= 180) score += 15; else issues.push("Meta description: перевірити довжину/наявність");
  if (canonical) score += 10; else issues.push("Canonical відсутній");
  if (h1Matches.length >= 1 && h1) score += 15; else issues.push("H1 відсутній");
  if (h1Matches.length > 2) issues.push(`Забагато H1: ${h1Matches.length}`);
  if (schemaCount >= 1) score += 10; else issues.push("JSON-LD schema відсутня");
  if (langOk) score += 5; else issues.push("html lang не uk-UA");
  if (internalLinks >= 3) score += 10; else issues.push("Замало внутрішніх посилань");
  if (wordCount >= 250 || !indexable) score += 10; else issues.push(`Thin content: ${wordCount} слів`);
  const noindex = robots.includes("noindex");
  if ((indexable && !noindex) || (!indexable && noindex)) score += 10;
  else issues.push(indexable ? "Сторінка випадково noindex" : "Noindex-сторінка не має noindex");

  return { score: Math.min(score, 100), issues, wordCount, internalLinks, h1 };
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const pagesResponse = await supabaseRest<SeoRow[]>(
    "seo_pages?select=id,path,indexable&status=eq.published&order=path.asc",
    { method: "GET" },
    { accessToken: session.accessToken },
  );
  const pages = pagesResponse.data ?? [];
  const base = process.env.SEO_AUDIT_BASE_URL || request.nextUrl.origin;
  let audited = 0;

  for (const page of pages) {
    try {
      const response = await fetch(new URL(page.path, base), { cache: "no-store", headers: { "User-Agent": "RESET-SEO-Auditor/1.0" } });
      const html = await response.text();
      const result = audit(html, page.indexable);
      await supabaseRest(
        `seo_pages?id=eq.${encodeURIComponent(page.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            seo_score: result.score,
            audit_issues: result.issues,
            word_count: result.wordCount,
            internal_links: result.internalLinks,
            h1: result.h1 || null,
            last_audited_at: new Date().toISOString(),
          }),
        },
        { accessToken: session.accessToken },
      );
      audited += 1;
    } catch {
      // Keep auditing remaining pages; the failed URL stays unchanged.
    }
  }

  return NextResponse.redirect(new URL(`/admin/seo/?audited=${audited}`, request.url), 303);
}

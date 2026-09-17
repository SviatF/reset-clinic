import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { createBlogPost, getBlogPosts } from "../../../../../lib/admin-data";
import { AUTHORITY_WAVE1_ARTICLES } from "../../../../../lib/seo-authority-wave1";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const existing = await getBlogPosts(2000);
  const existingSlugs = new Set(existing.map((post) => post.slug));
  let seeded = 0;
  let skipped = 0;

  try {
    for (const article of AUTHORITY_WAVE1_ARTICLES) {
      if (existingSlugs.has(article.slug)) {
        skipped += 1;
        continue;
      }

      await createBlogPost({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.metaDescription,
        body: article.body,
        target_keyword: article.primaryKeyword,
        author_name: null,
        reviewer_name: null,
        reviewer_title: null,
        reviewed_at: null,
        seo_title: article.seoTitle,
        seo_description: article.metaDescription,
        canonical_url: null,
        og_image: null,
        sources: article.sources,
        faq: article.faq,
        schema_type: "MedicalWebPage",
        status: "draft",
        published_at: null,
        // Draft status keeps the material non-public. Once explicitly published,
        // public robots policy is always index, follow; noindex is admin-only.
        indexable: true,
      });
      existingSlugs.add(article.slug);
      seeded += 1;
    }
  } catch {
    return NextResponse.redirect(
      new URL(`/admin/content-authority/?error=seed&seeded=${seeded}&skipped=${skipped}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(
    new URL(`/admin/content-authority/?seeded=${seeded}&skipped=${skipped}`, request.url),
    303,
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { createBlogPost, getBlogPosts } from "../../../../../lib/admin-data";
import { BLOG_AUTHORITY_WAVE1 } from "../../../../../lib/blog-authority-wave1";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const existing = await getBlogPosts(1000);
  const existingSlugs = new Set(existing.map((post) => post.slug));
  let created = 0;

  for (const draft of BLOG_AUTHORITY_WAVE1) {
    if (existingSlugs.has(draft.slug)) continue;

    await createBlogPost({
      title: draft.title,
      slug: draft.slug,
      category: draft.category,
      excerpt: draft.excerpt,
      body: draft.body,
      target_keyword: draft.targetKeyword,
      author_name: null,
      reviewer_name: null,
      reviewer_title: null,
      reviewed_at: null,
      seo_title: draft.seoTitle,
      seo_description: draft.seoDescription,
      canonical_url: null,
      og_image: null,
      sources: draft.sources,
      faq: draft.faq,
      schema_type: "BlogPosting",
      status: "draft",
      published_at: null,
      indexable: true,
    });
    created += 1;
  }

  return NextResponse.redirect(new URL(`/admin/blog/?authority_seeded=${created}#materials`, request.url), 303);
}

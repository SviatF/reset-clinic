import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { createBlogPost, getBlogPosts } from "../../../../lib/admin-data";
import { normalizeBlogCategory } from "../../../../lib/blog-categories";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[’'`]/g, "").replace(/[^a-z0-9а-яіїєґ\s-]/giu, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || title);
  if (!title || !slug) return NextResponse.redirect(new URL("/admin/blog/?error=missing", request.url), 303);

  const existing = await getBlogPosts(1000);
  if (existing.some((post) => post.slug === slug)) {
    return NextResponse.redirect(new URL("/admin/blog/?error=slug", request.url), 303);
  }

  const status = String(form.get("status") ?? "draft") === "published" ? "published" : "draft";
  try {
    const post = await createBlogPost({
      title,
      slug,
      category: normalizeBlogCategory(String(form.get("category") ?? "")),
      excerpt: String(form.get("excerpt") ?? "").trim() || null,
      body: String(form.get("body") ?? ""),
      target_keyword: String(form.get("target_keyword") ?? "").trim() || null,
      author_name: String(form.get("author_name") ?? "").trim() || null,
      reviewer_name: String(form.get("reviewer_name") ?? "").trim() || null,
      reviewer_title: String(form.get("reviewer_title") ?? "").trim() || null,
      reviewed_at: null,
      seo_title: String(form.get("seo_title") ?? "").trim() || title,
      seo_description: String(form.get("seo_description") ?? "").trim() || null,
      canonical_url: null,
      og_image: null,
      sources: [],
      faq: [],
      schema_type: "MedicalWebPage",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      indexable: form.get("indexable") === "on",
    });
    return NextResponse.redirect(new URL(`/admin/blog/${post.id}/`, request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/blog/?error=save", request.url), 303);
  }
}

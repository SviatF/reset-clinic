import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { getBlogPost, getBlogPosts, updateBlogPost } from "../../../../../lib/admin-data";

type Context = { params: Promise<{ id: string }> };
function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[’'`]/g, "").replace(/[^a-z0-9а-яіїєґ\s-]/giu, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const { id } = await params;
  const current = await getBlogPost(id);
  if (!current) return NextResponse.redirect(new URL("/admin/blog/?error=missing", request.url), 303);

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? title));
  if (!title || !slug) {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=missing`, request.url), 303);
  }

  const allPosts = await getBlogPosts(1000);
  if (allPosts.some((post) => post.id !== id && post.slug === slug)) {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=slug`, request.url), 303);
  }

  const status = String(form.get("status") ?? "draft") === "published" ? "published" : "draft";

  try {
    await updateBlogPost(id, {
      title,
      slug,
      excerpt: String(form.get("excerpt") ?? "").trim() || null,
      body: String(form.get("body") ?? ""),
      target_keyword: String(form.get("target_keyword") ?? "").trim() || null,
      author_name: String(form.get("author_name") ?? "").trim() || null,
      reviewer_name: String(form.get("reviewer_name") ?? "").trim() || null,
      reviewer_title: String(form.get("reviewer_title") ?? "").trim() || null,
      seo_title: String(form.get("seo_title") ?? "").trim() || title,
      seo_description: String(form.get("seo_description") ?? "").trim() || null,
      status,
      published_at: status === "published" ? current.published_at ?? new Date().toISOString() : null,
      indexable: form.get("indexable") === "on",
      reviewed_at: form.get("reviewed") === "on" ? current.reviewed_at ?? new Date().toISOString() : null,
    });
  } catch {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=save`, request.url), 303);
  }

  return NextResponse.redirect(new URL(`/admin/blog/${id}/?saved=1`, request.url), 303);
}

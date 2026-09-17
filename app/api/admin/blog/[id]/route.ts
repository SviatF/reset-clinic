import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { getBlogPost, getBlogPosts, updateBlogPost } from "../../../../../lib/admin-data";
import { normalizeBlogCategory } from "../../../../../lib/blog-categories";
import { toUkrainianLatinSlug } from "../../../../../lib/blog-slug";

type Context = { params: Promise<{ id: string }> };

function parseArrayJson(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
  return parsed;
}

function stableJson(value: unknown) {
  return JSON.stringify(value ?? []);
}

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const { id } = await params;
  const current = await getBlogPost(id);
  if (!current) return NextResponse.redirect(new URL("/admin/blog/?error=missing", request.url), 303);

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const slug = toUkrainianLatinSlug(String(form.get("slug") ?? "").trim() || title);
  if (!title || !slug) {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=missing`, request.url), 303);
  }

  const allPosts = await getBlogPosts(1000);
  if (allPosts.some((post) => post.id !== id && post.slug === slug)) {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=slug`, request.url), 303);
  }

  let sources: unknown[];
  let faq: unknown[];
  try {
    sources = parseArrayJson(form.get("sources_json"));
    faq = parseArrayJson(form.get("faq_json"));
  } catch {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=json`, request.url), 303);
  }

  const status = String(form.get("status") ?? "draft") === "published" ? "published" : "draft";
  const excerpt = String(form.get("excerpt") ?? "").trim() || null;
  const body = String(form.get("body") ?? "");
  const seoDescription = String(form.get("seo_description") ?? "").trim() || null;
  const contentChanged =
    title !== current.title ||
    excerpt !== current.excerpt ||
    body !== current.body ||
    seoDescription !== current.seo_description ||
    stableJson(sources) !== stableJson(current.sources) ||
    stableJson(faq) !== stableJson(current.faq);
  const reviewRequested = form.get("reviewed") === "on";
  const reviewedAt = reviewRequested && !contentChanged
    ? current.reviewed_at ?? new Date().toISOString()
    : null;

  try {
    await updateBlogPost(id, {
      title,
      slug,
      category: normalizeBlogCategory(String(form.get("category") ?? "")),
      excerpt,
      body,
      target_keyword: String(form.get("target_keyword") ?? "").trim() || null,
      author_name: String(form.get("author_name") ?? "").trim() || null,
      reviewer_name: String(form.get("reviewer_name") ?? "").trim() || null,
      reviewer_title: String(form.get("reviewer_title") ?? "").trim() || null,
      seo_title: String(form.get("seo_title") ?? "").trim() || title,
      seo_description: seoDescription,
      sources,
      faq,
      status,
      published_at: status === "published" ? current.published_at ?? new Date().toISOString() : null,
      indexable: form.get("indexable") === "on",
      reviewed_at: reviewedAt,
    });
  } catch {
    return NextResponse.redirect(new URL(`/admin/blog/${id}/?error=save`, request.url), 303);
  }

  const reviewReset = contentChanged && Boolean(current.reviewed_at) ? "&review_reset=1" : "";
  return NextResponse.redirect(new URL(`/admin/blog/${id}/?saved=1${reviewReset}`, request.url), 303);
}

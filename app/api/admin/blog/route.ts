import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { supabaseRest } from "../../../../lib/supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9а-яіїєґ\s-]/giu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const rawSlug = String(form.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || title);
  if (!title || !slug) return NextResponse.redirect(new URL("/admin/blog/?error=missing", request.url), 303);

  const post = {
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
    status: String(form.get("status") ?? "draft") === "published" ? "published" : "draft",
    published_at: String(form.get("status") ?? "draft") === "published" ? new Date().toISOString() : null,
    indexable: form.get("indexable") === "on",
  };

  const response = await supabaseRest<Array<{ id: string }>>(
    "blog_posts?select=id",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(post),
    },
    { accessToken: session.accessToken },
  );

  if (!response.ok || !response.data?.[0]) {
    return NextResponse.redirect(new URL("/admin/blog/?error=save", request.url), 303);
  }

  return NextResponse.redirect(new URL(`/admin/blog/${response.data[0].id}/`, request.url), 303);
}

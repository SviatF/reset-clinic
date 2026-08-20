import { isSupabaseConfigured, supabaseRest } from "./supabase";

export type PublicBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  author_name: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  reviewed_at: string | null;
  target_keyword: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  sources: unknown[];
  faq: unknown[];
  schema_type: string;
  published_at: string | null;
  updated_at: string;
  indexable: boolean;
};

export async function getPublishedPosts(limit = 100) {
  if (!isSupabaseConfigured()) return [] as PublicBlogPost[];
  const response = await supabaseRest<PublicBlogPost[]>(
    `blog_posts?select=id,slug,title,excerpt,body,author_name,reviewer_name,reviewer_title,reviewed_at,target_keyword,seo_title,seo_description,canonical_url,og_image,sources,faq,schema_type,published_at,updated_at,indexable&status=eq.published&indexable=eq.true&order=published_at.desc&limit=${limit}`,
    { method: "GET" },
  );
  return response.ok && response.data ? response.data : [];
}

export async function getPublishedPost(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseRest<PublicBlogPost[]>(
    `blog_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { method: "GET" },
  );
  return response.ok ? response.data?.[0] ?? null : null;
}

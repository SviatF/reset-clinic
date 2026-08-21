import { getBlogPosts, type BlogPost } from "./admin-data";
import { getBlogCategory, type BlogCategorySlug } from "./blog-categories";

export type PublicBlogPost = BlogPost;

export async function getPublishedPosts(limit = 100) {
  const posts = await getBlogPosts(Math.max(limit, 200));
  return posts
    .filter((post) => post.status === "published")
    .sort(
      (a, b) =>
        new Date(b.published_at || b.updated_at).getTime() -
        new Date(a.published_at || a.updated_at).getTime(),
    )
    .slice(0, limit);
}

export async function getPublishedPostsByCategory(category: BlogCategorySlug, limit = 100) {
  const posts = await getPublishedPosts(Math.max(limit, 1000));
  return posts.filter((post) => post.category === category).slice(0, limit);
}

export async function getPublishedPost(slug: string) {
  const posts = await getBlogPosts(1000);
  return (
    posts.find(
      (post) => post.status === "published" && post.slug === slug,
    ) ?? null
  );
}

export function blogPostPath(post: Pick<BlogPost, "slug" | "category">) {
  const category = getBlogCategory(post.category);
  return category ? `/blog/${category.slug}/${post.slug}/` : `/blog/${post.slug}/`;
}

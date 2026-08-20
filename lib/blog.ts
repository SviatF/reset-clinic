import { getBlogPosts, type BlogPost } from "./admin-data";

export type PublicBlogPost = BlogPost;

export async function getPublishedPosts(limit = 100) {
  const posts = await getBlogPosts(Math.max(limit, 200));
  return posts
    .filter((post) => post.status === "published" && post.indexable)
    .sort(
      (a, b) =>
        new Date(b.published_at || b.updated_at).getTime() -
        new Date(a.published_at || a.updated_at).getTime(),
    )
    .slice(0, limit);
}

export async function getPublishedPost(slug: string) {
  const posts = await getBlogPosts(1000);
  return (
    posts.find(
      (post) => post.status === "published" && post.slug === slug && post.indexable,
    ) ?? null
  );
}

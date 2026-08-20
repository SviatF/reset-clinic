import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { supabaseRest } from "../../../../../lib/supabase";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  target_keyword: string | null;
  author_name: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  reviewed_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  indexable: boolean;
  updated_at: string;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminBlogEditorPage({ params, searchParams }: Props) {
  const { accessToken } = await requireAdmin();
  const { id } = await params;
  const query = await supabaseRest<Post[]>(
    `blog_posts?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
    { accessToken },
  );
  const post = query.data?.[0];
  if (!post) notFound();
  const state = await searchParams;

  return (
    <>
      <header className="admin-topbar">
        <div><div className="admin-label"><Link href="/admin/blog/">← Блог</Link></div><h1>Редагування</h1><div className="admin-subtitle">{post.title}</div></div>
        <a className="admin-btn secondary" href={`/blog/${post.slug}/`} target="_blank" rel="noreferrer">Переглянути</a>
      </header>
      {state.saved ? <div className="admin-alert good">Зміни збережені.</div> : null}
      <section className="admin-card">
        <form className="admin-form" action={`/api/admin/blog/${post.id}`} method="post">
          <div className="admin-form-row"><label>Заголовок<input name="title" defaultValue={post.title} required /></label><label>Slug<input name="slug" defaultValue={post.slug} required /></label></div>
          <label>Короткий опис<textarea name="excerpt" rows={3} defaultValue={post.excerpt ?? ""} /></label>
          <label>Основний текст<textarea name="body" rows={20} defaultValue={post.body} /></label>
          <div className="admin-form-row"><label>Primary keyword<input name="target_keyword" defaultValue={post.target_keyword ?? ""} /></label><label>Автор<input name="author_name" defaultValue={post.author_name ?? ""} /></label></div>
          <div className="admin-form-row"><label>Лікар-рецензент<input name="reviewer_name" defaultValue={post.reviewer_name ?? ""} /></label><label>Посада reviewer<input name="reviewer_title" defaultValue={post.reviewer_title ?? ""} /></label></div>
          <label>SEO Title<input name="seo_title" defaultValue={post.seo_title ?? ""} /></label>
          <label>Meta Description<textarea name="seo_description" rows={3} defaultValue={post.seo_description ?? ""} /></label>
          <div className="admin-form-row"><label>Статус<select name="status" defaultValue={post.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label style={{ alignContent: "end" }}><span><input type="checkbox" name="indexable" defaultChecked={post.indexable} style={{ width: "auto" }} /> Indexable</span></label></div>
          <label><span><input type="checkbox" name="reviewed" defaultChecked={Boolean(post.reviewed_at)} style={{ width: "auto" }} /> Матеріал перевірений лікарем</span></label>
          <button className="admin-btn" type="submit">Зберегти</button>
        </form>
      </section>
    </>
  );
}

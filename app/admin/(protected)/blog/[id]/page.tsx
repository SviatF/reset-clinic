import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { getBlogPost } from "../../../../../lib/admin-data";
import { BLOG_CATEGORIES } from "../../../../../lib/blog-categories";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Заголовок і slug не можуть бути порожніми.",
  slug: "Такий slug уже використовується іншим матеріалом.",
  save: "Не вдалося зберегти зміни. Спробуйте ще раз.",
};

export default async function AdminBlogEditorPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();
  const state = await searchParams;

  return (
    <>
      <header className="admin-topbar">
        <div><div className="admin-label"><Link href="/admin/blog/">← Блог</Link></div><h1>Редагування</h1><div className="admin-subtitle">{post.title}</div></div>
        {post.status === "published" ? <a className="admin-btn secondary" href={`/blog/${post.slug}/`} target="_blank" rel="noreferrer">Переглянути</a> : null}
      </header>
      {state.saved ? <div className="admin-alert good">Зміни збережені.</div> : null}
      {state.error ? <div className="admin-alert bad">{errorMessages[state.error] || "Не вдалося зберегти зміни."}</div> : null}
      <section className="admin-card">
        <form className="admin-form" action={`/api/admin/blog/${post.id}`} method="post">
          <div className="admin-form-row"><label>Заголовок<input name="title" defaultValue={post.title} required /></label><label>Slug<input name="slug" defaultValue={post.slug} required /></label></div>
          <div className="admin-form-row">
            <label>SEO категорія<select name="category" defaultValue={post.category ?? ""}><option value="">Без категорії</option>{BLOG_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
            <label>Primary keyword<input name="target_keyword" defaultValue={post.target_keyword ?? ""} /></label>
          </div>
          <label>Короткий опис<textarea name="excerpt" rows={3} defaultValue={post.excerpt ?? ""} /></label>
          <label>Основний текст<textarea name="body" rows={20} defaultValue={post.body} /></label>
          <div className="admin-form-row"><label>Автор<input name="author_name" defaultValue={post.author_name ?? ""} /></label><label>Лікар-рецензент<input name="reviewer_name" defaultValue={post.reviewer_name ?? ""} /></label></div>
          <label>Посада reviewer<input name="reviewer_title" defaultValue={post.reviewer_title ?? ""} /></label>
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

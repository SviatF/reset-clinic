import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { getBlogPost } from "../../../../../lib/admin-data";
import { blogWordCount, hasVerifiedClinicalAuthor, hasVerifiedClinicalReviewer, isBlogPostSeoReady } from "../../../../../lib/blog-quality";
import { BLOG_CATEGORIES } from "../../../../../lib/blog-categories";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Заголовок і slug не можуть бути порожніми.",
  slug: "Такий slug уже використовується іншим матеріалом.",
  json: "Sources або FAQ містять некоректний JSON. Потрібен масив [...].",
  save: "Не вдалося зберегти зміни. Спробуйте ще раз.",
};

export default async function AdminBlogEditorPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();
  const state = await searchParams;
  const ready = isBlogPostSeoReady(post);
  const words = blogWordCount(post.body);
  const checks = [
    { label: "Verified doctor author", ok: hasVerifiedClinicalAuthor(post) },
    { label: "Verified doctor reviewer", ok: hasVerifiedClinicalReviewer(post) },
    { label: "Medical review date", ok: Boolean(post.reviewed_at) },
    { label: "2+ authority sources", ok: Array.isArray(post.sources) && post.sources.length >= 2 },
    { label: "450+ words", ok: words >= 450 },
    { label: "SEO description", ok: Boolean(post.seo_description?.trim() || post.excerpt?.trim()) },
  ];

  return (
    <>
      <header className="admin-topbar">
        <div><div className="admin-label"><Link href="/admin/blog/">← Блог</Link></div><h1>Редагування</h1><div className="admin-subtitle">{post.title}</div></div>
        {post.status === "published" ? <a className="admin-btn secondary" href={`/blog/${post.slug}/`} target="_blank" rel="noreferrer">Переглянути</a> : null}
      </header>
      {state.saved ? <div className="admin-alert good">Зміни збережені.</div> : null}
      {state.error ? <div className="admin-alert bad">{errorMessages[state.error] || "Не вдалося зберегти зміни."}</div> : null}

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">Medical SEO gate</div><div className="admin-metric">{ready ? "READY" : "HOLD"}</div><div className="admin-kpi-note">{ready ? "може індексуватися після publish" : "Google отримує noindex"}</div></div>
        <div className="admin-card"><div className="admin-label">Words</div><div className="admin-metric">{words}</div><div className="admin-kpi-note">мінімум 450</div></div>
        <div className="admin-card"><div className="admin-label">Sources</div><div className="admin-metric">{post.sources.length}</div><div className="admin-kpi-note">мінімум 2</div></div>
        <div className="admin-card"><div className="admin-label">FAQ</div><div className="admin-metric">{post.faq.length}</div><div className="admin-kpi-note">структуровані питання</div></div>
      </section>

      <section className="admin-section">
        <div className="admin-card">
          <h2>Index readiness</h2>
          <div className="admin-table-wrap">
            <table className="admin-table"><tbody>{checks.map((check) => <tr key={check.label}><td>{check.label}</td><td><span className={`admin-badge ${check.ok ? "good" : "warn"}`}>{check.ok ? "OK" : "PENDING"}</span></td></tr>)}</tbody></table>
          </div>
          <div className="admin-alert">Статус Published сам по собі не відкриває індексацію. Реальний robots/sitemap gate проходить тільки коли всі медичні вимоги вище виконані.</div>
        </div>
      </section>

      <section className="admin-card admin-section">
        <form className="admin-form" action={`/api/admin/blog/${post.id}`} method="post">
          <div className="admin-form-row"><label>Заголовок<input name="title" defaultValue={post.title} required /></label><label>Slug<input name="slug" defaultValue={post.slug} required /></label></div>
          <div className="admin-form-row">
            <label>SEO категорія<select name="category" defaultValue={post.category ?? ""}><option value="">Без категорії</option>{BLOG_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
            <label>Primary keyword<input name="target_keyword" defaultValue={post.target_keyword ?? ""} /></label>
          </div>
          <label>Короткий опис<textarea name="excerpt" rows={3} defaultValue={post.excerpt ?? ""} /></label>
          <label>Основний текст<textarea name="body" rows={24} defaultValue={post.body} /></label>
          <div className="admin-form-row"><label>Автор<input name="author_name" defaultValue={post.author_name ?? ""} /><span className="admin-kpi-note">Для index gate ПІБ має точно збігатися з профілем лікаря RESET Clinic.</span></label><label>Лікар-рецензент<input name="reviewer_name" defaultValue={post.reviewer_name ?? ""} /><span className="admin-kpi-note">Вказувати тільки після фактичного review.</span></label></div>
          <label>Посада reviewer<input name="reviewer_title" defaultValue={post.reviewer_title ?? ""} /></label>
          <label>Sources JSON<textarea name="sources_json" rows={10} defaultValue={JSON.stringify(post.sources, null, 2)} /><span className="admin-kpi-note">Масив об’єктів, напр. {`[{"title":"AAD — Acne","url":"https://..."}]`}.</span></label>
          <label>FAQ JSON<textarea name="faq_json" rows={10} defaultValue={JSON.stringify(post.faq, null, 2)} /><span className="admin-kpi-note">Масив {`[{"question":"...","answer":"..."}]`}.</span></label>
          <label>SEO Title<input name="seo_title" defaultValue={post.seo_title ?? ""} /></label>
          <label>Meta Description<textarea name="seo_description" rows={3} defaultValue={post.seo_description ?? ""} /></label>
          <div className="admin-form-row"><label>Статус<select name="status" defaultValue={post.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label style={{ alignContent: "end" }}><span><input type="checkbox" name="indexable" defaultChecked={post.indexable} style={{ width: "auto" }} /> Запросити індексацію після проходження gate</span></label></div>
          <label><span><input type="checkbox" name="reviewed" defaultChecked={Boolean(post.reviewed_at)} style={{ width: "auto" }} /> Матеріал фактично перевірений вказаним лікарем</span></label>
          <button className="admin-btn" type="submit">Зберегти</button>
        </form>
      </section>
    </>
  );
}

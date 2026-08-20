import Link from "next/link";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getBlogPosts } from "../../../../lib/admin-data";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminBlogPage({ searchParams }: Props) {
  const { accessToken } = await requireAdmin();
  const posts = await getBlogPosts(accessToken);
  const params = await searchParams;

  return (
    <>
      <header className="admin-topbar">
        <div><h1>Блог / CMS</h1><div className="admin-subtitle">Медичний контент, SEO metadata, автор і reviewer для E-E-A-T.</div></div>
        <div className="admin-label">{posts.length} матеріалів</div>
      </header>

      {params.error ? <div className="admin-alert bad">Не вдалося зберегти матеріал. Перевірте slug і обов’язкові поля.</div> : null}

      <section className="admin-two-col">
        <div className="admin-card">
          <h2>Новий матеріал</h2>
          <form className="admin-form" action="/api/admin/blog" method="post">
            <div className="admin-form-row">
              <label>Заголовок<input name="title" required /></label>
              <label>Slug<input name="slug" placeholder="botoks-lviv" /></label>
            </div>
            <label>Короткий опис<textarea name="excerpt" rows={3} /></label>
            <label>Основний текст<textarea name="body" rows={10} placeholder="Пишемо доказово, структуровано, без медичних обіцянок..." /></label>
            <div className="admin-form-row">
              <label>Primary keyword<input name="target_keyword" /></label>
              <label>Автор<input name="author_name" /></label>
            </div>
            <div className="admin-form-row">
              <label>Лікар-рецензент<input name="reviewer_name" /></label>
              <label>Посада reviewer<input name="reviewer_title" /></label>
            </div>
            <label>SEO Title<input name="seo_title" /></label>
            <label>Meta Description<textarea name="seo_description" rows={3} /></label>
            <div className="admin-form-row">
              <label>Статус<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label>
              <label style={{ alignContent: "end" }}><span><input type="checkbox" name="indexable" defaultChecked style={{ width: "auto" }} /> Дозволити індексацію</span></label>
            </div>
            <button className="admin-btn" type="submit">Створити матеріал</button>
          </form>
        </div>

        <div className="admin-card">
          <h2>YMYL checklist</h2>
          <p>Для медичного контенту перед публікацією фіксуємо автора, лікаря-рецензента, дату перевірки, джерела та конкретний SEO intent.</p>
          <div className="admin-alert">FAQ і sources вже передбачені в схемі БД; наступні SEO-лендінги використовуватимуть той самий контентний стандарт.</div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Матеріали</h2><span>{posts.filter((p) => p.status === "published").length} published</span></div>
        <div className="admin-table-wrap">
          {posts.length ? <table className="admin-table"><thead><tr><th>Матеріал</th><th>SEO target</th><th>Автор / reviewer</th><th>Статус</th><th>Оновлено</th><th></th></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td><strong>{post.title}</strong><br /><span className="admin-code">/blog/{post.slug}/</span></td><td>{post.target_keyword || "—"}<br /><span className="admin-kpi-note">{post.seo_title || "SEO title не заданий"}</span></td><td>{post.author_name || "—"}<br /><span className="admin-kpi-note">Reviewer: {post.reviewer_name || "—"}</span></td><td><span className={`admin-badge ${post.status === "published" ? "good" : "warn"}`}>{post.status}</span>{!post.indexable ? <><br /><span className="admin-badge warn">noindex</span></> : null}</td><td>{new Date(post.updated_at).toLocaleString("uk-UA")}</td><td><Link className="admin-btn secondary" href={`/admin/blog/${post.id}/`}>Редагувати</Link></td></tr>)}</tbody></table> : <div className="admin-empty">Матеріалів ще немає.</div>}
        </div>
      </section>
    </>
  );
}

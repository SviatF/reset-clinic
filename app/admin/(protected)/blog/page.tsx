import Link from "next/link";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getBlogPosts } from "../../../../lib/admin-data";
import { BLOG_CATEGORIES, getBlogCategory } from "../../../../lib/blog-categories";
import { getSeoContentPlanItem, SEO_CONTENT_PLAN } from "../../../../lib/seo-content-plan";

type Props = { searchParams: Promise<{ error?: string; plan?: string }> };

const errorMessages: Record<string, string> = {
  missing: "Заповніть заголовок і коректний slug.",
  slug: "Такий slug уже використовується іншим матеріалом.",
  save: "Не вдалося зберегти матеріал. Перевірте storage та спробуйте ще раз.",
};

const intentLabels = {
  informational: "Інформаційний",
  comparison: "Порівняння",
  "pre-procedure": "Перед процедурою",
  diagnostic: "Діагностичний",
} as const;

export default async function AdminBlogPage({ searchParams }: Props) {
  await requireAdmin();
  const posts = await getBlogPosts();
  const params = await searchParams;
  const selectedPlan = getSeoContentPlanItem(params.plan);
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const planStarted = SEO_CONTENT_PLAN.filter((item) => postsBySlug.has(item.slug)).length;
  const p1Count = SEO_CONTENT_PLAN.filter((item) => item.priority === "P1").length;

  return (
    <>
      <header className="admin-topbar">
        <div><h1>Блог / CMS</h1><div className="admin-subtitle">Медичний контент, SEO metadata, категорії, автор і reviewer для E-E-A-T.</div></div>
        <div className="admin-label">{posts.length} матеріалів</div>
      </header>

      {params.error ? <div className="admin-alert bad">{errorMessages[params.error] || "Не вдалося зберегти матеріал."}</div> : null}

      <section className="admin-two-col" id="new-material">
        <div className="admin-card">
          <h2>{selectedPlan ? "Новий матеріал із SEO plan" : "Новий матеріал"}</h2>
          {selectedPlan ? (
            <div className="admin-alert">
              <strong>{selectedPlan.priority} · {intentLabels[selectedPlan.intent]}</strong><br />
              Primary money page: <Link href={selectedPlan.moneyPage.href} target="_blank">{selectedPlan.moneyPage.label}</Link><br />
              <span className="admin-kpi-note">{selectedPlan.angle}</span>
            </div>
          ) : null}
          <form className="admin-form" action="/api/admin/blog" method="post">
            <div className="admin-form-row">
              <label>Заголовок<input name="title" required defaultValue={selectedPlan?.title || ""} /></label>
              <label>Slug<input name="slug" placeholder="botoks-lviv" defaultValue={selectedPlan?.slug || ""} /></label>
            </div>
            <div className="admin-form-row">
              <label>SEO категорія<select name="category" defaultValue={selectedPlan?.category || ""}><option value="">Без категорії</option>{BLOG_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
              <label>Primary keyword<input name="target_keyword" defaultValue={selectedPlan?.primaryKeyword || ""} /></label>
            </div>
            <label>Короткий опис<textarea name="excerpt" rows={3} defaultValue={selectedPlan?.metaDescription || ""} /></label>
            <label>Основний текст<textarea name="body" rows={10} placeholder="Пишемо доказово, структуровано, без медичних обіцянок..." /></label>
            <div className="admin-form-row"><label>Автор<input name="author_name" /></label><label>Лікар-рецензент<input name="reviewer_name" /></label></div>
            <label>Посада reviewer<input name="reviewer_title" /></label>
            <label>SEO Title<input name="seo_title" defaultValue={selectedPlan?.seoTitle || ""} /></label>
            <label>Meta Description<textarea name="seo_description" rows={3} defaultValue={selectedPlan?.metaDescription || ""} /></label>
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
          <div className="admin-alert">Категорія блогу автоматично залишається noindex, доки не матиме щонайменше 4 published + indexable матеріали. Це захищає сайт від thin taxonomy pages.</div>
          <div className="admin-alert">
            <strong>Контент-кластер:</strong> {SEO_CONTENT_PLAN.length} тем · {p1Count} пріоритету P1 · {planStarted} уже заведено в CMS · {publishedCount} published.
          </div>
          {selectedPlan ? (
            <div className="admin-alert">
              <strong>Обов’язкова перелінковка</strong><br />
              <Link href={selectedPlan.moneyPage.href} target="_blank">→ {selectedPlan.moneyPage.label}</Link><br />
              {selectedPlan.supportingPages.map((item) => <span key={item.href}><Link href={item.href} target="_blank">→ {item.label}</Link><br /></span>)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>SEO Content Plan</h2><span>{SEO_CONTENT_PLAN.length} тем · 7 кластерів</span></div>
        <div className="admin-alert">Логіка: блог забирає informational / comparison / pre-procedure запити, а комерційні запити залишаються за service та problem pages. Так ми будуємо topical authority без keyword cannibalization.</div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Пріоритет / тема</th><th>Кластер / keyword</th><th>Intent</th><th>Money page</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {SEO_CONTENT_PLAN.map((item) => {
                const existing = postsBySlug.get(item.slug);
                return (
                  <tr key={item.slug}>
                    <td><span className={`admin-badge ${item.priority === "P1" ? "bad" : item.priority === "P2" ? "warn" : ""}`}>{item.priority}</span><br /><strong>{item.title}</strong><br /><span className="admin-code">/blog/{item.category}/{item.slug}/</span></td>
                    <td>{getBlogCategory(item.category)?.name}<br /><span className="admin-kpi-note">{item.primaryKeyword}</span></td>
                    <td>{intentLabels[item.intent]}<br /><span className="admin-kpi-note">{item.angle}</span></td>
                    <td><Link href={item.moneyPage.href} target="_blank">{item.moneyPage.label} ↗</Link><br /><span className="admin-kpi-note">+ {item.supportingPages.length} supporting links</span></td>
                    <td>{existing ? <><span className={`admin-badge ${existing.status === "published" ? "good" : "warn"}`}>{existing.status}</span>{!existing.indexable ? <><br /><span className="admin-badge warn">noindex</span></> : null}</> : <span className="admin-badge">planned</span>}</td>
                    <td>{existing ? <Link className="admin-btn secondary" href={`/admin/blog/${existing.id}/`}>Редагувати</Link> : <Link className="admin-btn secondary" href={`/admin/blog/?plan=${item.slug}#new-material`}>Взяти в роботу</Link>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Матеріали</h2><span>{publishedCount} published</span></div>
        <div className="admin-table-wrap">
          {posts.length ? <table className="admin-table"><thead><tr><th>Матеріал</th><th>Категорія / SEO target</th><th>Автор / reviewer</th><th>Статус</th><th>Оновлено</th><th></th></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td><strong>{post.title}</strong><br /><span className="admin-code">/blog/{post.slug}/</span></td><td>{getBlogCategory(post.category)?.name || "Без категорії"}<br /><span className="admin-kpi-note">{post.target_keyword || "Keyword не заданий"}</span></td><td>{post.author_name || "—"}<br /><span className="admin-kpi-note">Reviewer: {post.reviewer_name || "—"}</span></td><td><span className={`admin-badge ${post.status === "published" ? "good" : "warn"}`}>{post.status}</span>{!post.indexable ? <><br /><span className="admin-badge warn">noindex</span></> : null}</td><td>{new Date(post.updated_at).toLocaleString("uk-UA")}</td><td><Link className="admin-btn secondary" href={`/admin/blog/${post.id}/`}>Редагувати</Link></td></tr>)}</tbody></table> : <div className="admin-empty">Матеріалів ще немає. Почни з P1 тем у SEO Content Plan вище.</div>}
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { getBlogPosts } from "../../../../../lib/admin-data";
import { BLOG_AUTHORITY_WAVE1 } from "../../../../../lib/blog-authority-wave1";
import { blogCategoryPath, getBlogCategory } from "../../../../../lib/blog-categories";

export default async function AuthorityWavePage() {
  await requireAdmin();
  const posts = await getBlogPosts(1000);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const created = BLOG_AUTHORITY_WAVE1.filter((draft) => bySlug.has(draft.slug)).length;

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Content Authority · Wave 1</h1>
          <div className="admin-subtitle">6 готових YMYL-safe SEO drafts: dermatology + acne. Публікація тільки після авторства та clinical review.</div>
        </div>
        <Link className="admin-btn secondary" href="/admin/blog/">← Блог / CMS</Link>
      </header>

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">Wave 1</div><div className="admin-metric">{BLOG_AUTHORITY_WAVE1.length}</div><div className="admin-kpi-note">готових draft-матеріалів</div></div>
        <div className="admin-card"><div className="admin-label">У CMS</div><div className="admin-metric">{created}</div><div className="admin-kpi-note">із {BLOG_AUTHORITY_WAVE1.length}</div></div>
        <div className="admin-card"><div className="admin-label">Auto publish</div><div className="admin-metric">0</div><div className="admin-kpi-note">тільки ручний medical review</div></div>
      </section>

      <section className="admin-section">
        <div className="admin-alert">
          Усі матеріали вже мають SEO title, meta description, primary keyword, готовий body, FAQ, authoritative sources і привʼязку до існуючого content plan. Автор та reviewer навмисно не проставляються автоматично.
        </div>
        {created < BLOG_AUTHORITY_WAVE1.length ? (
          <form action="/api/admin/blog/seed-authority" method="post">
            <button className="admin-btn" type="submit">Додати Wave 1 у CMS як drafts</button>
          </form>
        ) : (
          <div className="admin-alert good">Wave 1 уже заведена в CMS.</div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Матеріали Wave 1</h2><span>Authority → money pages → booking</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Матеріал</th><th>Кластер</th><th>Keyword</th><th>Sources / FAQ</th><th>CMS</th></tr></thead>
            <tbody>
              {BLOG_AUTHORITY_WAVE1.map((draft) => {
                const existing = bySlug.get(draft.slug);
                const category = getBlogCategory(draft.category);
                return (
                  <tr key={draft.slug}>
                    <td><strong>{draft.title}</strong><br /><span className="admin-code">{category ? `${blogCategoryPath(category.slug)}${draft.slug}/` : `/blog/${draft.slug}/`}</span></td>
                    <td>{category?.name || draft.category}</td>
                    <td>{draft.targetKeyword}</td>
                    <td>{draft.sources.length} sources · {draft.faq.length} FAQ</td>
                    <td>{existing ? <><span className={`admin-badge ${existing.status === "published" ? "good" : "warn"}`}>{existing.status}</span><br /><Link href={`/admin/blog/${existing.id}/`}>Редагувати ↗</Link></> : <span className="admin-badge">ready to seed</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

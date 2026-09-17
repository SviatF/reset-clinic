import Link from "next/link";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getBlogPosts } from "../../../../lib/admin-data";
import { blogWordCount, isBlogPostSeoReady } from "../../../../lib/blog-quality";
import { DOCTORS, doctorPath } from "../../../../lib/doctors";
import { AUTHORITY_WAVE1_ARTICLES, AUTHORITY_WAVE1_STATS } from "../../../../lib/seo-authority-wave1";

type Props = {
  searchParams: Promise<{ seeded?: string; skipped?: string; error?: string }>;
};

export default async function ContentAuthorityPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const posts = await getBlogPosts(2000);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const imported = AUTHORITY_WAVE1_ARTICLES.filter((article) => bySlug.has(article.slug)).length;
  const medicallyReady = AUTHORITY_WAVE1_ARTICLES.filter((article) => {
    const post = bySlug.get(article.slug);
    return post ? isBlogPostSeoReady(post) : false;
  }).length;
  const published = AUTHORITY_WAVE1_ARTICLES.filter((article) => bySlug.get(article.slug)?.status === "published").length;

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Content Authority</h1>
          <div className="admin-subtitle">Медичний editorial pipeline: research → draft → doctor review → publish → index.</div>
        </div>
        <form action="/api/admin/blog/seed-authority-wave1" method="post">
          <button className="admin-btn" type="submit">Імпортувати Wave 1 у CMS</button>
        </form>
      </header>

      {params.seeded !== undefined ? (
        <div className="admin-alert good">Wave 1 синхронізовано: створено {Number(params.seeded || 0)} draft, пропущено існуючих {Number(params.skipped || 0)}. Існуючі матеріали не перезаписувалися.</div>
      ) : null}
      {params.error ? <div className="admin-alert bad">Seed зупинився через помилку storage. Уже створені draft не дублюватимуться при повторному запуску.</div> : null}

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">Wave 1</div><div className="admin-metric">{AUTHORITY_WAVE1_STATS.total}</div><div className="admin-kpi-note">готових editorial draft specs</div></div>
        <div className="admin-card"><div className="admin-label">У CMS</div><div className="admin-metric">{imported}</div><div className="admin-kpi-note">{AUTHORITY_WAVE1_STATS.total - imported} ще не імпортовано</div></div>
        <div className="admin-card"><div className="admin-label">Medical ready</div><div className="admin-metric">{medicallyReady}</div><div className="admin-kpi-note">author + reviewer + reviewed_at + sources + 450+ words</div></div>
        <div className="admin-card"><div className="admin-label">Published</div><div className="admin-metric">{published}</div><div className="admin-kpi-note">Index можливий лише після medical gate</div></div>
      </section>

      <section className="admin-section">
        <div className="admin-alert">
          <strong>Безпечний workflow.</strong> Seed створює лише <strong>draft + noindex</strong>. Suggested doctor — це редакційний маршрут, а не автоматичне авторство чи медична рецензія. ПІБ лікаря можна ставити в author/reviewer лише після фактичного погодження конкретного матеріалу.
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Wave 1 production queue</h2><span>{AUTHORITY_WAVE1_STATS.total} матеріалів</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Priority / тема</th><th>Cluster / keyword</th><th>Suggested doctor</th><th>Authority</th><th>Money page</th><th>CMS</th></tr></thead>
            <tbody>
              {AUTHORITY_WAVE1_ARTICLES.map((article) => {
                const post = bySlug.get(article.slug);
                const doctor = DOCTORS.find((item) => item.slug === article.suggestedDoctorSlug);
                const ready = post ? isBlogPostSeoReady(post) : false;
                return (
                  <tr key={article.slug}>
                    <td><span className={`admin-badge ${article.priority === "P1" ? "bad" : article.priority === "P2" ? "warn" : ""}`}>{article.priority}</span><br /><strong>{article.title}</strong><br /><span className="admin-code">{article.slug}</span></td>
                    <td>{article.category}<br /><span className="admin-kpi-note">{article.primaryKeyword}</span></td>
                    <td>{doctor ? <><Link href={doctorPath(doctor)} target="_blank">{doctor.name} ↗</Link><br /><span className="admin-kpi-note">{doctor.role}</span></> : <span className="admin-badge warn">needs mapping</span>}</td>
                    <td><strong>{blogWordCount(article.body)} words</strong><br /><span className="admin-kpi-note">{article.sources.length} sources · {article.faq.length} FAQ</span></td>
                    <td><Link href={article.moneyPage.href} target="_blank">{article.moneyPage.label} ↗</Link><br /><span className="admin-kpi-note">+ {article.supportingPages.length} supporting</span></td>
                    <td>{post ? <><span className={`admin-badge ${ready ? "good" : "warn"}`}>{ready ? "SEO READY" : post.status}</span>{!ready ? <><br /><span className="admin-kpi-note">medical gate pending</span></> : null}<br /><Link className="admin-btn secondary" href={`/admin/blog/${post.id}/`}>Відкрити</Link></> : <span className="admin-badge">not seeded</span>}</td>
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

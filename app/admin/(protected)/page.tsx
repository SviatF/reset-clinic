import Link from "next/link";
import { requireAdmin } from "../../../lib/admin-auth";
import {
  averageSeoScore,
  getBlogPosts,
  getGa4Rows,
  getGscRows,
  getLeads,
  getSeoPages,
} from "../../../lib/admin-data";

function sinceDays(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function number(value: number) {
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value);
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [leads, seoPages, posts, gsc, ga4] = await Promise.all([
    getLeads(500),
    getSeoPages(),
    getBlogPosts(),
    getGscRows(),
    getGa4Rows(),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const leadsToday = leads.filter((lead) => new Date(lead.created_at).getTime() >= todayStart.getTime()).length;
  const leads30 = leads.filter((lead) => new Date(lead.created_at).getTime() >= sinceDays(30)).length;
  const publishedPosts = posts.filter((post) => post.status === "published").length;
  const seoScore = averageSeoScore(seoPages);

  const gsc28 = gsc.filter((row) => new Date(row.date).getTime() >= sinceDays(28));
  const impressions = gsc28.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const clicks = gsc28.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const ga28 = ga4.filter((row) => new Date(row.date).getTime() >= sinceDays(28));
  const sessions = ga28.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
  const conversions = ga28.reduce((sum, row) => sum + Number(row.conversions || 0), 0);
  const newestLeads = leads.slice(0, 8);
  const weakPages = seoPages.filter((page) => page.indexable).slice(0, 6);

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="admin-subtitle">Ліди, SEO, контент і органічна ефективність RESET Clinic.</div>
        </div>
        <div className="admin-label">{new Date().toLocaleString("uk-UA")}</div>
      </header>

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">Заявки сьогодні</div><div className="admin-metric">{leadsToday}</div><div className="admin-kpi-note">За 30 днів: {leads30}</div></div>
        <div className="admin-card"><div className="admin-label">SEO Health</div><div className="admin-metric">{seoScore}/100</div><div className="admin-progress"><span style={{ width: `${seoScore}%` }} /></div></div>
        <div className="admin-card"><div className="admin-label">SEO сторінки</div><div className="admin-metric">{seoPages.filter((p) => p.indexable).length}</div><div className="admin-kpi-note">Всього: {seoPages.length}</div></div>
        <div className="admin-card"><div className="admin-label">Блог</div><div className="admin-metric">{publishedPosts}</div><div className="admin-kpi-note">Чернеток: {posts.filter((p) => p.status === "draft").length}</div></div>
      </section>

      <section className="admin-grid admin-section">
        <div className="admin-card"><div className="admin-label">GSC покази · 28 днів</div><div className="admin-metric">{gsc.length ? number(impressions) : "—"}</div><div className="admin-kpi-note">{gsc.length ? `Clicks ${number(clicks)} · CTR ${number(ctr)}%` : "Search Console ще не синхронізовано"}</div></div>
        <div className="admin-card"><div className="admin-label">GA4 sessions · 28 днів</div><div className="admin-metric">{ga4.length ? number(sessions) : "—"}</div><div className="admin-kpi-note">{ga4.length ? `Conversions ${number(conversions)}` : "GA4 ще не синхронізовано"}</div></div>
        <div className="admin-card"><div className="admin-label">CRM</div><div className="admin-metric">{leads.filter((l) => l.crm_status === "sent").length}</div><div className="admin-kpi-note">Успішно передано</div></div>
        <div className="admin-card"><div className="admin-label">Нові ліди</div><div className="admin-metric">{leads.filter((l) => l.status === "new").length}</div><div className="admin-kpi-note"><Link href="/admin/leads/">Відкрити заявки →</Link></div></div>
      </section>

      <section className="admin-two-col admin-section">
        <div>
          <div className="admin-section-header"><h2>Останні заявки</h2><Link href="/admin/leads/">Усі заявки →</Link></div>
          <div className="admin-table-wrap">
            {newestLeads.length ? <table className="admin-table"><thead><tr><th>Дата</th><th>Контакт</th><th>Сторінка</th><th>Джерело</th><th>CRM</th></tr></thead><tbody>{newestLeads.map((lead) => <tr key={lead.id}><td>{new Date(lead.created_at).toLocaleString("uk-UA")}</td><td><strong>{lead.name || "Без імені"}</strong><br />{lead.phone || lead.email || "—"}</td><td>{lead.page_path || "—"}</td><td>{lead.utm_source || "direct"}{lead.utm_medium ? ` / ${lead.utm_medium}` : ""}</td><td><span className={`admin-badge ${lead.crm_status === "sent" ? "good" : lead.crm_status === "failed" ? "bad" : "warn"}`}>{lead.crm_status}</span></td></tr>)}</tbody></table> : <div className="admin-empty">Поки немає заявок.</div>}
          </div>
        </div>
        <div>
          <div className="admin-section-header"><h2>SEO focus</h2><Link href="/admin/seo/">SEO центр →</Link></div>
          <div className="admin-card">
            {weakPages.length ? weakPages.map((page) => <div key={page.id} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{page.path}</strong><span>{page.seo_score}/100</span></div><div className="admin-progress"><span style={{ width: `${page.seo_score}%` }} /></div><div className="admin-kpi-note">{page.primary_keyword || page.page_type}</div></div>) : <div className="admin-empty">SEO records ще не синхронізовані.</div>}
          </div>
        </div>
      </section>
    </>
  );
}

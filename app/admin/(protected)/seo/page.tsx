import { requireAdmin } from "../../../../lib/admin-auth";
import { averageSeoScore, getGscRows, getSeoPages } from "../../../../lib/admin-data";

type Props = { searchParams: Promise<{ audited?: string }> };

export default async function AdminSeoPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const [pages, gsc] = await Promise.all([getSeoPages(), getGscRows(1000)]);
  const score = averageSeoScore(pages);
  const impressions = gsc.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const clicks = gsc.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const positions = gsc.filter((row) => Number(row.impressions) > 0);
  const weightedPosition = impressions
    ? positions.reduce((sum, row) => sum + Number(row.position || 0) * Number(row.impressions || 0), 0) / impressions
    : 0;

  return (
    <>
      <header className="admin-topbar">
        <div><h1>SEO Center</h1><div className="admin-subtitle">Технічне SEO, сторінки, індексація, GSC та семантичні цілі.</div></div>
        <form action="/api/admin/audit-seo" method="post"><button className="admin-btn" type="submit">Запустити SEO audit</button></form>
      </header>

      {params.audited ? <div className="admin-alert good">SEO audit завершено: перевірено {params.audited} сторінок.</div> : null}

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">SEO Health</div><div className="admin-metric">{score}/100</div><div className="admin-progress"><span style={{ width: `${score}%` }} /></div></div>
        <div className="admin-card"><div className="admin-label">SEO сторінок</div><div className="admin-metric">{pages.length}</div><div className="admin-kpi-note">Indexable: {pages.filter((p) => p.indexable).length}</div></div>
        <div className="admin-card"><div className="admin-label">GSC кліки / покази</div><div className="admin-metric">{gsc.length ? `${Math.round(clicks).toLocaleString("uk-UA")} / ${Math.round(impressions).toLocaleString("uk-UA")}` : "—"}</div><div className="admin-kpi-note">CTR: {gsc.length ? `${ctr.toFixed(2)}%` : "—"}</div></div>
        <div className="admin-card"><div className="admin-label">Середня позиція</div><div className="admin-metric">{gsc.length ? weightedPosition.toFixed(1) : "—"}</div><div className="admin-kpi-note">Зважено по impressions</div></div>
      </section>

      {!gsc.length ? <div className="admin-alert admin-section">Search Console ще не має синхронізованих даних. Після підключення Google service account тут з’являться impressions, clicks, CTR, position, top queries та indexing.</div> : null}

      <section className="admin-section">
        <div className="admin-section-header"><h2>SEO сторінки</h2><span>{pages.filter((p) => p.seo_score < 85 && p.indexable).length} потребують уваги</span></div>
        <div className="admin-table-wrap">
          {pages.length ? <table className="admin-table"><thead><tr><th>URL</th><th>Target</th><th>Title / H1</th><th>Index</th><th>Score</th><th>Google</th></tr></thead><tbody>{pages.map((page) => <tr key={page.id}><td><span className="admin-code">{page.path}</span><br />{page.page_type}</td><td>{page.primary_keyword || "—"}</td><td><strong>{page.title || "—"}</strong><br /><span className="admin-kpi-note">H1: {page.h1 || "не зафіксовано"}</span></td><td><span className={`admin-badge ${page.indexable ? "good" : "warn"}`}>{page.indexable ? "index" : "noindex"}</span></td><td><strong>{page.seo_score}/100</strong><div className="admin-progress"><span style={{ width: `${page.seo_score}%` }} /></div></td><td>{page.indexed_status || "not synced"}</td></tr>)}</tbody></table> : <div className="admin-empty">SEO records ще не створені.</div>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Top queries</h2></div>
        <div className="admin-table-wrap">
          {gsc.length ? <table className="admin-table"><thead><tr><th>Query</th><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>{[...gsc].sort((a,b) => Number(b.impressions)-Number(a.impressions)).slice(0,50).map((row, index) => <tr key={`${row.date}-${row.page}-${row.query}-${index}`}><td>{row.query || "(page total)"}</td><td>{row.page || "—"}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{(Number(row.ctr)*100).toFixed(2)}%</td><td>{Number(row.position).toFixed(1)}</td></tr>)}</tbody></table> : <div className="admin-empty">Після синхронізації Search Console тут будуть реальні запити Google.</div>}
        </div>
      </section>
    </>
  );
}

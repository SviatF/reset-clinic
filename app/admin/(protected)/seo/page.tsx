import { requireAdmin } from "../../../../lib/admin-auth";
import { averageSeoScore, getGscRows, getSeoPages } from "../../../../lib/admin-data";
import { isCronConfigured } from "../../../../lib/cron-auth";
import {
  buildSeoCommandCenter,
  getSeoAutomationState,
  type SeoMetric,
} from "../../../../lib/seo-command-center";
import {
  SEO_MASTER_MARKET_CLUSTERS,
  SEO_MASTER_MARKET_MAP,
  SEO_MASTER_MARKET_STATS,
} from "../../../../lib/seo-market-master";
import type { SeoMarketStatus } from "../../../../lib/seo-market-map";
import { isSeoTelegramConfigured } from "../../../../lib/seo-telegram";

type Props = {
  searchParams: Promise<{
    audited?: string;
    failed?: string;
    synced?: string;
    gsc?: string;
    ga4?: string;
    indexed?: string;
    error?: string;
  }>;
};

const CLUSTER_LABELS: Record<string, string> = {
  dermatology: "Дерматологія",
  "acne-postacne": "Акне / постакне",
  "rosacea-vessels": "Розацеа / судини",
  pigmentation: "Пігментація",
  trichology: "Трихологія",
  injection: "Інʼєкційна косметологія",
  hardware: "Апаратна косметологія",
  "skin-care": "Догляд / текстура",
  nutrition: "Нутриціологія",
  "local-core": "Local core",
};

const STATUS_LABELS: Record<SeoMarketStatus, string> = {
  live: "LIVE",
  "draft-review": "MED REVIEW",
  planned: "PLANNED",
  "confirm-service": "CONFIRM SERVICE",
  "hold-cannibalization": "CANNIBALIZATION HOLD",
};

function statusClass(status: SeoMarketStatus) {
  return status === "live" ? "good" : "warn";
}

function number(value: number) {
  return Math.round(value).toLocaleString("uk-UA");
}

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function metricPosition(value: number) {
  return value ? value.toFixed(1) : "—";
}

function deltaText(value: number | null, suffix = "%") {
  if (value === null) return "new";
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

function deltaBadge(value: number | null, invert = false) {
  const positive = value !== null && (invert ? value < 0 : value > 0);
  const negative = value !== null && (invert ? value > 0 : value < 0);
  return <span className={`admin-badge ${positive ? "good" : negative ? "bad" : "warn"}`}>{deltaText(value)}</span>;
}

function shortPath(value: string) {
  try {
    return new URL(value).pathname || "/";
  } catch {
    return value.replace(/^https?:\/\/[^/]+/, "") || "/";
  }
}

function metricCard(label: string, metric: SeoMetric, delta: { clicks: number | null; impressions: number | null; ctr: number | null; position: number | null }, mode: "clicks" | "impressions" | "ctr" | "position") {
  if (mode === "clicks") return <div className="admin-card"><div className="admin-label">{label}</div><div className="admin-metric">{number(metric.clicks)}</div><div className="admin-kpi-note">vs попередній період {deltaBadge(delta.clicks)}</div></div>;
  if (mode === "impressions") return <div className="admin-card"><div className="admin-label">{label}</div><div className="admin-metric">{number(metric.impressions)}</div><div className="admin-kpi-note">vs попередній період {deltaBadge(delta.impressions)}</div></div>;
  if (mode === "ctr") return <div className="admin-card"><div className="admin-label">{label}</div><div className="admin-metric">{percent(metric.ctr)}</div><div className="admin-kpi-note">vs попередній період {deltaBadge(delta.ctr)}</div></div>;
  return <div className="admin-card"><div className="admin-label">{label}</div><div className="admin-metric">{metricPosition(metric.position)}</div><div className="admin-kpi-note">покращення позиції {deltaBadge(delta.position)}</div></div>;
}

export default async function AdminSeoPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const [pages, gsc, automation] = await Promise.all([
    getSeoPages(),
    getGscRows(50000),
    getSeoAutomationState(),
  ]);
  const command = buildSeoCommandCenter(gsc);
  const score = averageSeoScore(pages);
  const failed = Number(params.failed || 0);
  const indexed = pages.filter((page) => page.indexed_status?.toLowerCase().includes("pass"));
  const needsAttention = pages.filter((page) => page.indexable && page.seo_score < 85);

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>SEO Command Center</h1>
          <div className="admin-subtitle">GSC intelligence, landing-page performance, query movements, indexing та автоматичний контроль organic growth.</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form action="/api/admin/sync-google?return=/admin/seo/" method="post"><button className="admin-btn" type="submit">Sync GSC зараз</button></form>
          <form action="/api/admin/audit-seo" method="post"><button className="admin-btn" type="submit">SEO audit</button></form>
        </div>
      </header>

      {params.synced ? <div className="admin-alert good">Google sync завершено: GSC {params.gsc || 0}, GA4 {params.ga4 || 0}, URL Inspection {params.indexed || 0}.</div> : null}
      {params.error ? <div className="admin-alert bad">Google sync: {params.error}</div> : null}
      {params.audited ? <div className={`admin-alert ${failed ? "" : "good"}`}>SEO audit завершено: перевірено {params.audited} сторінок{failed ? `, помилок ${failed}.` : "."}</div> : null}
      {!command.hasRequestedDate && gsc.length ? <div className="admin-alert admin-section">GSC ще не віддав повні дані за {command.requestedDate}. Остання доступна дата: {command.latestAvailableDate || "—"}. Command Center не підміняє вчорашні дані старішими.</div> : null}
      {!gsc.length ? <div className="admin-alert admin-section">Search Console ще не синхронізований. Натисни “Sync GSC зараз” або дочекайся нічного cron.</div> : null}

      <section className="admin-section">
        <div className="admin-section-header"><h2>Automation</h2><span>Europe/Kyiv</span></div>
        <div className="admin-grid">
          <div className="admin-card"><div className="admin-label">Daily GSC refresh</div><div className="admin-metric">00:00</div><div className="admin-kpi-note"><span className={`admin-badge ${isCronConfigured() ? "good" : "bad"}`}>{isCronConfigured() ? "cron ready" : "secret missing"}</span> · 90-day window</div></div>
          <div className="admin-card"><div className="admin-label">Telegram brief</div><div className="admin-metric">10:00</div><div className="admin-kpi-note"><span className={`admin-badge ${isSeoTelegramConfigured() ? "good" : "bad"}`}>{isSeoTelegramConfigured() ? "bot ready" : "not configured"}</span> · за попередній день</div></div>
          <div className="admin-card"><div className="admin-label">Останній sync</div><div className="admin-metric" style={{ fontSize: 22 }}>{automation.lastSyncAt ? new Date(automation.lastSyncAt).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" }) : "—"}</div><div className="admin-kpi-note">GSC {automation.gscRows} · GA4 {automation.ga4Rows} · inspected {automation.inspectedUrls}</div></div>
          <div className="admin-card"><div className="admin-label">Останній Telegram</div><div className="admin-metric" style={{ fontSize: 22 }}>{automation.lastReportKyivDate || "—"}</div><div className="admin-kpi-note">message id: {automation.lastReportMessageId || "—"}{automation.lastError ? ` · ${automation.lastError}` : ""}</div></div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Вчора · {command.requestedDate}</h2><span>vs {command.previousDay}</span></div>
        <div className="admin-grid">
          {metricCard("Кліки", command.today, command.todayDelta, "clicks")}
          {metricCard("Покази", command.today, command.todayDelta, "impressions")}
          {metricCard("CTR", command.today, command.todayDelta, "ctr")}
          {metricCard("Середня позиція", command.today, command.todayDelta, "position")}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Organic pulse</h2><span>7d та 28d comparison</span></div>
        <div className="admin-two-col">
          <div className="admin-card">
            <div className="admin-label">Останні 7 днів</div>
            <h2>{number(command.current7.clicks)} кліків · {number(command.current7.impressions)} показів</h2>
            <p>CTR {percent(command.current7.ctr)} · позиція {metricPosition(command.current7.position)}</p>
            <p className="admin-kpi-note">Кліки {deltaBadge(command.current7Delta.clicks)} · Покази {deltaBadge(command.current7Delta.impressions)} · CTR {deltaBadge(command.current7Delta.ctr)} · Position {deltaBadge(command.current7Delta.position)}</p>
          </div>
          <div className="admin-card">
            <div className="admin-label">Останні 28 днів</div>
            <h2>{number(command.current28.clicks)} кліків · {number(command.current28.impressions)} показів</h2>
            <p>CTR {percent(command.current28.ctr)} · позиція {metricPosition(command.current28.position)}</p>
            <p className="admin-kpi-note">Кліки {deltaBadge(command.current28Delta.clicks)} · Покази {deltaBadge(command.current28Delta.impressions)} · CTR {deltaBadge(command.current28Delta.ctr)} · Position {deltaBadge(command.current28Delta.position)}</p>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Найкращі сторінки</h2><span>28 днів · clicks → impressions</span></div>
        <div className="admin-table-wrap">
          {command.pages28.length ? <table className="admin-table"><thead><tr><th>#</th><th>Landing page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>{command.pages28.slice(0, 20).map((row, index) => <tr key={row.key}><td>{index + 1}</td><td><a className="admin-code" href={row.key} target="_blank" rel="noreferrer">{shortPath(row.key)}</a></td><td><strong>{number(row.clicks)}</strong></td><td>{number(row.impressions)}</td><td>{percent(row.ctr)}</td><td>{metricPosition(row.position)}</td></tr>)}</tbody></table> : <div className="admin-empty">Ще немає GSC landing-page data.</div>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Top search queries</h2><span>28 днів</span></div>
        <div className="admin-table-wrap">
          {command.queries28.length ? <table className="admin-table"><thead><tr><th>#</th><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>{command.queries28.slice(0, 30).map((row, index) => <tr key={row.key}><td>{index + 1}</td><td><strong>{row.key}</strong></td><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{percent(row.ctr)}</td><td>{metricPosition(row.position)}</td></tr>)}</tbody></table> : <div className="admin-empty">Запити зʼявляться після GSC sync.</div>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>SEO Opportunities</h2><span>позиції 4–20 · є попит, можна дотиснути</span></div>
        <div className="admin-table-wrap">
          {command.opportunities.length ? <table className="admin-table"><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th><th>Priority</th></tr></thead><tbody>{command.opportunities.map((row) => <tr key={row.key}><td><strong>{row.key}</strong></td><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{percent(row.ctr)}</td><td>{metricPosition(row.position)}</td><td><span className="admin-badge warn">{Math.round(row.opportunityScore)}</span></td></tr>)}</tbody></table> : <div className="admin-empty">Поки немає query opportunities з достатнім обсягом показів.</div>}
        </div>
      </section>

      <section className="admin-two-col admin-section">
        <div className="admin-card">
          <div className="admin-section-header"><h2>🚀 Winners</h2><span>7d vs previous 7d</span></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Page</th><th>Clicks Δ</th><th>Imp. Δ</th></tr></thead><tbody>{command.winners.slice(0, 8).map((row) => <tr key={row.key}><td className="admin-code">{shortPath(row.key)}</td><td>{deltaBadge(row.clicksDelta)}</td><td>{deltaBadge(row.impressionsDelta)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="admin-card">
          <div className="admin-section-header"><h2>⚠️ Losers</h2><span>7d vs previous 7d</span></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Page</th><th>Clicks Δ</th><th>Imp. Δ</th></tr></thead><tbody>{command.losers.slice(0, 8).map((row) => <tr key={row.key}><td className="admin-code">{shortPath(row.key)}</td><td>{deltaBadge(row.clicksDelta)}</td><td>{deltaBadge(row.impressionsDelta)}</td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section className="admin-two-col admin-section">
        <div className="admin-card">
          <div className="admin-section-header"><h2>Нові запити</h2><span>є зараз, не було previous 7d</span></div>
          {command.newQueries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Query</th><th>Imp.</th><th>Pos.</th></tr></thead><tbody>{command.newQueries.slice(0, 12).map((row) => <tr key={row.key}><td>{row.key}</td><td>{number(row.impressions)}</td><td>{metricPosition(row.position)}</td></tr>)}</tbody></table></div> : <div className="admin-empty">Нових запитів поки не зафіксовано.</div>}
        </div>
        <div className="admin-card">
          <div className="admin-section-header"><h2>Втрачені запити</h2><span>були previous 7d, зараз немає</span></div>
          {command.lostQueries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Query</th><th>Imp.</th><th>Pos.</th></tr></thead><tbody>{command.lostQueries.slice(0, 12).map((row) => <tr key={row.key}><td>{row.key}</td><td>{number(row.impressions)}</td><td>{metricPosition(row.position)}</td></tr>)}</tbody></table></div> : <div className="admin-empty">Втрачених запитів не зафіксовано.</div>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Technical / Indexing health</h2><span>{pages.length} tracked pages</span></div>
        <div className="admin-grid">
          <div className="admin-card"><div className="admin-label">SEO Health</div><div className="admin-metric">{score}/100</div><div className="admin-progress"><span style={{ width: `${score}%` }} /></div></div>
          <div className="admin-card"><div className="admin-label">Indexable</div><div className="admin-metric">{pages.filter((page) => page.indexable).length}</div><div className="admin-kpi-note">public SEO pages</div></div>
          <div className="admin-card"><div className="admin-label">URL Inspection PASS</div><div className="admin-metric">{indexed.length}</div><div className="admin-kpi-note">із синхронізованих inspection states</div></div>
          <div className="admin-card"><div className="admin-label">Need attention</div><div className="admin-metric">{needsAttention.length}</div><div className="admin-kpi-note">indexable із score &lt; 85</div></div>
        </div>
        <div className="admin-table-wrap admin-section">
          {needsAttention.length ? <table className="admin-table"><thead><tr><th>URL</th><th>Title / H1</th><th>Score</th><th>Google</th></tr></thead><tbody>{needsAttention.slice(0, 30).map((page) => <tr key={page.id}><td><a href={page.path} target="_blank" rel="noreferrer" className="admin-code">{page.path}</a></td><td><strong>{page.title || "—"}</strong><br /><span className="admin-kpi-note">H1: {page.h1 || "не зафіксовано"}</span></td><td><strong>{page.seo_score}/100</strong></td><td>{page.indexed_status || "not synced"}</td></tr>)}</tbody></table> : <div className="admin-empty">Критичних SEO audit issues немає.</div>}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Lviv Market Coverage</h2><span>{SEO_MASTER_MARKET_STATS.total} target intents</span></div>
        <div className="admin-grid">
          <div className="admin-card"><div className="admin-label">LIVE</div><div className="admin-metric">{SEO_MASTER_MARKET_STATS.live}</div></div>
          <div className="admin-card"><div className="admin-label">P0 + P1</div><div className="admin-metric">{SEO_MASTER_MARKET_STATS.p0p1}</div></div>
          <div className="admin-card"><div className="admin-label">Pipeline</div><div className="admin-metric">{SEO_MASTER_MARKET_STATS.drafts + SEO_MASTER_MARKET_STATS.planned}</div></div>
          <div className="admin-card"><div className="admin-label">Cannibalization hold</div><div className="admin-metric">{SEO_MASTER_MARKET_STATS.cannibalizationHold}</div></div>
        </div>
        <div className="admin-table-wrap admin-section"><table className="admin-table"><thead><tr><th>Cluster</th><th>Coverage</th></tr></thead><tbody>{SEO_MASTER_MARKET_CLUSTERS.map(([cluster, count]) => <tr key={cluster}><td><strong>{CLUSTER_LABELS[cluster] || cluster}</strong></td><td>{count}</td></tr>)}</tbody></table></div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Market Expansion Map</h2><span>LIVE → review → ISR → sitemap → index</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Priority</th><th>Cluster / asset</th><th>URL / intent</th><th>Status</th><th>Conversion</th></tr></thead><tbody>{SEO_MASTER_MARKET_MAP.map((item) => <tr key={item.path}><td><strong>{item.priority}</strong></td><td>{CLUSTER_LABELS[item.cluster] || item.cluster}<br /><span className="admin-kpi-note">{item.asset}</span></td><td><strong>{item.title}</strong><br /><span className="admin-code">{item.path}</span>{item.notes ? <><br /><span className="admin-kpi-note">{item.notes}</span></> : null}</td><td><span className={`admin-badge ${statusClass(item.status)}`}>{STATUS_LABELS[item.status]}</span>{item.reviewRequired ? <><br /><span className="admin-kpi-note">medical review</span></> : null}</td><td><span className="admin-code">{item.conversionPath}</span></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}

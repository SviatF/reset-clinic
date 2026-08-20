import { requireAdmin } from "../../../../lib/admin-auth";
import { isGoogleSeoConfigured } from "../../../../lib/google-service-account";
import { hasServiceRole, isSupabaseConfigured, supabaseRest } from "../../../../lib/supabase";

type LogRow = {
  id: number;
  created_at: string;
  integration: string;
  status: string;
  records_processed: number;
  message: string | null;
};

type Props = { searchParams: Promise<{ synced?: string; gsc?: string; ga4?: string; error?: string }> };

function status(ok: boolean) {
  return <span className={`admin-badge ${ok ? "good" : "warn"}`}>{ok ? "connected" : "not connected"}</span>;
}

export default async function AdminIntegrationsPage({ searchParams }: Props) {
  const { accessToken } = await requireAdmin();
  const params = await searchParams;
  const logsResponse = await supabaseRest<LogRow[]>(
    "integration_sync_logs?select=id,created_at,integration,status,records_processed,message&order=created_at.desc&limit=50",
    { method: "GET" },
    { accessToken },
  );
  const logs = logsResponse.data ?? [];
  const supabase = isSupabaseConfigured();
  const google = isGoogleSeoConfigured();
  const crm = Boolean(process.env.CRM_WEBHOOK_URL);

  return (
    <>
      <header className="admin-topbar">
        <div><h1>Інтеграції</h1><div className="admin-subtitle">Supabase, CRM, Google Search Console та GA4.</div></div>
      </header>

      {params.synced ? <div className="admin-alert good">Google sync завершено: GSC {params.gsc || 0} рядків, GA4 {params.ga4 || 0} рядків.</div> : null}
      {params.error ? <div className="admin-alert bad">Google sync: {params.error}</div> : null}

      <section className="admin-grid admin-section">
        <div className="admin-card"><div className="admin-label">Supabase database</div><h3>Leads + CMS + SEO data</h3>{status(supabase)}<p className="admin-kpi-note">Service role: {hasServiceRole() ? "configured" : "optional / missing"}</p></div>
        <div className="admin-card"><div className="admin-label">CRM</div><h3>Generic webhook</h3>{status(crm)}<p className="admin-kpi-note">Підтримує endpoint + Bearer token через Vercel env.</p></div>
        <div className="admin-card"><div className="admin-label">Google Search Console</div><h3>Organic search</h3>{status(google && Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL))}<p className="admin-kpi-note">Impressions, clicks, CTR, position, queries, pages.</p></div>
        <div className="admin-card"><div className="admin-label">Google Analytics 4</div><h3>Traffic + conversions</h3>{status(google && Boolean(process.env.GA4_PROPERTY_ID))}<p className="admin-kpi-note">Sessions, users, key events by landing page/source.</p></div>
      </section>

      <section className="admin-two-col admin-section">
        <div className="admin-card">
          <h2>Google sync</h2>
          <p>Service account повинен мати read-доступ до Search Console property та GA4 property.</p>
          <form action="/api/admin/sync-google" method="post"><button className="admin-btn" type="submit" disabled={!google}>Синхронізувати GSC + GA4</button></form>
        </div>
        <div className="admin-card">
          <h2>CRM contract</h2>
          <p>Кожна нова заявка надсилається як <span className="admin-code">lead.created</span>. Це дозволяє підключити KeyCRM, KeepinCRM, HubSpot, Make, n8n або власний endpoint без зміни форм.</p>
          <div className="admin-kpi-note">CRM_WEBHOOK_URL + CRM_WEBHOOK_TOKEN</div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Sync logs</h2></div>
        <div className="admin-table-wrap">
          {logs.length ? <table className="admin-table"><thead><tr><th>Дата</th><th>Integration</th><th>Status</th><th>Records</th><th>Message</th></tr></thead><tbody>{logs.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("uk-UA")}</td><td>{row.integration}</td><td><span className={`admin-badge ${row.status === "success" ? "good" : row.status === "failed" ? "bad" : "warn"}`}>{row.status}</span></td><td>{row.records_processed}</td><td>{row.message || "—"}</td></tr>)}</tbody></table> : <div className="admin-empty">Синхронізацій ще не було.</div>}
        </div>
      </section>
    </>
  );
}

import { requireAdmin } from "../../../../lib/admin-auth";
import { isGoogleSeoConfigured } from "../../../../lib/google-service-account";
import { canEncryptSecrets } from "../../../../lib/secret-box";
import { hasServiceRole, isSupabaseConfigured, supabaseRest } from "../../../../lib/supabase";

type LogRow = {
  id: number;
  created_at: string;
  integration: string;
  status: string;
  records_processed: number;
  message: string | null;
};

type CrmRow = {
  id: string;
  provider: string;
  name: string;
  enabled: boolean;
  endpoint: string | null;
  config: { token_enc?: string } | null;
  last_success_at: string | null;
  last_error: string | null;
};

type Props = { searchParams: Promise<{ synced?: string; gsc?: string; ga4?: string; indexed?: string; error?: string; crm_saved?: string; crm_error?: string }> };

function status(ok: boolean) {
  return <span className={`admin-badge ${ok ? "good" : "warn"}`}>{ok ? "connected" : "not connected"}</span>;
}

export default async function AdminIntegrationsPage({ searchParams }: Props) {
  const { accessToken } = await requireAdmin();
  const params = await searchParams;
  const [logsResponse, crmResponse] = await Promise.all([
    supabaseRest<LogRow[]>(
      "integration_sync_logs?select=id,created_at,integration,status,records_processed,message&order=created_at.desc&limit=50",
      { method: "GET" },
      { accessToken },
    ),
    supabaseRest<CrmRow[]>(
      "crm_integrations?select=id,provider,name,enabled,endpoint,config,last_success_at,last_error&order=created_at.asc&limit=1",
      { method: "GET" },
      { accessToken },
    ),
  ]);
  const logs = logsResponse.data ?? [];
  const crmRow = crmResponse.data?.[0];
  const supabase = isSupabaseConfigured();
  const google = isGoogleSeoConfigured();
  const crmConnected = Boolean(crmRow?.enabled && crmRow.endpoint) || Boolean(process.env.CRM_WEBHOOK_URL);

  return (
    <>
      <header className="admin-topbar">
        <div><h1>Інтеграції</h1><div className="admin-subtitle">Supabase, CRM, Google Search Console та GA4.</div></div>
      </header>

      {params.synced ? <div className="admin-alert good">Google sync завершено: GSC {params.gsc || 0}, GA4 {params.ga4 || 0}, URL Inspection {params.indexed || 0}.</div> : null}
      {params.error ? <div className="admin-alert bad">Google sync: {params.error}</div> : null}
      {params.crm_saved ? <div className="admin-alert good">CRM налаштування збережено.</div> : null}
      {params.crm_error ? <div className="admin-alert bad">CRM: не вдалося зберегти налаштування ({params.crm_error}).</div> : null}

      <section className="admin-grid admin-section">
        <div className="admin-card"><div className="admin-label">Supabase database</div><h3>Leads + CMS + SEO data</h3>{status(supabase)}<p className="admin-kpi-note">Service role: {hasServiceRole() ? "configured" : "missing"}</p></div>
        <div className="admin-card"><div className="admin-label">CRM</div><h3>{crmRow?.name || "Generic webhook"}</h3>{status(crmConnected)}<p className="admin-kpi-note">Admin-managed encrypted token: {crmRow?.config?.token_enc ? "yes" : "no"}</p></div>
        <div className="admin-card"><div className="admin-label">Google Search Console</div><h3>Organic search</h3>{status(google && Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL))}<p className="admin-kpi-note">Impressions, clicks, CTR, position, queries, pages, indexing.</p></div>
        <div className="admin-card"><div className="admin-label">Google Analytics 4</div><h3>Traffic + conversions</h3>{status(google && Boolean(process.env.GA4_PROPERTY_ID))}<p className="admin-kpi-note">Sessions, users, key events by landing page/source.</p></div>
      </section>

      <section className="admin-two-col admin-section">
        <div className="admin-card">
          <h2>CRM connection</h2>
          {!hasServiceRole() ? <div className="admin-alert">Щоб CRM-конфіг читався сервером після заявки, додайте SUPABASE_SERVICE_ROLE_KEY у Vercel.</div> : null}
          {!canEncryptSecrets() ? <div className="admin-alert">Для збереження токена з адмінки потрібен INTEGRATIONS_ENCRYPTION_KEY.</div> : null}
          <form className="admin-form" action="/api/admin/integrations/crm" method="post">
            <div className="admin-form-row"><label>Назва<input name="name" defaultValue={crmRow?.name || "Primary CRM"} /></label><label>Provider<select name="provider" defaultValue={crmRow?.provider || "webhook"}><option value="webhook">Generic webhook</option><option value="keycrm">KeyCRM</option><option value="keepincrm">KeepinCRM</option><option value="hubspot">HubSpot</option><option value="make">Make</option><option value="n8n">n8n</option></select></label></div>
            <label>Webhook endpoint<input name="endpoint" type="url" defaultValue={crmRow?.endpoint || ""} placeholder="https://..." /></label>
            <label>Bearer token<input name="token" type="password" placeholder={crmRow?.config?.token_enc ? "••••••••  (залиште пустим, щоб не змінювати)" : "Token"} /></label>
            <label><span><input type="checkbox" name="enabled" defaultChecked={crmRow?.enabled ?? false} style={{ width: "auto" }} /> Увімкнути CRM dispatch</span></label>
            <button className="admin-btn" type="submit">Зберегти CRM</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Google sync</h2>
          <p>Service account повинен мати read-доступ до Search Console property та GA4 property.</p>
          <p>Один sync завантажує останні 28 днів GSC/GA4 і перевіряє індексацію до 100 indexable SEO URL.</p>
          <form action="/api/admin/sync-google" method="post"><button className="admin-btn" type="submit" disabled={!google}>Синхронізувати GSC + GA4 + Indexing</button></form>
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

import { requireAdmin } from "../../../../lib/admin-auth";
import { getCrmConfig, getIntegrationLogs } from "../../../../lib/admin-data";
import { getAdminStoreHealth } from "../../../../lib/admin-store";
import { isGoogleSeoConfigured } from "../../../../lib/google-service-account";
import { canEncryptSecrets } from "../../../../lib/secret-box";

type Props = { searchParams: Promise<{ synced?: string; gsc?: string; ga4?: string; indexed?: string; error?: string; crm_saved?: string; crm_error?: string }> };

function status(ok: boolean, warning = false) {
  return <span className={`admin-badge ${ok ? "good" : warning ? "bad" : "warn"}`}>{ok ? "connected" : warning ? "error" : "not connected"}</span>;
}

export default async function AdminIntegrationsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const [logs, crm, storageHealth] = await Promise.all([getIntegrationLogs(50), getCrmConfig(), getAdminStoreHealth()]);
  const storage = storageHealth.ok;
  const google = isGoogleSeoConfigured();
  const crmConnected = Boolean(crm?.enabled && crm.endpoint) || Boolean(process.env.CRM_WEBHOOK_URL);

  return (
    <>
      <header className="admin-topbar">
        <div><h1>Інтеграції</h1><div className="admin-subtitle">Private JSON storage, CRM, Google Search Console та GA4.</div></div>
      </header>

      {params.synced ? <div className="admin-alert good">Google sync завершено: GSC {params.gsc || 0}, GA4 {params.ga4 || 0}, URL Inspection {params.indexed || 0}.</div> : null}
      {params.error ? <div className="admin-alert bad">Google sync: {params.error}</div> : null}
      {params.crm_saved ? <div className="admin-alert good">CRM налаштування збережено.</div> : null}
      {params.crm_error ? <div className="admin-alert bad">CRM: не вдалося зберегти налаштування ({params.crm_error}).</div> : null}

      <section className="admin-grid admin-section">
        <div className="admin-card"><div className="admin-label">Private JSON storage</div><h3>Vercel Blob</h3>{status(storage, storageHealth.configured && !storageHealth.ok)}<p className="admin-kpi-note">{storage ? `Private store · auth ${storageHealth.mode.toUpperCase()}` : storageHealth.error}</p></div>
        <div className="admin-card"><div className="admin-label">CRM</div><h3>{crm?.name || "Generic webhook"}</h3>{status(crmConnected)}<p className="admin-kpi-note">JSON POST · token: {crm?.token_enc ? "encrypted" : process.env.CRM_WEBHOOK_TOKEN ? "environment" : "none"}</p></div>
        <div className="admin-card"><div className="admin-label">Google Search Console</div><h3>Organic search</h3>{status(google && Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL))}<p className="admin-kpi-note">Impressions, clicks, CTR, position, queries, pages, indexing.</p></div>
        <div className="admin-card"><div className="admin-label">Google Analytics 4</div><h3>Traffic + conversions</h3>{status(google && Boolean(process.env.GA4_PROPERTY_ID))}<p className="admin-kpi-note">Sessions, users, key events by landing page/source.</p></div>
      </section>

      {!storage ? <div className={`admin-alert admin-section ${storageHealth.configured ? "bad" : ""}`}>{storageHealth.configured ? `Vercel Blob підключений, але health-check не проходить: ${storageHealth.error}` : "Підключіть private Vercel Blob store до проєкту. Для Vercel deployment використовується системний OIDC + BLOB_STORE_ID; окремий Supabase або SQL не потрібен."}</div> : null}

      <section className="admin-two-col admin-section">
        <div className="admin-card">
          <h2>CRM connection</h2>
          {!canEncryptSecrets() ? <div className="admin-alert">Для збереження Bearer token через адмінку задайте INTEGRATIONS_ENCRYPTION_KEY. Endpoint без токена працює і без нього.</div> : null}
          <form className="admin-form" action="/api/admin/integrations/crm" method="post">
            <div className="admin-form-row"><label>Назва<input name="name" defaultValue={crm?.name || "Primary CRM"} /></label><label>Provider<select name="provider" defaultValue={crm?.provider || "webhook"}><option value="webhook">Generic webhook</option><option value="keycrm">KeyCRM</option><option value="keepincrm">KeepinCRM</option><option value="hubspot">HubSpot</option><option value="make">Make</option><option value="n8n">n8n</option></select></label></div>
            <label>Webhook endpoint<input name="endpoint" type="url" defaultValue={crm?.endpoint || ""} placeholder="https://..." /></label>
            <label>Bearer token<input name="token" type="password" placeholder={crm?.token_enc ? "••••••••  (залиште пустим, щоб не змінювати)" : "Token"} /></label>
            <label><span><input type="checkbox" name="enabled" defaultChecked={crm?.enabled ?? false} style={{ width: "auto" }} /> Увімкнути CRM dispatch</span></label>
            <button className="admin-btn" type="submit" disabled={!storage}>Зберегти CRM</button>
          </form>
        </div>
        <div className="admin-card">
          <h2>Google sync</h2>
          <p>Service account повинен мати read-доступ до Search Console property та GA4 property.</p>
          <p>Один sync завантажує останні 28 днів GSC/GA4 і перевіряє індексацію до 100 indexable URL.</p>
          <form action="/api/admin/sync-google" method="post"><button className="admin-btn" type="submit" disabled={!google || !storage}>Синхронізувати GSC + GA4 + Indexing</button></form>
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

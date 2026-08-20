import { requireAdmin } from "../../../../lib/admin-auth";
import { getLeads } from "../../../../lib/admin-data";

type Props = { searchParams: Promise<{ retry?: string }> };

const retryMessages: Record<string, { text: string; good: boolean }> = {
  sent: { text: "Заявку повторно передано в CRM.", good: true },
  disabled: { text: "CRM dispatch зараз вимкнений — заявку збережено в таблиці.", good: false },
  failed: { text: "CRM знову не прийняла заявку. Деталі залишились біля заявки.", good: false },
  missing: { text: "Заявку для повторної відправки не знайдено.", good: false },
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  await requireAdmin();
  const [leads, params] = await Promise.all([getLeads(500), searchParams]);
  const retry = params.retry ? retryMessages[params.retry] : null;

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Заявки</h1>
          <div className="admin-subtitle">Усі форми сайту з UTM, click IDs, сторінкою входу та статусом CRM.</div>
        </div>
        <div className="admin-label">{leads.length} записів</div>
      </header>

      {retry ? <div className={`admin-alert ${retry.good ? "good" : ""}`}>{retry.text}</div> : null}

      <div className="admin-table-wrap admin-section">
        {leads.length ? (
          <table className="admin-table">
            <thead><tr><th>Дата</th><th>Контакт</th><th>Послуга / сторінка</th><th>Атрибуція</th><th>Статус</th><th>CRM</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{new Date(lead.created_at).toLocaleString("uk-UA")}</td>
                  <td><strong>{lead.name || "Без імені"}</strong><br />{lead.phone || ""}{lead.phone && lead.email ? <br /> : null}{lead.email || ""}</td>
                  <td>{lead.service || "—"}<br /><span className="admin-code">{lead.page_path || "/"}</span></td>
                  <td>{lead.utm_source || "direct"}{lead.utm_medium ? ` / ${lead.utm_medium}` : ""}{lead.utm_campaign ? <><br />{lead.utm_campaign}</> : null}</td>
                  <td>
                    <form action={`/api/admin/leads/${lead.id}`} method="post" className="admin-form">
                      <select name="status" defaultValue={lead.status} aria-label="Lead status">
                        <option value="new">new</option><option value="contacted">contacted</option><option value="qualified">qualified</option><option value="booked">booked</option><option value="won">won</option><option value="lost">lost</option><option value="spam">spam</option>
                      </select>
                      <button className="admin-btn secondary" type="submit">Зберегти</button>
                    </form>
                  </td>
                  <td>
                    <span className={`admin-badge ${lead.crm_status === "sent" ? "good" : lead.crm_status === "failed" ? "bad" : "warn"}`}>{lead.crm_status}</span>
                    {lead.crm_error ? <><br /><span className="admin-kpi-note">{lead.crm_error}</span></> : null}
                    {lead.crm_status === "failed" || lead.crm_status === "disabled" ? (
                      <form action={`/api/admin/leads/${lead.id}`} method="post" style={{ marginTop: 9 }}>
                        <input type="hidden" name="action" value="retry_crm" />
                        <button className="admin-btn secondary" type="submit">Retry CRM</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="admin-empty">Заявок ще немає. Нові заявки автоматично зберігатимуться у private Vercel Blob.</div>}
      </div>
    </>
  );
}

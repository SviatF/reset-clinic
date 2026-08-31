import { requireAdmin } from "../../../../lib/admin-auth";
import { getLeads } from "../../../../lib/admin-data";

type Props = { searchParams: Promise<{ retry?: string; telegram?: string }> };

const retryMessages: Record<string, { text: string; good: boolean }> = {
  sent: { text: "Заявку повторно передано в CRM.", good: true },
  disabled: { text: "CRM dispatch зараз вимкнений — заявку збережено в таблиці.", good: false },
  failed: { text: "CRM знову не прийняла заявку. Деталі залишились біля заявки.", good: false },
  missing: { text: "Заявку для повторної відправки не знайдено.", good: false },
};

const telegramMessages: Record<string, { text: string; good: boolean }> = {
  sent: { text: "Заявку повторно відправлено у Telegram-групу.", good: true },
  disabled: { text: "Telegram не налаштований. Перевірте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID.", good: false },
  failed: { text: "Telegram знову не прийняв повідомлення. Помилка збережена біля заявки.", good: false },
  missing: { text: "Заявку для повторної Telegram-відправки не знайдено.", good: false },
};

function telegramValue(payload: Record<string, unknown>, key: string) {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  await requireAdmin();
  const [leads, params] = await Promise.all([getLeads(500), searchParams]);
  const retry = params.retry ? retryMessages[params.retry] : null;
  const telegram = params.telegram ? telegramMessages[params.telegram] : null;

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Заявки</h1>
          <div className="admin-subtitle">Усі форми сайту з UTM, click IDs, сторінкою входу, Telegram та статусом CRM.</div>
        </div>
        <div className="admin-label">{leads.length} записів</div>
      </header>

      {retry ? <div className={`admin-alert ${retry.good ? "good" : ""}`}>{retry.text}</div> : null}
      {telegram ? <div className={`admin-alert ${telegram.good ? "good" : ""}`}>{telegram.text}</div> : null}

      <div className="admin-table-wrap admin-section">
        {leads.length ? (
          <table className="admin-table">
            <thead><tr><th>Дата</th><th>Контакт</th><th>Послуга / сторінка</th><th>Атрибуція</th><th>Статус</th><th>Telegram</th><th>CRM</th></tr></thead>
            <tbody>
              {leads.map((lead) => {
                const telegramStatus = telegramValue(lead.payload, "telegram_status") || "legacy";
                const telegramError = telegramValue(lead.payload, "telegram_error");
                const telegramSentAt = telegramValue(lead.payload, "telegram_sent_at");
                const telegramGood = telegramStatus === "sent";
                const telegramBad = telegramStatus === "failed";

                return (
                  <tr key={lead.id}>
                    <td>{new Date(lead.created_at).toLocaleString("uk-UA")}</td>
                    <td><strong>{lead.name || "Без імені"}</strong><br />{lead.phone || ""}{lead.phone && lead.email ? <br /> : null}{lead.email || ""}</td>
                    <td>{lead.service || "—"}<br /><span className="admin-code">{lead.page_path || "/"}</span>{lead.form_id ? <><br /><span className="admin-kpi-note">{lead.form_id}</span></> : null}</td>
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
                      <span className={`admin-badge ${telegramGood ? "good" : telegramBad ? "bad" : "warn"}`}>{telegramStatus}</span>
                      {telegramSentAt ? <><br /><span className="admin-kpi-note">{new Date(telegramSentAt).toLocaleString("uk-UA")}</span></> : null}
                      {telegramError ? <><br /><span className="admin-kpi-note">{telegramError}</span></> : null}
                      {telegramStatus === "failed" || telegramStatus === "disabled" ? (
                        <form action={`/api/admin/leads/${lead.id}`} method="post" style={{ marginTop: 9 }}>
                          <input type="hidden" name="action" value="retry_telegram" />
                          <button className="admin-btn secondary" type="submit">Retry Telegram</button>
                        </form>
                      ) : null}
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
                );
              })}
            </tbody>
          </table>
        ) : <div className="admin-empty">Заявок ще немає. Нові заявки автоматично зберігатимуться у приватному сховищі RESET Admin.</div>}
      </div>
    </>
  );
}

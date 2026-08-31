import type { Lead } from "./admin-data";

function botToken() {
  return (process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

function chatId() {
  return (process.env.TELEGRAM_CHAT_ID || "").trim();
}

function messageThreadId() {
  const raw = (process.env.TELEGRAM_MESSAGE_THREAD_ID || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function isTelegramLeadNotificationsEnabled() {
  return Boolean(botToken() && chatId());
}

function clean(value: unknown, max = 700) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim().slice(0, max);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return "";
  }
}

function quizSummary(payload: Record<string, unknown>) {
  const answers = payload.quiz_answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return "";
  return Object.values(answers as Record<string, unknown>)
    .map((value) => clean(value, 180))
    .filter(Boolean)
    .join(" → ")
    .slice(0, 700);
}

function sourceLabel(lead: Lead) {
  const surface = clean(lead.payload?.promo_surface, 120);
  if (surface === "dedicated_quiz_url") return "Окремий quiz URL";
  if (surface === "landing_drawer_quiz") return "Quiz у лендингу";
  if (surface === "landing_form") return "Форма promo-лендингу";
  if (lead.page_path?.includes("/quiz")) return "Quiz";
  if (lead.page_path?.startsWith("/promo/")) return "Promo landing";
  return "Форма сайту";
}

function kyivTime(value: string) {
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildLeadMessage(lead: Lead) {
  const lines: string[] = ["🟢 НОВА ЗАЯВКА · RESET CLINIC", ""];

  lines.push(`Послуга: ${lead.service || "Не вказано"}`);
  lines.push(`Ім’я: ${lead.name || "Не вказано"}`);
  if (lead.phone) lines.push(`Телефон: ${lead.phone}`);
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.message) lines.push(`Повідомлення: ${clean(lead.message, 700)}`);

  lines.push("");
  lines.push(`Джерело: ${sourceLabel(lead)}`);
  if (lead.form_id) lines.push(`Форма: ${lead.form_id}`);
  if (lead.page_path) lines.push(`Сторінка: ${lead.page_path}`);
  if (lead.page_url) lines.push(`URL: ${clean(lead.page_url, 1000)}`);

  const concern = clean(lead.payload?.selected_concern || lead.payload?.prefilled_concern, 350);
  if (concern) lines.push(`Запит: ${concern}`);

  const answers = quizSummary(lead.payload || {});
  if (answers) lines.push(`Відповіді quiz: ${answers}`);

  if (lead.utm_source || lead.utm_medium) {
    lines.push(`UTM: ${lead.utm_source || "direct"}${lead.utm_medium ? ` / ${lead.utm_medium}` : ""}`);
  }
  if (lead.utm_campaign) lines.push(`Кампанія: ${clean(lead.utm_campaign, 350)}`);
  if (lead.utm_content) lines.push(`Креатив: ${clean(lead.utm_content, 350)}`);
  if (lead.utm_term) lines.push(`UTM term: ${clean(lead.utm_term, 350)}`);
  if (lead.fbclid) lines.push("Meta click: є fbclid");
  if (lead.gclid) lines.push("Google click: є gclid");
  if (lead.ttclid) lines.push("TikTok click: є ttclid");

  lines.push("");
  lines.push(`Час: ${kyivTime(lead.created_at)}`);
  lines.push(`Lead ID: ${lead.id}`);

  return lines.join("\n").slice(0, 4000);
}

type TelegramResponse = {
  ok?: boolean;
  description?: string;
  result?: { message_id?: number };
};

export async function dispatchLeadToTelegram(lead: Lead) {
  const token = botToken();
  const targetChat = chatId();
  if (!token || !targetChat) {
    return { status: "disabled" as const, messageId: null };
  }

  const threadId = messageThreadId();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChat,
      text: buildLeadMessage(lead),
      disable_web_page_preview: true,
      ...(threadId ? { message_thread_id: threadId } : {}),
    }),
    cache: "no-store",
  });

  let data: TelegramResponse = {};
  try {
    data = (await response.json()) as TelegramResponse;
  } catch {
    // Keep the HTTP status as the useful error below.
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.description || `Telegram API ${response.status}`);
  }

  return {
    status: "sent" as const,
    messageId: data.result?.message_id ? String(data.result.message_id) : null,
  };
}

export function telegramErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Telegram notification failed";
}

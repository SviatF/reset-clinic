import { getGscRows } from "./admin-data";
import {
  buildSeoCommandCenter,
  kyivYesterday,
  updateSeoAutomationState,
} from "./seo-command-center";

function botToken() {
  return (process.env.SEO_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

function chatId() {
  return (process.env.SEO_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "").trim();
}

function messageThreadId() {
  const raw = (
    process.env.SEO_TELEGRAM_MESSAGE_THREAD_ID ||
    process.env.TELEGRAM_MESSAGE_THREAD_ID ||
    ""
  ).trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function isSeoTelegramConfigured() {
  return Boolean(botToken() && chatId());
}

function compactNumber(value: number) {
  return Math.round(value).toLocaleString("uk-UA");
}

function pct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function delta(value: number | null) {
  if (value === null) return "new";
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function positionDelta(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

function shortPage(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, "") || "/";
  }
}

function formatDateUa(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

export async function buildDailySeoTelegramMessage(date = kyivYesterday()) {
  const rows = await getGscRows(50000);
  const data = buildSeoCommandCenter(rows, date);

  if (!data.hasRequestedDate) {
    const latest = data.latestAvailableDate ? formatDateUa(data.latestAvailableDate) : "немає даних";
    return [
      `📈 RESET Clinic · SEO за ${formatDateUa(date)}`,
      "",
      "⚠️ Google Search Console ще не віддав дані за вчора.",
      `Остання доступна дата в GSC: ${latest}.`,
      "Звіт не підміняє вчорашні дані старішою датою.",
    ].join("\n");
  }

  const lines: string[] = [
    `📈 RESET Clinic · SEO за ${formatDateUa(date)}`,
    "",
    `Покази: ${compactNumber(data.today.impressions)} (${delta(data.todayDelta.impressions)} vs попередній день)`,
    `Кліки: ${compactNumber(data.today.clicks)} (${delta(data.todayDelta.clicks)} vs попередній день)`,
    `CTR: ${pct(data.today.ctr)} (${delta(data.todayDelta.ctr)})`,
    `Середня позиція: ${data.today.position ? data.today.position.toFixed(1) : "—"} (${positionDelta(data.todayDelta.position)})`,
    "",
    "🔎 Топ запити",
  ];

  data.queries28
    .filter((row) => rows.some((source) => source.date === date && source.query === row.key))
    .slice(0, 5)
    .forEach((row, index) => {
      const dayRows = rows.filter((source) => source.date === date && source.query === row.key);
      const metric = dayRows.length ? {
        clicks: dayRows.reduce((sum, item) => sum + Number(item.clicks || 0), 0),
        impressions: dayRows.reduce((sum, item) => sum + Number(item.impressions || 0), 0),
        position: dayRows.reduce((sum, item) => sum + Number(item.position || 0) * Number(item.impressions || 0), 0) /
          Math.max(1, dayRows.reduce((sum, item) => sum + Number(item.impressions || 0), 0)),
      } : null;
      if (!metric) return;
      lines.push(`${index + 1}. ${row.key} — ${compactNumber(metric.clicks)} кл. / ${compactNumber(metric.impressions)} пок. / поз. ${metric.position.toFixed(1)}`);
    });

  lines.push("", "📄 Топ сторінки");
  const dayPages = new Map<string, { clicks: number; impressions: number }>();
  rows.filter((row) => row.date === date && row.page).forEach((row) => {
    const current = dayPages.get(row.page) || { clicks: 0, impressions: 0 };
    current.clicks += Number(row.clicks || 0);
    current.impressions += Number(row.impressions || 0);
    dayPages.set(row.page, current);
  });
  [...dayPages.entries()]
    .sort((a, b) => b[1].clicks - a[1].clicks || b[1].impressions - a[1].impressions)
    .slice(0, 5)
    .forEach(([page, metric], index) => {
      lines.push(`${index + 1}. ${shortPage(page)} — ${compactNumber(metric.clicks)} кл. / ${compactNumber(metric.impressions)} пок.`);
    });

  const growing = data.queryWinners
    .filter((row) => row.impressions > row.previous.impressions || row.clicks > row.previous.clicks)
    .slice(0, 3);
  if (growing.length) {
    lines.push("", "🚀 Ростуть за 7 днів");
    growing.forEach((row) => {
      lines.push(`• ${row.key} — кліки ${delta(row.clicksDelta)}, покази ${delta(row.impressionsDelta)}`);
    });
  }

  const falling = data.queryLosers
    .filter((row) => row.impressions < row.previous.impressions || row.clicks < row.previous.clicks)
    .slice(0, 3);
  if (falling.length) {
    lines.push("", "⚠️ Просідання за 7 днів");
    falling.forEach((row) => {
      lines.push(`• ${row.key} — кліки ${delta(row.clicksDelta)}, покази ${delta(row.impressionsDelta)}`);
    });
  }

  lines.push("", `Джерело: Google Search Console · дата ${formatDateUa(date)}`);
  return lines.join("\n").slice(0, 4000);
}

type TelegramResponse = {
  ok?: boolean;
  description?: string;
  result?: { message_id?: number };
};

export async function sendDailySeoTelegramReport(date = kyivYesterday()) {
  const token = botToken();
  const targetChat = chatId();
  if (!token || !targetChat) throw new Error("SEO Telegram bot/chat is not configured");

  const text = await buildDailySeoTelegramMessage(date);
  const threadId = messageThreadId();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChat,
      text,
      disable_web_page_preview: true,
      ...(threadId ? { message_thread_id: threadId } : {}),
    }),
    cache: "no-store",
  });

  let data: TelegramResponse = {};
  try {
    data = (await response.json()) as TelegramResponse;
  } catch {
    // HTTP status below is enough when Telegram returns malformed JSON.
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.description || `Telegram API ${response.status}`);
  }

  const messageId = data.result?.message_id ? String(data.result.message_id) : null;
  await updateSeoAutomationState({
    lastReportAt: new Date().toISOString(),
    lastReportKyivDate: date,
    lastReportMessageId: messageId,
    lastError: null,
  });
  return { messageId, text };
}

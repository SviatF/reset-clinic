import { NextRequest, NextResponse } from "next/server";
import { appendIntegrationLog } from "../../../../lib/admin-data";
import { isCronAuthorized } from "../../../../lib/cron-auth";
import {
  getSeoAutomationState,
  kyivHour,
  kyivYesterday,
  updateSeoAutomationState,
} from "../../../../lib/seo-command-center";
import {
  isSeoTelegramConfigured,
  sendDailySeoTelegramReport,
} from "../../../../lib/seo-telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function run(request: NextRequest) {
  if (!process.env.SEO_CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "SEO_CRON_SECRET is missing" }, { status: 503 });
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSeoTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: "SEO Telegram is not configured" }, { status: 503 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const hour = kyivHour();
  const reportDate = kyivYesterday();
  const state = await getSeoAutomationState();

  if (!force && hour !== 10) {
    return NextResponse.json({ ok: true, skipped: true, reason: "outside_10_kyiv", kyivHour: hour });
  }
  if (!force && state.lastReportKyivDate === reportDate) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already_reported", date: reportDate });
  }

  try {
    const result = await sendDailySeoTelegramReport(reportDate);
    await appendIntegrationLog("seo_telegram", "success", 1, `Daily report ${reportDate}`);
    return NextResponse.json({ ok: true, date: reportDate, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEO Telegram report failed";
    await appendIntegrationLog("seo_telegram", "failed", 0, message).catch(() => undefined);
    await updateSeoAutomationState({ lastError: message }).catch(() => undefined);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;

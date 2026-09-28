import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { SITE_URL } from "../../../../lib/seo";
import { kyivSeoReportDate, sendDailySeoTelegramReport } from "../../../../lib/seo-telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", SITE_URL), 303);

  const returnTo = request.nextUrl.searchParams.get("return") === "/admin/seo/"
    ? "/admin/seo/"
    : "/admin/seo/";
  const url = new URL(returnTo, SITE_URL);
  const reportDate = kyivSeoReportDate();

  try {
    const result = await sendDailySeoTelegramReport(reportDate);
    url.searchParams.set("telegram_report", reportDate);
    if (result.messageId) url.searchParams.set("telegram_message", result.messageId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEO Telegram report failed";
    url.searchParams.set("telegram_error", message.slice(0, 220));
  }

  return NextResponse.redirect(url, 303);
}

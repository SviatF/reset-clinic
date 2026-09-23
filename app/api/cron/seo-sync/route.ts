import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "../../../../lib/cron-auth";
import { syncGoogleSeo } from "../../../../lib/google-seo-sync";
import {
  getSeoAutomationState,
  kyivDateString,
  kyivHour,
} from "../../../../lib/seo-command-center";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function run(request: NextRequest) {
  if (!process.env.SEO_CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "SEO_CRON_SECRET is missing" }, { status: 503 });
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const hour = kyivHour();
  const today = kyivDateString();
  const state = await getSeoAutomationState();

  if (!force && hour !== 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "outside_00_kyiv", kyivHour: hour });
  }
  if (!force && state.lastSyncKyivDate === today) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already_synced_today", date: today });
  }

  try {
    const result = await syncGoogleSeo({ inspect: true, days: 90 });
    return NextResponse.json({ ok: true, date: today, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "SEO sync failed" },
      { status: 500 },
    );
  }
}

export const GET = run;
export const POST = run;

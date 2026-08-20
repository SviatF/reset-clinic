import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import {
  appendIntegrationLog,
  getSeoPages,
  saveGa4Rows,
  saveGscRows,
  saveIndexingStates,
  type Ga4Row,
  type GscRow,
} from "../../../../lib/admin-data";
import { getGoogleAccessToken } from "../../../../lib/google-service-account";
import { SITE_URL } from "../../../../lib/seo";

const scopes = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly"];
function dateString(date: Date) { return date.toISOString().slice(0, 10); }

async function syncSearchConsole(googleToken: string) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) { await appendIntegrationLog("search_console", "skipped", 0, "GOOGLE_SEARCH_CONSOLE_SITE_URL is missing"); return 0; }
  const end = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: dateString(start), endDate: dateString(end), dimensions: ["date", "page", "query"], rowLimit: 25000, dataState: "final" }),
    cache: "no-store",
  });
  const data = (await response.json()) as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Search Console HTTP ${response.status}`);
  const rows: GscRow[] = (data.rows ?? []).map((row) => ({ date: row.keys?.[0] ?? dateString(end), page: row.keys?.[1] ?? "", query: row.keys?.[2] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 }));
  await saveGscRows(rows);
  await appendIntegrationLog("search_console", "success", rows.length);
  return rows.length;
}

async function syncGa4(googleToken: string) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) { await appendIntegrationLog("ga4", "skipped", 0, "GA4_PROPERTY_ID is missing"); return 0; }
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }], dimensions: [{ name: "date" }, { name: "landingPagePlusQueryString" }, { name: "sessionSourceMedium" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }], limit: "25000" }),
    cache: "no-store",
  });
  const data = (await response.json()) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `GA4 HTTP ${response.status}`);
  const rows: Ga4Row[] = (data.rows ?? []).map((row) => {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    return { date: rawDate.length === 8 ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : rawDate, landing_page: row.dimensionValues?.[1]?.value ?? "", source_medium: row.dimensionValues?.[2]?.value ?? "", sessions: Number(row.metricValues?.[0]?.value ?? 0), users: Number(row.metricValues?.[1]?.value ?? 0), conversions: Number(row.metricValues?.[2]?.value ?? 0) };
  });
  await saveGa4Rows(rows);
  await appendIntegrationLog("ga4", "success", rows.length);
  return rows.length;
}

async function syncIndexing(googleToken: string) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) return 0;
  const pages = (await getSeoPages()).filter((page) => page.status === "published" && page.indexable).slice(0, 100);
  const states: Record<string, { status: string; lastCrawledAt: string | null }> = {};
  for (const page of pages) {
    const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl: new URL(page.path, SITE_URL).toString(), siteUrl, languageCode: "uk-UA" }),
      cache: "no-store",
    });
    if (!response.ok) continue;
    const data = (await response.json()) as { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; indexingState?: string; lastCrawlTime?: string } } };
    const result = data.inspectionResult?.indexStatusResult;
    if (!result) continue;
    states[page.path] = { status: [result.verdict, result.coverageState, result.indexingState].filter(Boolean).join(" · ").slice(0, 500) || "UNKNOWN", lastCrawledAt: result.lastCrawlTime || null };
  }
  await saveIndexingStates(states);
  await appendIntegrationLog("url_inspection", "success", Object.keys(states).length);
  return Object.keys(states).length;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);
  try {
    const googleToken = await getGoogleAccessToken(scopes);
    const [gsc, ga4] = await Promise.all([syncSearchConsole(googleToken), syncGa4(googleToken)]);
    const indexed = await syncIndexing(googleToken);
    return NextResponse.redirect(new URL(`/admin/integrations/?synced=1&gsc=${gsc}&ga4=${ga4}&indexed=${indexed}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed";
    await appendIntegrationLog("google", "failed", 0, message).catch(() => undefined);
    const url = new URL("/admin/integrations/", request.url);
    url.searchParams.set("error", message.slice(0, 180));
    return NextResponse.redirect(url, 303);
  }
}

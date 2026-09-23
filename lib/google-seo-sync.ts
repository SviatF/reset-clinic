import {
  appendIntegrationLog,
  getSeoPages,
  saveGa4Rows,
  saveGscRows,
  saveIndexingStates,
  type Ga4Row,
  type GscRow,
} from "./admin-data";
import { getGoogleAccessToken } from "./google-service-account";
import { SITE_URL } from "./seo";
import {
  kyivDateString,
  kyivYesterday,
  shiftDate,
  updateSeoAutomationState,
} from "./seo-command-center";

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

export type GoogleSeoSyncResult = {
  gsc: number;
  ga4: number;
  indexed: number;
  startDate: string;
  endDate: string;
};

async function syncSearchConsole(googleToken: string, days = 90) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const endDate = kyivYesterday();
  const startDate = shiftDate(endDate, -(Math.max(2, days) - 1));
  if (!siteUrl) {
    await appendIntegrationLog("search_console", "skipped", 0, "GOOGLE_SEARCH_CONSOLE_SITE_URL is missing");
    return { rows: 0, startDate, endDate };
  }

  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["date", "page", "query"],
        rowLimit: 25000,
        dataState: "all",
      }),
      cache: "no-store",
    },
  );
  const data = (await response.json()) as {
    rows?: Array<{
      keys?: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || `Search Console HTTP ${response.status}`);

  const rows: GscRow[] = (data.rows ?? []).map((row) => ({
    date: row.keys?.[0] ?? endDate,
    page: row.keys?.[1] ?? "",
    query: row.keys?.[2] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
  await saveGscRows(rows);
  await appendIntegrationLog("search_console", "success", rows.length, `${startDate} → ${endDate} · dataState=all`);
  return { rows: rows.length, startDate, endDate };
}

async function syncGa4(googleToken: string) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    await appendIntegrationLog("ga4", "skipped", 0, "GA4_PROPERTY_ID is missing");
    return 0;
  }

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: "90daysAgo", endDate: "yesterday" }],
        dimensions: [
          { name: "date" },
          { name: "landingPagePlusQueryString" },
          { name: "sessionSourceMedium" },
        ],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }],
        limit: "25000",
      }),
      cache: "no-store",
    },
  );
  const data = (await response.json()) as {
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || `GA4 HTTP ${response.status}`);

  const rows: Ga4Row[] = (data.rows ?? []).map((row) => {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    return {
      date: rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate,
      landing_page: row.dimensionValues?.[1]?.value ?? "",
      source_medium: row.dimensionValues?.[2]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      users: Number(row.metricValues?.[1]?.value ?? 0),
      conversions: Number(row.metricValues?.[2]?.value ?? 0),
    };
  });
  await saveGa4Rows(rows);
  await appendIntegrationLog("ga4", "success", rows.length, "90daysAgo → yesterday");
  return rows.length;
}

async function syncIndexing(googleToken: string) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) return 0;
  const pages = (await getSeoPages())
    .filter((page) => page.status === "published" && page.indexable)
    .slice(0, 200);
  const states: Record<string, { status: string; lastCrawledAt: string | null }> = {};

  for (const page of pages) {
    const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inspectionUrl: new URL(page.path, SITE_URL).toString(),
        siteUrl,
        languageCode: "uk-UA",
      }),
      cache: "no-store",
    });
    if (!response.ok) continue;
    const data = (await response.json()) as {
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          indexingState?: string;
          lastCrawlTime?: string;
        };
      };
    };
    const result = data.inspectionResult?.indexStatusResult;
    if (!result) continue;
    states[page.path] = {
      status: [result.verdict, result.coverageState, result.indexingState]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 500) || "UNKNOWN",
      lastCrawledAt: result.lastCrawlTime || null,
    };
  }

  await saveIndexingStates(states);
  await appendIntegrationLog("url_inspection", "success", Object.keys(states).length);
  return Object.keys(states).length;
}

export async function syncGoogleSeo(options: { inspect?: boolean; days?: number } = {}): Promise<GoogleSeoSyncResult> {
  try {
    const googleToken = await getGoogleAccessToken(SCOPES);
    const [gscResult, ga4] = await Promise.all([
      syncSearchConsole(googleToken, options.days ?? 90),
      syncGa4(googleToken),
    ]);
    const indexed = options.inspect === false ? 0 : await syncIndexing(googleToken);
    await updateSeoAutomationState({
      lastSyncAt: new Date().toISOString(),
      lastSyncKyivDate: kyivDateString(),
      gscRows: gscResult.rows,
      ga4Rows: ga4,
      inspectedUrls: indexed,
      gscStartDate: gscResult.startDate,
      gscEndDate: gscResult.endDate,
      lastError: null,
    });
    return {
      gsc: gscResult.rows,
      ga4,
      indexed,
      startDate: gscResult.startDate,
      endDate: gscResult.endDate,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google SEO sync failed";
    await appendIntegrationLog("google", "failed", 0, message).catch(() => undefined);
    await updateSeoAutomationState({ lastError: message }).catch(() => undefined);
    throw error;
  }
}

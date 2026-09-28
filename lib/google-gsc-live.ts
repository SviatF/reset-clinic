import type { GscRow } from "./admin-data";
import { getGoogleAccessToken } from "./google-service-account";
import { kyivYesterday, shiftDate } from "./seo-command-center";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export async function fetchLiveGscRows(days = 90): Promise<GscRow[]> {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) throw new Error("GOOGLE_SEARCH_CONSOLE_SITE_URL is missing");

  const token = await getGoogleAccessToken([GSC_SCOPE]);
  const endDate = kyivYesterday();
  const startDate = shiftDate(endDate, -(Math.max(2, days) - 1));

  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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

  if (!response.ok) {
    throw new Error(data.error?.message || `Search Console HTTP ${response.status}`);
  }

  return (data.rows ?? []).map((row) => ({
    date: row.keys?.[0] ?? endDate,
    page: row.keys?.[1] ?? "",
    query: row.keys?.[2] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

import type { GscRow } from "./admin-data";
import { putJson, readJson } from "./admin-store";

const KYIV_TZ = "Europe/Kyiv";
const STATE_PATH = "reset/seo/command-center-state.json";

export type SeoMetric = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SeoEntityMetric = SeoMetric & {
  key: string;
};

export type SeoMovement = SeoEntityMetric & {
  previous: SeoMetric;
  clicksDelta: number | null;
  impressionsDelta: number | null;
  positionDelta: number | null;
};

export type SeoOpportunity = SeoEntityMetric & {
  opportunityScore: number;
};

export type SeoAutomationState = {
  lastSyncAt: string | null;
  lastSyncKyivDate: string | null;
  gscRows: number;
  ga4Rows: number;
  inspectedUrls: number;
  gscStartDate: string | null;
  gscEndDate: string | null;
  lastReportAt: string | null;
  lastReportKyivDate: string | null;
  lastReportMessageId: string | null;
  lastError: string | null;
};

const EMPTY_STATE: SeoAutomationState = {
  lastSyncAt: null,
  lastSyncKyivDate: null,
  gscRows: 0,
  ga4Rows: 0,
  inspectedUrls: 0,
  gscStartDate: null,
  gscEndDate: null,
  lastReportAt: null,
  lastReportKyivDate: null,
  lastReportMessageId: null,
  lastError: null,
};

export function kyivDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KYIV_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function kyivHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: KYIV_TZ,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
}

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function kyivYesterday(date = new Date()) {
  return shiftDate(kyivDateString(date), -1);
}

function within(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function aggregateRows(rows: GscRow[]): SeoMetric {
  const clicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const impressions = rows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const weightedPosition = rows.reduce(
    (sum, row) => sum + Number(row.position || 0) * Number(row.impressions || 0),
    0,
  );
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? weightedPosition / impressions : 0,
  };
}

function groupRows(rows: GscRow[], key: "page" | "query") {
  const grouped = new Map<string, GscRow[]>();
  rows.forEach((row) => {
    const value = (row[key] || "").trim();
    if (!value) return;
    const bucket = grouped.get(value) || [];
    bucket.push(row);
    grouped.set(value, bucket);
  });
  return [...grouped.entries()].map(([entity, entityRows]) => ({
    key: entity,
    ...aggregateRows(entityRows),
  }));
}

function percentDelta(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

function compareEntities(current: SeoEntityMetric[], previous: SeoEntityMetric[]): SeoMovement[] {
  const previousMap = new Map(previous.map((row) => [row.key, row]));
  return current.map((row) => {
    const prior = previousMap.get(row.key) || {
      key: row.key,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };
    return {
      ...row,
      previous: prior,
      clicksDelta: percentDelta(row.clicks, prior.clicks),
      impressionsDelta: percentDelta(row.impressions, prior.impressions),
      positionDelta: prior.position && row.position ? prior.position - row.position : null,
    };
  });
}

export function buildSeoCommandCenter(rows: GscRow[], requestedDate = kyivYesterday()) {
  const availableDates = [...new Set(rows.map((row) => row.date).filter(Boolean))].sort();
  const latestAvailableDate = availableDates.filter((date) => date <= requestedDate).at(-1) || availableDates.at(-1) || null;
  const reportDate = requestedDate;
  const reportRows = rows.filter((row) => row.date === reportDate);
  const previousDay = shiftDate(reportDate, -1);
  const previousDayRows = rows.filter((row) => row.date === previousDay);

  const current7Start = shiftDate(reportDate, -6);
  const previous7Start = shiftDate(reportDate, -13);
  const previous7End = shiftDate(reportDate, -7);
  const current28Start = shiftDate(reportDate, -27);
  const previous28Start = shiftDate(reportDate, -55);
  const previous28End = shiftDate(reportDate, -28);

  const current7Rows = rows.filter((row) => within(row.date, current7Start, reportDate));
  const previous7Rows = rows.filter((row) => within(row.date, previous7Start, previous7End));
  const current28Rows = rows.filter((row) => within(row.date, current28Start, reportDate));
  const previous28Rows = rows.filter((row) => within(row.date, previous28Start, previous28End));

  const today = aggregateRows(reportRows);
  const priorDay = aggregateRows(previousDayRows);
  const current7 = aggregateRows(current7Rows);
  const previous7 = aggregateRows(previous7Rows);
  const current28 = aggregateRows(current28Rows);
  const previous28 = aggregateRows(previous28Rows);

  const pages28 = groupRows(current28Rows, "page").sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  const queries28 = groupRows(current28Rows, "query").sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  const pages7 = groupRows(current7Rows, "page");
  const pagesPrevious7 = groupRows(previous7Rows, "page");
  const queries7 = groupRows(current7Rows, "query");
  const queriesPrevious7 = groupRows(previous7Rows, "query");

  const pageMovements = compareEntities(pages7, pagesPrevious7)
    .filter((row) => row.impressions >= 5 || row.previous.impressions >= 5);
  const queryMovements = compareEntities(queries7, queriesPrevious7)
    .filter((row) => row.impressions >= 5 || row.previous.impressions >= 5);

  const winners = [...pageMovements]
    .sort((a, b) => (b.clicks - b.previous.clicks) - (a.clicks - a.previous.clicks) || (b.impressions - b.previous.impressions) - (a.impressions - a.previous.impressions))
    .slice(0, 10);
  const losers = [...pageMovements]
    .sort((a, b) => (a.clicks - a.previous.clicks) - (b.clicks - b.previous.clicks) || (a.impressions - a.previous.impressions) - (b.impressions - b.previous.impressions))
    .slice(0, 10);

  const queryWinners = [...queryMovements]
    .sort((a, b) => (b.clicks - b.previous.clicks) - (a.clicks - a.previous.clicks) || (b.impressions - b.previous.impressions) - (a.impressions - a.previous.impressions))
    .slice(0, 10);
  const queryLosers = [...queryMovements]
    .sort((a, b) => (a.clicks - a.previous.clicks) - (b.clicks - b.previous.clicks) || (a.impressions - a.previous.impressions) - (b.impressions - b.previous.impressions))
    .slice(0, 10);

  const previousQueryKeys = new Set(queriesPrevious7.map((row) => row.key));
  const currentQueryKeys = new Set(queries7.map((row) => row.key));
  const newQueries = queries7
    .filter((row) => !previousQueryKeys.has(row.key) && row.impressions >= 3)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);
  const lostQueries = queriesPrevious7
    .filter((row) => !currentQueryKeys.has(row.key) && row.impressions >= 3)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  const opportunities: SeoOpportunity[] = queries28
    .filter((row) => row.impressions >= 10 && row.position > 3 && row.position <= 20)
    .map((row) => ({
      ...row,
      opportunityScore: row.impressions * Math.max(0.01, 0.12 - row.ctr) * Math.min(2, row.position / 10),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20);

  return {
    requestedDate: reportDate,
    previousDay,
    latestAvailableDate,
    hasRequestedDate: reportRows.length > 0,
    today,
    priorDay,
    todayDelta: {
      clicks: percentDelta(today.clicks, priorDay.clicks),
      impressions: percentDelta(today.impressions, priorDay.impressions),
      ctr: percentDelta(today.ctr, priorDay.ctr),
      position: priorDay.position && today.position ? priorDay.position - today.position : null,
    },
    current7,
    previous7,
    current7Delta: {
      clicks: percentDelta(current7.clicks, previous7.clicks),
      impressions: percentDelta(current7.impressions, previous7.impressions),
      ctr: percentDelta(current7.ctr, previous7.ctr),
      position: previous7.position && current7.position ? previous7.position - current7.position : null,
    },
    current28,
    previous28,
    current28Delta: {
      clicks: percentDelta(current28.clicks, previous28.clicks),
      impressions: percentDelta(current28.impressions, previous28.impressions),
      ctr: percentDelta(current28.ctr, previous28.ctr),
      position: previous28.position && current28.position ? previous28.position - current28.position : null,
    },
    pages28,
    queries28,
    winners,
    losers,
    queryWinners,
    queryLosers,
    newQueries,
    lostQueries,
    opportunities,
  };
}

export function getSeoAutomationState() {
  return readJson<SeoAutomationState>(STATE_PATH, EMPTY_STATE);
}

export async function updateSeoAutomationState(patch: Partial<SeoAutomationState>) {
  const current = await getSeoAutomationState();
  const next = { ...current, ...patch };
  await putJson(STATE_PATH, next);
  return next;
}

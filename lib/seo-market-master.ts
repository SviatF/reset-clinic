import { SEO_MARKET_MAP } from "./seo-market-map";
import { SEO_WAVE5_OPPORTUNITIES } from "./seo-market-wave5-opportunities";
import type { SeoMarketPage, SeoMarketStatus } from "./seo-market-map";

const merged = new Map<string, SeoMarketPage>();

// Research inventory goes first; existing live/draft/planned architecture wins on duplicates.
for (const item of SEO_WAVE5_OPPORTUNITIES) merged.set(item.path, item);
for (const item of SEO_MARKET_MAP) merged.set(item.path, item);

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 } as const;
const statusOrder: Record<SeoMarketStatus, number> = {
  live: 0,
  "draft-review": 1,
  planned: 2,
  "confirm-service": 3,
  "hold-cannibalization": 4,
};

export const SEO_MASTER_MARKET_MAP = [...merged.values()].sort((a, b) =>
  priorityOrder[a.priority] - priorityOrder[b.priority] ||
  statusOrder[a.status] - statusOrder[b.status] ||
  a.path.localeCompare(b.path),
);

export const SEO_MASTER_MARKET_STATS = {
  total: SEO_MASTER_MARKET_MAP.length,
  live: SEO_MASTER_MARKET_MAP.filter((item) => item.status === "live").length,
  drafts: SEO_MASTER_MARKET_MAP.filter((item) => item.status === "draft-review").length,
  planned: SEO_MASTER_MARKET_MAP.filter((item) => item.status === "planned").length,
  confirmService: SEO_MASTER_MARKET_MAP.filter((item) => item.status === "confirm-service").length,
  cannibalizationHold: SEO_MASTER_MARKET_MAP.filter((item) => item.status === "hold-cannibalization").length,
  p0: SEO_MASTER_MARKET_MAP.filter((item) => item.priority === "P0").length,
  p1: SEO_MASTER_MARKET_MAP.filter((item) => item.priority === "P1").length,
  p0p1: SEO_MASTER_MARKET_MAP.filter((item) => item.priority === "P0" || item.priority === "P1").length,
  reviewRequired: SEO_MASTER_MARKET_MAP.filter((item) => item.reviewRequired).length,
};

export const SEO_MASTER_MARKET_CLUSTERS = Object.entries(
  SEO_MASTER_MARKET_MAP.reduce<Record<string, number>>((acc, item) => {
    acc[item.cluster] = (acc[item.cluster] || 0) + 1;
    return acc;
  }, {}),
).sort((a, b) => b[1] - a[1]);

export const SEO_MASTER_PUBLISH_QUEUE = SEO_MASTER_MARKET_MAP.filter(
  (item) =>
    (item.priority === "P0" || item.priority === "P1") &&
    item.status !== "live" &&
    item.status !== "hold-cannibalization" &&
    item.status !== "confirm-service",
);

export const SEO_MASTER_REVIEW_QUEUE = SEO_MASTER_MARKET_MAP.filter(
  (item) => item.status === "draft-review" || item.status === "confirm-service",
);

export const SEO_MASTER_CANNIBALIZATION_QUEUE = SEO_MASTER_MARKET_MAP.filter(
  (item) => item.status === "hold-cannibalization",
);

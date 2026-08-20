import { randomUUID } from "node:crypto";
import { SEO_BY_ROUTE } from "./seo";
import { listJson, putJson, readJson } from "./admin-store";

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  service: string | null;
  form_id: string | null;
  page_url: string | null;
  page_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  payload: Record<string, unknown>;
  crm_status: string;
  crm_error: string | null;
  crm_external_id: string | null;
};

export type BlogPost = {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  reviewed_at: string | null;
  status: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  body: string;
  target_keyword: string | null;
  author_name: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  sources: unknown[];
  faq: unknown[];
  schema_type: string;
  indexable: boolean;
};

export type SeoPage = {
  id: string;
  path: string;
  page_type: string;
  status: string;
  primary_keyword: string | null;
  title: string | null;
  description: string | null;
  h1: string | null;
  indexable: boolean;
  seo_score: number;
  indexed_status: string | null;
  last_audited_at: string | null;
};

export type GscRow = {
  date: string;
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type Ga4Row = {
  date: string;
  landing_page: string;
  source_medium: string;
  sessions: number;
  users: number;
  conversions: number;
};

export type CrmConfig = {
  id: "primary";
  provider: string;
  name: string;
  enabled: boolean;
  endpoint: string | null;
  token_enc?: string;
  updated_at: string;
};

export type IntegrationLog = {
  id: string;
  created_at: string;
  integration: string;
  status: "success" | "failed" | "skipped";
  records_processed: number;
  message: string | null;
};

type SeoAudit = {
  score: number;
  issues: string[];
  wordCount: number;
  internalLinks: number;
  h1: string | null;
  auditedAt: string;
};

type IndexingState = {
  status: string;
  lastCrawledAt: string | null;
  checkedAt: string;
};

const PATHS = {
  crm: "reset/config/crm.json",
  gsc: "reset/analytics/gsc.json",
  ga4: "reset/analytics/ga4.json",
  seoAudit: "reset/seo/audit.json",
  indexing: "reset/seo/indexing.json",
};

export async function getLeads(limit = 500) {
  const rows = await listJson<Lead>("reset/leads/", limit);
  return rows
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function saveLead(lead: Lead) {
  return putJson(`reset/leads/${lead.id}.json`, lead);
}

export async function getLead(id: string) {
  return readJson<Lead | null>(`reset/leads/${id}.json`, null);
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  const current = await getLead(id);
  if (!current) return null;
  const next: Lead = { ...current, ...patch, id: current.id, updated_at: new Date().toISOString() };
  await saveLead(next);
  return next;
}

export async function getBlogPosts(limit = 200) {
  const rows = await listJson<BlogPost>("reset/blog/", limit);
  return rows
    .map((post) => ({ ...post, category: post.category ?? null }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}

export async function getBlogPost(id: string) {
  const post = await readJson<BlogPost | null>(`reset/blog/${id}.json`, null);
  return post ? { ...post, category: post.category ?? null } : null;
}

export async function createBlogPost(
  input: Omit<BlogPost, "id" | "created_at" | "updated_at">,
) {
  const now = new Date().toISOString();
  const post: BlogPost = { ...input, id: randomUUID(), created_at: now, updated_at: now };
  await putJson(`reset/blog/${post.id}.json`, post);
  return post;
}

export async function updateBlogPost(id: string, patch: Partial<BlogPost>) {
  const current = await getBlogPost(id);
  if (!current) return null;
  const next: BlogPost = { ...current, ...patch, id: current.id, updated_at: new Date().toISOString() };
  await putJson(`reset/blog/${id}.json`, next);
  return next;
}

export function getCrmConfig() {
  return readJson<CrmConfig | null>(PATHS.crm, null);
}

export async function saveCrmConfig(config: Omit<CrmConfig, "id" | "updated_at">) {
  const row: CrmConfig = {
    ...config,
    id: "primary",
    updated_at: new Date().toISOString(),
  };
  await putJson(PATHS.crm, row);
  return row;
}

export async function getIntegrationLogs(limit = 50) {
  const rows = await listJson<IntegrationLog>("reset/logs/", limit);
  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function appendIntegrationLog(
  integration: string,
  status: IntegrationLog["status"],
  records: number,
  message?: string,
) {
  const created_at = new Date().toISOString();
  const row: IntegrationLog = {
    id: randomUUID(),
    created_at,
    integration,
    status,
    records_processed: records,
    message: message ?? null,
  };
  await putJson(`reset/logs/${row.id}.json`, row);
  return row;
}

export function getGscRows() {
  return readJson<GscRow[]>(PATHS.gsc, []);
}

export function getGa4Rows() {
  return readJson<Ga4Row[]>(PATHS.ga4, []);
}

export async function saveGscRows(rows: GscRow[]) {
  await putJson(PATHS.gsc, rows);
}

export async function saveGa4Rows(rows: Ga4Row[]) {
  await putJson(PATHS.ga4, rows);
}

export function getSeoAudit() {
  return readJson<Record<string, SeoAudit>>(PATHS.seoAudit, {});
}

export async function saveSeoAudit(rows: Record<string, SeoAudit>) {
  await putJson(PATHS.seoAudit, rows);
}

export function getIndexingState() {
  return readJson<Record<string, IndexingState>>(PATHS.indexing, {});
}

export async function saveIndexingState(rows: Record<string, IndexingState>) {
  await putJson(PATHS.indexing, rows);
}

export async function getSeoPages(): Promise<SeoPage[]> {
  const audit = await getSeoAudit();
  const indexing = await getIndexingState();
  return Object.entries(SEO_BY_ROUTE).map(([path, seo], index) => ({
    id: `route-${index}`,
    path,
    page_type: seo.schemaType,
    status: "published",
    primary_keyword: null,
    title: seo.title,
    description: seo.description,
    h1: null,
    indexable: seo.index,
    seo_score: audit[path]?.score ?? 0,
    indexed_status: indexing[path]?.status ?? null,
    last_audited_at: audit[path]?.auditedAt ?? null,
  }));
}

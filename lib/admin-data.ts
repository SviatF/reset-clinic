import { supabaseRest } from "./supabase";

export type Lead = {
  id: string;
  created_at: string;
  status: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  service: string | null;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  crm_status: string;
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

export type BlogPost = {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: string;
  slug: string;
  title: string;
  excerpt: string | null;
  target_keyword: string | null;
  author_name: string | null;
  reviewer_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  indexable: boolean;
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

async function list<T>(path: string, accessToken: string) {
  const response = await supabaseRest<T[]>(path, { method: "GET" }, { accessToken });
  return response.ok && response.data ? response.data : [];
}

export function getLeads(accessToken: string, limit = 100) {
  return list<Lead>(
    `leads?select=id,created_at,status,name,phone,email,service,page_path,utm_source,utm_medium,utm_campaign,crm_status&order=created_at.desc&limit=${limit}`,
    accessToken,
  );
}

export function getSeoPages(accessToken: string) {
  return list<SeoPage>(
    "seo_pages?select=id,path,page_type,status,primary_keyword,title,description,h1,indexable,seo_score,indexed_status,last_audited_at&order=seo_score.asc,path.asc",
    accessToken,
  );
}

export function getBlogPosts(accessToken: string, limit = 200) {
  return list<BlogPost>(
    `blog_posts?select=id,created_at,updated_at,published_at,status,slug,title,excerpt,target_keyword,author_name,reviewer_name,seo_title,seo_description,indexable&order=updated_at.desc&limit=${limit}`,
    accessToken,
  );
}

export function getGscRows(accessToken: string, limit = 500) {
  return list<GscRow>(
    `search_console_daily?select=date,page,query,clicks,impressions,ctr,position&order=date.desc,impressions.desc&limit=${limit}`,
    accessToken,
  );
}

export function getGa4Rows(accessToken: string, limit = 500) {
  return list<Ga4Row>(
    `ga4_daily?select=date,landing_page,source_medium,sessions,users,conversions&order=date.desc,sessions.desc&limit=${limit}`,
    accessToken,
  );
}

export function averageSeoScore(rows: SeoPage[]) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + Number(row.seo_score || 0), 0) / rows.length);
}

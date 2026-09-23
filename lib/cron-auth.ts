import type { NextRequest } from "next/server";

export function isCronAuthorized(request: NextRequest) {
  const secret = (process.env.SEO_CRON_SECRET || "").trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export function isCronConfigured() {
  return Boolean((process.env.SEO_CRON_SECRET || "").trim());
}

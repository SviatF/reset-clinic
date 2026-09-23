import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { syncGoogleSeo } from "../../../../lib/google-seo-sync";
import { SITE_URL } from "../../../../lib/seo";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", SITE_URL), 303);

  const returnTo = request.nextUrl.searchParams.get("return") === "/admin/seo/"
    ? "/admin/seo/"
    : "/admin/integrations/";

  try {
    const result = await syncGoogleSeo({ inspect: true, days: 90 });
    const url = new URL(returnTo, SITE_URL);
    url.searchParams.set("synced", "1");
    url.searchParams.set("gsc", String(result.gsc));
    url.searchParams.set("ga4", String(result.ga4));
    url.searchParams.set("indexed", String(result.indexed));
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed";
    const url = new URL(returnTo, SITE_URL);
    url.searchParams.set("error", message.slice(0, 180));
    return NextResponse.redirect(url, 303);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
} from "../../../../lib/admin-auth";

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function requestOrigin(request: NextRequest) {
  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const fallbackProto = request.nextUrl.protocol.replace(":", "");
  const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : fallbackProto;

  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
}

function adminUrl(request: NextRequest, pathname: string, error?: string) {
  const url = new URL(pathname, `${requestOrigin(request)}/`);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(adminUrl(request, "/admin/login/", "missing_credentials"), 303);
  }
  if (!isAdminConfigured()) {
    return NextResponse.redirect(adminUrl(request, "/admin/login/", "not_configured"), 303);
  }
  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.redirect(adminUrl(request, "/admin/login/", "invalid_credentials"), 303);
  }

  const response = NextResponse.redirect(adminUrl(request, "/admin/"), 303);
  response.cookies.set(SESSION_COOKIE, createAdminSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

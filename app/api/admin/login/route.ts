import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
} from "../../../../lib/admin-auth";

function loginUrl(request: NextRequest, error?: string) {
  const url = new URL("/admin/login/", request.url);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(loginUrl(request, "missing_credentials"), 303);
  }
  if (!isAdminConfigured()) {
    return NextResponse.redirect(loginUrl(request, "not_configured"), 303);
  }
  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.redirect(loginUrl(request, "invalid_credentials"), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, createAdminSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

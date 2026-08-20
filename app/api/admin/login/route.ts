import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../../../../lib/admin-auth";
import { supabaseAuth, supabaseRest, type SupabaseSession } from "../../../../lib/supabase";

type AdminRow = { email: string; role: string; enabled: boolean };

function loginUrl(request: NextRequest, error?: string) {
  const url = new URL("/admin/login/", request.url);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(loginUrl(request, "missing_credentials"), 303);
  }

  const auth = await supabaseAuth<SupabaseSession>("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!auth.ok || !auth.data?.access_token) {
    return NextResponse.redirect(loginUrl(request, "invalid_credentials"), 303);
  }

  const admin = await supabaseRest<AdminRow[]>(
    `admin_users?select=email,role,enabled&email=eq.${encodeURIComponent(email)}&enabled=eq.true&limit=1`,
    { method: "GET" },
    { accessToken: auth.data.access_token },
  );

  if (!admin.ok || !admin.data?.[0]) {
    return NextResponse.redirect(loginUrl(request, "not_authorized"), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/", request.url), 303);
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, auth.data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, auth.data.expires_in - 30),
  });
  response.cookies.set(REFRESH_COOKIE, auth.data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

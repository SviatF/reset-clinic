import { NextRequest, NextResponse } from "next/server";

const legacyPages: Record<string, string> = {
  "5": "/",
  "286": "/price/",
  "295": "/doctors/",
  "328": "/contacts/",
  "425": "/about/",
  "435": "/services/",
  "1064": "/thank-you/",
  "1073": "/booking/",
};

const PRIVATE_PREFIXES = ["/admin", "/api", "/preview", "/internal"];
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const ACCESS_COOKIE = "rc_admin_access";
const REFRESH_COOKIE = "rc_admin_refresh";

function isPrivateRoute(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedAdmin(pathname: string) {
  const adminPage =
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    !pathname.startsWith("/admin/login");
  const adminApi =
    pathname.startsWith("/api/admin/") &&
    !pathname.startsWith("/api/admin/login") &&
    !pathname.startsWith("/api/admin/logout");
  return adminPage || adminApi;
}

function applyPrivateHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", PRIVATE_ROBOTS);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function jwtExp(token?: string) {
  if (!token) return 0;
  try {
    const part = token.split(".")[1];
    if (!part) return 0;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = JSON.parse(atob(padded)) as { exp?: number };
    return Number(json.exp || 0);
  } catch {
    return 0;
  }
}

async function refreshSession(refreshToken: string) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

function loginRedirect(request: NextRequest) {
  const login = new URL("/admin/login/", request.url);
  // Admin actions are form POSTs, so 303 safely turns a failed authenticated
  // submission into a GET for the login page instead of replaying the POST.
  const status = request.method === "GET" || request.method === "HEAD" ? 307 : 303;
  return applyPrivateHeaders(NextResponse.redirect(login, status));
}

export async function middleware(request: NextRequest) {
  const legacyId =
    request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");

  if (legacyId && legacyPages[legacyId]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPages[legacyId];
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;

  if (isProtectedAdmin(pathname)) {
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    const exp = jwtExp(access);
    const now = Math.floor(Date.now() / 1000);

    if (!access && !refresh) {
      return loginRedirect(request);
    }

    if ((!access || exp < now + 90) && refresh) {
      const renewed = await refreshSession(refresh);
      if (!renewed?.access_token || !renewed.refresh_token) {
        const response = loginRedirect(request);
        response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
        response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
        return response;
      }

      const response = applyPrivateHeaders(NextResponse.next());
      const secure = process.env.NODE_ENV === "production";
      response.cookies.set(ACCESS_COOKIE, renewed.access_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: Math.max(60, Number(renewed.expires_in || 3600) - 30),
      });
      response.cookies.set(REFRESH_COOKIE, renewed.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }
  }

  const response = NextResponse.next();
  return isPrivateRoute(pathname) ? applyPrivateHeaders(response) : response;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/api/:path*",
    "/preview/:path*",
    "/internal/:path*",
  ],
};

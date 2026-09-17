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

const retiredPages: Record<string, string> = {
  "/nutrition/medical-weight-loss": "/nutrition/",
  "/nutrition/medical-weight-loss/": "/nutrition/",
};

const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const SESSION_COOKIE = "rc_admin_session";

function isAdminRoute(pathname: string) {
  return ADMIN_PREFIXES.some(
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

function normalizeHost(value: string | null | undefined) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  return first.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] || null;
}

function requestHost(request: NextRequest) {
  const candidates = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("x-original-host"),
    request.headers.get("host"),
    request.nextUrl.hostname,
  ]
    .map(normalizeHost)
    .filter((host): host is string => Boolean(host));
  return candidates[0] ?? null;
}

function applyPrivateHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", PRIVATE_ROBOTS);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function redirectWwwToCanonical(request: NextRequest) {
  const host = requestHost(request);
  if (host !== "www.resetclinic.org") return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = "resetclinic.org";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

function loginRedirect(request: NextRequest) {
  const login = new URL("/admin/login/", request.url);
  const status = request.method === "GET" || request.method === "HEAD" ? 307 : 303;
  return applyPrivateHeaders(NextResponse.redirect(login, status));
}

export function middleware(request: NextRequest) {
  const canonicalRedirect = redirectWwwToCanonical(request);
  if (canonicalRedirect) return canonicalRedirect;

  const legacyId =
    request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");

  if (legacyId && legacyPages[legacyId]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPages[legacyId];
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const retiredTarget = retiredPages[pathname];
  if (retiredTarget) {
    const url = request.nextUrl.clone();
    url.pathname = retiredTarget;
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  // Middleware only performs the cheap presence gate. Every protected page/API
  // verifies the HMAC-signed cookie server-side before reading private data.
  if (isProtectedAdmin(pathname) && !request.cookies.get(SESSION_COOKIE)?.value) {
    return loginRedirect(request);
  }

  const response = NextResponse.next();
  if (isAdminRoute(pathname)) return applyPrivateHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|assets/).*)",
  ],
};

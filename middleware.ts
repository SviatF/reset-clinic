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
const NON_CANONICAL_ROBOTS = "noindex, follow";
const SESSION_COOKIE = "rc_admin_session";
const MAIN_HOSTS = new Set(["resetclinic.org", "www.resetclinic.org"]);
const SHOP_CANONICAL_HOSTS = new Set(["shop.resetclinic.org"]);
const SHOP_DEPLOYMENT_HOSTS = new Set(["reset-clinic-shop.vercel.app"]);
const CANONICAL_HOSTS = new Set([...MAIN_HOSTS, ...SHOP_CANONICAL_HOSTS]);

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

function normalizeHost(value: string | null | undefined) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  return first.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] || null;
}

function requestHosts(request: NextRequest) {
  return [
    request.headers.get("x-forwarded-host"),
    request.headers.get("x-original-host"),
    request.headers.get("host"),
    request.nextUrl.hostname,
  ]
    .map(normalizeHost)
    .filter((host): host is string => Boolean(host));
}

function primaryHost(request: NextRequest) {
  return requestHosts(request)[0] || null;
}

function isShopHost(host: string | null) {
  if (!host) return false;
  return (
    SHOP_CANONICAL_HOSTS.has(host) ||
    SHOP_DEPLOYMENT_HOSTS.has(host) ||
    (host.startsWith("reset-clinic-shop-") && host.endsWith(".vercel.app"))
  );
}

function isNonCanonicalHost(request: NextRequest) {
  return !requestHosts(request).some((host) => CANONICAL_HOSTS.has(host));
}

function applyPrivateHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", PRIVATE_ROBOTS);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function applyNonCanonicalHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", NON_CANONICAL_ROBOTS);
  return response;
}

function loginRedirect(request: NextRequest) {
  const login = new URL("/admin/login/", request.url);
  const status = request.method === "GET" || request.method === "HEAD" ? 307 : 303;
  return applyPrivateHeaders(NextResponse.redirect(login, status));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = primaryHost(request);

  // Normalize browser-saved WordPress URLs before Next.js route matching.
  if (/\/index\.html$/i.test(pathname)) {
    const clean = request.nextUrl.clone();
    clean.pathname = pathname.replace(/index\.html$/i, "");
    const redirect = NextResponse.redirect(clean, 308);
    return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(redirect) : redirect;
  }

  // Native category routes render the complete category, so collapse legacy
  // WooCommerce pagination URLs to their canonical category path.
  if (pathname.includes("/product-category/") && /\/page\/\d+\/?$/i.test(pathname)) {
    const clean = request.nextUrl.clone();
    clean.pathname = pathname.replace(/\/page\/\d+\/?$/i, "/");
    const redirect = NextResponse.redirect(clean, 308);
    return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(redirect) : redirect;
  }

  // The shop subdomain and its Vercel deployment expose clean shop URLs, while
  // every storefront route lives internally under /shop/* in this repository.
  if (isShopHost(host)) {
    if (
      pathname.startsWith("/shop-media/") ||
      pathname.startsWith("/shop-archive/") ||
      pathname.startsWith("/_next/")
    ) {
      const response = NextResponse.next();
      return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(response) : response;
    }

    // Never expose the internal namespace on the shop host.
    if (pathname === "/shop" || pathname.startsWith("/shop/")) {
      const clean = request.nextUrl.clone();
      clean.pathname = pathname === "/shop" ? "/" : pathname.slice(5) || "/";
      const redirect = NextResponse.redirect(clean, 308);
      return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(redirect) : redirect;
    }

    const internal = request.nextUrl.clone();
    internal.pathname = pathname === "/" ? "/shop" : `/shop${pathname}`;
    const rewrite = NextResponse.rewrite(internal);
    return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(rewrite) : rewrite;
  }

  // On the clinic production domain, /shop is an internal namespace only.
  if (host && MAIN_HOSTS.has(host) && (pathname === "/shop" || pathname.startsWith("/shop/"))) {
    const target = new URL(request.url);
    target.hostname = "shop.resetclinic.org";
    target.pathname = pathname === "/shop" ? "/" : pathname.slice(5) || "/";
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  const legacyId =
    request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");

  if (legacyId && legacyPages[legacyId]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPages[legacyId];
    url.search = "";
    const redirect = NextResponse.redirect(url, 308);
    return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(redirect) : redirect;
  }

  // Middleware only performs the cheap presence gate. Every protected page/API
  // verifies the HMAC-signed cookie server-side before reading private data.
  if (isProtectedAdmin(pathname) && !request.cookies.get(SESSION_COOKIE)?.value) {
    return loginRedirect(request);
  }

  const response = NextResponse.next();
  if (isPrivateRoute(pathname)) return applyPrivateHeaders(response);
  return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(response) : response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|assets/|shop-media/).*)",
  ],
};

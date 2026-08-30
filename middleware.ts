import { NextRequest, NextResponse } from "next/server";

const legacyPages: Record<string, string> = {
  "5": "/", "286": "/price/", "295": "/doctors/", "328": "/contacts/",
  "425": "/about/", "435": "/services/", "1064": "/thank-you/", "1073": "/booking/",
};

const PRIVATE_PREFIXES = ["/admin", "/api", "/preview", "/internal"];
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const NON_CANONICAL_ROBOTS = "noindex, follow";
const SESSION_COOKIE = "rc_admin_session";
const MAIN_HOSTS = new Set(["resetclinic.org", "www.resetclinic.org"]);
const SHOP_HOSTS = new Set(["shop.resetclinic.org"]);
const CANONICAL_HOSTS = new Set([...MAIN_HOSTS, ...SHOP_HOSTS]);

function isPrivateRoute(pathname: string) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedAdmin(pathname: string) {
  const adminPage = (pathname === "/admin" || pathname.startsWith("/admin/")) && !pathname.startsWith("/admin/login");
  const adminApi = pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/login") && !pathname.startsWith("/api/admin/logout");
  return adminPage || adminApi;
}

function normalizeHost(value: string | null | undefined) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  return first.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] || null;
}

function requestHosts(request: NextRequest) {
  return [request.headers.get("x-forwarded-host"), request.headers.get("x-original-host"), request.headers.get("host"), request.nextUrl.hostname]
    .map(normalizeHost).filter((host): host is string => Boolean(host));
}

function primaryHost(request: NextRequest) { return requestHosts(request)[0] || null; }
function isNonCanonicalHost(request: NextRequest) { return !requestHosts(request).some((host) => CANONICAL_HOSTS.has(host)); }

function applyPrivateHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", PRIVATE_ROBOTS);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}
function applyNonCanonicalHeaders(response: NextResponse) { response.headers.set("X-Robots-Tag", NON_CANONICAL_ROBOTS); return response; }
function loginRedirect(request: NextRequest) {
  const login = new URL("/admin/login/", request.url);
  const status = request.method === "GET" || request.method === "HEAD" ? 307 : 303;
  return applyPrivateHeaders(NextResponse.redirect(login, status));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = primaryHost(request);

  // Browser-saved shop pages link to */index.html. Canonicalize those URLs before
  // route matching so both Vercel previews and the real shop subdomain work.
  if (/\/index\.html$/i.test(pathname)) {
    const clean = request.nextUrl.clone();
    clean.pathname = pathname.replace(/index\.html$/i, "");
    return NextResponse.redirect(clean, 308);
  }

  // Saved WooCommerce category archives include /page/1/ and /page/2/ URLs.
  // The new SSR category route renders the whole category, so collapse legacy
  // pagination to one canonical URL instead of allowing those links to 404.
  if (pathname.includes("/product-category/") && /\/page\/\d+\/?$/i.test(pathname)) {
    const clean = request.nextUrl.clone();
    clean.pathname = pathname.replace(/\/page\/\d+\/?$/i, "/");
    return NextResponse.redirect(clean, 308);
  }

  // The shop is one Next.js application but a completely isolated route tree.
  // Visitors on shop.resetclinic.org see clean URLs; internally they render /shop/*.
  if (host && SHOP_HOSTS.has(host)) {
    // These are internal media endpoints used by the archived 1:1 shop markup.
    // They must stay outside the /shop rewrite or CSS/images/fonts will 404.
    if (pathname.startsWith("/shop-media/") || pathname.startsWith("/shop-archive/")) return NextResponse.next();

    if (pathname === "/shop" || pathname.startsWith("/shop/")) {
      const clean = request.nextUrl.clone();
      clean.pathname = pathname === "/shop" ? "/" : pathname.slice(5) || "/";
      return NextResponse.redirect(clean, 308);
    }
    const internal = request.nextUrl.clone();
    internal.pathname = pathname === "/" ? "/shop" : `/shop${pathname}`;
    return NextResponse.rewrite(internal);
  }

  // On the main production domain never expose the internal /shop namespace.
  if (host && MAIN_HOSTS.has(host) && (pathname === "/shop" || pathname.startsWith("/shop/"))) {
    const target = new URL(request.url);
    target.hostname = "shop.resetclinic.org";
    target.pathname = pathname === "/shop" ? "/" : pathname.slice(5) || "/";
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  const legacyId = request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");
  if (legacyId && legacyPages[legacyId]) {
    const url = request.nextUrl.clone(); url.pathname = legacyPages[legacyId]; url.search = "";
    const redirect = NextResponse.redirect(url, 308);
    return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(redirect) : redirect;
  }

  if (isProtectedAdmin(pathname) && !request.cookies.get(SESSION_COOKIE)?.value) return loginRedirect(request);
  const response = NextResponse.next();
  if (isPrivateRoute(pathname)) return applyPrivateHeaders(response);
  return isNonCanonicalHost(request) ? applyNonCanonicalHeaders(response) : response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|assets/|shop-media/).*)"],
};

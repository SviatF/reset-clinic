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

function isPrivateRoute(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const legacyId =
    request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");

  if (legacyId && legacyPages[legacyId]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPages[legacyId];
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  if (isPrivateRoute(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", PRIVATE_ROBOTS);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
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

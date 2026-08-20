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

export function middleware(request: NextRequest) {
  const legacyId =
    request.nextUrl.searchParams.get("page_id") ?? request.nextUrl.searchParams.get("p");

  if (!legacyId || !legacyPages[legacyId]) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = legacyPages[legacyId];
  url.search = "";

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/",
};

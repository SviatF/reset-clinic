import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login/", request.url), 303);
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

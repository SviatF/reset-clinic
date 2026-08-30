import { NextResponse } from "next/server";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  const target = new URL(request.url);
  target.pathname = target.pathname.replace(/\/index\.html$/i, "/");
  if (!target.pathname.endsWith(`/${slug}/`)) target.pathname = `/shop/product/${slug}/`;
  return NextResponse.redirect(target, 308);
}

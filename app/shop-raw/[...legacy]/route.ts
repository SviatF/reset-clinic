import { NextResponse } from "next/server";
import { loadCompactShopDocument } from "../../../lib/shop/legacy-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ legacy: string[] }> };

export async function GET(request: Request, { params }: Context) {
  const { legacy } = await params;

  try {
    const html = await loadCompactShopDocument(legacy);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        "X-RESET-Shop-Renderer": "next-ssr-compact-archive",
      },
    });
  } catch {
    // Until the compact archive is present, keep the current native Next.js
    // product/category pages available instead of hard-failing the storefront.
    const fallback = new URL(request.url);
    const currentPath = fallback.pathname;
    const previewPrefix = currentPath.startsWith("/shop/") ? "/shop" : "";
    const cleanParts = legacy.filter((part) => part.toLowerCase() !== "index.html");
    fallback.pathname = `${previewPrefix}/${cleanParts.join("/")}/`.replace(/\/+/g, "/");
    fallback.searchParams.set("native", "1");
    return NextResponse.redirect(fallback, 307);
  }
}

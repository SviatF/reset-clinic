import { loadLegacyShopDocument } from "../../../lib/shop/legacy-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ legacy: string[] }> };

export async function GET(_request: Request, { params }: Context) {
  const { legacy } = await params;

  try {
    const html = await loadLegacyShopDocument(legacy);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        "X-RESET-Shop-Renderer": "next-ssr-archive-page",
      },
    });
  } catch {
    return new Response(
      "<!doctype html><html lang=\"uk\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>404 — RESET Shop</title></head><body style=\"font-family:Arial,sans-serif;background:#f5f3f1;color:#211d19;display:grid;place-items:center;min-height:100vh;margin:0\"><main style=\"text-align:center\"><div style=\"font:64px Georgia,serif\">404</div><p>Сторінку не знайдено</p><a href=\"/shop/\" style=\"color:inherit\">На головну магазину</a></main></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

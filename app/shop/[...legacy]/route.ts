import { loadCompactShopDocument, loadLegacyShopDocument } from "../../../lib/shop/legacy-renderer";

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
        "X-RESET-Shop-Source": "original-downloaded-html",
      },
    });
  } catch {
    try {
      const html = await loadCompactShopDocument(legacy);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
          "X-RESET-Shop-Source": "original-compact-html",
        },
      });
    } catch {
      return new Response(
        "<!doctype html><html lang=\"uk\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>404 — RESET Shop</title></head><body><main style=\"font-family:Arial,sans-serif;padding:80px;text-align:center\"><h1>404</h1><p>Сторінку не знайдено у збереженій копії RESET Shop.</p><a href=\"/shop/\">На головну</a></main></body></html>",
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }
  }
}

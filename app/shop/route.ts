import { loadLegacyShopDocument } from "../../lib/shop/legacy-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const html = await loadLegacyShopDocument();
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "X-RESET-Shop-Renderer": "next-ssr-archive",
    },
  });
}

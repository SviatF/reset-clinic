export const dynamic = "force-static";

export function GET() {
  return new Response("User-agent: *\nAllow: /\nDisallow: /cart/\nSitemap: https://shop.resetclinic.org/sitemap.xml\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

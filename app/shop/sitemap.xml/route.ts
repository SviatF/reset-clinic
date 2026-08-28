import { SHOP_CATEGORIES, SHOP_PRODUCTS } from "../../../lib/shop/catalog";
import { SHOP_INFO_PAGES } from "../../../lib/shop/info-pages";

export const dynamic = "force-static";

export function GET() {
  const origin = "https://shop.resetclinic.org";
  const paths = [
    "/",
    ...Object.keys(SHOP_CATEGORIES).map((slug) => `/product-category/${slug}/`),
    ...SHOP_PRODUCTS.map((product) => `/product/${product.slug}/`),
    ...Object.keys(SHOP_INFO_PAGES).map((slug) => `/${slug}/`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc><changefreq>${path.startsWith("/product/") ? "weekly" : "monthly"}</changefreq><priority>${path === "/" ? "1.0" : path.startsWith("/product/") ? "0.8" : "0.7"}</priority></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

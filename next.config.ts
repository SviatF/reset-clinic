import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  outputFileTracingIncludes: {
    "/shop": ["./shop.resetclinic.org 3/index.html"],
    "/shop/[...legacy]": ["./shop.resetclinic.org 3/**/*"],
    "/shop-raw/[...legacy]": ["./shop.resetclinic.org 3/index.html", "./shop.resetclinic.org 3/shop-pages-compact.br"],
    "/shop-archive/[...path]": ["./shop.resetclinic.org 3/**/*"],
    "/shop-media/products/[slug]": ["./shop.resetclinic.org 3/wp-content/uploads/**/*"],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    serverSourceMaps: false,
  },
  async redirects() {
    return [
      { source: "/blog/dermatology/", destination: "/blog/dermatolohiya/", permanent: true },
      { source: "/blog/acne/", destination: "/blog/akne/", permanent: true },
      { source: "/blog/rosacea/", destination: "/blog/rozatsea/", permanent: true },
      { source: "/blog/pigmentation/", destination: "/blog/pihmentatsiya/", permanent: true },
      { source: "/blog/cosmetology/", destination: "/blog/kosmetolohiya/", permanent: true },
      { source: "/blog/skin-care/", destination: "/blog/dohlyad-za-shkiroyu/", permanent: true },
      { source: "/blog/nutrition/", destination: "/blog/nutrytsiolohiya/", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  experimental: {
    webpackMemoryOptimizations: true,
    serverSourceMaps: false,
    cpus: 1,
    workerThreads: false,
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

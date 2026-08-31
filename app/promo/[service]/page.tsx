import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromoLandingPage from "../../../components/PromoLandingPage";
import { getPromoService, PROMO_SLUGS } from "../../../lib/promo-data";
import { SITE_NAME } from "../../../lib/seo";

export function generateStaticParams() {
  return PROMO_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) return { title: "RESÉT clinic", robots: { index: false, follow: false } };

  const promoPath = `/promo/${config.slug}/`;
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: { canonical: config.canonicalPath },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: promoPath,
      siteName: SITE_NAME,
      title: config.metaTitle,
      description: config.metaDescription,
      images: [{ url: config.heroImage, alt: config.heroImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.metaTitle,
      description: config.metaDescription,
      images: [config.heroImage],
    },
  };
}

export default async function PromoServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) notFound();
  return <PromoLandingPage config={config} />;
}

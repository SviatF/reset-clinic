import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromoQuizClient from "../../../../components/PromoQuizClient";
import { getPromoService, PROMO_SLUGS } from "../../../../lib/promo-data";
import { SITE_NAME } from "../../../../lib/seo";

export function generateStaticParams() {
  return PROMO_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) return { title: "RESÉT clinic", robots: { index: false, follow: false } };

  const title = `${config.serviceName}: швидкий підбір | RESÉT clinic`;
  const quizPath = `/promo/${config.slug}/quiz/`;
  return {
    title,
    description: config.quizLead,
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
      url: quizPath,
      siteName: SITE_NAME,
      title,
      description: config.quizLead,
      images: [{ url: config.heroImage, alt: config.heroImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: config.quizLead,
      images: [config.heroImage],
    },
  };
}

export default async function PromoQuizPage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) notFound();
  return <PromoQuizClient config={config} />;
}

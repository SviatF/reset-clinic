import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromoQuizClientPl from "../../../../../../components/PromoQuizClientPl";
import { getPolishPromoByPathSlug, PL_PROMO_SLUGS } from "../../../../../../lib/promo-data-pl";
import { SITE_NAME } from "../../../../../../lib/seo";

export function generateStaticParams() {
  return PL_PROMO_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params;
  const config = getPolishPromoByPathSlug(service);
  if (!config) return { title: "RESÉT clinic" };

  const title = `${config.serviceName}: szybki quiz | RESÉT clinic`;
  const quizPath = `/pl/promo/${service}/quiz/`;
  const landingPath = `/pl/promo/${service}/`;

  return {
    title,
    description: config.quizLead,
    alternates: { canonical: landingPath },
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
      locale: "pl_PL",
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

export default async function PolishPromoQuizPage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const config = getPolishPromoByPathSlug(service);
  if (!config) notFound();

  return <PromoQuizClientPl config={config} pathSlug={service} />;
}

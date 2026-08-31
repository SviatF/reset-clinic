import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromoQuizClient from "../../../../components/PromoQuizClient";
import { getPromoService, PROMO_SLUGS } from "../../../../lib/promo-data";

export function generateStaticParams() {
  return PROMO_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) return { title: "RESÉT clinic", robots: { index: false, follow: false } };
  return {
    title: `${config.serviceName}: швидкий підбір | RESÉT clinic`,
    description: config.quizLead,
    robots: { index: false, follow: true },
  };
}

export default async function PromoQuizPage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const config = getPromoService(service);
  if (!config) notFound();
  return <PromoQuizClient config={config} />;
}

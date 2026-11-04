import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromoLandingPagePl from "../../../../components/PromoLandingPagePl";
import { getPolishPromoByPathSlug, PL_PROMO_SLUGS } from "../../../../lib/promo-data-pl";
import { SITE_NAME, jsonLd, SITE_URL } from "../../../../lib/seo";
import { PROMO_LOCALE_PAIRS } from "../../../../lib/promo-locale-pairs";

export function generateStaticParams() {
  return PL_PROMO_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params;
  const config = getPolishPromoByPathSlug(service);
  if (!config) return { title: "RESÉT clinic" };

  const plPath = `/pl/promo/${service}/`;
  const ukPath = PROMO_LOCALE_PAIRS[config.slug].uk;

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: {
      canonical: plPath,
      languages: {
        "pl-PL": plPath,
        "uk-UA": ukPath,
        "x-default": ukPath,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: plPath,
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

export default async function PolishPromoServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const config = getPolishPromoByPathSlug(service);
  if (!config) notFound();

  const url = `${SITE_URL}/pl/promo/${service}/`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: config.serviceName,
      description: config.metaDescription,
      url,
      areaServed: { "@type": "City", name: "Lwów" },
      provider: { "@id": `${SITE_URL}/#clinic` },
      inLanguage: "pl-PL",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: config.metaTitle,
      description: config.metaDescription,
      inLanguage: "pl-PL",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${url}#service` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}${config.heroImage}` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "RESÉT clinic", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Oferta po polsku", item: `${SITE_URL}/pl/promo/` },
        { "@type": "ListItem", position: 3, name: config.serviceName, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "pl-PL",
      mainEntity: config.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <>
      {schema.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(item) }}
        />
      ))}
      <PromoLandingPagePl config={config} pathSlug={service} />
    </>
  );
}

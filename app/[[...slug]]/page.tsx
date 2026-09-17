import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LegacyPage, {
  type LegacyPageData,
  type MobilePageData,
} from "../../components/LegacyPage";
import pages from "../../lib/pages.json";
import mobilePages from "../../lib/mobile-pages.json";
import { buildMetadata, buildPageJsonLd, jsonLd } from "../../lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

const route = (slug?: string[]) => (slug?.length ? `/${slug.join("/")}/` : "/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = route(slug);
  const data = (pages as Record<string, LegacyPageData>)[key];
  if (!data) return { title: "RESET Clinic" };

  const metadata = buildMetadata(key, data.title);
  return {
    ...metadata,
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
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const key = route(slug);
  const data = (pages as Record<string, LegacyPageData>)[key];
  const mobile = (mobilePages as Record<string, MobilePageData>)[key];

  if (!data) notFound();

  const schemas = buildPageJsonLd(key);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      ))}
      <LegacyPage data={data} mobile={mobile} route={key} />
    </>
  );
}

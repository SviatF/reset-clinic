import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../../components/SeoLandingPage";
import { buildCompliantLandingMetadata } from "../../../lib/seo-compliance";
import { resolveSeoLanding } from "../../../lib/seo-page-resolver";
import { seoStaticParams } from "../../../lib/seo-static-params";

export const revalidate = 21600;
export const dynamicParams = false;

type Props = { params: Promise<{ slug?: string[] }> };
const pathFor = (slug?: string[]) => `/cosmetology/${slug?.length ? `${slug.join("/")}/` : ""}`;

export function generateStaticParams() {
  return seoStaticParams("/cosmetology/");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const landing = resolveSeoLanding(pathFor(slug));
  return landing ? buildCompliantLandingMetadata(landing) : { title: "RESET Clinic" };
}

export default async function CosmetologySeoPage({ params }: Props) {
  const { slug } = await params;
  const landing = resolveSeoLanding(pathFor(slug));
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}

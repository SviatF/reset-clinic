import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../../components/SeoLandingPage";
import { buildCompliantLandingMetadata } from "../../../lib/seo-compliance";
import { resolveSeoLanding } from "../../../lib/seo-page-resolver";
import { seoStaticParams } from "../../../lib/seo-static-params";

export const revalidate = 21600;
export const dynamicParams = false;

type Props = { params: Promise<{ slug?: string[] }> };
const pathFor = (slug?: string[]) => `/dermatology/${slug?.length ? `${slug.join("/")}/` : ""}`;

export function generateStaticParams() {
  return seoStaticParams("/dermatology/");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const landing = resolveSeoLanding(pathFor(slug));
  return landing ? buildCompliantLandingMetadata(landing) : { title: "RESET Clinic", robots: { index: false, follow: false } };
}

export default async function DermatologySeoPage({ params }: Props) {
  const { slug } = await params;
  const landing = resolveSeoLanding(pathFor(slug));
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}

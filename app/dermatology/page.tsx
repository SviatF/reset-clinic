import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../components/SeoLandingPage";
import { buildCompliantLandingMetadata } from "../../lib/seo-compliance";
import { resolveSeoLanding } from "../../lib/seo-page-resolver";

export const revalidate = 21600;

const landing = resolveSeoLanding("/dermatology/");

export const metadata: Metadata = landing
  ? buildCompliantLandingMetadata(landing)
  : { title: "RESET Clinic" };

export default function DermatologyPage() {
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}

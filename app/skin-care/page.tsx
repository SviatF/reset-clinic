import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../components/SeoLandingPage";
import { buildCompliantLandingMetadata } from "../../lib/seo-compliance";
import { resolveSeoLanding } from "../../lib/seo-page-resolver";

const landing = resolveSeoLanding("/skin-care/");

export const metadata: Metadata = landing
  ? buildCompliantLandingMetadata(landing)
  : { title: "RESET Clinic", robots: { index: false, follow: false } };

export default function SkinCarePage() {
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}

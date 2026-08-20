import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../components/SeoLandingPage";
import { buildSeoLandingMetadata } from "../../lib/seo-pages";
import { resolveSeoLanding } from "../../lib/seo-page-resolver";

const landing = resolveSeoLanding("/skin-care/");

export const metadata: Metadata = landing
  ? buildSeoLandingMetadata(landing)
  : { title: "RESET Clinic", robots: { index: false, follow: false } };

export default function SkinCarePage() {
  if (!landing) notFound();
  return <SeoLandingPage landing={landing} />;
}

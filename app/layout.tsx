import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../components/SeoLandingPage.css";
import {
  clinicJsonLd,
  DEFAULT_OG_IMAGE,
  jsonLd,
  SITE_NAME,
  SITE_URL,
  websiteJsonLd,
} from "../lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: "RESET Clinic Львів — клініка естетичної медицини",
  description:
    "RESET Clinic у Львові: дерматологія, косметологія, трихологія, нутриціологія та сімейна медицина. Доказовий підхід і сертифіковане обладнання.",
  category: "health",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "/",
    siteName: SITE_NAME,
    title: "RESET Clinic Львів — клініка естетичної медицини",
    description:
      "Клініка естетичної медицини у Львові: дерматологія, косметологія, трихологія, нутриціологія та сімейна медицина.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 2446,
        height: 1314,
        alt: "Інтер’єр RESET Clinic у Львові",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RESET Clinic Львів — клініка естетичної медицини",
    description:
      "Клініка естетичної медицини у Львові: дерматологія, косметологія, трихологія, нутриціологія та сімейна медицина.",
    images: [DEFAULT_OG_IMAGE],
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
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#29201B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk-UA">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(clinicJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}

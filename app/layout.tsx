import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "../components/SeoLandingPage.css";
import "../components/SeoLandingPolish.css";
import "../components/SeoLandingVisualFixes.css";
import "../components/DoctorProfileLogo.css";
import "../components/PremiumMotion.css";
import "../components/PromoPages.css";
import MarketingTracking from "../components/MarketingTracking";
import SeoComplianceClient from "../components/SeoComplianceClient";
import PremiumMotion from "../components/PremiumMotion";
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
  icons: {
    icon: [{ url: "/assets/favicon.png", type: "image/png" }],
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png",
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
      <head>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-THZNMKV3');`}
        </Script>

        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1027613629595915');
fbq('track', 'PageView');`}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-THZNMKV3"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1027613629595915&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(clinicJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
        />
        <MarketingTracking />
        <SeoComplianceClient />
        <PremiumMotion />
        {children}
      </body>
    </html>
  );
}

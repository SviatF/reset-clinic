import type { Metadata } from "next";
import BookingExperience from "./BookingExperience";
import { buildPageJsonLd, jsonLd } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Онлайн-запис | RESET Clinic",
  description: "Оберіть послугу або лікаря, перегляньте актуальні вільні години та запишіться в RESET Clinic у Львові онлайн.",
  alternates: { canonical: "https://resetclinic.org/booking/" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Онлайн-запис | RESET Clinic",
    description: "Актуальний розклад RESET Clinic: послуга або лікар → день → час → підтвердження.",
    url: "https://resetclinic.org/booking/",
    siteName: "RESET Clinic",
    locale: "uk_UA",
    type: "website",
    images: [{
      url: "https://resetclinic.org/assets/6dff7433211d4169812cea0cec5bf9be74ba951c.png",
      width: 2446,
      height: 1314,
      alt: "RESET Clinic у Львові",
    }],
  },
};

export default function BookingPage() {
  const schemas = buildPageJsonLd("/booking/");

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`booking-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      ))}

      <style>{`
        /* /booking is intentionally form-only: no promo story, hero or extra support strip. */
        main > header + div {
          display: block !important;
          min-height: 100dvh !important;
          padding-top: 76px !important;
        }

        main > header + div > aside,
        main > header + div > section > div:first-child,
        main > header + div > section > div:last-child {
          display: none !important;
        }

        main > header + div > section {
          width: 100% !important;
          max-width: 980px !important;
          min-height: calc(100dvh - 76px) !important;
          margin: 0 auto !important;
          padding: clamp(28px, 4vw, 56px) 20px 48px !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
        }

        main > header + div > section > div:nth-child(2) {
          width: min(100%, 860px) !important;
          min-height: auto !important;
          border-radius: 28px !important;
        }

        @media (max-width: 820px) {
          main > header + div {
            padding-top: 62px !important;
          }

          main > header + div > section {
            min-height: calc(100dvh - 62px) !important;
            padding: 14px 10px 28px !important;
          }

          main > header + div > section > div:nth-child(2) {
            border: 1px solid rgba(43, 33, 28, 0.08) !important;
            border-radius: 20px !important;
            box-shadow: 0 18px 46px rgba(53, 39, 31, 0.07) !important;
            overflow: hidden !important;
          }
        }

        @media (max-width: 430px) {
          main > header + div > section {
            padding: 8px 6px 22px !important;
          }

          main > header + div > section > div:nth-child(2) {
            border-radius: 16px !important;
          }
        }
      `}</style>

      <BookingExperience />
    </>
  );
}

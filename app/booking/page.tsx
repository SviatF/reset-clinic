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
      <BookingExperience />
    </>
  );
}

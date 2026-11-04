import type { Metadata } from "next";
import Link from "next/link";
import PromoAttributionBridge from "../../../components/PromoAttributionBridge";

export const metadata: Metadata = {
  title: "Dziękujemy za zgłoszenie | RESÉT clinic",
  description: "Zgłoszenie zostało wysłane do RESÉT clinic we Lwowie.",
  robots: { index: false, follow: false },
};

export default function PolishThankYouPage() {
  return (
    <main className="promo-site" lang="pl-PL" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px" }}>
      <PromoAttributionBridge />
      <section style={{ maxWidth: 760, textAlign: "center" }}>
        <p className="promo-kicker">RESÉT clinic · Lwów</p>
        <h1 style={{ fontSize: "clamp(42px, 7vw, 82px)", margin: "18px 0" }}>Dziękujemy.</h1>
        <p style={{ fontSize: 20, lineHeight: 1.6 }}>
          Otrzymaliśmy Twoje zgłoszenie. Jeśli wybrany termin został potwierdzony w Cliniccards,
          wizyta jest już zapisana. W razie potrzeby administrator skontaktuje się z Tobą.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link className="promo-primary" href="/pl/promo/">Wróć do polskiej oferty →</Link>
        </div>
      </section>
    </main>
  );
}

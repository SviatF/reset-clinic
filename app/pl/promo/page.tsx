import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../../../components/PromoHub.module.css";
import PromoAttributionBridge from "../../../components/PromoAttributionBridge";
import { PROMO_SERVICES_PL, polishPromoPath } from "../../../lib/promo-data-pl";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "../../../lib/seo";
import type { PromoServiceSlug } from "../../../lib/promo-data";

const META_TITLE = "Medycyna estetyczna we Lwowie – wybierz zabieg | RESÉT clinic";
const META_DESCRIPTION = "Polskojęzyczny przewodnik RESÉT clinic we Lwowie: toksyna botulinowa, modelowanie ust, IPL, oczyszczanie twarzy, kontrola masy ciała i konsultacje żywieniowe.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  alternates: {
    canonical: "/pl/promo/",
    languages: {
      "pl-PL": "/pl/promo/",
      "uk-UA": "/promo/",
      "x-default": "/promo/",
    },
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
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "/pl/promo/",
    siteName: SITE_NAME,
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: "RESÉT clinic we Lwowie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const order: PromoServiceSlug[] = [
  "botulinotherapy",
  "lips",
  "ipl-face",
  "facial-cleaning",
  "biopatid",
  "nutrition",
];

const cardMeta: Record<PromoServiceSlug, { index: string; family: string; title: string; text: string; tags: string[] }> = {
  botulinotherapy: {
    index: "01",
    family: "Twarz i mimika",
    title: "Świeższy wygląd bez efektu maski",
    text: "Indywidualna praca z mimiką, czołem, okolicą między brwiami i wokół oczu.",
    tags: ["Zmarszczki", "Mimika", "Naturalny efekt"],
  },
  lips: {
    index: "02",
    family: "Twarz i proporcje",
    title: "Usta dopasowane do Twojej twarzy",
    text: "Kształt, symetria, kontur i subtelna objętość bez schematycznego rezultatu.",
    tags: ["Usta", "Kształt", "Symetria"],
  },
  "ipl-face": {
    index: "03",
    family: "Jakość skóry",
    title: "Równy koloryt bez ciągłego maskowania",
    text: "Dla problemów związanych z rumieniem, naczynkami, przebarwieniami i nierównym kolorytem.",
    tags: ["Rumień", "Przebarwienia", "Koloryt"],
  },
  "facial-cleaning": {
    index: "04",
    family: "Jakość skóry",
    title: "Czystsza i świeższa skóra",
    text: "Gdy przeszkadzają zaskórniki, nadmiar sebum, matowość lub nierówna tekstura.",
    tags: ["Zaskórniki", "Pory", "Tekstura"],
  },
  biopatid: {
    index: "05",
    family: "Masa ciała",
    title: "Medyczna kontrola wagi z oceną lekarza",
    text: "Program rozpoczynany od konsultacji, oceny wskazań i bezpieczeństwa.",
    tags: ["Apetyt", "Masa ciała", "Opieka lekarska"],
  },
  nutrition: {
    index: "06",
    family: "Żywienie",
    title: "Żywienie, które pasuje do codzienności",
    text: "Analiza realnego sposobu jedzenia, rytmu dnia i nawyków bez uniwersalnych restrykcji.",
    tags: ["Żywienie", "Nawyki", "Plan"],
  },
};

export default function PolishPromoHubPage() {
  return (
    <main className={styles.page} lang="pl-PL">
      <PromoAttributionBridge />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="RESÉT clinic">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} priority />
        </Link>
        <div className={styles.headerMeta}>
          <span>RESÉT clinic · Lwów, Ukraina</span>
          <a href="tel:+380932828888">+380 93 282 88 88</a>
        </div>
        <a className={styles.headerFinder} href="#kierunki">Wybierz kierunek <span>↓</span></a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGhost} aria-hidden="true">SELECT</div>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>RESÉT · PROCEDURE FINDER · LWÓW</p>
          <h1>Co chcesz <em>zmienić?</em></h1>
          <p className={styles.heroLead}>
            Zacznij od swojego problemu, nie od nazwy procedury. Każdy kierunek ma osobną stronę
            z informacjami, lekarzami, cenami i dedykowanym quizem.
          </p>
          <div className={styles.heroActions}>
            <a href="#kierunki" className={styles.primary}>Zobacz kierunki <span>↓</span></a>
          </div>
          <div className={styles.heroSignals}>
            <span>6 kierunków</span><span>Osobne quizy</span><span>Rezerwacja online</span><span>RESÉT clinic · Lwów</span>
          </div>
        </div>
      </section>

      <section className={styles.selector} id="kierunki">
        <div className={styles.selectorIntro}>
          <div>
            <p className={styles.kicker}>WYBIERZ PROBLEM</p>
            <h2>Nie katalog zabiegów.<br />Sześć konkretnych scenariuszy.</h2>
          </div>
          <p>
            Otwórz stronę kierunku albo przejdź od razu do krótkiego quizu.
            Ostateczny plan jest ustalany po ocenie lekarza lub właściwego specjalisty.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {order.map((slug, position) => {
            const config = PROMO_SERVICES_PL[slug];
            const card = cardMeta[slug];
            const path = polishPromoPath(slug);
            const quiz = polishPromoPath(slug, true);

            return (
              <article className={`${styles.card} ${position % 4 === 0 || position % 4 === 3 ? styles.cardWide : styles.cardNarrow}`} key={slug}>
                <Link href={path} className={styles.cardImage} aria-label={`${config.serviceName}: otwórz stronę`}>
                  <Image src={config.heroImage} alt={config.heroImageAlt} fill sizes="(max-width: 760px) 100vw, 55vw" style={{ objectFit: "cover" }} />
                  <span className={styles.cardShade} />
                  <span className={styles.cardNumber}>{card.index}</span>
                  <span className={styles.cardFamily}>{card.family}</span>
                  <span className={styles.cardView}>VIEW <b>↗</b></span>
                </Link>
                <div className={styles.cardBody}>
                  <div className={styles.cardTags}>{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <p className={styles.cardService}>{config.serviceName}</p>
                  <h3>{card.title}</h3>
                  <p className={styles.cardText}>{card.text}</p>
                  <div className={styles.cardActions}>
                    <Link href={path}>Zobacz kierunek <span>→</span></Link>
                    <Link href={quiz}>3 pytania</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.finderBanner}>
        <div className={styles.finderBannerGhost} aria-hidden="true">PL</div>
        <div>
          <p className={styles.kicker}>RESÉT CLINIC · LWÓW</p>
          <h2>Każdy landing ma własny<br />dedykowany quiz.</h2>
        </div>
        <a href="#kierunki">Wybierz kierunek <span>→</span></a>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} />
        </Link>
        <div>
          <span>Lwów, Ukraina · ul. Kulparkowska 93/2</span>
          <a href="tel:+380932828888">+380 93 282 88 88</a>
        </div>
        <nav><Link href="/contacts/">Kontakt</Link><Link href="/price/">Cennik</Link></nav>
      </footer>
    </main>
  );
}

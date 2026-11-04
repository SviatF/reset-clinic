import Image from "next/image";
import Link from "next/link";
import { DOCTORS } from "../lib/doctors";
import { PROMO_SERVICES, type PromoServiceConfig, type PromoServiceSlug } from "../lib/promo-data";
import { PROMO_SERVICES_PL, polishPromoPath } from "../lib/promo-data-pl";
import { getPublishedPricesForLanding } from "../lib/price-data";
import { PROMO_DOCTOR_SLUGS } from "../lib/promo-doctor-map";
import PromoCasesSectionPl from "./PromoCasesSectionPl";
import PromoAttributionBridge from "./PromoAttributionBridge";
import PromoLeadFormPl from "./PromoLeadFormPl";

function uniqPrices(rows: { service: string; price: string }[]) {
  return rows.filter((row, index, list) =>
    list.findIndex((item) => `${item.service}|${item.price}` === `${row.service}|${row.price}`) === index
  );
}

function rolePl(role: string) {
  if (role === "Лікар-косметолог") return "Lekarz-kosmetolog";
  if (role === "Сімейний лікар та нутриціолог") return "Lekarz rodzinny i specjalista żywieniowy";
  return role;
}

function priceServicePl(value: string) {
  return value
    .replaceAll("Повторна консультація", "Konsultacja kontrolna")
    .replaceAll("Індивідуальний супровід нутриціолога", "Indywidualne prowadzenie żywieniowe")
    .replaceAll("консультація", "konsultacja")
    .replaceAll("Консультація", "Konsultacja")
    .replaceAll("Міжбрів’я", "Okolica między brwiami")
    .replaceAll("Чоло", "Czoło")
    .replaceAll("Очі", "Okolica oczu")
    .replaceAll("Верхня третина", "Górna 1/3 twarzy")
    .replaceAll("Зморшки носа", "Zmarszczki nosa")
    .replaceAll("Гінгівальна посмішка", "Uśmiech dziąsłowy")
    .replaceAll("Кисетні зморшки", "Zmarszczki palacza")
    .replaceAll("Підборіддя", "Broda")
    .replaceAll("кутики рота", "kąciki ust")
    .replaceAll("Платизма", "Platysma")
    .replaceAll("шия", "szyja")
    .replaceAll("Шия", "Szyja")
    .replaceAll("овал", "owal")
    .replaceAll("всі зони обличчя", "wszystkie obszary twarzy")
    .replaceAll("Обличчя", "Twarz")
    .replaceAll("обличчя", "twarz")
    .replaceAll("декольте", "dekolt")
    .replaceAll("Декольте", "Dekolt")
    .replaceAll("Щоки", "Policzki")
    .replaceAll("Спина", "Plecy")
    .replaceAll("Кисті рук", "Dłonie")
    .replaceAll("кисті рук", "dłonie")
    .replaceAll("Пакет", "Pakiet")
    .replaceAll("Лікування розацеа", "Terapia zmian związanych z rumieniem")
    .replaceAll("Чистка обличчя", "Oczyszczanie twarzy")
    .replaceAll("супровід протягом", "prowadzenie przez")
    .replaceAll("меню на", "jadłospis na")
    .replaceAll("діє протягом", "ważna przez")
    .replaceAll("від первинної консультації", "od pierwszej konsultacji");
}

const RELATED_DIRECTIONS: Record<PromoServiceSlug, PromoServiceSlug[]> = {
  botulinotherapy: ["lips", "ipl-face"],
  lips: ["botulinotherapy", "facial-cleaning"],
  "ipl-face": ["facial-cleaning", "botulinotherapy"],
  "facial-cleaning": ["ipl-face", "lips"],
  biopatid: ["nutrition"],
  nutrition: ["biopatid"],
};

export default function PromoLandingPagePl({
  config,
  pathSlug,
}: {
  config: PromoServiceConfig;
  pathSlug: string;
}) {
  const published = config.priceLandingPaths.flatMap((path) => getPublishedPricesForLanding(path, 8));
  const prices = uniqPrices([
    ...published.map(({ service, price }) => ({ service: priceServicePl(service), price }))
      .filter(({ service }) => !/[\u0400-\u04FF]/.test(service)),
    ...(config.manualPriceRows ?? []),
  ]).slice(0, 8);

  const doctors = PROMO_DOCTOR_SLUGS[config.slug].flatMap((slug) => {
    const doctor = DOCTORS.find((item) => item.slug === slug);
    return doctor ? [doctor] : [];
  });

  const quizPath = `/pl/promo/${pathSlug}/quiz/`;
  const bookingService = PROMO_SERVICES[config.slug].serviceName;
  const relatedDirections = RELATED_DIRECTIONS[config.slug].map((slug) => ({
    title: PROMO_SERVICES_PL[slug].serviceName,
    href: polishPromoPath(slug),
  }));

  return (
    <main className={`promo-site promo-landing promo-theme-${config.slug}`} lang="pl-PL">
      <PromoAttributionBridge />
      <header className="promo-header">
        <Link className="promo-brand" href="/pl/promo/" aria-label="RESÉT clinic — polskie strony promocyjne">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} priority />
        </Link>
        <div className="promo-header-meta">
          <span>Lwów · Kulparkowska 93/2</span>
          <a href="tel:+380932828888">+380 93 282 88 88</a>
        </div>
        <a className="promo-header-cta" href="#promo-form">Umów wizytę</a>
      </header>

      <section className="promo-hero">
        <div className="promo-shell promo-hero-grid">
          <div className="promo-hero-copy">
            <p className="promo-kicker">{config.eyebrow}</p>
            <h1>{config.heroTitle}</h1>
            <p className="promo-hero-lead">{config.heroLead}</p>
            {config.heroBadge ? <div className="promo-hero-badge">{config.heroBadge}</div> : null}
            <div className="promo-hero-actions">
              <a className="promo-primary" href="#promo-form">{config.primaryCta} →</a>
              <Link className="promo-secondary" href={quizPath}>{config.quizCta}</Link>
            </div>
            {config.heroNote ? <p className="promo-medical-note">{config.heroNote}</p> : null}
          </div>

          <figure className="promo-hero-visual">
            <Image
              src={config.heroImage}
              alt={config.heroImageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              priority
              style={{ objectFit: "cover" }}
            />
            <figcaption>
              <span>RESÉT clinic · Lwów</span>
              <strong>{config.serviceName}</strong>
              <small>Indywidualne podejście · ocena specjalisty</small>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="promo-proof-strip" aria-label="Dlaczego RESÉT clinic">
        <div className="promo-shell promo-proof-grid">
          <div>
            <span>01</span><strong>Podejście medyczne</strong>
            <p>Decyzja o zabiegu lub planie jest podejmowana po ocenie Twojego problemu i stanu zdrowia.</p>
          </div>
          <div>
            <span>02</span><strong>Bez schematów</strong>
            <p>Zakres, parametry i kolejne kroki dobieramy indywidualnie, a nie według jednego wzorca.</p>
          </div>
          <div>
            <span>03</span><strong>Kontrola</strong>
            <p>Wyjaśniamy oczekiwany efekt, możliwą regenerację i dalsze kroki.</p>
          </div>
        </div>
      </section>

      <section className="promo-pain-section">
        <div className="promo-shell">
          <div className="promo-section-heading promo-section-heading-wide">
            <p className="promo-kicker">{config.painEyebrow}</p>
            <h2>{config.painTitle}</h2>
            <p>{config.painLead}</p>
          </div>

          <div className="promo-pain-grid">
            {config.pains.map((pain, index) => (
              <article key={pain.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{pain.title}</h3>
                <p>{pain.text}</p>
              </article>
            ))}
          </div>

          <div className="promo-inline-cta">
            <Link href={quizPath}>Rozpoznajesz swój problem? Odpowiedz na 3 krótkie pytania <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="promo-solution-section">
        <div className="promo-shell promo-solution-grid">
          <figure className="promo-solution-visual">
            <Image
              src={config.secondaryImage}
              alt={config.secondaryImageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              style={{ objectFit: "cover" }}
            />
          </figure>

          <div className="promo-solution-copy">
            <p className="promo-kicker">{config.solutionEyebrow}</p>
            <h2>{config.solutionTitle}</h2>
            <p className="promo-section-lead">{config.solutionLead}</p>

            <div className="promo-benefit-list">
              {config.benefits.map((benefit, index) => (
                <div key={benefit.title}>
                  <span>0{index + 1}</span>
                  <div><h3>{benefit.title}</h3><p>{benefit.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PromoCasesSectionPl config={config} quizPath={quizPath} />

      <section className="promo-process-section">
        <div className="promo-shell">
          <div className="promo-section-heading">
            <p className="promo-kicker">Jak to wygląda</p>
            <h2>{config.processTitle}</h2>
          </div>
          <div className="promo-process-grid">
            {config.process.map((item) => (
              <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="promo-doctor-section">
        <div className="promo-shell promo-doctor-layout">
          <div className="promo-section-heading">
            <p className="promo-kicker">Komu powierzasz swój rezultat</p>
            <h2>{config.trustTitle}</h2>
            <p>{config.trustLead}</p>
          </div>

          <div className={`promo-doctor-grid promo-doctor-count-${Math.min(doctors.length, 3)}`}>
            {doctors.map((doctor) => (
              <article className="promo-doctor-card" key={doctor.slug}>
                <div className="promo-doctor-photo">
                  <Image
                    src={doctor.image}
                    alt={`${doctor.name} — ${rolePl(doctor.role)}`}
                    fill
                    sizes="(max-width: 700px) 100vw, 280px"
                    style={{ objectFit: "cover", objectPosition: "center top" }}
                  />
                </div>
                <div>
                  <span>{rolePl(doctor.role)}</span>
                  <strong>{doctor.name}</strong>
                  <p>Specjalista RESÉT clinic. Zakres procedury lub plan konsultacji jest ustalany indywidualnie po ocenie pacjenta.</p>
                  <Link className="promo-doctor-profile-link" href={`/doctors/${doctor.slug}/`} lang="uk-UA">
                    Profil lekarza (po ukraińsku) →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="promo-price-section" id="promo-price">
        <div className="promo-shell promo-price-layout">
          <div className="promo-section-heading">
            <p className="promo-kicker">Cena</p>
            <h2>Bez ukrytego „cenę poznasz dopiero po wysłaniu formularza”.</h2>
            <p>{config.priceNote}</p>
          </div>

          <div className="promo-price-card">
            {prices.length
              ? prices.map((row) => (
                  <div className="promo-price-row" key={`${row.service}-${row.price}`}>
                    <span>{row.service}</span><strong>{row.price}</strong>
                  </div>
                ))
              : <div className="promo-price-empty">Aktualną cenę potwierdzi administrator kliniki.</div>}
            <Link href="/price/" lang="uk-UA">Pełny cennik kliniki (po ukraińsku) →</Link>
          </div>
        </div>
      </section>

      <section className="promo-faq-section">
        <div className="promo-shell promo-faq-layout">
          <div className="promo-section-heading">
            <p className="promo-kicker">Pytania przed wizytą</p>
            <h2>To normalne, że chcesz wiedzieć więcej przed podjęciem decyzji.</h2>
            <p>Krótko odpowiadamy na najczęstsze pytania przed konsultacją lub zabiegiem.</p>
          </div>

          <div className="promo-faq-list">
            {config.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<span>+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="promo-related-pl" aria-labelledby="promo-related-heading">
        <div className="promo-shell">
          <p className="promo-kicker">Poznaj inne możliwości</p>
          <h2 id="promo-related-heading">Powiązane konsultacje i zabiegi we Lwowie</h2>
          <nav aria-label="Powiązane polskojęzyczne strony usług" className="promo-related-pl-links">
            {relatedDirections.map((direction) => (
              <Link key={direction.href} href={direction.href}>
                {direction.title}<span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <p className="promo-related-pl-note">RESÉT clinic znajduje się we Lwowie, w Ukrainie. O wyborze zabiegu decyduje konsultacja i ocena wskazań.</p>
        </div>
      </section>

      <section className="promo-conversion-section" id="promo-form">
        <div className="promo-shell promo-conversion-grid">
          <div>
            <p className="promo-kicker">Następny krok</p>
            <h2>{config.finalTitle}</h2>
            <p>{config.finalLead}</p>
            <div className="promo-conversion-alt">
              <span>Nie chcesz jeszcze zostawiać numeru?</span>
              <Link href={quizPath}>{config.quizCta} →</Link>
            </div>
          </div>

          <div className="promo-form-card">
            <PromoLeadFormPl
              service={config.serviceName}
              bookingService={bookingService}
              slug={config.slug}
              extraFields={{ promo_language: "pl" }}
            />
          </div>
        </div>
      </section>

      <footer className="promo-footer">
        <div className="promo-shell">
          <Link className="promo-brand promo-brand-footer" href="/pl/promo/">
            <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} />
          </Link>
          <div>
            <span>Lwów, ul. Kulparkowska 93/2</span>
            <a href="tel:+380932828888">+380 93 282 88 88</a>
          </div>
          <nav>
            <Link href="/pl/promo/">Wszystkie kierunki</Link>
            <Link href={quizPath}>Quiz</Link>
            <Link href="/contacts/" lang="uk-UA">Kontakt (po ukraińsku)</Link>
          </nav>
        </div>
      </footer>

      <div className="promo-mobile-bar">
        <a href="#promo-form">Umów wizytę</a>
        <Link href={quizPath}>3 pytania →</Link>
      </div>
    </main>
  );
}

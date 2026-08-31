import Image from "next/image";
import Link from "next/link";
import { DOCTORS, doctorPath } from "../lib/doctors";
import { getPublishedPricesForLanding } from "../lib/price-data";
import type { PromoServiceConfig } from "../lib/promo-data";
import PromoLeadForm from "./PromoLeadForm";

function uniqPrices(rows: { service: string; price: string }[]) {
  return rows.filter((row, index, list) => list.findIndex((item) => `${item.service}|${item.price}` === `${row.service}|${row.price}`) === index);
}

export default function PromoLandingPage({ config }: { config: PromoServiceConfig }) {
  const published = config.priceLandingPaths.flatMap((path) => getPublishedPricesForLanding(path, 8));
  const prices = uniqPrices([
    ...published.map(({ service, price }) => ({ service, price })),
    ...(config.manualPriceRows ?? []),
  ]).slice(0, 8);
  const doctors = DOCTORS.filter((doctor) => config.doctorSlugs.includes(doctor.slug));

  return (
    <main className={`promo-site promo-landing promo-theme-${config.slug}`}>
      <header className="promo-header">
        <Link className="promo-brand" href="/" aria-label="RESÉT clinic — головна">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} priority />
        </Link>
        <div className="promo-header-meta"><span>Львів · Кульпарківська, 93/2</span><a href="tel:+380932828888">+380 93 282 88 88</a></div>
        <a className="promo-header-cta" href="#promo-form">Записатися</a>
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
              <Link className="promo-secondary" href={`/promo/${config.slug}/quiz/`}>{config.quizCta}</Link>
            </div>
            {config.heroNote ? <p className="promo-medical-note">{config.heroNote}</p> : null}
          </div>
          <figure className="promo-hero-visual">
            <Image src={config.heroImage} alt={config.heroImageAlt} fill sizes="(max-width: 900px) 100vw, 45vw" priority style={{ objectFit: "cover" }} />
            <figcaption><span>RESÉT clinic · Львів</span><strong>{config.serviceName}</strong><small>Індивідуальний підхід · медична оцінка</small></figcaption>
          </figure>
        </div>
      </section>

      <section className="promo-proof-strip" aria-label="Переваги RESÉT clinic">
        <div className="promo-shell promo-proof-grid">
          <div><span>01</span><strong>Лікарський підхід</strong><p>Рішення приймається після оцінки вашого запиту та стану.</p></div>
          <div><span>02</span><strong>Не шаблон</strong><p>Протокол, параметри або обсяг підбираються індивідуально.</p></div>
          <div><span>03</span><strong>Контроль</strong><p>Пояснюємо очікуваний результат, відновлення та наступні кроки.</p></div>
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
            {config.pains.map((pain, index) => <article key={pain.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{pain.title}</h3><p>{pain.text}</p></article>)}
          </div>
          <div className="promo-inline-cta"><Link href={`/promo/${config.slug}/quiz/`}>Впізнали свій запит? Пройдіть 3 короткі питання <span>→</span></Link></div>
        </div>
      </section>

      <section className="promo-solution-section">
        <div className="promo-shell promo-solution-grid">
          <figure className="promo-solution-visual"><Image src={config.secondaryImage} alt={config.secondaryImageAlt} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: "cover" }} /></figure>
          <div className="promo-solution-copy">
            <p className="promo-kicker">{config.solutionEyebrow}</p>
            <h2>{config.solutionTitle}</h2>
            <p className="promo-section-lead">{config.solutionLead}</p>
            <div className="promo-benefit-list">
              {config.benefits.map((benefit, index) => <div key={benefit.title}><span>0{index + 1}</span><div><h3>{benefit.title}</h3><p>{benefit.text}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="promo-process-section">
        <div className="promo-shell">
          <div className="promo-section-heading"><p className="promo-kicker">Як це працює</p><h2>{config.processTitle}</h2></div>
          <div className="promo-process-grid">
            {config.process.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="promo-doctor-section">
        <div className="promo-shell promo-doctor-layout">
          <div className="promo-section-heading"><p className="promo-kicker">Кому ви довіряєте результат</p><h2>{config.trustTitle}</h2><p>{config.trustLead}</p></div>
          <div className={`promo-doctor-grid promo-doctor-count-${Math.min(doctors.length, 3)}`}>
            {doctors.map((doctor) => (
              <Link className="promo-doctor-card" href={doctorPath(doctor)} key={doctor.slug}>
                <div className="promo-doctor-photo"><Image src={doctor.image} alt={`${doctor.name} — ${doctor.role}`} fill sizes="(max-width: 700px) 100vw, 280px" style={{ objectFit: "cover", objectPosition: "center top" }} /></div>
                <div><span>{doctor.role}</span><strong>{doctor.name}</strong>{doctor.subtitle ? <small>{doctor.subtitle}</small> : null}<p>{doctor.bio}</p><b>Профіль лікаря →</b></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="promo-price-section" id="promo-price">
        <div className="promo-shell promo-price-layout">
          <div className="promo-section-heading"><p className="promo-kicker">Вартість</p><h2>Без прихованого «дізнайтеся ціну після заявки».</h2><p>{config.priceNote}</p></div>
          <div className="promo-price-card">
            {prices.length ? prices.map((row) => <div className="promo-price-row" key={`${row.service}-${row.price}`}><span>{row.service}</span><strong>{row.price}</strong></div>) : <div className="promo-price-empty">Актуальна вартість доступна у загальному прайсі клініки.</div>}
            <Link href="/price/">Переглянути повний прайс →</Link>
          </div>
        </div>
      </section>

      <section className="promo-faq-section">
        <div className="promo-shell promo-faq-layout">
          <div className="promo-section-heading"><p className="promo-kicker">Заперечення, які нормально мати</p><h2>Питання перед записом</h2><p>Коротко відповідаємо на те, що найчастіше зупиняє перед консультацією або процедурою.</p></div>
          <div className="promo-faq-list">
            {config.faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="promo-conversion-section" id="promo-form">
        <div className="promo-shell promo-conversion-grid">
          <div><p className="promo-kicker">Наступний крок</p><h2>{config.finalTitle}</h2><p>{config.finalLead}</p><div className="promo-conversion-alt"><span>Не готові залишати номер?</span><Link href={`/promo/${config.slug}/quiz/`}>{config.quizCta} →</Link></div></div>
          <div className="promo-form-card"><PromoLeadForm service={config.serviceName} slug={config.slug} /></div>
        </div>
      </section>

      <footer className="promo-footer">
        <div className="promo-shell"><Link className="promo-brand promo-brand-footer" href="/"><Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} /></Link><div><span>Львів, вул. Кульпарківська, 93/2</span><a href="tel:+380932828888">+380 93 282 88 88</a></div><nav><Link href="/">Головна</Link><Link href="/price/">Ціни</Link><Link href="/doctors/">Лікарі</Link><Link href="/contacts/">Контакти</Link></nav></div>
      </footer>

      <div className="promo-mobile-bar"><a href="#promo-form">Записатися</a><Link href={`/promo/${config.slug}/quiz/`}>3 питання →</Link></div>
    </main>
  );
}

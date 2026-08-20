import Link from "next/link";
import { jsonLd } from "../lib/seo";
import { buildSeoLandingJsonLd, type SeoLanding } from "../lib/seo-pages";

const MAIN_NAV = [
  ["Дерматологія", "/dermatology/"],
  ["Косметологія", "/cosmetology/"],
  ["Проблеми шкіри", "/skin-problems/"],
  ["Догляд", "/skin-care/"],
  ["Нутриціологія", "/nutrition/"],
  ["Лікарі", "/doctors/"],
  ["Ціни", "/price/"],
] as const;

export default function SeoLandingPage({ landing }: { landing: SeoLanding }) {
  const schema = buildSeoLandingJsonLd(landing);

  return (
    <main className="seo-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="RESET Clinic — головна">
          <span>RESET</span>
          <small>клініка естетичної медицини</small>
        </Link>
        <nav className="seo-nav" aria-label="Основна навігація">
          {MAIN_NAV.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <Link className="seo-header-cta" href="/booking/">Записатися</Link>
      </header>

      <section className="seo-hero">
        <div className="seo-shell">
          <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
            {landing.breadcrumbs.map((crumb, index) => (
              <span key={crumb.href}>
                {index > 0 ? <b aria-hidden="true">/</b> : null}
                {index === landing.breadcrumbs.length - 1 ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href}>{crumb.name}</Link>
                )}
              </span>
            ))}
          </nav>

          <div className="seo-hero-grid">
            <div>
              <p className="seo-eyebrow">{landing.eyebrow}</p>
              <h1>{landing.h1}</h1>
              <p className="seo-lead">{landing.intro}</p>
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href="/booking/">Записатися на прийом</Link>
                <Link className="seo-button" href="/price/">Переглянути ціни</Link>
              </div>
            </div>
            <aside className="seo-intent-card" aria-label="Про сторінку">
              <span>RESET Clinic · Львів</span>
              <strong>{landing.type === "problem" ? "Проблема → діагностика → лікування" : landing.type === "procedure" ? "Процедура → показання → консультація" : landing.type === "service" ? "Консультація → план → контроль" : "Напрям → послуги → лікар"}</strong>
              <p>Інформація на сторінці не замінює консультацію лікаря. Медична тактика визначається індивідуально.</p>
            </aside>
          </div>
        </div>
      </section>

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          {landing.sections.map((section, index) => (
            <section className="seo-section" key={`${section.title}-${index}`}>
              <span className="seo-section-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.title}</h2>
                {section.text?.map((paragraph, pIndex) => <p key={pIndex}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>

        <aside className="seo-side">
          {landing.related.map((group) => (
            <section className="seo-related-card" key={group.title}>
              <p>{group.title}</p>
              <div>
                {group.items.map((item) => (
                  <Link href={item.href} key={`${group.title}-${item.href}`}>{item.label}<span>↗</span></Link>
                ))}
              </div>
            </section>
          ))}
          <section className="seo-related-card seo-contact-card">
            <p>RESET Clinic</p>
            <strong>Львів, вул. Кульпарківська, 93/2</strong>
            <a href="tel:+380932828888">+380 93 282 88 88</a>
          </section>
        </aside>
      </div>

      {landing.faq.length ? (
        <section className="seo-faq">
          <div className="seo-shell">
            <p className="seo-eyebrow">FAQ</p>
            <h2>Часті запитання</h2>
            <div className="seo-faq-grid">
              {landing.faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}<span>+</span></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="seo-final-cta">
        <div className="seo-shell seo-final-grid">
          <div>
            <p className="seo-eyebrow">RESET Clinic · Львів</p>
            <h2>{landing.cta.title}</h2>
            <p>{landing.cta.text}</p>
          </div>
          <Link className="seo-button seo-button-light" href={landing.cta.href}>{landing.cta.label}</Link>
        </div>
      </section>

      <footer className="seo-footer">
        <div className="seo-shell seo-footer-grid">
          <Link className="seo-brand" href="/"><span>RESET</span><small>клініка естетичної медицини</small></Link>
          <div className="seo-footer-links">
            <Link href="/services/">Усі послуги</Link>
            <Link href="/doctors/">Лікарі</Link>
            <Link href="/price/">Ціни</Link>
            <Link href="/blog/">Блог</Link>
            <Link href="/contacts/">Контакти</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

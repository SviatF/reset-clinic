import Link from "next/link";
import { DOCTORS, doctorPath } from "../lib/doctors";
import { DEFAULT_OG_IMAGE, jsonLd } from "../lib/seo";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";
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

function directChildren(landing: SeoLanding) {
  if (landing.type !== "category") return [];
  return ALL_SEO_LANDINGS.filter((candidate) => {
    if (candidate.path === landing.path || !candidate.path.startsWith(landing.path)) return false;
    const remainder = candidate.path.slice(landing.path.length).replace(/\/$/, "");
    return remainder.length > 0 && !remainder.includes("/");
  });
}

function intentLabel(landing: SeoLanding) {
  if (landing.type === "problem") return "Діагностика · причина · тактика";
  if (landing.type === "procedure") return "Показання · процедура · супровід";
  if (landing.type === "service") return "Консультація · план · контроль";
  return "Напрям · послуги · лікарі";
}

function SiteHeader() {
  return (
    <header className="seo-header">
      <Link className="seo-brand" href="/" aria-label="RESET Clinic — головна">
        <span>RESET</span>
        <small>клініка естетичної медицини</small>
      </Link>
      <nav className="seo-nav" aria-label="Основна навігація">
        {MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="seo-header-actions">
        <details className="seo-mobile-menu">
          <summary>Меню</summary>
          <div className="seo-mobile-menu-panel">
            {MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </details>
        <Link className="seo-header-cta" href="/booking/">Записатися</Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="seo-footer">
      <div className="seo-shell seo-footer-grid">
        <div className="seo-footer-brand-block">
          <Link className="seo-brand" href="/"><span>RESET</span><small>клініка естетичної медицини</small></Link>
          <p>Львів, вул. Кульпарківська, 93/2</p>
          <a href="tel:+380932828888">+380 93 282 88 88</a>
        </div>
        <div className="seo-footer-links">
          <Link href="/services/">Усі послуги</Link>
          <Link href="/doctors/">Лікарі</Link>
          <Link href="/price/">Ціни</Link>
          <Link href="/blog/">Блог</Link>
          <Link href="/contacts/">Контакти</Link>
        </div>
      </div>
    </footer>
  );
}

export default function SeoLandingPage({ landing }: { landing: SeoLanding }) {
  const schema = buildSeoLandingJsonLd(landing);
  const children = directChildren(landing);
  const doctors = DOCTORS.filter((doctor) => doctor.relatedPaths.includes(landing.path));

  return (
    <main className="seo-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <SiteHeader />

      <section className="seo-hero">
        <div className="seo-shell">
          <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
            {landing.breadcrumbs.map((crumb, index) => (
              <span key={crumb.href}>
                {index > 0 ? <b aria-hidden="true">/</b> : null}
                {index === landing.breadcrumbs.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.href}>{crumb.name}</Link>}
              </span>
            ))}
          </nav>

          <div className="seo-hero-grid">
            <div className="seo-hero-copy">
              <p className="seo-eyebrow">{landing.eyebrow}</p>
              <h1>{landing.h1}</h1>
              <p className="seo-lead">{landing.intro}</p>
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href="/booking/">Записатися на прийом</Link>
                <Link className="seo-button" href="/price/">Переглянути ціни</Link>
              </div>
              <p className="seo-medical-note">Інформація на сторінці не замінює консультацію лікаря. Тактика визначається індивідуально.</p>
            </div>

            <figure className="seo-hero-visual">
              <img src={DEFAULT_OG_IMAGE} alt="Інтер’єр RESET Clinic у Львові" />
              <figcaption className="seo-hero-caption">
                <span>RESET Clinic · Львів</span>
                <strong>{intentLabel(landing)}</strong>
                <small>Кульпарківська, 93/2</small>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="seo-process-strip" aria-label="Підхід RESET Clinic">
        <div className="seo-shell seo-process-grid">
          <div><span>01</span><strong>Оцінка запиту</strong><p>Починаємо з анамнезу, огляду та визначення задачі.</p></div>
          <div><span>02</span><strong>Персональний план</strong><p>Метод і послідовність підбираються під конкретний стан.</p></div>
          <div><span>03</span><strong>Контроль динаміки</strong><p>За потреби коригуємо план на наступних візитах.</p></div>
        </div>
      </section>

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          {landing.sections.map((section, index) => (
            <section className="seo-section" key={`${section.title}-${index}`}>
              <div className="seo-section-kicker"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
              <div>
                <h2>{section.title}</h2>
                {section.text?.map((paragraph, pIndex) => <p key={pIndex}>{paragraph}</p>)}
                {section.bullets?.length ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </div>
            </section>
          ))}
        </article>

        <aside className="seo-side">
          {children.length ? (
            <section className="seo-related-card seo-related-primary">
              <p>У цьому розділі</p>
              <div>{children.map((child) => <Link href={child.path} key={child.path}>{child.breadcrumbs.at(-1)?.name ?? child.h1}<span>↗</span></Link>)}</div>
            </section>
          ) : null}
          {landing.related.map((group) => (
            <section className="seo-related-card" key={group.title}>
              <p>{group.title}</p>
              <div>{group.items.map((item) => <Link href={item.href} key={`${group.title}-${item.href}`}>{item.label}<span>↗</span></Link>)}</div>
            </section>
          ))}
          <section className="seo-related-card seo-contact-card">
            <p>RESET Clinic</p>
            <strong>Львів, вул. Кульпарківська, 93/2</strong>
            <a href="tel:+380932828888">+380 93 282 88 88</a>
            <Link className="seo-inline-link" href="/contacts/">Контакти та маршрут →</Link>
          </section>
        </aside>
      </div>

      {doctors.length ? (
        <section className="seo-doctors-band">
          <div className="seo-shell">
            <div className="seo-band-heading">
              <div><p className="seo-eyebrow">Команда</p><h2>Лікарі цього напряму</h2></div>
              <Link href="/doctors/">Усі лікарі →</Link>
            </div>
            <div className="seo-doctor-grid">
              {doctors.map((doctor) => (
                <Link className="seo-doctor-card" href={doctorPath(doctor)} key={doctor.slug}>
                  <div className="seo-doctor-photo"><img src={doctor.image} alt={doctor.name} /></div>
                  <div><span>{doctor.role}</span><strong>{doctor.name}</strong><small>Профіль лікаря →</small></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {landing.faq.length ? (
        <section className="seo-faq">
          <div className="seo-shell seo-faq-layout">
            <div className="seo-faq-heading"><p className="seo-eyebrow">FAQ</p><h2>Часті запитання</h2><p>Короткі відповіді на питання, які найчастіше виникають перед консультацією або процедурою.</p></div>
            <div className="seo-faq-grid">
              {landing.faq.map((item) => (
                <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="seo-final-cta">
        <div className="seo-shell seo-final-grid">
          <div><p className="seo-eyebrow">RESET Clinic · Львів</p><h2>{landing.cta.title}</h2><p>{landing.cta.text}</p></div>
          <Link className="seo-button seo-button-light" href={landing.cta.href}>{landing.cta.label}</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

import Link from "next/link";
import { doctorJsonLd, type DoctorProfile } from "../lib/doctors";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";
import { jsonLd } from "../lib/seo";

const MAIN_NAV = [
  ["Дерматологія", "/dermatology/"],
  ["Косметологія", "/cosmetology/"],
  ["Проблеми шкіри", "/skin-problems/"],
  ["Догляд", "/skin-care/"],
  ["Нутриціологія", "/nutrition/"],
  ["Лікарі", "/doctors/"],
  ["Ціни", "/price/"],
] as const;

function relatedLandings(doctor: DoctorProfile) {
  return doctor.relatedPaths
    .map((path) => ALL_SEO_LANDINGS.find((landing) => landing.path === path))
    .filter((landing): landing is NonNullable<typeof landing> => Boolean(landing));
}

export default function DoctorProfilePage({ doctor }: { doctor: DoctorProfile }) {
  const related = relatedLandings(doctor);

  return (
    <main className="seo-site seo-doctor-profile">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(doctorJsonLd(doctor)) }} />

      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="RESET Clinic — головна">
          <span>RESET</span><small>клініка естетичної медицини</small>
        </Link>
        <nav className="seo-nav" aria-label="Основна навігація">
          {MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="seo-header-actions">
          <details className="seo-mobile-menu">
            <summary>Меню</summary>
            <div className="seo-mobile-menu-panel">{MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
          </details>
          <Link className="seo-header-cta" href="/booking/">Записатися</Link>
        </div>
      </header>

      <section className="seo-hero">
        <div className="seo-shell">
          <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
            <span><Link href="/">Головна</Link></span>
            <span><b aria-hidden="true">/</b><Link href="/doctors/">Лікарі</Link></span>
            <span><b aria-hidden="true">/</b><span aria-current="page">{doctor.name}</span></span>
          </nav>

          <div className="seo-hero-grid">
            <div className="seo-hero-copy">
              <p className="seo-eyebrow">Команда RESET Clinic</p>
              <h1>{doctor.name}</h1>
              <p className="seo-lead">{doctor.role}{doctor.subtitle ? ` · ${doctor.subtitle}` : ""}</p>
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href="/booking/">Записатися на прийом</Link>
                <Link className="seo-button" href="/doctors/">Усі лікарі</Link>
              </div>
              <p className="seo-medical-note">Профіль сформований на основі інформації, опублікованої RESET Clinic.</p>
            </div>

            <figure className="seo-hero-visual seo-doctor-hero-visual">
              <img src={doctor.image} alt={doctor.name} />
              <figcaption className="seo-hero-caption">
                <span>RESET Clinic · Львів</span>
                <strong>{doctor.role}</strong>
                <small>{doctor.subtitle || "Клініка естетичної медицини"}</small>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="seo-process-strip" aria-label="Профіль лікаря">
        <div className="seo-shell seo-process-grid">
          <div><span>01</span><strong>Консультація</strong><p>Оцінка запиту, стану шкіри та очікувань.</p></div>
          <div><span>02</span><strong>План</strong><p>Підбір доречних процедур і послідовності роботи.</p></div>
          <div><span>03</span><strong>Супровід</strong><p>Рекомендації та контроль динаміки за потреби.</p></div>
        </div>
      </section>

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          <section className="seo-section">
            <div className="seo-section-kicker"><span>01</span><i /></div>
            <div><h2>Про лікаря</h2><p>{doctor.bio}</p></div>
          </section>
          <section className="seo-section">
            <div className="seo-section-kicker"><span>02</span><i /></div>
            <div>
              <h2>Напрямки роботи</h2>
              <p>Сторінки процедур і напрямків, які відповідають інформації, опублікованій у профілі лікаря.</p>
              {related.length ? <ul>{related.map((landing) => <li key={landing.path}><Link href={landing.path}>{landing.h1}</Link></li>)}</ul> : null}
            </div>
          </section>
          <section className="seo-section">
            <div className="seo-section-kicker"><span>03</span><i /></div>
            <div><h2>Запис на консультацію</h2><p>Для вибору процедури або плану корекції важлива очна оцінка задачі, анатомічних особливостей і можливих протипоказань.</p></div>
          </section>
        </article>

        <aside className="seo-side">
          {related.length ? (
            <section className="seo-related-card seo-related-primary">
              <p>Напрямки лікаря</p>
              <div>{related.slice(0, 10).map((landing) => <Link href={landing.path} key={landing.path}>{landing.breadcrumbs.at(-1)?.name ?? landing.h1}<span>↗</span></Link>)}</div>
            </section>
          ) : null}
          <section className="seo-related-card">
            <p>Перед візитом</p>
            <div><Link href="/price/">Ціни<span>↗</span></Link><Link href="/contacts/">Контакти<span>↗</span></Link><Link href="/doctors/">Усі лікарі<span>↗</span></Link></div>
          </section>
          <section className="seo-related-card seo-contact-card">
            <p>RESET Clinic</p><strong>Львів, вул. Кульпарківська, 93/2</strong><a href="tel:+380932828888">+380 93 282 88 88</a>
            <Link className="seo-inline-link" href="/contacts/">Контакти та маршрут →</Link>
          </section>
        </aside>
      </div>

      <section className="seo-final-cta">
        <div className="seo-shell seo-final-grid">
          <div><p className="seo-eyebrow">RESET Clinic · Львів</p><h2>Записатися до {doctor.name}</h2><p>Оберіть зручний час для консультації або процедури.</p></div>
          <Link className="seo-button seo-button-light" href="/booking/">Записатися</Link>
        </div>
      </section>

      <footer className="seo-footer">
        <div className="seo-shell seo-footer-grid">
          <div className="seo-footer-brand-block">
            <Link className="seo-brand" href="/"><span>RESET</span><small>клініка естетичної медицини</small></Link>
            <p>Львів, вул. Кульпарківська, 93/2</p><a href="tel:+380932828888">+380 93 282 88 88</a>
          </div>
          <div className="seo-footer-links"><Link href="/services/">Усі послуги</Link><Link href="/doctors/">Лікарі</Link><Link href="/price/">Ціни</Link><Link href="/blog/">Блог</Link><Link href="/contacts/">Контакти</Link></div>
        </div>
      </footer>
    </main>
  );
}

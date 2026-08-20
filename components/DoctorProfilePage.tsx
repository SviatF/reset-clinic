import Link from "next/link";
import { doctorJsonLd, type DoctorProfile } from "../lib/doctors";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";
import { jsonLd } from "../lib/seo";

function relatedLandings(doctor: DoctorProfile) {
  return doctor.relatedPaths
    .map((path) => ALL_SEO_LANDINGS.find((landing) => landing.path === path))
    .filter((landing): landing is NonNullable<typeof landing> => Boolean(landing));
}

export default function DoctorProfilePage({ doctor }: { doctor: DoctorProfile }) {
  const related = relatedLandings(doctor);

  return (
    <main className="seo-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(doctorJsonLd(doctor)) }} />

      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="RESET Clinic — головна">
          <span>RESET</span>
          <small>клініка естетичної медицини</small>
        </Link>
        <nav className="seo-nav" aria-label="Основна навігація">
          <Link href="/dermatology/">Дерматологія</Link>
          <Link href="/cosmetology/">Косметологія</Link>
          <Link href="/skin-problems/">Проблеми шкіри</Link>
          <Link href="/nutrition/">Нутриціологія</Link>
          <Link href="/doctors/">Лікарі</Link>
          <Link href="/price/">Ціни</Link>
        </nav>
        <Link className="seo-header-cta" href="/booking/">Записатися</Link>
      </header>

      <section className="seo-hero">
        <div className="seo-shell">
          <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
            <span><Link href="/">Головна</Link></span>
            <span><b aria-hidden="true">/</b><Link href="/doctors/">Лікарі</Link></span>
            <span><b aria-hidden="true">/</b><span aria-current="page">{doctor.name}</span></span>
          </nav>

          <div className="seo-hero-grid">
            <div>
              <p className="seo-eyebrow">Команда RESET Clinic</p>
              <h1>{doctor.name}</h1>
              <p className="seo-lead">{doctor.role}{doctor.subtitle ? ` · ${doctor.subtitle}` : ""}</p>
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href="/booking/">Записатися на прийом</Link>
                <Link className="seo-button" href="/doctors/">Усі лікарі</Link>
              </div>
            </div>
            <aside className="seo-intent-card" aria-label="Профіль лікаря">
              <span>RESET Clinic · Львів</span>
              <strong>Лікар → напрямки → запис</strong>
              <p>Профіль сформований на основі інформації, опублікованої клінікою. Додаткові кваліфікації не додаються без підтвердження.</p>
            </aside>
          </div>
        </div>
      </section>

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          <section className="seo-section">
            <span className="seo-section-number">01</span>
            <div>
              <h2>Про лікаря</h2>
              <p>{doctor.bio}</p>
            </div>
          </section>
          <section className="seo-section">
            <span className="seo-section-number">02</span>
            <div>
              <h2>Напрямки роботи</h2>
              <p>Нижче показані сторінки напрямків і процедур, які прямо відповідають інформації з профілю лікаря на сайті клініки.</p>
              {related.length ? (
                <ul>{related.map((landing) => <li key={landing.path}><Link href={landing.path}>{landing.h1}</Link></li>)}</ul>
              ) : null}
            </div>
          </section>
          <section className="seo-section">
            <span className="seo-section-number">03</span>
            <div>
              <h2>Запис на консультацію</h2>
              <p>Для вибору процедури або плану корекції важлива очна оцінка задачі, анатомічних особливостей і можливих протипоказань.</p>
            </div>
          </section>
        </article>

        <aside className="seo-side">
          {related.length ? (
            <section className="seo-related-card">
              <p>Пов’язані напрямки</p>
              <div>
                {related.slice(0, 10).map((landing) => (
                  <Link href={landing.path} key={landing.path}>{landing.breadcrumbs.at(-1)?.name ?? landing.h1}<span>↗</span></Link>
                ))}
              </div>
            </section>
          ) : null}
          <section className="seo-related-card">
            <p>Корисно перед візитом</p>
            <div>
              <Link href="/price/">Ціни<span>↗</span></Link>
              <Link href="/contacts/">Контакти<span>↗</span></Link>
              <Link href="/doctors/">Усі лікарі<span>↗</span></Link>
            </div>
          </section>
          <section className="seo-related-card seo-contact-card">
            <p>RESET Clinic</p>
            <strong>Львів, вул. Кульпарківська, 93/2</strong>
            <a href="tel:+380932828888">+380 93 282 88 88</a>
          </section>
        </aside>
      </div>

      <section className="seo-final-cta">
        <div className="seo-shell seo-final-grid">
          <div>
            <p className="seo-eyebrow">RESET Clinic · Львів</p>
            <h2>Записатися до {doctor.name}</h2>
            <p>Оберіть зручний час для консультації або процедури.</p>
          </div>
          <Link className="seo-button seo-button-light" href="/booking/">Записатися</Link>
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

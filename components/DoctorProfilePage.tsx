import Link from "next/link";
import { type DoctorProfile } from "../lib/doctors";
import { doctorBookingHref, doctorEeat, doctorEeatJsonLd } from "../lib/doctor-eeat";
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

function relatedByFamily(doctor: DoctorProfile) {
  const related = relatedLandings(doctor);
  return [
    { title: "Дерматологія", items: related.filter((item) => item.path.startsWith("/dermatology/") && item.path !== "/dermatology/") },
    { title: "Косметологія", items: related.filter((item) => item.path.startsWith("/cosmetology/") && item.path !== "/cosmetology/") },
    { title: "Проблеми шкіри та волосся", items: related.filter((item) => item.path.startsWith("/skin-problems/") && item.path !== "/skin-problems/") },
    { title: "Нутриціологія", items: related.filter((item) => item.path.startsWith("/nutrition/") && item.path !== "/nutrition/") },
  ].filter((group) => group.items.length);
}

export default function DoctorProfilePage({ doctor }: { doctor: DoctorProfile }) {
  const related = relatedLandings(doctor);
  const groupedRelated = relatedByFamily(doctor);
  const eeat = doctorEeat(doctor);
  const bookingHref = doctorBookingHref(doctor, "profile_primary");
  let sectionNumber = 0;
  const nextNumber = () => String(++sectionNumber).padStart(2, "0");

  return (
    <main className="seo-site seo-doctor-profile">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(doctorEeatJsonLd(doctor)) }} />

      <header className="seo-header">
        <Link className="seo-brand seo-brand-image" href="/" aria-label="RESET Clinic — головна">
          <img src="/assets/logo-main.png" width={132} height={56} alt="RESET Clinic" />
        </Link>
        <nav className="seo-nav" aria-label="Основна навігація">
          {MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="seo-header-actions">
          <details className="seo-mobile-menu">
            <summary>Меню</summary>
            <div className="seo-mobile-menu-panel">{MAIN_NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
          </details>
          <Link className="seo-header-cta" href={doctorBookingHref(doctor, "header")}>Записатися</Link>
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
              <p className="seo-eyebrow">Команда RESET Clinic · Львів</p>
              <h1>{doctor.name}</h1>
              <p className="seo-lead">{doctor.role}{doctor.subtitle ? ` · ${doctor.subtitle}` : ""}</p>
              {eeat.expertise.length ? <p className="seo-doctor-expertise-lead">{eeat.expertise.slice(0, 4).join(" · ")}</p> : null}
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href={bookingHref}>Обрати час до лікаря</Link>
                <Link className="seo-button" href="/doctors/">Усі лікарі</Link>
              </div>
              <p className="seo-medical-note">Профіль сформований тільки з інформації, опублікованої та підтвердженої RESET Clinic. Діагноз і персональна тактика визначаються під час консультації.</p>
            </div>

            <figure className="seo-hero-visual seo-doctor-hero-visual">
              <img src={doctor.image} alt={`${doctor.name} — ${doctor.role} RESET Clinic у Львові`} />
              <figcaption className="seo-hero-caption">
                <span>RESET Clinic · Львів</span>
                <strong>{doctor.role}</strong>
                <small>{doctor.subtitle || "Клініка естетичної медицини"}</small>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="seo-process-strip" aria-label="Підхід лікаря">
        <div className="seo-shell seo-process-grid">
          <div><span>01</span><strong>Запит</strong><p>Фіксуємо, що саме турбує, як давно та що вже пробували.</p></div>
          <div><span>02</span><strong>Оцінка</strong><p>Лікар оцінює стан і відокремлює симптом від його можливої причини.</p></div>
          <div><span>03</span><strong>План</strong><p>Формуємо зрозумілий маршрут лікування, догляду або процедур за показаннями.</p></div>
        </div>
      </section>

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          <section className="seo-section">
            <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
            <div><h2>Про лікаря</h2><p>{doctor.bio}</p></div>
          </section>

          {eeat.expertise.length ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div>
                <h2>Професійні напрямки</h2>
                <p>Напрями нижче сформовані з опублікованого профілю та фактичної структури послуг RESET Clinic.</p>
                <ul>{eeat.expertise.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </section>
          ) : null}

          {eeat.consultationReasons.length ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div>
                <h2>З якими запитами можна звернутися</h2>
                <ul>{eeat.consultationReasons.map((item) => <li key={item}>{item}</li>)}</ul>
                <p><Link href={doctorBookingHref(doctor, "consultation_reasons")}>Переглянути актуальні вільні години {doctor.name} →</Link></p>
              </div>
            </section>
          ) : null}

          <section className="seo-section">
            <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
            <div><h2>Підхід до консультації</h2><p>{eeat.approach}</p><p>План формується після оцінки анамнезу, поточного стану, попереднього лікування або процедур та очікувань пацієнта.</p></div>
          </section>

          {doctor.education?.length ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div><h2>Освіта</h2><ul>{doctor.education.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </section>
          ) : null}

          {doctor.certifications?.length ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div><h2>Сертифікації та підвищення кваліфікації</h2><ul>{doctor.certifications.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </section>
          ) : null}

          {doctor.experience ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div><h2>Досвід</h2><p>{doctor.experience}</p></div>
            </section>
          ) : null}

          <section className="seo-section">
            <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
            <div>
              <h2>Напрямки роботи на сайті RESET Clinic</h2>
              <p>Ці сторінки формують тематичний зв’язок між профілем лікаря, проблемами пацієнтів і послугами клініки.</p>
              {groupedRelated.map((group) => (
                <div key={group.title} className="seo-doctor-topic-group">
                  <h3>{group.title}</h3>
                  <ul>{group.items.map((landing) => <li key={landing.path}><Link href={landing.path}>{landing.h1}</Link></li>)}</ul>
                </div>
              ))}
            </div>
          </section>

          {doctor.schedule ? (
            <section className="seo-section">
              <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
              <div><h2>Графік прийому</h2><p>{doctor.schedule}</p></div>
            </section>
          ) : null}

          <section className="seo-section">
            <div className="seo-section-kicker"><span>{nextNumber()}</span><i /></div>
            <div>
              <h2>Як підготуватися до консультації</h2>
              <ul>
                <li>сформулюйте основний запит і коли він з’явився;</li>
                <li>візьміть попередні висновки, результати обстежень або фото динаміки, якщо вони є;</li>
                <li>запишіть назви препаратів, косметики чи процедур, які вже використовували;</li>
                <li>не скасовуйте призначені препарати самостійно заради візиту.</li>
              </ul>
            </div>
          </section>
        </article>

        <aside className="seo-side">
          <section className="seo-related-card seo-related-primary">
            <p>Запис до лікаря</p>
            <div>
              <Link href={doctorBookingHref(doctor, "sidebar")}>Обрати вільний час<span>↗</span></Link>
              <a href="tel:+380932828888">+380 93 282 88 88<span>↗</span></a>
            </div>
          </section>
          {related.length ? (
            <section className="seo-related-card">
              <p>Ключові напрямки</p>
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
          <div><p className="seo-eyebrow">RESET Clinic · Львів</p><h2>Записатися до {doctor.name}</h2><p>Перейдіть до живого розкладу та оберіть доступну послугу й зручний час.</p></div>
          <Link className="seo-button seo-button-light" href={doctorBookingHref(doctor, "final")}>Обрати час</Link>
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

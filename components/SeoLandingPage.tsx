import Link from "next/link";
import { getPublishedPostsByCategory } from "../lib/blog";
import { blogCategoryPath, getBlogCategory } from "../lib/blog-categories";
import { DOCTORS, doctorPath } from "../lib/doctors";
import { getPublishedPricesForLanding } from "../lib/price-data";
import {
  blogCategoryForLanding,
  buildCompliantLandingJsonLd,
  displayH1ForLanding,
  priceHrefForLanding,
  reviewerForLanding,
  supplementalLandingSections,
} from "../lib/seo-compliance";
import { jsonLd } from "../lib/seo";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";
import type { SeoLanding } from "../lib/seo-pages";
import { seoLandingVisual } from "../lib/seo-visuals";

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

function visualFamily(landing: SeoLanding) {
  if (landing.path.startsWith("/dermatology/")) return "dermatology";
  if (landing.path.startsWith("/cosmetology/")) return "cosmetology";
  if (landing.path.startsWith("/skin-problems/")) return "problems";
  if (landing.path.startsWith("/nutrition/")) return "nutrition";
  if (landing.path.startsWith("/skin-care/")) return "care";
  return "default";
}

function familySignature(landing: SeoLanding) {
  const family = visualFamily(landing);
  if (family === "dermatology") return "Клінічна дерматологія";
  if (family === "cosmetology") return "Естетична медицина";
  if (family === "problems") return "Від симптому до рішення";
  if (family === "nutrition") return "Системний підхід";
  if (family === "care") return "Щоденний догляд";
  return "RESET Clinic";
}

function journeySteps(landing: SeoLanding) {
  if (landing.type === "problem") {
    return [
      ["01", "Симптом", "Фіксуємо, що саме турбує і як давно це триває."],
      ["02", "Причина", "Відрізняємо косметичний прояв від стану, який потребує лікування."],
      ["03", "Тактика", "Обираємо консультацію, лікування або процедуру за показаннями."],
    ] as const;
  }
  if (landing.type === "procedure") {
    return [
      ["01", "Задача", "Визначаємо, який результат потрібен і чи підходить метод."],
      ["02", "Протокол", "Параметри та обсяг процедури підбираються індивідуально."],
      ["03", "Результат", "Пояснюємо строки ефекту, відновлення та подальший супровід."],
    ] as const;
  }
  if (landing.type === "category") {
    return [
      ["01", "Ваш запит", "Починаємо не з назви процедури, а з того, що хочете вирішити."],
      ["02", "Напрям", "Допомагаємо перейти до потрібної послуги, проблеми або методу."],
      ["03", "Спеціаліст", "За потреби маршрут продовжується консультацією профільного лікаря."],
    ] as const;
  }
  return [
    ["01", "Оцінка", "Починаємо з анамнезу, огляду та визначення задачі."],
    ["02", "Персональний план", "Метод і послідовність підбираються під конкретний стан."],
    ["03", "Контроль", "За потреби коригуємо план на наступних візитах."],
  ] as const;
}

function sectionClass(index: number) {
  return `seo-section${index === 0 ? " seo-section-first" : ""} seo-section-variant-${index % 3}`;
}

function publicBlogPostPath(post: { slug: string; category: string | null }) {
  const category = getBlogCategory(post.category);
  return category ? `/blog/${category.slug}/${post.slug}/` : `/blog/${post.slug}/`;
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className="seo-brand seo-brand-image"
      href="/"
      aria-label={footer ? "RESET Clinic — головна" : "RESET Clinic — головна"}
    >
      <img className="seo-brand-logo" src="/assets/logo-main.png" alt="RESET Clinic" />
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="seo-header">
      <Brand />
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
          <Brand footer />
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

export default async function SeoLandingPage({ landing }: { landing: SeoLanding }) {
  const baseSchema = buildCompliantLandingJsonLd(landing);
  const schema = {
    ...baseSchema,
    "@graph": baseSchema["@graph"].filter((node) => node["@type"] !== "FAQPage"),
  };
  const children = directChildren(landing);
  const doctors = DOCTORS.filter((doctor) => doctor.relatedPaths.includes(landing.path));
  const reviewer = reviewerForLanding(landing);
  const priceHref = priceHrefForLanding(landing);
  const priceRows = getPublishedPricesForLanding(landing.path, 5);
  const displayH1 = displayH1ForLanding(landing);
  const supplementalSections = supplementalLandingSections(landing);
  const blogCategory = blogCategoryForLanding(landing.path);
  const relatedPosts = blogCategory
    ? (await getPublishedPostsByCategory(blogCategory, 10)).filter((post) => post.indexable).slice(0, landing.type === "problem" ? 4 : 3)
    : [];
  const family = visualFamily(landing);
  const steps = journeySteps(landing);
  const heroVisual = seoLandingVisual(landing.path);

  return (
    <main className={`seo-site seo-site-polished seo-template-${landing.type} seo-family-${family}`}>
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
              <h1>{displayH1}</h1>
              <p className="seo-lead">{landing.intro}</p>
              <div className="seo-hero-actions">
                <Link className="seo-button seo-button-dark" href="/booking/">Записатися на прийом</Link>
                <Link className="seo-button" href={priceHref}>Переглянути ціни</Link>
              </div>
              <p className="seo-medical-note">Інформація на сторінці не замінює консультацію лікаря. Тактика визначається індивідуально.</p>
              <div className="seo-hero-signature" aria-hidden="true">{familySignature(landing)}</div>
            </div>

            <figure className="seo-hero-visual">
              <img src={heroVisual.src} alt={heroVisual.alt} width={2446} height={1314} fetchPriority="high" decoding="async" />
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
          {steps.map(([number, title, text]) => (
            <div key={number}><span>{number}</span><strong>{title}</strong><p>{text}</p></div>
          ))}
        </div>
      </section>

      {landing.type === "category" && children.length ? (
        <section className="seo-directory-band" aria-label={`Напрями: ${displayH1}`}>
          <div className="seo-shell">
            <div className="seo-directory-heading">
              <div>
                <p className="seo-eyebrow">Напрями та послуги</p>
                <h2>Оберіть потрібний напрям</h2>
              </div>
              <p>Оберіть напрям, що відповідає вашому запиту. На сторінці кожної послуги описані показання, підхід RESET Clinic, пов’язані методи, лікарі та актуальна вартість.</p>
            </div>
            <div className="seo-directory-grid">
              {children.map((child) => (
                <Link className="seo-directory-link" href={child.path} key={child.path}>
                  <strong>{child.breadcrumbs.at(-1)?.name ?? child.h1}</strong><span>↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="seo-shell seo-content-grid">
        <article className="seo-article">
          {[...landing.sections, ...supplementalSections].map((section, index) => (
            <section className={sectionClass(index)} key={`${section.title}-${index}`}>
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
          {children.length && landing.type !== "category" ? (
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
          {relatedPosts.length && blogCategory ? (
            <section className="seo-related-card">
              <p>Статті за темою</p>
              <div>
                {relatedPosts.map((post) => <Link href={publicBlogPostPath(post)} key={post.id}>{post.title}<span>↗</span></Link>)}
                <Link href={blogCategoryPath(blogCategory)}>Усі матеріали категорії<span>↗</span></Link>
              </div>
            </section>
          ) : null}
          <section className="seo-related-card">
            <p>Вартість</p>
            {priceRows.length ? (
              <div className="seo-price-list" aria-label="Актуальні ціни з прайсу RESET Clinic">
                {priceRows.map((row, index) => (
                  <div className="seo-price-row" key={`${row.section}-${row.service}-${row.price}-${index}`}>
                    <span className="seo-price-copy">
                      {row.section ? <span className="seo-price-section">{row.section}</span> : null}
                      <span className="seo-price-service">{row.service}</span>
                    </span>
                    <strong className="seo-price-value">{row.price}</strong>
                  </div>
                ))}
              </div>
            ) : null}
            <div><Link href={priceHref}>Актуальний прайс RESET Clinic<span>↗</span></Link></div>
            <small>Ціни беруться з єдиного опублікованого прайсу RESET Clinic. Остаточна вартість залежить від конкретної послуги, зони, препарату або протоколу.</small>
          </section>
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
                  <div className="seo-doctor-photo"><img src={doctor.image} alt={doctor.name} loading="lazy" decoding="async" /></div>
                  <div><span>{doctor.role}</span><strong>{doctor.name}</strong><small>Профіль лікаря →</small></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {landing.type !== "category" ? (
        <section className="seo-reviewer-band">
          <div className="seo-shell seo-reviewer-card">
            <div>
              <p className="seo-eyebrow">Медична перевірка</p>
              <h2>{reviewer ? `Матеріал перевірено: ${reviewer.name}` : "Медична редакція RESET Clinic"}</h2>
              <p>{reviewer ? `${reviewer.role}. Пов’язаний профіль лікаря та його напрямки доступні на сайті RESET Clinic.` : "Медичні твердження публікуються в межах редакційного контролю клініки. Індивідуальні призначення та діагноз визначаються тільки під час консультації."}</p>
            </div>
            {reviewer ? <Link className="seo-button" href={doctorPath(reviewer)}>Профіль лікаря</Link> : <Link className="seo-button" href="/doctors/">Команда клініки</Link>}
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

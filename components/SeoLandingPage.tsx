import Link from "next/link";
import { getPublishedPostsByCategory } from "../lib/blog";
import { blogCategoryPath, getBlogCategory } from "../lib/blog-categories";
import { DOCTORS, doctorPath } from "../lib/doctors";
import {
  blogCategoryForLanding,
  buildCompliantLandingJsonLd,
  displayH1ForLanding,
  priceHrefForLanding,
  reviewerForLanding,
  supplementalLandingSections,
} from "../lib/seo-compliance";
import { DEFAULT_OG_IMAGE, jsonLd } from "../lib/seo";
import { ALL_SEO_LANDINGS } from "../lib/seo-page-resolver";
import type { SeoLanding } from "../lib/seo-pages";

const MAIN_NAV = [
  ["Дерматологія", "/dermatology/"],
  ["Косметологія", "/cosmetology/"],
  ["Проблеми шкіри", "/skin-problems/"],
  ["Догляд", "/skin-care/"],
  ["Нутриціологія", "/nutrition/"],
  ["Лікарі", "/doctors/"],
  ["Ціни", "/price/"],
] as const;

const POLISH_CSS = `
.seo-site-polished .seo-header{min-height:74px;padding-top:10px;padding-bottom:10px;background:rgba(246,246,238,.97);backdrop-filter:blur(10px)}
.seo-site-polished .seo-brand span{font-size:30px}.seo-site-polished .seo-brand small{font-size:6.5px}
.seo-site-polished .seo-hero{padding:30px 0 62px;background:#f6f6ee}
.seo-site-polished .seo-breadcrumbs{margin-bottom:30px}
.seo-site-polished .seo-hero-grid{grid-template-columns:minmax(0,1.16fr) minmax(350px,.84fr);gap:52px}
.seo-site-polished .seo-hero-copy{padding:8px 0}
.seo-site-polished .seo-hero h1{font-size:clamp(48px,5vw,74px);line-height:.96;max-width:820px}
.seo-site-polished .seo-lead{margin-top:24px;font-size:15px;line-height:1.72;max-width:680px}
.seo-site-polished .seo-hero-actions{margin-top:28px}
.seo-site-polished .seo-button{min-height:46px;padding:0 21px}
.seo-site-polished .seo-hero-visual{min-height:470px;height:470px;border-radius:28px;box-shadow:none}
.seo-site-polished .seo-hero-visual>img{height:470px}
.seo-site-polished .seo-hero-caption{left:22px;right:22px;bottom:22px}
.seo-site-polished .seo-hero-caption strong{font-size:25px}
.seo-site-polished .seo-process-grid>div{padding-top:24px;padding-bottom:26px}
.seo-site-polished .seo-process-grid span{margin-bottom:18px}
.seo-site-polished .seo-process-grid strong{font-size:24px}
.seo-site-polished .seo-content-grid{grid-template-columns:minmax(0,1fr) 300px;gap:64px;padding-top:74px;padding-bottom:78px}
.seo-site-polished .seo-section{grid-template-columns:64px minmax(0,1fr);gap:24px;padding-bottom:50px;margin-bottom:50px}
.seo-site-polished .seo-section h2{font-size:clamp(34px,3.3vw,48px);line-height:1.02;margin-bottom:20px}
.seo-site-polished .seo-section p,.seo-site-polished .seo-section li{font-size:14px;line-height:1.78}
.seo-site-polished .seo-section ul{margin-top:20px}
.seo-site-polished .seo-related-card{border-radius:18px;padding:20px}
.seo-site-polished .seo-related-card small{display:block;margin-top:12px;font-size:11px;line-height:1.55;color:var(--muted)}
.seo-site-polished .seo-contact-card strong{font-size:23px}
.seo-site-polished .seo-doctors-band{padding:72px 0 78px}
.seo-site-polished .seo-band-heading{margin-bottom:32px}
.seo-site-polished .seo-band-heading h2{font-size:clamp(42px,4.4vw,60px)}
.seo-site-polished .seo-doctor-card{border-radius:20px;min-height:170px;grid-template-columns:128px minmax(0,1fr)}
.seo-site-polished .seo-doctor-photo{min-height:170px}
.seo-site-polished .seo-doctor-card strong{font-size:26px}
.seo-site-polished .seo-reviewer-band{padding:58px 0;background:#ebe6da;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.seo-site-polished .seo-reviewer-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:center}
.seo-site-polished .seo-reviewer-card h2{font-family:var(--serif);font-size:clamp(34px,4vw,52px);font-weight:500;line-height:1;margin:8px 0 14px}
.seo-site-polished .seo-reviewer-card p{max-width:760px;line-height:1.7;margin:0}
.seo-site-polished .seo-faq{padding:76px 0}
.seo-site-polished .seo-faq-layout{grid-template-columns:.68fr 1.32fr;gap:64px}
.seo-site-polished .seo-faq h2{font-size:clamp(42px,4.4vw,60px)}
.seo-site-polished .seo-faq summary{font-size:24px;padding:22px 0}
.seo-site-polished .seo-final-cta{padding:76px 0}
.seo-site-polished .seo-final-cta h2{font-size:clamp(46px,5.2vw,70px);line-height:.94}
@media(max-width:1024px){
  .seo-site-polished .seo-hero-grid{grid-template-columns:1fr 390px;gap:36px}
  .seo-site-polished .seo-hero h1{font-size:clamp(46px,6vw,66px)}
  .seo-site-polished .seo-content-grid{grid-template-columns:minmax(0,1fr) 270px;gap:38px}
  .seo-site-polished .seo-section{grid-template-columns:50px minmax(0,1fr);gap:18px}
}
@media(max-width:767px){
  .seo-site-polished .seo-header{min-height:66px;padding-left:18px;padding-right:18px}
  .seo-site-polished .seo-brand span{font-size:27px}
  .seo-site-polished .seo-hero{padding:20px 0 42px}
  .seo-site-polished .seo-breadcrumbs{margin-bottom:22px}
  .seo-site-polished .seo-hero-grid{grid-template-columns:1fr;gap:28px}
  .seo-site-polished .seo-hero h1{font-size:clamp(40px,12vw,58px);line-height:.97}
  .seo-site-polished .seo-lead{font-size:14px;line-height:1.68;margin-top:20px}
  .seo-site-polished .seo-hero-visual,.seo-site-polished .seo-hero-visual>img{height:360px;min-height:360px}
  .seo-site-polished .seo-hero-visual{border-radius:22px}
  .seo-site-polished .seo-process-grid{grid-template-columns:1fr}
  .seo-site-polished .seo-process-grid>div{padding:20px 0;border-right:0;border-bottom:1px solid var(--line)}
  .seo-site-polished .seo-process-grid>div:last-child{border-bottom:0}
  .seo-site-polished .seo-content-grid{grid-template-columns:1fr;gap:34px;padding-top:50px;padding-bottom:56px}
  .seo-site-polished .seo-section{grid-template-columns:1fr;gap:12px;padding-bottom:38px;margin-bottom:38px}
  .seo-site-polished .seo-section-kicker{padding-top:0}
  .seo-site-polished .seo-section h2{font-size:36px}
  .seo-site-polished .seo-section ul{grid-template-columns:1fr}
  .seo-site-polished .seo-side{display:grid;gap:12px}
  .seo-site-polished .seo-related-primary{position:static}
  .seo-site-polished .seo-doctors-band,.seo-site-polished .seo-faq,.seo-site-polished .seo-final-cta,.seo-site-polished .seo-reviewer-band{padding:58px 0}
  .seo-site-polished .seo-doctor-grid{grid-template-columns:1fr}
  .seo-site-polished .seo-reviewer-card{grid-template-columns:1fr;gap:24px}
  .seo-site-polished .seo-faq-layout{grid-template-columns:1fr;gap:34px}
  .seo-site-polished .seo-faq-heading{position:static}
  .seo-site-polished .seo-final-grid{grid-template-columns:1fr;align-items:start}
}
`;

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

function publicBlogPostPath(post: { slug: string; category: string | null }) {
  const category = getBlogCategory(post.category);
  return category ? `/blog/${category.slug}/${post.slug}/` : `/blog/${post.slug}/`;
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

export default async function SeoLandingPage({ landing }: { landing: SeoLanding }) {
  const schema = buildCompliantLandingJsonLd(landing);
  const children = directChildren(landing);
  const doctors = DOCTORS.filter((doctor) => doctor.relatedPaths.includes(landing.path));
  const reviewer = reviewerForLanding(landing);
  const priceHref = priceHrefForLanding(landing);
  const displayH1 = displayH1ForLanding(landing);
  const supplementalSections = supplementalLandingSections(landing);
  const blogCategory = blogCategoryForLanding(landing.path);
  const relatedPosts = blogCategory
    ? (await getPublishedPostsByCategory(blogCategory, 10)).filter((post) => post.indexable).slice(0, landing.type === "problem" ? 4 : 3)
    : [];

  return (
    <main className="seo-site seo-site-polished">
      <style dangerouslySetInnerHTML={{ __html: POLISH_CSS }} />
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
          {[...landing.sections, ...supplementalSections].map((section, index) => (
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
            <div><Link href={priceHref}>Актуальний прайс RESET Clinic<span>↗</span></Link></div>
            <small>Вартість залежить від конкретної послуги, зони, препарату або протоколу. Використовуємо один глобальний прайс без дубльованих SEO-сторінок цін.</small>
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
                  <div className="seo-doctor-photo"><img src={doctor.image} alt={doctor.name} /></div>
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

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
.seo-site-polished .seo-price-list{display:grid;margin:10px 0 2px;border-top:1px solid var(--line)}
.seo-site-polished .seo-price-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);align-items:start}
.seo-site-polished .seo-price-copy{display:grid;gap:3px;min-width:0}
.seo-site-polished .seo-price-section{font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.seo-site-polished .seo-price-service{font-size:11px;line-height:1.45;color:#554a43}
.seo-site-polished .seo-price-value{font-size:12px;white-space:nowrap}
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

/* One RESET identity, several page rhythms. */
.seo-site-polished .seo-hero,.seo-site-polished .seo-process-strip,.seo-site-polished .seo-section,.seo-site-polished .seo-directory-band{transition:background .2s ease,border-color .2s ease}
.seo-site-polished .seo-hero-signature{display:flex;align-items:center;gap:10px;margin-top:28px;color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.seo-site-polished .seo-hero-signature:before{content:"";width:34px;height:1px;background:var(--accent);opacity:.65}

/* Dermatology: quiet clinical editorial. */
.seo-family-dermatology .seo-hero{background:linear-gradient(135deg,#f6f6ee 0%,#f6f6ee 68%,#ebe6da 68%,#ebe6da 100%)}
.seo-family-dermatology .seo-hero-grid{grid-template-columns:minmax(0,1.2fr) minmax(340px,.8fr);align-items:end}
.seo-family-dermatology .seo-hero-visual{border-radius:54px 8px 54px 8px}
.seo-family-dermatology .seo-process-strip{background:#fbfaf6}
.seo-family-dermatology .seo-section-first{padding:34px 36px 38px;background:#ebe6da;border:0;border-radius:26px;margin-bottom:64px;grid-template-columns:54px minmax(0,1fr)}
.seo-family-dermatology .seo-section-first .seo-section-kicker{padding-top:5px}
.seo-family-dermatology .seo-section:not(.seo-section-first) h2{max-width:720px}

/* Cosmetology: larger visual, premium panels, stronger contrast. */
.seo-family-cosmetology .seo-hero{background:#ebe6da}
.seo-family-cosmetology .seo-hero-grid{grid-template-columns:minmax(330px,.82fr) minmax(0,1.18fr);gap:34px}
.seo-family-cosmetology .seo-hero-copy{position:relative;z-index:2;padding:34px 34px 38px;background:#f6f6ee;border:1px solid rgba(41,32,27,.08);border-radius:30px}
.seo-family-cosmetology .seo-hero-visual,.seo-family-cosmetology .seo-hero-visual>img{height:550px;min-height:550px}
.seo-family-cosmetology .seo-hero-visual{border-radius:30px}
.seo-family-cosmetology .seo-process-strip{background:#29201b;color:#f6f6ee;border-color:rgba(246,246,238,.12)}
.seo-family-cosmetology .seo-process-grid>div{border-color:rgba(246,246,238,.14)}
.seo-family-cosmetology .seo-process-grid span{color:#c7a979}
.seo-family-cosmetology .seo-process-grid p{color:rgba(246,246,238,.62)}
.seo-family-cosmetology .seo-section{border-bottom:0;padding:34px 36px 38px;margin-bottom:18px;border-radius:26px;background:#fbfaf6;grid-template-columns:56px minmax(0,1fr)}
.seo-family-cosmetology .seo-section:nth-child(even){background:#ebe6da}
.seo-family-cosmetology .seo-section:last-child{margin-bottom:0}

/* Problems: symptom-first magazine layout. */
.seo-family-problems .seo-hero-grid{grid-template-columns:1fr;gap:28px}
.seo-family-problems .seo-hero-copy{max-width:930px;padding-bottom:0}
.seo-family-problems .seo-hero h1{max-width:1000px;font-size:clamp(56px,7vw,96px)}
.seo-family-problems .seo-lead{max-width:850px}
.seo-family-problems .seo-hero-visual,.seo-family-problems .seo-hero-visual>img{height:330px;min-height:330px}
.seo-family-problems .seo-hero-visual{border-radius:28px}
.seo-family-problems .seo-hero-visual>img{object-position:center 48%}
.seo-family-problems .seo-hero-caption{grid-template-columns:auto 1fr auto;align-items:end;gap:20px}
.seo-family-problems .seo-hero-caption strong{text-align:center}
.seo-family-problems .seo-section-first{background:#29201b;color:#f6f6ee;border:0;border-radius:28px;padding:38px 40px 42px;grid-template-columns:56px minmax(0,1fr)}
.seo-family-problems .seo-section-first p,.seo-family-problems .seo-section-first li{color:rgba(246,246,238,.72)}
.seo-family-problems .seo-section-first .seo-section-kicker span{color:#c7a979}
.seo-family-problems .seo-section-first .seo-section-kicker i{background:#c7a979}
.seo-family-problems .seo-section ul{grid-template-columns:1fr}
.seo-family-problems .seo-section li{padding:15px 18px 15px 20px}

/* Nutrition / care: calmer, narrower reading measure. */
.seo-family-nutrition .seo-hero{background:linear-gradient(180deg,#f6f6ee 0%,#f1eee5 100%)}
.seo-family-nutrition .seo-hero-grid{grid-template-columns:minmax(0,1fr) 420px;gap:72px}
.seo-family-nutrition .seo-hero-visual{border-radius:999px 999px 28px 28px}
.seo-family-nutrition .seo-article{max-width:820px}
.seo-family-nutrition .seo-section{grid-template-columns:48px minmax(0,1fr)}
.seo-family-care .seo-hero{background:#fbfaf6}
.seo-family-care .seo-hero-visual{border-radius:8px 54px 8px 54px}
.seo-family-care .seo-section-first{background:#ebe6da;border:0;border-radius:28px;padding:36px 38px;grid-template-columns:52px minmax(0,1fr)}

/* Category pages become visual directories, not long copies of treatment pages. */
.seo-template-category .seo-hero h1{font-size:clamp(62px,7vw,98px)}
.seo-template-category .seo-process-strip{background:#ebe6da}
.seo-directory-band{padding:70px 0 76px;background:#29201b;color:#f6f6ee}
.seo-directory-heading{display:grid;grid-template-columns:minmax(0,.72fr) minmax(0,1.28fr);gap:60px;align-items:end;margin-bottom:38px}
.seo-directory-heading .seo-eyebrow{color:rgba(246,246,238,.52)}
.seo-directory-heading h2{margin:0;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(44px,5vw,68px);font-weight:600;line-height:.94;letter-spacing:-.025em}
.seo-directory-heading p:not(.seo-eyebrow){margin:0;max-width:620px;color:rgba(246,246,238,.66);font-size:13px;line-height:1.75}
.seo-directory-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid rgba(246,246,238,.16)}
.seo-directory-link{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;padding:25px 0;border-bottom:1px solid rgba(246,246,238,.16);text-decoration:none}
.seo-directory-link:nth-child(odd){padding-right:30px;border-right:1px solid rgba(246,246,238,.16)}
.seo-directory-link:nth-child(even){padding-left:30px}
.seo-directory-link strong{font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(25px,2.7vw,36px);font-weight:600;line-height:1}
.seo-directory-link span{font-size:18px;transition:transform .2s ease}
.seo-directory-link:hover span{transform:translate(3px,-3px)}
.seo-template-category .seo-content-grid{padding-top:68px}
.seo-template-category .seo-section{grid-template-columns:1fr;gap:0}
.seo-template-category .seo-section-kicker{display:none}
.seo-template-category .seo-section h2{max-width:760px}

/* Procedure pages feel like service experiences rather than articles. */
.seo-template-procedure .seo-content-grid{gap:48px}
.seo-template-procedure .seo-side{padding-top:8px}
.seo-template-procedure .seo-price-list{background:#f6f6ee;border-radius:14px;padding:0 12px;border-top:0}

@media(max-width:1024px){
  .seo-site-polished .seo-hero-grid{grid-template-columns:1fr 390px;gap:36px}
  .seo-site-polished .seo-hero h1{font-size:clamp(46px,6vw,66px)}
  .seo-site-polished .seo-content-grid{grid-template-columns:minmax(0,1fr) 270px;gap:38px}
  .seo-site-polished .seo-section{grid-template-columns:50px minmax(0,1fr);gap:18px}
  .seo-family-cosmetology .seo-hero-grid{grid-template-columns:minmax(300px,.9fr) minmax(0,1.1fr)}
  .seo-family-problems .seo-hero-grid{grid-template-columns:1fr}
  .seo-family-nutrition .seo-hero-grid{grid-template-columns:minmax(0,1fr) 340px;gap:42px}
}
@media(max-width:767px){
  .seo-site-polished .seo-header{min-height:66px;padding-left:18px;padding-right:18px}
  .seo-site-polished .seo-brand span{font-size:27px}
  .seo-site-polished .seo-hero{padding:20px 0 42px}
  .seo-site-polished .seo-breadcrumbs{margin-bottom:22px}
  .seo-site-polished .seo-hero-grid,.seo-family-cosmetology .seo-hero-grid,.seo-family-nutrition .seo-hero-grid{grid-template-columns:1fr;gap:28px}
  .seo-site-polished .seo-hero h1,.seo-template-category .seo-hero h1,.seo-family-problems .seo-hero h1{font-size:clamp(40px,12vw,58px);line-height:.97}
  .seo-site-polished .seo-lead{font-size:14px;line-height:1.68;margin-top:20px}
  .seo-site-polished .seo-hero-visual,.seo-site-polished .seo-hero-visual>img,.seo-family-cosmetology .seo-hero-visual,.seo-family-cosmetology .seo-hero-visual>img,.seo-family-problems .seo-hero-visual,.seo-family-problems .seo-hero-visual>img{height:360px;min-height:360px}
  .seo-site-polished .seo-hero-visual,.seo-family-dermatology .seo-hero-visual,.seo-family-cosmetology .seo-hero-visual,.seo-family-care .seo-hero-visual,.seo-family-nutrition .seo-hero-visual{border-radius:22px}
  .seo-family-cosmetology .seo-hero-copy{padding:26px 22px 28px;border-radius:22px}
  .seo-family-problems .seo-hero-caption{display:grid;grid-template-columns:1fr;gap:5px;align-items:start}
  .seo-family-problems .seo-hero-caption strong{text-align:left}
  .seo-site-polished .seo-process-grid{grid-template-columns:1fr}
  .seo-site-polished .seo-process-grid>div{padding:20px 0;border-right:0;border-bottom:1px solid var(--line)}
  .seo-family-cosmetology .seo-process-grid>div{border-bottom-color:rgba(246,246,238,.14)}
  .seo-site-polished .seo-process-grid>div:last-child{border-bottom:0}
  .seo-site-polished .seo-content-grid{grid-template-columns:1fr;gap:34px;padding-top:50px;padding-bottom:56px}
  .seo-site-polished .seo-section,.seo-family-dermatology .seo-section-first,.seo-family-cosmetology .seo-section,.seo-family-problems .seo-section-first,.seo-family-care .seo-section-first,.seo-family-nutrition .seo-section{grid-template-columns:1fr;gap:12px;padding-bottom:38px;margin-bottom:38px}
  .seo-family-dermatology .seo-section-first,.seo-family-cosmetology .seo-section,.seo-family-problems .seo-section-first,.seo-family-care .seo-section-first{padding:28px 24px;border-radius:22px}
  .seo-site-polished .seo-section-kicker{padding-top:0}
  .seo-site-polished .seo-section h2{font-size:36px}
  .seo-site-polished .seo-section ul{grid-template-columns:1fr}
  .seo-site-polished .seo-side{display:grid;gap:12px}
  .seo-site-polished .seo-related-primary{position:static}
  .seo-directory-band{padding:52px 0 58px}
  .seo-directory-heading{grid-template-columns:1fr;gap:18px;margin-bottom:30px}
  .seo-directory-grid{grid-template-columns:1fr}
  .seo-directory-link:nth-child(odd),.seo-directory-link:nth-child(even){padding:20px 0;border-right:0}
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

  return (
    <main className={`seo-site seo-site-polished seo-template-${landing.type} seo-family-${family}`}>
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
              <div className="seo-hero-signature" aria-hidden="true">{familySignature(landing)}</div>
            </div>

            <figure className="seo-hero-visual">
              <img src={DEFAULT_OG_IMAGE} alt="Інтер’єр RESET Clinic у Львові" width={2446} height={1314} fetchPriority="high" decoding="async" />
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
              <div><p className="seo-eyebrow">Оберіть потрібний напрям</p><h2>Знайдіть свій наступний крок</h2></div>
              <p>Не потрібно знати медичну назву методу. Оберіть найближчий за змістом напрям — далі сторінка допоможе перейти до конкретної проблеми, лікування або процедури.</p>
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

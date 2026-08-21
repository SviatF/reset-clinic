import Link from "next/link";

const MAIN_NAV = [
  ["Дерматологія", "/dermatology/"],
  ["Косметологія", "/cosmetology/"],
  ["Проблеми шкіри", "/skin-problems/"],
  ["Догляд", "/skin-care/"],
  ["Нутриціологія", "/nutrition/"],
  ["Лікарі", "/doctors/"],
  ["Ціни", "/price/"],
] as const;

export function PublicSiteHeader() {
  return (
    <header className="seo-header">
      <Link className="seo-brand seo-brand-image" href="/" aria-label="RESET Clinic — головна">
        <img className="seo-brand-logo" src="/assets/logo-main.png" alt="RESET Clinic" />
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

export function PublicSiteFooter() {
  return (
    <footer className="seo-footer">
      <div className="seo-shell seo-footer-grid">
        <div className="seo-footer-brand-block">
          <Link className="seo-brand seo-brand-image" href="/" aria-label="RESET Clinic — головна">
            <img className="seo-brand-logo" src="/assets/logo-main.png" alt="RESET Clinic" />
          </Link>
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

import LegacyEnhancer from "./LegacyEnhancer";

export type LegacyPageData = {
  title: string;
  bodyClass: string;
  stylesheets: string[];
  inlineStyles: string[];
  html: string;
};

export type MobilePageData = {
  bodyClass: string;
  html: string;
  referenceHeight: number;
};

export default function LegacyPage({
  data,
  mobile,
}: {
  data: LegacyPageData;
  mobile?: MobilePageData;
}) {
  return (
    <>
      {data.stylesheets.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} />
      ))}
      {data.inlineStyles.map((css, index) => (
        <style key={index} dangerouslySetInnerHTML={{ __html: css }} />
      ))}

      <div
        className={`legacy-page legacy-desktop ${data.bodyClass}`}
        dangerouslySetInnerHTML={{ __html: data.html }}
      />

      {mobile ? (
        <div
          className={`legacy-page legacy-mobile ${mobile.bodyClass}`}
          dangerouslySetInnerHTML={{ __html: mobile.html }}
        />
      ) : null}

      <div
        id="reset-menu-overlay"
        className="reset-menu-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Головне меню"
        aria-hidden="true"
      >
        <button id="reset-menu-close" className="reset-menu-close" aria-label="Закрити меню">
          ×
        </button>
        <nav className="reset-menu-card" aria-label="Навігація сайту">
          <a href="/">Головна</a>
          <a href="/about/">Про клініку</a>
          <a href="/services/">Послуги</a>
          <a href="/doctors/">Лікарі</a>
          <a href="/price/">Прайс</a>
          <a href="/contacts/">Контакти</a>
          <a className="reset-menu-book" href="/booking/">
            Записатись на прийом
          </a>
        </nav>
      </div>

      <LegacyEnhancer bodyClass={data.bodyClass} />
    </>
  );
}

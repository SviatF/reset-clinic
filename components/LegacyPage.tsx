import LegacyEnhancer from "./LegacyEnhancer";

export type LegacyPageData = {
  title: string;
  bodyClass: string;
  stylesheets: string[];
  inlineStyles: string[];
  html: string;
};

export default function LegacyPage({ data }: { data: LegacyPageData }) {
  return (
    <>
      {data.stylesheets.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} />
      ))}
      {data.inlineStyles.map((css, index) => (
        <style key={index} dangerouslySetInnerHTML={{ __html: css }} />
      ))}
      <div
        className={`legacy-page ${data.bodyClass}`}
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
      <div id="reset-menu-overlay" className="reset-menu-overlay">
        <button id="reset-menu-close" className="reset-menu-close" aria-label="Закрити">
          ×
        </button>
        <nav className="reset-menu-card">
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

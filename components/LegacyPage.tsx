import LegacyBookingEnhancer from "./LegacyBookingEnhancer";
import LegacyEnhancer from "./LegacyEnhancer";
import LegacyRouteFixes from "./LegacyRouteFixes";

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

const HOME_CATEGORY_LINKS: Record<string, string> = {
  "Дерматологія": "/dermatology/",
  "Доглядова косметологія": "/cosmetology/",
  "Ін’єкційна косметологія": "/cosmetology/injection/",
  "Апаратна косметологія": "/cosmetology/hardware/",
  "Трихологія": "/dermatology/trichologist-lviv/",
  "Сімейна медицина та нутриціологія": "/nutrition/",
};

function plainHeadingText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function linkHomepageCategoryHeadings(html: string, route: string) {
  if (route !== "/") return html;

  return html.replace(
    /<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      const href = HOME_CATEGORY_LINKS[plainHeadingText(inner)];
      if (!href || /<a\b/i.test(inner)) return full;
      return `<${tag}${attrs}><a class="reset-home-category-link" href="${href}">${inner}</a></${tag}>`;
    },
  );
}

export default function LegacyPage({
  data,
  mobile,
  route,
}: {
  data: LegacyPageData;
  mobile?: MobilePageData;
  route: string;
}) {
  const desktopHtml = linkHomepageCategoryHeadings(data.html, route);
  const mobileHtml = mobile ? linkHomepageCategoryHeadings(mobile.html, route) : undefined;
  const hiddenUntilStyled = { visibility: "hidden" as const, backgroundColor: "#f5f4ed" };

  return (
    <>
      {data.stylesheets.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} data-reset-legacy-stylesheet="true" />
      ))}
      {data.inlineStyles.map((css, index) => (
        <style key={index} dangerouslySetInnerHTML={{ __html: css }} />
      ))}

      <div
        className={`legacy-page legacy-styles-pending legacy-desktop ${data.bodyClass}`}
        style={hiddenUntilStyled}
        dangerouslySetInnerHTML={{ __html: desktopHtml }}
      />

      {mobile && mobileHtml ? (
        <div
          className={`legacy-page legacy-styles-pending legacy-mobile ${mobile.bodyClass}`}
          style={hiddenUntilStyled}
          dangerouslySetInnerHTML={{ __html: mobileHtml }}
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
          <a href="/dermatology/">Дерматологія</a>
          <a href="/cosmetology/">Косметологія</a>
          <a href="/skin-problems/">Проблеми шкіри</a>
          <a href="/nutrition/">Нутриціологія</a>
          <a href="/doctors/">Лікарі</a>
          <a href="/price/">Прайс</a>
          <a href="/blog/">Блог</a>
          <a href="/contacts/">Контакти</a>
          <a className="reset-menu-book" href="/booking/">
            Записатись на прийом
          </a>
        </nav>
      </div>

      <LegacyRouteFixes route={route} />
      <LegacyEnhancer bodyClass={data.bodyClass} />
      <LegacyBookingEnhancer bodyClass={data.bodyClass} />
    </>
  );
}

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

const MOBILE_ASSET_REWRITES: Record<string, Array<[string, string]>> = {
  "/about/": [
    [
      "/wp-content/uploads/2026/08/IMG_9170-scaled.jpg",
      "/assets/desktop-3febdea9eeb32b25099c039d28f1c2a2fd197d0f.jpg",
    ],
  ],
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

function repairMobileAssets(html: string, route: string) {
  return (MOBILE_ASSET_REWRITES[route] ?? []).reduce(
    (result, [from, to]) => result.split(from).join(to),
    html,
  );
}

function stripLegacyAgencyBranding(html: string) {
  return html
    .replace(
      /<a\b[^>]*>\s*<img\b[^>]*desktop-753a672ef96753a806c9c12d76d5bfe8077a44e6\.svg[^>]*>\s*<\/a>/gi,
      "",
    )
    .replace(
      /<img\b[^>]*desktop-753a672ef96753a806c9c12d76d5bfe8077a44e6\.svg[^>]*>/gi,
      "",
    )
    .replace(/розробка(?:\s|&nbsp;)+сайту/gi, "");
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
  const desktopHtml = stripLegacyAgencyBranding(linkHomepageCategoryHeadings(data.html, route));
  const mobileHtml = mobile
    ? stripLegacyAgencyBranding(
        repairMobileAssets(linkHomepageCategoryHeadings(mobile.html, route), route),
      )
    : undefined;

  return (
    <>
      {data.stylesheets.map((href, index) => (
        <link
          key={index}
          rel="stylesheet"
          href={href}
          precedence="legacy"
          data-reset-legacy-stylesheet="true"
        />
      ))}
      {data.inlineStyles.map((css, index) => (
        <style key={index} dangerouslySetInnerHTML={{ __html: css }} />
      ))}

      <style>{`
        .legacy-page footer .legacy-live-booking,
        .legacy-page [data-elementor-type="footer"] .legacy-live-booking,
        .legacy-page .elementor-location-footer .legacy-live-booking,
        .legacy-page [class*="footer"] .legacy-live-booking {
          display: none !important;
        }
        .legacy-page img[src*="desktop-753a672ef96753a806c9c12d76d5bfe8077a44e6.svg"] {
          display: none !important;
        }
      `}</style>

      {route === "/" ? (
        <style>{`
          @media (max-width: 767px) {
            .legacy-mobile .elementor-element-153f2e1,
            .legacy-mobile [data-id="153f2e1"] {
              display: none !important;
              height: 0 !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
          }
        `}</style>
      ) : null}

      <div
        className={`legacy-page legacy-styles-pending legacy-desktop ${data.bodyClass}`}
        dangerouslySetInnerHTML={{ __html: desktopHtml }}
      />

      {mobile && mobileHtml ? (
        <div
          className={`legacy-page legacy-styles-pending legacy-mobile ${mobile.bodyClass}`}
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

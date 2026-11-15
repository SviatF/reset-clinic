"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPromoCustomEvent } from "../lib/marketing-pixels";

// November 27 is the final day of this campaign in Kyiv.
const CAMPAIGN_END_AT = Date.parse("2026-11-27T23:59:59+02:00");
const DISMISS_KEY = "reset_bf_shop_sticker_closed_2026";
const SHOP_URL =
  "https://shop.resetclinic.org/?utm_source=resetclinic&utm_medium=floating_sticker&utm_campaign=black_friday_2026";

const COPY = {
  uk: {
    sale: "до",
    product: "На професійну косметику",
    action: "В магазин",
    close: "Закрити пропозицію Black Friday",
    aria: "Black Friday: знижки до 20 відсотків на професійну косметику в RESET Clinic Shop",
  },
  pl: {
    sale: "do",
    product: "Na profesjonalne kosmetyki",
    action: "Do sklepu",
    close: "Zamknij ofertę Black Friday",
    aria: "Black Friday: rabaty do 20 procent na profesjonalne kosmetyki w RESET Clinic Shop",
  },
} as const;

export default function BlackFridayShopSticker() {
  const pathname = usePathname() || "/";
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "yes");
    } catch {
      // The close button works even if session storage is disabled.
    }

    // No visual countdown: a minute-level check is enough to expire the offer.
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (
    now === null ||
    now >= CAMPAIGN_END_AT ||
    dismissed ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/")
  ) {
    return null;
  }

  const polish = pathname === "/pl" || pathname.startsWith("/pl/");
  const promo = pathname.startsWith("/promo/") || pathname.startsWith("/pl/promo/");
  const quiz = pathname.includes("/quiz/");
  const copy = polish ? COPY.pl : COPY.uk;
  const className = [
    "bf26-hanger",
    promo ? "bf26-hanger--promo" : "",
    quiz ? "bf26-hanger--quiz" : "",
  ].filter(Boolean).join(" ");

  const close = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "yes");
    } catch {
      // Dismissal is still effective for this render.
    }
    trackPromoCustomEvent("bf_shop_sticker_close", {
      campaign: "black_friday_2026",
      page_path: pathname,
      language: polish ? "pl" : "uk",
    });
  };

  const trackShopClick = () => {
    trackPromoCustomEvent("bf_shop_sticker_click", {
      campaign: "black_friday_2026",
      page_path: pathname,
      language: polish ? "pl" : "uk",
      target: "shop.resetclinic.org",
    });
  };

  return (
    <div className={className} lang={polish ? "pl-PL" : "uk-UA"}>
      {/* One stationary hook, two cords and one rigid swinging assembly.
          The cord ends and eyelets share coordinates and always move together. */}
      <span className="bf26-hook" aria-hidden="true" />
      <div className="bf26-suspension">
        <div className="bf26-swing">
          <svg className="bf26-strings" viewBox="0 0 370 285" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="bf26-twine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff5dc" />
                <stop offset="46%" stopColor="#d2aa86" />
                <stop offset="100%" stopColor="#89604a" />
              </linearGradient>
            </defs>
            <path className="bf26-string-shadow" d="M 202 13 L 51 115 M 202 13 L 313 115" />
            <path className="bf26-string-body" d="M 202 13 L 51 115 M 202 13 L 313 115" stroke="url(#bf26-twine)" />
            <path className="bf26-string-light" d="M 202 13 L 51 115 M 202 13 L 313 115" />
          </svg>

          <aside className="bf26-tag" aria-label={copy.aria}>
            <span className="bf26-eyelet bf26-eyelet--left" aria-hidden="true" />
            <span className="bf26-eyelet bf26-eyelet--right" aria-hidden="true" />
            <span className="bf26-satin" aria-hidden="true" />

        <button
          className="bf26-close"
          type="button"
          onClick={close}
          aria-label={copy.close}
          title={copy.close}
        >
          <span aria-hidden="true">×</span>
        </button>

        <p className="bf26-title">BLACK FRIDAY</p>
        <div className="bf26-discount">
          <span>{copy.sale}</span>
          <strong>−20%</strong>
        </div>
        <p className="bf26-product">{copy.product}</p>

        <a
          className="bf26-cta"
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShopClick}
        >
          <span>{copy.action}</span>
          <span className="bf26-cta-arrow" aria-hidden="true">↗</span>
        </a>
          </aside>
        </div>
      </div>
    </div>
  );
}

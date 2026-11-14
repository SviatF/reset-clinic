"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPromoCustomEvent } from "../lib/marketing-pixels";

const CAMPAIGN_END_AT = Date.parse("2026-11-27T23:59:59+02:00"); // Kyiv, Nov 27 inclusive
const DISMISS_KEY = "reset_bf_shop_sticker_closed_2026";
const SHOP_URL =
  "https://shop.resetclinic.org/?utm_source=resetclinic&utm_medium=floating_sticker&utm_campaign=black_friday_2026";

const COPY = {
  uk: {
    label: "RESET CLINIC / SHOP",
    event: "BLACK FRIDAY",
    upTo: "ДО",
    product: "на професійну косметику",
    ends: "До 27.11 включно",
    remaining: "До завершення",
    units: ["дн.", "год.", "хв.", "сек."] as const,
    action: "В магазин",
    close: "Закрити пропозицію Black Friday",
    aria: "Знижки до 20% у магазині косметики RESET Clinic до 27 листопада",
  },
  pl: {
    label: "RESET CLINIC / SHOP",
    event: "BLACK FRIDAY",
    upTo: "DO",
    product: "na profesjonalne kosmetyki",
    ends: "Do 27.11 włącznie",
    remaining: "Do końca promocji",
    units: ["dni", "godz.", "min", "sek."] as const,
    action: "Do sklepu",
    close: "Zamknij ofertę Black Friday",
    aria: "Rabaty do 20% w sklepie RESET Clinic do 27 listopada",
  },
} as const;

function timeParts(remainingMs: number) {
  const seconds = Math.max(0, Math.floor(remainingMs / 1000));
  return [
    Math.floor(seconds / 86_400),
    Math.floor((seconds % 86_400) / 3_600),
    Math.floor((seconds % 3_600) / 60),
    seconds % 60,
  ];
}

export default function BlackFridayShopSticker() {
  const pathname = usePathname() || "/";
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "yes");
    } catch {
      // The campaign stays dismissible even if storage is disabled.
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  // Only public site pages; the admin area should not display marketing UI.
  if (
    now === null ||
    dismissed ||
    now >= CAMPAIGN_END_AT ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/")
  ) {
    return null;
  }

  const polish = pathname === "/pl" || pathname.startsWith("/pl/");
  const promo = pathname.startsWith("/promo/") || pathname.startsWith("/pl/promo/");
  const quiz = pathname.includes("/quiz/");
  const copy = polish ? COPY.pl : COPY.uk;
  const units = timeParts(CAMPAIGN_END_AT - now);
  const className = [
    "reset-bf-sticker",
    promo ? "reset-bf-sticker--promo" : "",
    quiz ? "reset-bf-sticker--quiz" : "",
  ].filter(Boolean).join(" ");

  const close = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "yes");
    } catch {
      // No persistence when sessionStorage is unavailable.
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
    <aside className={className} aria-label={copy.aria} lang={polish ? "pl-PL" : "uk-UA"}>
      <button
        className="reset-bf-close"
        type="button"
        onClick={close}
        aria-label={copy.close}
        title={copy.close}
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className="reset-bf-top">
        <span>{copy.label}</span>
        <span className="reset-bf-year">2026 / 27 NOV</span>
      </div>

      <div className="reset-bf-offer">
        <p className="reset-bf-event">{copy.event}</p>
        <div className="reset-bf-discount">
          <span className="reset-bf-up-to">{copy.upTo}</span>
          <strong>−20<span>%</span></strong>
        </div>
        <p className="reset-bf-product">{copy.product}</p>
        <p className="reset-bf-date">{copy.ends}</p>
      </div>

      <div className="reset-bf-bottom">
        <div className="reset-bf-countdown" aria-label={copy.remaining}>
          <p>{copy.remaining}</p>
          <div className="reset-bf-clock" role="timer" aria-live="off">
            {units.map((amount, index) => (
              <span className="reset-bf-time-unit" key={copy.units[index]}>
                <strong>{String(amount).padStart(2, "0")}</strong>
                <small>{copy.units[index]}</small>
              </span>
            ))}
          </div>
        </div>
        <a
          className="reset-bf-shop-link"
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShopClick}
        >
          <span>{copy.action}</span>
          <span className="reset-bf-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </aside>
  );
}

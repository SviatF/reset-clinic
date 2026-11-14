"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPromoCustomEvent } from "../lib/marketing-pixels";

const CAMPAIGN_END_AT = Date.parse("2026-11-27T23:59:59+02:00"); // Kyiv; Nov 27 inclusive
const DISMISS_KEY = "reset_bf_shop_sticker_closed_2026";
const SHOP_URL =
  "https://shop.resetclinic.org/?utm_source=resetclinic&utm_medium=floating_sticker&utm_campaign=black_friday_2026";

const COPY = {
  uk: {
    event: "BLACK FRIDAY",
    upTo: "до",
    product: "На професійну косметику",
    ends: "до 27.11",
    remaining: "До завершення акції",
    days: "дн",
    action: "В магазин",
    close: "Закрити пропозицію Black Friday",
    aria: "Black Friday: знижки до 20% у магазині косметики RESET Clinic до 27 листопада",
  },
  pl: {
    event: "BLACK FRIDAY",
    upTo: "do",
    product: "Na profesjonalne kosmetyki",
    ends: "do 27.11",
    remaining: "Do końca promocji",
    days: "dni",
    action: "Do sklepu",
    close: "Zamknij ofertę Black Friday",
    aria: "Black Friday: rabaty do 20% w sklepie RESET Clinic do 27 listopada",
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

const twoDigits = (value: number) => String(value).padStart(2, "0");

export default function BlackFridayShopSticker() {
  const pathname = usePathname() || "/";
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "yes");
    } catch {
      // The sticker can still be closed when storage is blocked.
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

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
  const [days, hours, minutes, seconds] = timeParts(CAMPAIGN_END_AT - now);
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
      // No persistence when sessionStorage is disabled.
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

      <div className="reset-bf-content">
        <p className="reset-bf-title">{copy.event}</p>
        <div className="reset-bf-offer">
          <strong className="reset-bf-discount">
            <small>{copy.upTo}</small>
            <span>−20%</span>
          </strong>
          <p className="reset-bf-subline">{copy.product}</p>
          <p className="reset-bf-date">{copy.ends}</p>
        </div>
      </div>

      <div className="reset-bf-footer">
        <div
          className="reset-bf-timer"
          role="timer"
          aria-live="off"
          aria-label={`${copy.remaining}: ${days} ${copy.days}, ${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`}
        >
          <span className="reset-bf-live-dot" aria-hidden="true" />
          <strong>{days}<small>{copy.days}</small></strong>
          <span className="reset-bf-clock-digits">
            {twoDigits(hours)}:{twoDigits(minutes)}:{twoDigits(seconds)}
          </span>
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

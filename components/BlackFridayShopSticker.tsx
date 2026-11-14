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
    ends: "До 27.11 включно",
    remaining: "До завершення:",
    days: "дн",
    hours: "год",
    minutes: "хв",
    seconds: "сек",
    action: "В магазин",
    close: "Закрити пропозицію Black Friday",
    aria: "Black Friday: знижки до 20% у магазині косметики RESET Clinic до 27 листопада",
  },
  pl: {
    event: "BLACK FRIDAY",
    upTo: "do",
    product: "Na profesjonalne kosmetyki",
    ends: "Do 27.11 włącznie",
    remaining: "Do końca:",
    days: "dni",
    hours: "godz",
    minutes: "min",
    seconds: "sek",
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
    "bf26-sticker",
    promo ? "bf26-sticker--promo" : "",
    quiz ? "bf26-sticker--quiz" : "",
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

  const units = [
    { amount: days, label: copy.days },
    { amount: hours, label: copy.hours },
    { amount: minutes, label: copy.minutes },
    { amount: seconds, label: copy.seconds },
  ];

  return (
    <aside className={className} aria-label={copy.aria} lang={polish ? "pl-PL" : "uk-UA"}>
      <span className="bf26-ribbon bf26-ribbon--left" aria-hidden="true" />
      <span className="bf26-ribbon bf26-ribbon--right" aria-hidden="true" />
      <button
        className="bf26-close"
        type="button"
        onClick={close}
        aria-label={copy.close}
        title={copy.close}
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className="bf26-main">
        <div className="bf26-event" aria-label={copy.event}>
          <span>BLACK</span>
          <span>FRIDAY</span>
        </div>
        <span className="bf26-separator" aria-hidden="true" />
        <div className="bf26-offer">
          <div className="bf26-discount">
            <span>{copy.upTo}</span>
            <strong>−20%</strong>
          </div>
          <p className="bf26-product">{copy.product}</p>
          <p className="bf26-date">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M7 2v6M17 2v6M3 10h18" />
            </svg>
            {copy.ends}
          </p>
        </div>
      </div>

      <div className="bf26-bottom">
        <div className="bf26-countdown">
          <span className="bf26-countdown-heading">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="13" r="8.5" />
              <path d="M12 8v5l3 2M9 2h6" />
            </svg>
            {copy.remaining}
          </span>
          <div
            className="bf26-timer"
            role="timer"
            aria-live="off"
            aria-label={`${copy.remaining} ${days} ${copy.days}, ${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`}
          >
            {units.map((unit) => (
              <span className="bf26-time" key={unit.label}>
                <strong>{twoDigits(unit.amount)}</strong>
                <small>{unit.label}</small>
              </span>
            ))}
          </div>
        </div>

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
      </div>
    </aside>
  );
}

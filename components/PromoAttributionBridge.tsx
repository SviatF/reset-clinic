"use client";

import { useEffect } from "react";

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

export default function PromoAttributionBridge() {
  useEffect(() => {
    // Client document language for accessibility on the existing shared root.
    // Avoid making the entire statically generated site request-dynamic.
    const isPolish = window.location.pathname.startsWith("/pl/");
    const previousLang = document.documentElement.lang;
    if (isPolish) document.documentElement.lang = "pl-PL";

    const params = new URLSearchParams(window.location.search);
    TRACKING_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(`reset_${key}`, value);
    });
    return () => {
      if (isPolish) document.documentElement.lang = previousLang;
    };
  }, []);

  return null;
}

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
    const params = new URLSearchParams(window.location.search);
    TRACKING_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(`reset_${key}`, value);
    });
  }, []);

  return null;
}

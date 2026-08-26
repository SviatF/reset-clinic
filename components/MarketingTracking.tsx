"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

const THANK_YOU_PATHS = new Set(["/thank-you", "/thank-you/"]);

export default function MarketingTracking() {
  const pathname = usePathname();
  const initialPageViewHandled = useRef(false);

  useEffect(() => {
    const pagePath = pathname || "/";

    // The inline snippets in the root layout send the initial PageView.
    // For subsequent Next.js client-side navigations we send a virtual page view
    // so Meta and GTM still see every page transition.
    if (initialPageViewHandled.current) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "virtual_page_view",
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });

      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
      }
    } else {
      initialPageViewHandled.current = true;
    }

    if (!THANK_YOU_PATHS.has(pagePath)) return;

    // Prevent a refresh of the thank-you page from counting the same lead twice
    // during the same browser session.
    const conversionKey = "reset_lead_conversion_fired";
    if (window.sessionStorage.getItem(conversionKey) === "1") return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "generate_lead",
      lead_type: "website_application",
      page_path: pagePath,
      page_location: window.location.href,
    });

    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead");
    }

    window.sessionStorage.setItem(conversionKey, "1");
  }, [pathname]);

  return null;
}

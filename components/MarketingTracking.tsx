"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackContactConversion,
  trackLeadConversion,
  trackPageView,
  wasLeadTrackedRecently,
} from "../lib/marketing-pixels";

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

    // The root layout sends the first PageView to the general site pixel.
    // On the initial promo render we only add the service-specific PageView.
    // On subsequent Next.js navigations we explicitly send the general and,
    // when applicable, the scoped promo PageView with trackSingle.
    if (initialPageViewHandled.current) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "virtual_page_view",
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
      trackPageView(pagePath, true);
    } else {
      initialPageViewHandled.current = true;
      trackPageView(pagePath, false);
    }

    if (!THANK_YOU_PATHS.has(pagePath)) return;

    // Promo and native booking forms fire Lead only after /api/leads succeeds.
    // Keep the thank-you page as a fallback for any legacy form that redirects
    // here without using the shared conversion dispatcher.
    if (wasLeadTrackedRecently()) return;

    trackLeadConversion({
      lead_type: "website_application",
      conversion_source: "thank_you_fallback",
    }, pagePath);
  }, [pathname]);

  useEffect(() => {
    const handlePhoneClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (!link) return;

      trackContactConversion({
        contact_source: "phone_link",
        link_text: link.textContent?.trim() || undefined,
      }, window.location.pathname);
    };

    document.addEventListener("click", handlePhoneClick, { capture: true });
    return () => document.removeEventListener("click", handlePhoneClick, { capture: true });
  }, []);

  return null;
}

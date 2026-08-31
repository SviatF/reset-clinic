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

    // Forms using /api/leads are tracked on successful API response.
    // Keep thank-you as fallback for older or external submission flows.
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

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const wrappedFetch: typeof window.fetch = async (...args) => {
      const [input, init] = args;
      const response = await originalFetch(...args);

      try {
        const rawUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const requestUrl = new URL(rawUrl, window.location.origin);
        const method = (
          init?.method || (input instanceof Request ? input.method : "GET")
        ).toUpperCase();

        if (response.ok && method === "POST" && requestUrl.pathname === "/api/leads") {
          let requestPayload: Record<string, unknown> = {};
          if (typeof init?.body === "string") {
            try {
              const parsed = JSON.parse(init.body);
              if (parsed && typeof parsed === "object") requestPayload = parsed;
            } catch {
              // The conversion still counts even if the request body is not JSON.
            }
          }

          const service =
            typeof requestPayload.service === "string" ? requestPayload.service : undefined;
          const formId =
            typeof requestPayload.formId === "string" ? requestPayload.formId : undefined;
          const pagePath =
            typeof requestPayload.pagePath === "string"
              ? requestPayload.pagePath
              : window.location.pathname;

          trackLeadConversion({
            content_name: service,
            form_id: formId,
            conversion_source: "lead_api_success",
          }, pagePath);
        }
      } catch (error) {
        console.error("Lead conversion tracking failed", error);
      }

      return response;
    };

    window.fetch = wrappedFetch;
    return () => {
      if (window.fetch === wrappedFetch) window.fetch = originalFetch;
    };
  }, []);

  return null;
}

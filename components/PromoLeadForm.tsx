"use client";

import { FormEvent, useRef, useState } from "react";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

type PromoLeadFormProps = {
  service: string;
  slug: string;
  formId?: string;
  compact?: boolean;
  extraFields?: Record<string, unknown>;
  buttonLabel?: string;
  note?: string;
};

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function track(event: string, payload: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
  if (typeof window.fbq === "function") window.fbq("trackCustom", event, payload);
}

export default function PromoLeadForm({
  service,
  slug,
  formId = "promo-landing",
  compact = false,
  extraFields,
  buttonLabel = "Записатися →",
  note = "Адміністратор RESÉT clinic зв’яжеться з вами, уточнить запит і запропонує зручний час.",
}: PromoLeadFormProps) {
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || submitting) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const website = String(data.get("website") || "").trim();
    setSubmitting(true);
    setStatus("");
    track("promo_lead_submit", { promo_service: slug, form_id: formId });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service,
          formId,
          pageUrl: window.location.href,
          pagePath: window.location.pathname,
          referrer: document.referrer || undefined,
          utmSource: trackingValue("utm_source"),
          utmMedium: trackingValue("utm_medium"),
          utmCampaign: trackingValue("utm_campaign"),
          utmContent: trackingValue("utm_content"),
          utmTerm: trackingValue("utm_term"),
          gclid: trackingValue("gclid"),
          fbclid: trackingValue("fbclid"),
          ttclid: trackingValue("ttclid"),
          startedAt: startedAt.current,
          website,
          fields: {
            promo_service: slug,
            promo_surface: formId,
            ...(extraFields ?? {}),
          },
        }),
      });
      if (!response.ok) throw new Error(`Lead API ${response.status}`);
      track("promo_lead_success", { promo_service: slug, form_id: formId });
      window.location.assign("/thank-you/");
    } catch (error) {
      console.error("Promo lead submit failed", error);
      setSubmitting(false);
      setStatus("Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте у клініку.");
    }
  }

  return (
    <form className={`promo-form${compact ? " promo-form-compact" : ""}`} onSubmit={submit}>
      <label><span>Ваше ім’я</span><input name="name" autoComplete="name" maxLength={120} required placeholder="Ім’я" /></label>
      <label><span>Номер телефону</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} required placeholder="+380" /></label>
      <label className="promo-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" disabled={submitting}>{submitting ? "Надсилаємо…" : buttonLabel}</button>
      <p className="promo-form-note">{note}</p>
      <div className="promo-form-status" role="status" aria-live="polite">{status}</div>
    </form>
  );
}

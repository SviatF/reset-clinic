"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import type { BookingSelection } from "../lib/booking-types";
import { trackLeadConversion, trackPromoCustomEvent } from "../lib/marketing-pixels";
import BookingSlotPickerPl from "./BookingSlotPickerPl";

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

type PromoLeadFormPlProps = {
  service: string;
  bookingService: string;
  slug: string;
  formId?: string;
  compact?: boolean;
  extraFields?: Record<string, unknown>;
  buttonLabel?: string;
  note?: string;
};

type AvailabilityState = {
  enabled: boolean;
  loading: boolean;
  hasSlots: boolean;
  error?: string;
};

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function track(event: string, payload: Record<string, unknown>) {
  trackPromoCustomEvent(event, payload);
}

export default function PromoLeadFormPl({
  service,
  bookingService,
  slug,
  formId = "promo-landing-pl",
  compact = false,
  extraFields,
  buttonLabel = "Umów konsultację →",
  note = "Wybierz wolny termin z kalendarza Cliniccards. Przed potwierdzeniem sprawdzimy dostępność jeszcze raz.",
}: PromoLeadFormPlProps) {
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({ enabled: false, loading: true, hasSlots: false });
  const updateAvailability = useCallback((next: AvailabilityState) => setAvailability(next), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || submitting) return;

    if (availability.loading) {
      setStatus("Jeszcze odświeżamy wolne terminy — poczekaj kilka sekund.");
      return;
    }

    if (availability.enabled && availability.hasSlots && !booking) {
      setStatus("Wybierz dogodną datę i wolną godzinę przed wysłaniem zgłoszenia.");
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const website = String(data.get("website") || "").trim();

    setSubmitting(true);
    setStatus("");

    track("promo_lead_submit", {
      promo_service: slug,
      promo_language: "pl",
      form_id: formId,
      booking_date: booking?.date,
      booking_time: booking?.time,
    });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service: bookingService,
          booking,
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
            language: "pl",
            promo_service: slug,
            promo_service_name_pl: service,
            promo_surface: formId,
            booking_selection: booking,
            ...(extraFields ?? {}),
          },
        }),
      });

      const result = await response.json().catch(() => ({})) as {
        ok?: boolean;
        booking?: { status?: string; error?: string };
      };

      if (response.status === 409 || result.booking?.status === "slot_unavailable") {
        setBooking(null);
        setSubmitting(false);
        setStatus("Ten termin został właśnie zajęty. Zapisaliśmy Twój kontakt — wybierz proszę inną wolną godzinę.");
        return;
      }

      if (!response.ok) throw new Error(`Lead API ${response.status}`);

      track("promo_lead_success", {
        promo_service: slug,
        promo_language: "pl",
        form_id: formId,
        booking_status: result.booking?.status,
      });

      trackLeadConversion({
        content_name: service,
        form_id: formId,
        conversion_source: "promo_form_success_pl",
      });

      window.location.assign("/pl/thank-you/");
    } catch (error) {
      console.error("Polish promo lead submit failed", error);
      setSubmitting(false);
      setStatus("Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub zadzwoń do kliniki.");
    }
  }

  return (
    <form className={`promo-form${compact ? " promo-form-compact" : ""}`} onSubmit={submit} lang="pl">
      <BookingSlotPickerPl
        service={bookingService}
        value={booking}
        onChange={setBooking}
        onAvailabilityChange={updateAvailability}
        compact={compact}
      />
      <label>
        <span>Imię</span>
        <input name="name" autoComplete="name" maxLength={120} required placeholder="Imię" />
      </label>
      <label>
        <span>Numer telefonu</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} required placeholder="+48 / +380" />
      </label>
      <label className="promo-honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button type="submit" disabled={submitting || availability.loading}>
        {submitting ? "Rezerwujemy…" : availability.loading ? "Odświeżamy terminy…" : buttonLabel}
      </button>
      <p className="promo-form-note">{note}</p>
      <div className="promo-form-status" role="status" aria-live="polite">{status}</div>
    </form>
  );
}

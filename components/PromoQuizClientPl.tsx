"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BookingSelection } from "../lib/booking-types";
import { PROMO_SERVICES, type PromoServiceConfig } from "../lib/promo-data";
import { trackLeadConversion, trackPromoCustomEvent } from "../lib/marketing-pixels";
import BookingSlotPickerPl from "./BookingSlotPickerPl";\nimport PromoAttributionBridge from "./PromoAttributionBridge";

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

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

export default function PromoQuizClientPl({
  config,
  pathSlug,
}: {
  config: PromoServiceConfig;
  pathSlug: string;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [entrySource, setEntrySource] = useState("direct_quiz_url");
  const [prefilledConcern, setPrefilledConcern] = useState("");
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({ enabled: false, loading: true, hasSlots: false });
  const startedAt = useRef(Date.now());
  const initializedFromUrl = useRef(false);
  const total = config.quizQuestions.length;
  const finished = started && step >= total;
  const question = config.quizQuestions[step];
  const progress = useMemo(() => (finished ? 100 : Math.max(8, ((step + 1) / total) * 100)), [finished, step, total]);
  const updateAvailability = useCallback((next: AvailabilityState) => setAvailability(next), []);
  const bookingService = PROMO_SERVICES[config.slug].serviceName;
  const landingPath = `/pl/promo/${pathSlug}/`;

  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") || "direct_quiz_url";
    const concern = params.get("concern") || "";
    const first = config.quizQuestions[0];
    const validConcern = Boolean(first && concern && first.answers.includes(concern));
    const mobileDirectStart = window.matchMedia("(max-width: 900px)").matches;

    setEntrySource(source);

    if (validConcern && first) {
      setAnswers({ [first.id]: concern });
      setPrefilledConcern(concern);
      setStarted(true);
      setStep(Math.min(1, total));
      startedAt.current = Date.now();
      track("promo_quiz_view", {
        promo_service: config.slug,
        promo_language: "pl",
        source,
        prefilled_concern: concern,
        dedicated_url: true,
      });
      track("promo_quiz_start", {
        promo_service: config.slug,
        promo_language: "pl",
        source,
        prefilled_first_answer: true,
      });
      return;
    }

    track("promo_quiz_view", {
      promo_service: config.slug,
      promo_language: "pl",
      source,
      dedicated_url: true,
    });

    if (mobileDirectStart) {
      setStarted(true);
      setStep(0);
      setAnswers({});
      setPrefilledConcern("");
      startedAt.current = Date.now();
      track("promo_quiz_start", {
        promo_service: config.slug,
        promo_language: "pl",
        source,
        mobile_direct_start: true,
      });
    }
  }, [config.quizQuestions, config.slug, total]);

  useEffect(() => {
    if (!finished || !window.matchMedia("(max-width: 900px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [finished]);

  function start() {
    setStarted(true);
    setStep(0);
    setAnswers({});
    setBooking(null);
    setPrefilledConcern("");
    startedAt.current = Date.now();
    track("promo_quiz_start", { promo_service: config.slug, promo_language: "pl", source: entrySource });
  }

  function choose(answer: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: answer };
    setAnswers(next);
    if (step === 0) setPrefilledConcern(answer);
    track("promo_quiz_answer", {
      promo_service: config.slug,
      promo_language: "pl",
      question_id: question.id,
      answer,
      question_number: step + 1,
      source: entrySource,
    });
    if (step + 1 >= total) {
      setStep(total);
      track("promo_quiz_contact_view", { promo_service: config.slug, promo_language: "pl", source: entrySource });
    } else {
      setStep(step + 1);
    }
  }

  function back() {
    if (finished) return setStep(total - 1);
    if (step > 0) return setStep(step - 1);
    setStarted(false);
  }

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

    track("promo_quiz_lead_submit", {
      promo_service: config.slug,
      promo_language: "pl",
      source: entrySource,
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
          formId: `promo-quiz-pl-${config.slug}`,
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
            promo_service: config.slug,
            promo_service_name_pl: config.serviceName,
            promo_surface: "dedicated_quiz_url_pl",
            promo_entry_source: entrySource,
            prefilled_concern: prefilledConcern || undefined,
            quiz_answers: answers,
            booking_selection: booking,
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
        setStatus("Ten termin został właśnie zajęty. Zapisaliśmy Twój kontakt — wybierz inną dostępną godzinę.");
        return;
      }

      if (!response.ok) throw new Error(`Lead API ${response.status}`);

      track("promo_quiz_lead_success", {
        promo_service: config.slug,
        promo_language: "pl",
        source: entrySource,
        booking_status: result.booking?.status,
      });

      trackLeadConversion({
        content_name: config.serviceName,
        form_id: `promo-quiz-pl-${config.slug}`,
        conversion_source: "promo_quiz_success_pl",
        promo_entry_source: entrySource,
      });

      window.location.assign("/pl/thank-you/");
    } catch (error) {
      console.error("Polish promo quiz submit failed", error);
      setSubmitting(false);
      setStatus("Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub zadzwoń do kliniki.");
    }
  }

  return (
    <main className={`promo-site promo-quiz-site promo-theme-${config.slug}${finished ? " promo-quiz-booking-stage" : ""}`} lang="pl-PL">\n      <PromoAttributionBridge />
      <header className="promo-quiz-header">
        <Link href={landingPath} className="promo-brand" aria-label="RESÉT clinic — wróć do strony usługi">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={150} height={46} priority />
        </Link>
        {started
          ? <button className="promo-quiz-back" type="button" onClick={back}>← Wstecz</button>
          : <Link className="promo-quiz-close" href={landingPath}>Zamknij</Link>}
      </header>

      <div className="promo-quiz-progress" aria-hidden="true">
        <span style={{ width: `${started ? progress : 0}%` }} />
      </div>

      <section className="promo-quiz-stage">
        <div className="promo-quiz-copy">
          {!started ? (
            <>
              <p className="promo-kicker">{config.quizKicker}</p>
              <h1>{config.quizTitle}</h1>
              <p className="promo-quiz-lead">{config.quizLead}</p>
              <div className="promo-quiz-start-meta">
                <span>≈ 30 sekund</span>
                <span>Bez zbędnych pól</span>
                <span>Ostateczną decyzję podejmuje lekarz lub specjalista</span>
              </div>
              <button className="promo-primary promo-quiz-start" type="button" onClick={start}>Zacznij →</button>
            </>
          ) : finished ? (
            <>
              <p className="promo-kicker">Gotowe · {total}/{total}</p>
              <h1>{config.quizFinalTitle}</h1>
              <p className="promo-quiz-lead">{config.quizFinalLead}</p>
              <form className="promo-quiz-form" onSubmit={submit}>
                <BookingSlotPickerPl
                  service={bookingService}
                  value={booking}
                  onChange={setBooking}
                  onAvailabilityChange={updateAvailability}
                />
                <label>
                  <span>Imię</span>
                  <input name="name" autoComplete="name" required maxLength={120} placeholder="Imię" />
                </label>
                <label>
                  <span>Numer telefonu</span>
                  <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={40} placeholder="+48 / +380" />
                </label>
                <label className="promo-honeypot" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                <button className="promo-primary" type="submit" disabled={submitting || availability.loading}>
                  {submitting ? "Rezerwujemy…" : availability.loading ? "Odświeżamy terminy…" : "Umów konsultację →"}
                </button>
                <p>Wybrany termin jest sprawdzany ponownie przed utworzeniem wizyty w Cliniccards.</p>
                <div className="promo-form-status" role="status" aria-live="polite">{status}</div>
              </form>
            </>
          ) : question ? (
            <>
              {prefilledConcern && step > 0
                ? <div className="promo-quiz-prefill">Twój wybór: <strong>{prefilledConcern}</strong></div>
                : null}
              <p className="promo-kicker">Pytanie {step + 1} z {total}</p>
              <h1>{question.title}</h1>
              {question.helper ? <p className="promo-quiz-lead">{question.helper}</p> : null}
              <div className="promo-answer-grid">
                {question.answers.map((answer) => (
                  <button type="button" key={answer} onClick={() => choose(answer)}>
                    <span>{answer}</span><b>→</b>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <aside className="promo-quiz-visual" aria-hidden="true">
          <Image src={config.heroImage} alt="" fill sizes="(max-width: 900px) 100vw, 42vw" priority style={{ objectFit: "cover" }} />
          <div className="promo-quiz-visual-overlay" />
          <div className="promo-quiz-visual-caption">
            <small>RESÉT clinic · Lwów</small>
            <strong>{config.serviceName}</strong>
            <span>Kulparkowska 93/2</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

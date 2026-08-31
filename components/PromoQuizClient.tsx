"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PromoServiceConfig } from "../lib/promo-data";
import { trackLeadConversion, trackPromoCustomEvent } from "../lib/marketing-pixels";

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function track(event: string, payload: Record<string, unknown>) {
  trackPromoCustomEvent(event, payload);
}

export default function PromoQuizClient({ config }: { config: PromoServiceConfig }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [entrySource, setEntrySource] = useState("direct_quiz_url");
  const [prefilledConcern, setPrefilledConcern] = useState("");
  const startedAt = useRef(Date.now());
  const initializedFromUrl = useRef(false);
  const total = config.quizQuestions.length;
  const finished = started && step >= total;
  const question = config.quizQuestions[step];
  const progress = useMemo(() => (finished ? 100 : Math.max(8, ((step + 1) / total) * 100)), [finished, step, total]);

  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") || "direct_quiz_url";
    const concern = params.get("concern") || "";
    const first = config.quizQuestions[0];
    const validConcern = Boolean(first && concern && first.answers.includes(concern));

    setEntrySource(source);

    if (validConcern && first) {
      setAnswers({ [first.id]: concern });
      setPrefilledConcern(concern);
      setStarted(true);
      setStep(Math.min(1, total));
      startedAt.current = Date.now();
      track("promo_quiz_view", {
        promo_service: config.slug,
        source,
        prefilled_concern: concern,
        dedicated_url: true,
      });
      track("promo_quiz_start", {
        promo_service: config.slug,
        source,
        prefilled_first_answer: true,
      });
      return;
    }

    track("promo_quiz_view", {
      promo_service: config.slug,
      source,
      dedicated_url: true,
    });
  }, [config.quizQuestions, config.slug, total]);

  function start() {
    setStarted(true);
    setStep(0);
    setAnswers({});
    setPrefilledConcern("");
    startedAt.current = Date.now();
    track("promo_quiz_start", { promo_service: config.slug, source: entrySource });
  }

  function choose(answer: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: answer };
    setAnswers(next);
    if (step === 0) setPrefilledConcern(answer);
    track("promo_quiz_answer", {
      promo_service: config.slug,
      question_id: question.id,
      answer,
      question_number: step + 1,
      source: entrySource,
    });
    if (step + 1 >= total) {
      setStep(total);
      track("promo_quiz_contact_view", { promo_service: config.slug, source: entrySource });
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
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const website = String(data.get("website") || "").trim();
    setSubmitting(true);
    setStatus("");
    track("promo_quiz_lead_submit", { promo_service: config.slug, source: entrySource });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service: config.serviceName,
          formId: `promo-quiz-${config.slug}`,
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
            promo_service: config.slug,
            promo_surface: "dedicated_quiz_url",
            promo_entry_source: entrySource,
            prefilled_concern: prefilledConcern || undefined,
            quiz_answers: answers,
          },
        }),
      });
      if (!response.ok) throw new Error(`Lead API ${response.status}`);

      track("promo_quiz_lead_success", { promo_service: config.slug, source: entrySource });
      trackLeadConversion({
        content_name: config.serviceName,
        form_id: `promo-quiz-${config.slug}`,
        conversion_source: "promo_quiz_success",
        promo_entry_source: entrySource,
      });

      window.location.assign("/thank-you/");
    } catch (error) {
      console.error("Promo quiz submit failed", error);
      setSubmitting(false);
      setStatus("Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте у клініку.");
    }
  }

  return (
    <main className={`promo-site promo-quiz-site promo-theme-${config.slug}`}>
      <header className="promo-quiz-header">
        <Link href={`/promo/${config.slug}/`} className="promo-brand" aria-label="RESÉT clinic — назад до сторінки послуги">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={150} height={46} priority />
        </Link>
        {started ? <button className="promo-quiz-back" type="button" onClick={back}>← Назад</button> : <Link className="promo-quiz-close" href={`/promo/${config.slug}/`}>Закрити</Link>}
      </header>

      <div className="promo-quiz-progress" aria-hidden="true"><span style={{ width: `${started ? progress : 0}%` }} /></div>

      <section className="promo-quiz-stage">
        <div className="promo-quiz-copy">
          {!started ? (
            <>
              <p className="promo-kicker">{config.quizKicker}</p>
              <h1>{config.quizTitle}</h1>
              <p className="promo-quiz-lead">{config.quizLead}</p>
              <div className="promo-quiz-start-meta">
                <span>≈ 30 секунд</span><span>Без зайвих полів</span><span>Лікар приймає фінальне рішення</span>
              </div>
              <button className="promo-primary promo-quiz-start" type="button" onClick={start}>Почати →</button>
            </>
          ) : finished ? (
            <>
              <p className="promo-kicker">Готово · {total}/{total}</p>
              <h1>{config.quizFinalTitle}</h1>
              <p className="promo-quiz-lead">{config.quizFinalLead}</p>
              <form className="promo-quiz-form" onSubmit={submit}>
                <label><span>Ваше ім’я</span><input name="name" autoComplete="name" required maxLength={120} placeholder="Ім’я" /></label>
                <label><span>Номер телефону</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={40} placeholder="+380" /></label>
                <label className="promo-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <button className="promo-primary" type="submit" disabled={submitting}>{submitting ? "Надсилаємо…" : "Отримати консультацію →"}</button>
                <p>Адміністратор RESÉT clinic зв’яжеться з вами та уточнить деталі запису.</p>
                <div className="promo-form-status" role="status" aria-live="polite">{status}</div>
              </form>
            </>
          ) : question ? (
            <>
              {prefilledConcern && step > 0 ? <div className="promo-quiz-prefill">Ваш вибір: <strong>{prefilledConcern}</strong></div> : null}
              <p className="promo-kicker">Питання {step + 1} з {total}</p>
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
          <div className="promo-quiz-visual-caption"><small>RESÉT clinic · Львів</small><strong>{config.serviceName}</strong><span>Кульпарківська, 93/2</span></div>
        </aside>
      </section>
    </main>
  );
}

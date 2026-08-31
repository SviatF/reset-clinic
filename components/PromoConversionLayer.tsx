"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PromoServiceConfig } from "../lib/promo-data";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

type PromoDoctor = {
  name: string;
  role: string;
  image: string;
};

function track(event: string, payload: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
  if (typeof window.fbq === "function") window.fbq("trackCustom", event, payload);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PromoConversionLayer({ config, doctor }: { config: PromoServiceConfig; doctor?: PromoDoctor | null }) {
  const [concern, setConcern] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [doctorVisible, setDoctorVisible] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [exitVisible, setExitVisible] = useState(false);
  const progressRef = useRef(0);
  const exitArmed = useRef(false);
  const inlineQuestion = config.quizQuestions[0];

  const navigateToQuiz = useCallback((source: string, selectedConcern?: string) => {
    const current = new URL(window.location.href);
    const target = new URL(`/promo/${config.slug}/quiz/`, window.location.origin);

    current.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });

    target.searchParams.set("source", source);
    const value = selectedConcern || concern;
    if (value) target.searchParams.set("concern", value);

    track("promo_quiz_click", {
      promo_service: config.slug,
      source,
      selected_concern: value || undefined,
      destination: target.pathname,
    });

    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  }, [concern, config.slug]);

  const scrollToForm = useCallback((source: string) => {
    setExitVisible(false);
    const form = document.getElementById("promo-form");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
    track("promo_cta_click", { promo_service: config.slug, source, destination: "lead_form" });
  }, [config.slug]);

  function selectConcern(answer: string) {
    if (!inlineQuestion) return;
    setConcern(answer);
    track("promo_concern_select", {
      promo_service: config.slug,
      question_id: inlineQuestion.id,
      answer,
      source: "inline_selector",
    });
    window.setTimeout(() => navigateToQuiz("inline_selector", answer), 100);
  }

  useEffect(() => {
    track("promo_landing_view", { promo_service: config.slug, conversion_layer: true });
  }, [config.slug]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      const quizLink = element?.closest<HTMLAnchorElement>(`.promo-landing a[href$="/quiz/"]`);
      if (quizLink) {
        event.preventDefault();
        navigateToQuiz(quizLink.className || "quiz_link");
        return;
      }

      const formLink = element?.closest<HTMLAnchorElement>(`.promo-landing a[href="#promo-form"]`);
      if (formLink) {
        track("promo_cta_click", {
          promo_service: config.slug,
          source: formLink.className || "form_link",
          destination: "lead_form",
        });
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [config.slug, navigateToQuiz]);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(`.promo-landing.promo-theme-${config.slug}`);
    if (!main) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealNodes = Array.from(main.querySelectorAll<HTMLElement>(
      ".promo-section-heading, .promo-pain-grid article, .promo-solution-grid, .promo-process-grid article, .promo-doctor-card, .promo-price-card, .promo-faq-list details, .promo-conversion-grid",
    ));

    if (!prefersReduced && "IntersectionObserver" in window) {
      revealNodes.forEach((node) => node.classList.add("promo-conversion-reveal"));
      main.classList.add("promo-conversion-motion-ready");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("promo-conversion-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

      revealNodes.forEach((node) => observer.observe(node));
      return () => observer.disconnect();
    }
  }, [config.slug]);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(`.promo-landing.promo-theme-${config.slug}`);
    const heroVisual = main?.querySelector<HTMLElement>(".promo-hero-visual");
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const value = clamp(window.scrollY / max, 0, 1);
        progressRef.current = value;
        setScrollProgress(value);
        setStickyVisible(value > 0.1 && value < 0.96);
        setDoctorVisible(Boolean(doctor) && value > 0.48 && value < 0.88);

        if (heroVisual) {
          heroVisual.style.setProperty("--promo-parallax-y", `${Math.min(14, window.scrollY * 0.018)}px`);
        }

        const nudgeKey = `reset_promo_nudge_${config.slug}`;
        if (value > 0.36 && value < 0.72 && !exitVisible && !sessionStorage.getItem(nudgeKey)) {
          sessionStorage.setItem(nudgeKey, "1");
          setNudgeVisible(true);
          track("promo_scroll_nudge_view", {
            promo_service: config.slug,
            scroll_percent: Math.round(value * 100),
          });
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [config.slug, doctor, exitVisible]);

  useEffect(() => {
    const key = `reset_promo_exit_${config.slug}`;
    const armTimer = window.setTimeout(() => { exitArmed.current = true; }, 12000);

    const onLeave = (event: MouseEvent) => {
      if (event.clientY > 4 || !exitArmed.current || exitVisible || sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      setNudgeVisible(false);
      setExitVisible(true);
      track("promo_exit_intent_view", {
        promo_service: config.slug,
        device: "desktop",
        scroll_percent: Math.round(progressRef.current * 100),
      });
    };

    document.addEventListener("mouseleave", onLeave);

    const mobileTimer = window.setTimeout(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (!coarse || exitVisible || progressRef.current < 0.2 || progressRef.current > 0.9 || sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      setNudgeVisible(false);
      setExitVisible(true);
      track("promo_exit_intent_view", {
        promo_service: config.slug,
        device: "mobile_inactivity",
        scroll_percent: Math.round(progressRef.current * 100),
      });
    }, 45000);

    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [config.slug, exitVisible]);

  useEffect(() => {
    if (!exitVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExitVisible(false);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [exitVisible]);

  const stickyLabel = scrollProgress > 0.72
    ? "Записатися на консультацію"
    : concern
      ? `Продовжити: ${concern}`
      : "Підібрати під мій запит за 30 сек";

  return (
    <>
      <div className="promo-scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>

      {inlineQuestion ? (
        <section className="promo-concern-section" aria-labelledby={`promo-concern-${config.slug}`}>
          <div className="promo-shell promo-concern-layout">
            <div className="promo-concern-copy">
              <p className="promo-kicker">Персональний підбір · 1 клік</p>
              <h2 id={`promo-concern-${config.slug}`}>Що вас турбує найбільше?</h2>
              <p>Оберіть свій запит — далі відкриється окремий квіз цієї послуги. Це не діагноз і не зобов’язує до процедури.</p>
              <div className="promo-concern-trust"><span>≈ 30 секунд</span><span>3 питання</span><span>Окрема сторінка квізу</span></div>
            </div>
            <div className="promo-concern-options">
              {inlineQuestion.answers.map((answer, index) => (
                <button
                  type="button"
                  key={answer}
                  className={concern === answer ? "is-selected" : ""}
                  onClick={() => selectConcern(answer)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{answer}</strong><b>→</b>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {nudgeVisible && !exitVisible ? (
        <aside className="promo-smart-nudge" role="status">
          <button type="button" className="promo-smart-nudge-close" aria-label="Закрити" onClick={() => setNudgeVisible(false)}>×</button>
          <span>Впізнали свій запит?</span>
          <strong>Підберемо наступний крок за 30 секунд.</strong>
          <button type="button" onClick={() => navigateToQuiz("scroll_nudge")}>Перейти до квізу →</button>
        </aside>
      ) : null}

      {doctorVisible && doctor && !exitVisible ? (
        <aside className="promo-floating-doctor">
          <div className="promo-floating-doctor-photo">
            <Image src={doctor.image} alt={doctor.name} fill sizes="64px" style={{ objectFit: "cover", objectPosition: "center top" }} />
          </div>
          <div><small>Ваш запит може оцінити</small><strong>{doctor.name}</strong><span>{doctor.role}</span></div>
          <button type="button" onClick={() => scrollToForm("floating_doctor")}>Записатися →</button>
        </aside>
      ) : null}

      {!exitVisible && !nudgeVisible ? (
        <button className="promo-helper-fab" type="button" onClick={() => navigateToQuiz("floating_helper")}>
          <span>?</span><b>Не знаю, що обрати</b>
        </button>
      ) : null}

      {stickyVisible && !exitVisible ? (
        <div className="promo-smart-sticky">
          <div>
            <small>{scrollProgress > 0.72 ? "Готові до наступного кроку" : "Персональний підбір"}</small>
            <strong>{stickyLabel}</strong>
          </div>
          <button
            type="button"
            onClick={() => scrollProgress > 0.72 ? scrollToForm("smart_sticky") : navigateToQuiz("smart_sticky")}
          >
            {scrollProgress > 0.72 ? "Записатися →" : "До квізу →"}
          </button>
          <span>Квіз відкривається на окремому URL</span>
        </div>
      ) : null}

      {exitVisible ? (
        <div
          className="promo-overlay promo-exit-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-exit-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExitVisible(false);
          }}
        >
          <div className="promo-exit-card">
            <button className="promo-overlay-close" type="button" aria-label="Закрити" onClick={() => setExitVisible(false)}>×</button>
            <p className="promo-kicker">Перед тим як піти</p>
            <h2 id="promo-exit-title">Не впевнені, що підійде саме вам?</h2>
            <p>Не потрібно обирати процедуру навмання. Перейдіть на окремий квіз, дайте 3 короткі відповіді — і ми краще зрозуміємо ваш запит.</p>
            <div className="promo-exit-actions">
              <button className="promo-primary" type="button" onClick={() => navigateToQuiz("exit_intent")}>Пройти квіз →</button>
              <button className="promo-exit-secondary" type="button" onClick={() => scrollToForm("exit_intent_form")}>Одразу записатися</button>
            </div>
            <small>Квіз має власний URL і підходить для окремих рекламних кампаній.</small>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PromoServiceConfig } from "../lib/promo-data";
import PromoLeadForm from "./PromoLeadForm";

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

type Overlay = "quiz" | "exit" | null;

function track(event: string, payload: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
  if (typeof window.fbq === "function") window.fbq("trackCustom", event, payload);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PromoConversionLayer({ config, doctor }: { config: PromoServiceConfig; doctor?: PromoDoctor | null }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [concern, setConcern] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [doctorVisible, setDoctorVisible] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const progressRef = useRef(0);
  const exitArmed = useRef(false);
  const startedAt = useRef(Date.now());
  const total = config.quizQuestions.length;
  const inlineQuestion = config.quizQuestions[0];
  const question = config.quizQuestions[step];
  const finished = step >= total;

  const drawerProgress = useMemo(() => {
    if (!total) return 100;
    if (finished) return 100;
    return clamp(((step + 1) / total) * 100, 8, 100);
  }, [finished, step, total]);

  const openQuiz = useCallback((source: string) => {
    const first = config.quizQuestions[0];
    if (concern && first) {
      setAnswers((current) => ({ ...current, [first.id]: concern }));
      setStep(Math.min(1, config.quizQuestions.length));
    } else {
      setStep(0);
    }
    startedAt.current = Date.now();
    setOverlay("quiz");
    setNudgeVisible(false);
    track("promo_quiz_open", { promo_service: config.slug, source, selected_concern: concern || undefined });
  }, [concern, config.quizQuestions, config.slug]);

  const scrollToForm = useCallback((source: string) => {
    setOverlay(null);
    const form = document.getElementById("promo-form");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
    track("promo_cta_click", { promo_service: config.slug, source, destination: "lead_form" });
  }, [config.slug]);

  const closeOverlay = useCallback((source = "close") => {
    setOverlay(null);
    track("promo_overlay_close", { promo_service: config.slug, source });
  }, [config.slug]);

  function selectConcern(answer: string, source = "inline_selector") {
    if (!inlineQuestion) return;
    const next = { ...answers, [inlineQuestion.id]: answer };
    setAnswers(next);
    setConcern(answer);
    setStep(Math.min(1, total));
    startedAt.current = Date.now();
    track("promo_concern_select", { promo_service: config.slug, answer, source });
    track("promo_quiz_answer", {
      promo_service: config.slug,
      question_id: inlineQuestion.id,
      answer,
      question_number: 1,
      source,
    });
    window.setTimeout(() => setOverlay("quiz"), 120);
  }

  function choose(answer: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: answer };
    setAnswers(next);
    if (step === 0) setConcern(answer);
    track("promo_quiz_answer", {
      promo_service: config.slug,
      question_id: question.id,
      answer,
      question_number: step + 1,
      source: "landing_drawer",
    });
    if (step + 1 >= total) {
      setStep(total);
      track("promo_quiz_complete", {
        promo_service: config.slug,
        source: "landing_drawer",
        duration_ms: Date.now() - startedAt.current,
      });
    } else {
      setStep(step + 1);
    }
  }

  function back() {
    if (finished) return setStep(Math.max(0, total - 1));
    if (step > 0) return setStep(step - 1);
    closeOverlay("quiz_back");
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
        openQuiz(quizLink.className || "quiz_link");
        return;
      }
      const formLink = element?.closest<HTMLAnchorElement>(`.promo-landing a[href="#promo-form"]`);
      if (formLink) {
        track("promo_cta_click", { promo_service: config.slug, source: formLink.className || "form_link", destination: "lead_form" });
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [config.slug, openQuiz]);

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
        if (heroVisual) heroVisual.style.setProperty("--promo-parallax-y", `${Math.min(14, window.scrollY * 0.018)}px`);

        const nudgeKey = `reset_promo_nudge_${config.slug}`;
        if (value > 0.36 && value < 0.72 && !overlay && !sessionStorage.getItem(nudgeKey)) {
          sessionStorage.setItem(nudgeKey, "1");
          setNudgeVisible(true);
          track("promo_scroll_nudge_view", { promo_service: config.slug, scroll_percent: Math.round(value * 100) });
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
  }, [config.slug, doctor, overlay]);

  useEffect(() => {
    const key = `reset_promo_exit_${config.slug}`;
    const armTimer = window.setTimeout(() => { exitArmed.current = true; }, 12000);
    const onLeave = (event: MouseEvent) => {
      if (event.clientY > 4 || !exitArmed.current || overlay || sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      setOverlay("exit");
      track("promo_exit_intent_view", { promo_service: config.slug, device: "desktop", scroll_percent: Math.round(progressRef.current * 100) });
    };
    document.addEventListener("mouseleave", onLeave);

    const mobileTimer = window.setTimeout(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (!coarse || overlay || progressRef.current < 0.2 || progressRef.current > 0.9 || sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      setOverlay("exit");
      track("promo_exit_intent_view", { promo_service: config.slug, device: "mobile_inactivity", scroll_percent: Math.round(progressRef.current * 100) });
    }, 45000);

    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [config.slug, overlay]);

  useEffect(() => {
    if (!overlay) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlay("escape");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [closeOverlay, overlay]);

  const stickyLabel = scrollProgress > 0.72
    ? "Записатися на консультацію"
    : concern
      ? `Продовжити: ${concern}`
      : "Підібрати під мій запит за 30 сек";

  return (
    <>
      <div className="promo-scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scrollProgress})` }} /></div>

      {inlineQuestion ? (
        <section className="promo-concern-section" aria-labelledby={`promo-concern-${config.slug}`}>
          <div className="promo-shell promo-concern-layout">
            <div className="promo-concern-copy">
              <p className="promo-kicker">Персональний підбір · 1 клік</p>
              <h2 id={`promo-concern-${config.slug}`}>Що вас турбує найбільше?</h2>
              <p>Оберіть свій запит — наступні питання й CTA підлаштуються під вашу відповідь. Це не діагноз і не зобов’язує до процедури.</p>
              <div className="promo-concern-trust"><span>≈ 30 секунд</span><span>3 питання</span><span>Без оплати</span></div>
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

      {nudgeVisible && !overlay ? (
        <aside className="promo-smart-nudge" role="status">
          <button type="button" className="promo-smart-nudge-close" aria-label="Закрити" onClick={() => setNudgeVisible(false)}>×</button>
          <span>Впізнали свій запит?</span>
          <strong>Підберемо наступний крок за 30 секунд.</strong>
          <button type="button" onClick={() => openQuiz("scroll_nudge")}>3 короткі питання →</button>
        </aside>
      ) : null}

      {doctorVisible && doctor && !overlay ? (
        <aside className="promo-floating-doctor">
          <div className="promo-floating-doctor-photo"><Image src={doctor.image} alt={doctor.name} fill sizes="64px" style={{ objectFit: "cover", objectPosition: "center top" }} /></div>
          <div><small>Ваш запит може оцінити</small><strong>{doctor.name}</strong><span>{doctor.role}</span></div>
          <button type="button" onClick={() => scrollToForm("floating_doctor")}>Записатися →</button>
        </aside>
      ) : null}

      {!overlay ? (
        <button className="promo-helper-fab" type="button" onClick={() => openQuiz("floating_helper")}>
          <span>?</span><b>Не знаю, що обрати</b>
        </button>
      ) : null}

      {stickyVisible && !overlay ? (
        <div className="promo-smart-sticky">
          <div>
            <small>{scrollProgress > 0.72 ? "Готові до наступного кроку" : "Персональний підбір"}</small>
            <strong>{stickyLabel}</strong>
          </div>
          <button type="button" onClick={() => scrollProgress > 0.72 ? scrollToForm("smart_sticky") : openQuiz("smart_sticky")}>
            {scrollProgress > 0.72 ? "Записатися →" : "Підібрати →"}
          </button>
          <span>Найближчий час уточнить адміністратор</span>
        </div>
      ) : null}

      {overlay === "exit" ? (
        <div className="promo-overlay promo-exit-overlay" role="dialog" aria-modal="true" aria-labelledby="promo-exit-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeOverlay("exit_backdrop");
        }}>
          <div className="promo-exit-card">
            <button className="promo-overlay-close" type="button" aria-label="Закрити" onClick={() => closeOverlay("exit_close")}>×</button>
            <p className="promo-kicker">Перед тим як піти</p>
            <h2 id="promo-exit-title">Не впевнені, що підійде саме вам?</h2>
            <p>Не потрібно обирати процедуру навмання. Дайте 3 короткі відповіді — ми зафіксуємо ваш запит і підкажемо логічний наступний крок.</p>
            <div className="promo-exit-meta"><span>≈ 30 секунд</span><span>Без зобов’язань</span><span>Фінальне рішення — після оцінки спеціаліста</span></div>
            <div className="promo-exit-actions">
              <button className="promo-primary" type="button" onClick={() => {
                setOverlay(null);
                window.setTimeout(() => openQuiz("exit_intent"), 0);
              }}>Підібрати під мій запит →</button>
              <button className="promo-exit-secondary" type="button" onClick={() => scrollToForm("exit_direct_form")}>Одразу записатися</button>
            </div>
          </div>
        </div>
      ) : null}

      {overlay === "quiz" ? (
        <div className="promo-overlay promo-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby="promo-drawer-title" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeOverlay("drawer_backdrop");
        }}>
          <section className="promo-quiz-drawer">
            <div className="promo-drawer-progress" aria-hidden="true"><span style={{ width: `${drawerProgress}%` }} /></div>
            <header className="promo-drawer-header">
              <div><small>RESÉT clinic · Львів</small><strong>{config.serviceName}</strong></div>
              <div className="promo-drawer-header-actions">
                {(step > 0 || finished) ? <button type="button" onClick={back}>← Назад</button> : null}
                <button type="button" aria-label="Закрити" onClick={() => closeOverlay("drawer_close")}>×</button>
              </div>
            </header>

            <div className="promo-drawer-body">
              <div className="promo-drawer-copy">
                {finished ? (
                  <>
                    <p className="promo-kicker">Готово · {total}/{total}</p>
                    <h2 id="promo-drawer-title">{config.quizFinalTitle}</h2>
                    <p className="promo-drawer-lead">{config.quizFinalLead}</p>
                    <div className="promo-drawer-summary">
                      {config.quizQuestions.map((item) => answers[item.id] ? <span key={item.id}>{answers[item.id]}</span> : null)}
                    </div>
                    <div className="promo-drawer-form-wrap">
                      <PromoLeadForm
                        service={config.serviceName}
                        slug={config.slug}
                        formId={`promo-drawer-quiz-${config.slug}`}
                        compact
                        extraFields={{
                          promo_surface: "landing_drawer_quiz",
                          quiz_answers: answers,
                          selected_concern: concern || undefined,
                          quiz_duration_ms: Date.now() - startedAt.current,
                        }}
                        buttonLabel="Отримати консультацію →"
                        note="Адміністратор уточнить ваш запит і запропонує зручний час. Заповнення форми не зобов’язує проходити процедуру."
                      />
                    </div>
                  </>
                ) : question ? (
                  <>
                    <p className="promo-kicker">Питання {step + 1} з {total}</p>
                    <h2 id="promo-drawer-title">{question.title}</h2>
                    {question.helper ? <p className="promo-drawer-lead">{question.helper}</p> : <p className="promo-drawer-lead">Оберіть найближчу відповідь — її побачить адміністратор разом із вашим запитом.</p>}
                    <div className="promo-drawer-answers">
                      {question.answers.map((answer) => (
                        <button type="button" key={answer} onClick={() => choose(answer)} className={answers[question.id] === answer ? "is-selected" : ""}>
                          <span>{answer}</span><b>→</b>
                        </button>
                      ))}
                    </div>
                    <p className="promo-drawer-medical">Квіз допомагає зорієнтуватися у запиті, але не замінює медичну оцінку.</p>
                  </>
                ) : null}
              </div>

              <aside className="promo-drawer-visual" aria-hidden="true">
                <Image src={config.heroImage} alt="" fill sizes="(max-width: 900px) 0px, 38vw" style={{ objectFit: "cover" }} />
                <div className="promo-drawer-visual-shade" />
                <div className="promo-drawer-visual-copy"><small>Ваш запит</small><strong>{concern || config.serviceName}</strong><span>Індивідуальний підхід · без шаблонних рішень</span></div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

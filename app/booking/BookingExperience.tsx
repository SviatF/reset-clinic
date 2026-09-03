"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BookingSlotPicker from "../../components/BookingSlotPicker";
import type { BookingSelection } from "../../lib/booking-types";
import { trackLeadConversion, trackPromoCustomEvent } from "../../lib/marketing-pixels";
import styles from "./booking.module.css";

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

type Mode = "service" | "doctor" | "help";
type Step = "mode" | "choice" | "doctorService" | "slot" | "details";

type DoctorOption = {
  id: string;
  name: string;
  serviceCount: number;
};

type ServiceOption = {
  id: string;
  name: string;
  doctorIds: string[];
};

type OptionsResponse = {
  ok: boolean;
  doctors: DoctorOption[];
  services: ServiceOption[];
  message?: string;
};

type AvailabilityState = {
  enabled: boolean;
  loading: boolean;
  hasSlots: boolean;
  error?: string;
};

const INITIAL_AVAILABILITY: AvailabilityState = {
  enabled: false,
  loading: true,
  hasSlots: false,
};

const BOOKING_DATE = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function trackingValue(key: (typeof TRACKING_KEYS)[number]) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? sessionStorage.getItem(`reset_${key}`) ?? undefined;
}

function normalizedSearch(value: string) {
  return value.toLocaleLowerCase("uk-UA").replace(/\s+/g, " ").trim();
}

function validPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function formatBookingDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return BOOKING_DATE.format(date).replace(/^./, (letter) => letter.toUpperCase());
}

function doctorWord(count: number) {
  return count === 1 ? "лікар" : count >= 2 && count <= 4 ? "лікарі" : "лікарів";
}

function Icon({ type }: { type: Mode }) {
  if (type === "doctor") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c1-3.8 3.5-5.8 6.5-5.8s5.5 2 6.5 5.8" />
      </svg>
    );
  }
  if (type === "help") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M9.8 9a2.4 2.4 0 0 1 4.7.7c0 1.8-2.5 2-2.5 3.8" />
        <path d="M12 17h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14M5 12h14M5 17.5h9" />
      <circle cx="3" cy="6.5" r=".8" />
      <circle cx="3" cy="12" r=".8" />
      <circle cx="3" cy="17.5" r=".8" />
    </svg>
  );
}

export default function BookingExperience() {
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [booking, setBooking] = useState<BookingSelection | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>(INITIAL_AVAILABILITY);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError("");
    try {
      const response = await fetch("/api/booking/options", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as OptionsResponse;
      setOptions(data);
      if (!response.ok || !data.ok) {
        setOptionsError(data.message || "Не вдалося оновити список послуг і лікарів.");
      }
    } catch (error) {
      console.error("RESET booking options failed", error);
      setOptionsError("Не вдалося оновити список послуг і лікарів.");
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const choiceKind: "doctor" | "service" = step === "doctorService" ? "service" : mode === "doctor" ? "doctor" : "service";

  const allChoiceItems = useMemo<Array<DoctorOption | ServiceOption>>(() => {
    if (step === "doctorService") {
      if (!selectedDoctor) return [];
      return (options?.services || []).filter((service) => service.doctorIds.includes(selectedDoctor.id));
    }
    if (mode === "doctor") return options?.doctors || [];
    return options?.services || [];
  }, [mode, options, selectedDoctor, step]);

  const choiceItems = useMemo<Array<DoctorOption | ServiceOption>>(() => {
    const query = normalizedSearch(search);
    const filtered = query
      ? allChoiceItems.filter((item) => normalizedSearch(item.name).includes(query))
      : allChoiceItems;
    return showAll || query ? filtered : filtered.slice(0, 18);
  }, [allChoiceItems, search, showAll]);

  const totalChoices = allChoiceItems.length;
  const selectedLabel = selectedService?.name || selectedDoctor?.name || "";
  const totalSteps = mode === "help" ? 2 : mode === "doctor" ? 5 : 4;
  const currentNumber = step === "mode"
    ? 1
    : step === "choice"
      ? 2
      : step === "doctorService"
        ? 3
        : step === "slot"
          ? mode === "doctor" ? 4 : 3
          : mode === "help" ? 2 : mode === "doctor" ? 5 : 4;

  const progressTitle = step === "mode"
    ? "Почнемо з вашого запиту"
    : step === "choice"
      ? mode === "doctor" ? "Оберіть лікаря" : "Оберіть послугу"
      : step === "doctorService"
        ? "Оберіть послугу"
        : step === "slot"
          ? "Оберіть вільний час"
          : "Підтвердіть контакт";

  function resetSelection(nextMode?: Mode) {
    setSelectedService(null);
    setSelectedDoctor(null);
    setBooking(null);
    setSearch("");
    setShowAll(false);
    setStatus("");
    setAvailability(INITIAL_AVAILABILITY);
    if (nextMode) setMode(nextMode);
  }

  function selectMode(nextMode: Mode) {
    resetSelection(nextMode);
    trackPromoCustomEvent("booking_mode_selected", { booking_mode: nextMode });
    setStep(nextMode === "help" ? "details" : "choice");
  }

  function selectChoice(item: DoctorOption | ServiceOption) {
    setBooking(null);
    setStatus("");
    setSearch("");
    setShowAll(false);

    if (step === "doctorService") {
      const service = item as ServiceOption;
      setSelectedService(service);
      trackPromoCustomEvent("booking_service_selected", {
        service_name: service.name,
        doctor_name: selectedDoctor?.name,
      });
      setStep("slot");
      return;
    }

    if (mode === "doctor") {
      const doctor = item as DoctorOption;
      setSelectedDoctor(doctor);
      setSelectedService(null);
      trackPromoCustomEvent("booking_doctor_selected", { doctor_name: doctor.name });
      setStep("doctorService");
      return;
    }

    const service = item as ServiceOption;
    setSelectedService(service);
    setSelectedDoctor(null);
    trackPromoCustomEvent("booking_service_selected", { service_name: service.name });
    setStep("slot");
  }

  function goBack() {
    setStatus("");
    if (step === "details") {
      if (mode === "help") {
        setMode(null);
        setStep("mode");
      } else {
        setStep("slot");
      }
      return;
    }
    if (step === "slot") {
      setBooking(null);
      setStep(mode === "doctor" ? "doctorService" : "choice");
      return;
    }
    if (step === "doctorService") {
      setSelectedService(null);
      setSearch("");
      setShowAll(false);
      setStep("choice");
      return;
    }
    if (step === "choice") {
      setMode(null);
      resetSelection();
      setStep("mode");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (submitting || !form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const comment = String(data.get("comment") || "").trim();
    const website = String(data.get("website") || "").trim();

    if (!validPhone(phone)) {
      setStatus("Перевірте номер телефону — має бути щонайменше 9 цифр.");
      return;
    }
    if (mode !== "help" && (!selectedService || !booking)) {
      setStatus("Спочатку оберіть послугу та актуальну вільну годину.");
      setStep(selectedService ? "slot" : mode === "doctor" ? "doctorService" : "choice");
      return;
    }

    const service = mode === "help"
      ? comment
        ? `Потрібна допомога з вибором: ${comment}`
        : "Потрібна допомога з вибором послуги"
      : selectedService?.name || "Онлайн-запис";

    setSubmitting(true);
    setStatus("");
    trackPromoCustomEvent("booking_submit", {
      booking_mode: mode,
      booking_service: selectedService?.name,
      booking_doctor: selectedDoctor?.name || booking?.doctorName,
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
          service,
          booking,
          formId: "booking-page-v2",
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
            booking_mode: mode,
            booking_service: selectedService?.name,
            booking_service_id: selectedService?.id,
            booking_doctor: selectedDoctor?.name || booking?.doctorName,
            booking_doctor_id: selectedDoctor?.id || booking?.doctorId,
            patient_comment: comment || undefined,
            booking_selection: booking,
            source_surface: "booking-page-v2",
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
        setStep("slot");
        setStatus("Цю годину щойно зайняли. Ваш контакт уже збережено — оберіть інший вільний час.");
        return;
      }
      if (!response.ok) throw new Error(`Lead API ${response.status}`);

      trackPromoCustomEvent("booking_success", {
        booking_mode: mode,
        booking_status: result.booking?.status,
      });
      trackLeadConversion({
        content_name: service,
        form_id: "booking-page-v2",
        conversion_source: "booking_page_success",
      });
      window.location.assign("/thank-you/");
    } catch (error) {
      console.error("RESET booking submit failed", error);
      setSubmitting(false);
      setStatus("Не вдалося підтвердити запис. Спробуйте ще раз або зателефонуйте нам.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a href="/" className={styles.brand} aria-label="RESET Clinic — на головну">
          <img src="/assets/logo-main.png" alt="RESET Clinic" />
        </a>
        <div className={styles.topbarActions}>
          <a href="tel:+380932828888" className={styles.phone}>+380 93 282 88 88</a>
          <a href="/" className={styles.backSite}>На сайт</a>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.story}>
          <div className={styles.storyOverlay} />
          <div className={styles.storyContent}>
            <span className={styles.eyebrow}>Онлайн-запис · Львів</span>
            <h1>Ваш час у RESET — без зайвих дзвінків.</h1>
            <p>Оберіть послугу або лікаря, побачте тільки актуальні вільні години та підтвердьте запис за кілька кроків.</p>
            <div className={styles.trustList}>
              <div><span>01</span><strong>Живий розклад Cliniccards</strong><small>Зайняті та минулі години не показуємо.</small></div>
              <div><span>02</span><strong>Точна тривалість процедури</strong><small>Час розраховується за реальною послугою та лікарем.</small></div>
              <div><span>03</span><strong>Ми поруч, якщо є сумніви</strong><small>Адміністратор допоможе підібрати правильний напрямок.</small></div>
            </div>
          </div>
          <div className={styles.storyFooter}>
            <span>RESET Clinic</span>
            <span>Кульпарківська, 93/2</span>
          </div>
        </aside>

        <section className={styles.workspace}>
          <div className={styles.mobileIntro}>
            <span>Онлайн-запис · актуальний розклад</span>
            <h1>Оберіть зручний час у RESET</h1>
            <p>Кілька простих кроків — і запис готовий.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.progressRow}>
              <div className={styles.progressCopy}>
                <span>Крок {currentNumber} з {totalSteps}</span>
                <strong>{progressTitle}</strong>
              </div>
              <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${(currentNumber / totalSteps) * 100}%` }} /></div>
            </div>

            {step !== "mode" ? (
              <button type="button" className={styles.backButton} onClick={goBack}>
                <span aria-hidden="true">←</span> Назад
              </button>
            ) : null}

            {step === "mode" ? (
              <div className={styles.stepBody}>
                <div className={styles.heading}>
                  <span className={styles.kicker}>Як вам зручніше?</span>
                  <h2>Оберіть найпростіший шлях до запису</h2>
                  <p>Якщо не знаєте точну назву процедури — це нормально. Для цього є швидкий варіант із допомогою адміністратора.</p>
                </div>
                <div className={styles.modeGrid}>
                  <button type="button" className={`${styles.modeCard} ${styles.recommended}`} onClick={() => selectMode("service")}>
                    <span className={styles.recommendLabel}>Рекомендуємо</span>
                    <span className={styles.modeIcon}><Icon type="service" /></span>
                    <strong>Знаю, яка послуга потрібна</strong>
                    <small>Оберу процедуру → побачу доступних лікарів і час.</small>
                    <span className={styles.modeArrow}>→</span>
                  </button>
                  <button type="button" className={styles.modeCard} onClick={() => selectMode("doctor")}>
                    <span className={styles.modeIcon}><Icon type="doctor" /></span>
                    <strong>Хочу до конкретного лікаря</strong>
                    <small>Оберу спеціаліста та послугу → побачу його реальний графік.</small>
                    <span className={styles.modeArrow}>→</span>
                  </button>
                  <button type="button" className={styles.modeCard} onClick={() => selectMode("help")}>
                    <span className={styles.modeIcon}><Icon type="help" /></span>
                    <strong>Не знаю, що саме обрати</strong>
                    <small>Залишу контакт — адміністратор підбере правильний напрямок.</small>
                    <span className={styles.modeArrow}>→</span>
                  </button>
                </div>
              </div>
            ) : null}

            {step === "choice" || step === "doctorService" ? (
              <div className={styles.stepBody}>
                <div className={styles.heading}>
                  <span className={styles.kicker}>
                    {step === "doctorService" ? selectedDoctor?.name : choiceKind === "doctor" ? "Спеціалісти RESET" : "Послуги RESET"}
                  </span>
                  <h2>
                    {step === "doctorService"
                      ? "Яка послуга вам потрібна?"
                      : choiceKind === "doctor"
                        ? "До кого хочете записатись?"
                        : "Що вас цікавить?"}
                  </h2>
                  <p>
                    {step === "doctorService"
                      ? "Показуємо тільки ті послуги, які доступні для обраного лікаря. Це потрібно, щоб коректно забронювати тривалість в Cliniccards."
                      : choiceKind === "doctor"
                        ? "Показуємо лише активних спеціалістів із доступними послугами."
                        : "Почніть вводити назву — список відфільтрується автоматично."}
                  </p>
                </div>

                {optionsLoading ? (
                  <div className={styles.loadingBox}><span />Оновлюємо дані Cliniccards…</div>
                ) : optionsError ? (
                  <div className={styles.errorBox}>
                    <strong>Не вдалося завантажити список</strong>
                    <p>{optionsError}</p>
                    <div><button type="button" onClick={() => void loadOptions()}>Спробувати ще раз</button><button type="button" onClick={() => selectMode("help")}>Залишити заявку</button></div>
                  </div>
                ) : (
                  <>
                    <label className={styles.searchBox}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={choiceKind === "doctor" ? "Ім’я лікаря" : "Наприклад: консультація, ботулінотерапія…"}
                        autoComplete="off"
                      />
                      {search ? <button type="button" onClick={() => setSearch("")} aria-label="Очистити пошук">×</button> : null}
                    </label>

                    <div className={styles.choiceList}>
                      {choiceItems.map((item) => {
                        const doctorItem = choiceKind === "doctor" ? item as DoctorOption : null;
                        const serviceItem = choiceKind === "service" ? item as ServiceOption : null;
                        return (
                          <button type="button" key={`${choiceKind}-${item.id}`} className={styles.choiceItem} onClick={() => selectChoice(item)}>
                            <span className={styles.choiceAvatar}>{choiceKind === "doctor" ? item.name.slice(0, 1).toUpperCase() : "·"}</span>
                            <span className={styles.choiceCopy}>
                              <strong>{item.name}</strong>
                              <small>
                                {doctorItem
                                  ? `${doctorItem.serviceCount} послуг у розкладі`
                                  : serviceItem
                                    ? step === "doctorService"
                                      ? `Доступно у ${selectedDoctor?.name || "лікаря"}`
                                      : `${serviceItem.doctorIds.length} ${doctorWord(serviceItem.doctorIds.length)} доступно`
                                    : ""}
                              </small>
                            </span>
                            <span className={styles.choiceArrow}>→</span>
                          </button>
                        );
                      })}
                      {!choiceItems.length ? <div className={styles.emptyChoice}>Нічого не знайшли. Спробуйте коротший запит або скористайтесь допомогою адміністратора.</div> : null}
                    </div>

                    {!search && totalChoices > choiceItems.length ? (
                      <button type="button" className={styles.showAll} onClick={() => setShowAll((value) => !value)}>
                        {showAll ? "Показати компактно" : `Показати всі (${totalChoices})`}
                      </button>
                    ) : null}

                    <button type="button" className={styles.helpLink} onClick={() => selectMode("help")}>
                      Не бачу потрібного / не впевнений у виборі →
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {step === "slot" ? (
              <div className={`${styles.stepBody} ${styles.slotStep}`}>
                <div className={styles.heading}>
                  <span className={styles.kicker}>Актуальні вільні години</span>
                  <h2>Коли вам зручно?</h2>
                  <p>Показуємо майбутні вільні години. Перед створенням запису слот автоматично перевіряється ще раз.</p>
                </div>
                <div className={styles.selectedChoice}>
                  <span>{mode === "doctor" ? `Лікар · ${selectedDoctor?.name || ""}` : "Послуга"}</span>
                  <strong>{selectedService?.name || selectedLabel}</strong>
                  <button type="button" onClick={() => setStep(mode === "doctor" ? "doctorService" : "choice")}>Змінити</button>
                </div>

                <div className={styles.slotPickerWrap}>
                  <BookingSlotPicker
                    service={selectedService?.name}
                    doctor={selectedDoctor?.id}
                    value={booking}
                    onChange={(value) => {
                      setBooking(value);
                      setStatus("");
                      if (value) {
                        trackPromoCustomEvent("booking_slot_selected", {
                          booking_date: value.date,
                          booking_time: value.time,
                          doctor_name: value.doctorName,
                        });
                      }
                    }}
                    onAvailabilityChange={setAvailability}
                    compact
                  />
                </div>

                {status ? <div className={styles.inlineStatus} role="status">{status}</div> : null}
                <button
                  type="button"
                  className={styles.primaryAction}
                  disabled={!booking || availability.loading}
                  onClick={() => setStep("details")}
                >
                  {availability.loading ? "Оновлюємо години…" : booking ? "Продовжити →" : "Оберіть вільну годину"}
                </button>
              </div>
            ) : null}

            {step === "details" ? (
              <div className={styles.stepBody}>
                <div className={styles.heading}>
                  <span className={styles.kicker}>{mode === "help" ? "Ми допоможемо" : "Останній крок"}</span>
                  <h2>{mode === "help" ? "Куди вам зателефонувати?" : "Підтвердіть запис"}</h2>
                  <p>{mode === "help" ? "Опишіть запит одним реченням — адміністратор зорієнтує по послузі, лікарю та часу." : "Залиште контакт — він потрібен для створення або пошуку вашої картки в Cliniccards."}</p>
                </div>

                {mode !== "help" && booking ? (
                  <div className={styles.bookingSummary}>
                    <span className={styles.summaryCheck}>✓</span>
                    <div>
                      <small>Ваш вибір</small>
                      <strong>{formatBookingDate(booking.date)} · {booking.time}</strong>
                      <span>{selectedService?.name}{booking.doctorName ? ` · ${booking.doctorName}` : ""}</span>
                    </div>
                    <button type="button" onClick={() => setStep("slot")}>Змінити</button>
                  </div>
                ) : null}

                <form className={styles.contactForm} onSubmit={submit}>
                  <label>
                    <span>Ваше ім’я</span>
                    <input name="name" autoComplete="name" maxLength={120} required placeholder="Як до вас звертатись?" />
                  </label>
                  <label>
                    <span>Номер телефону</span>
                    <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} required placeholder="+380 00 000 00 00" />
                  </label>
                  <label>
                    <span>{mode === "help" ? "Що вас турбує?" : "Коментар"} <small>необов’язково</small></span>
                    <textarea name="comment" maxLength={600} rows={3} placeholder={mode === "help" ? "Наприклад: висипання на обличчі, хочу зрозуміти до кого записатись" : "Щось важливе, що варто знати адміністратору"} />
                  </label>
                  <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

                  {status ? <div className={styles.formStatus} role="status" aria-live="polite">{status}</div> : null}
                  <button type="submit" className={styles.primaryAction} disabled={submitting}>
                    {submitting ? (mode === "help" ? "Надсилаємо…" : "Бронюємо…") : mode === "help" ? "Отримати допомогу →" : "Підтвердити запис →"}
                  </button>
                  <p className={styles.formNote}>Контактні дані використовуються для організації та підтвердження вашого запису.</p>
                </form>
              </div>
            ) : null}
          </div>

          <div className={styles.supportBar}>
            <div><span>Потрібна допомога прямо зараз?</span><strong>Адміністратор RESET на зв’язку</strong></div>
            <a href="tel:+380932828888">Зателефонувати</a>
          </div>
        </section>
      </div>
    </main>
  );
}

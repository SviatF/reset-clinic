"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingAvailabilityResponse, BookingSelection, BookingSlot } from "../lib/booking-types";

type AvailabilityState = {
  enabled: boolean;
  loading: boolean;
  hasSlots: boolean;
  error?: string;
};

type Props = {
  service?: string;
  doctor?: string;
  value?: BookingSelection | null;
  onChange: (value: BookingSelection | null) => void;
  onAvailabilityChange?: (state: AvailabilityState) => void;
  compact?: boolean;
};

type WeekGroup = {
  key: string;
  label: string;
  slots: BookingSlot[];
};

const UK_DATE = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const UK_SHORT = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function utcDate(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monday(date: Date) {
  const value = new Date(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function kyivDateFromIso(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dateKey(new Date());
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function weekLabel(start: Date, currentWeek: Date) {
  const diff = Math.round((start.getTime() - currentWeek.getTime()) / 604_800_000);
  if (diff === 0) return "Цей тиждень";
  if (diff === 1) return "Наступний тиждень";
  return `${UK_SHORT.format(start)} — ${UK_SHORT.format(addDays(start, 6))}`;
}

function groupWeeks(slots: BookingSlot[], generatedAt: string): WeekGroup[] {
  const currentWeek = monday(utcDate(kyivDateFromIso(generatedAt)));
  const slotsByWeek = new Map<string, BookingSlot[]>();

  slots.forEach((slot) => {
    const start = monday(utcDate(slot.date));
    const key = dateKey(start);
    const group = slotsByWeek.get(key) || [];
    group.push(slot);
    slotsByWeek.set(key, group);
  });

  if (!slots.length) return [];

  const furthestWeek = [...slotsByWeek.keys()].sort().at(-1) || dateKey(currentWeek);
  const weekDistance = Math.max(
    0,
    Math.round((utcDate(furthestWeek).getTime() - currentWeek.getTime()) / 604_800_000),
  );
  const visibleWeekCount = Math.min(6, Math.max(2, weekDistance + 1));

  return Array.from({ length: visibleWeekCount }, (_, index) => {
    const start = addDays(currentWeek, index * 7);
    const key = dateKey(start);
    return {
      key,
      label: weekLabel(start, currentWeek),
      slots: [...(slotsByWeek.get(key) || [])].sort((a, b) => a.start.localeCompare(b.start)),
    };
  });
}

function dateLabel(date: string) {
  return UK_DATE.format(utcDate(date)).replace(/^./, (letter) => letter.toUpperCase());
}

function selectionFrom(slot: BookingSlot, week: WeekGroup): BookingSelection {
  return {
    slotId: slot.id,
    date: slot.date,
    time: slot.time,
    start: slot.start,
    end: slot.end,
    doctorId: slot.doctorId,
    doctorName: slot.doctorName,
    cabinetId: slot.cabinetId,
    cabinetName: slot.cabinetName,
    serviceId: slot.serviceId,
    serviceName: slot.serviceName,
    weekKey: week.key,
    weekLabel: week.label,
  };
}

export default function BookingSlotPicker({
  service,
  doctor,
  value,
  onChange,
  onAvailabilityChange,
  compact = false,
}: Props) {
  const [payload, setPayload] = useState<BookingAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeWeek, setActiveWeek] = useState("");
  const [activeDate, setActiveDate] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const query = new URLSearchParams();
    if (service) query.set("service", service);
    if (doctor) query.set("doctor", doctor);
    const queryString = query.toString();

    try {
      const response = await fetch(`/api/booking/slots${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as BookingAvailabilityResponse;
      setPayload(data);
      if (!response.ok || !data.ok) setError(data.message || "Не вдалося оновити вільні години.");
    } catch (requestError) {
      console.error("RESET booking availability failed", requestError);
      setError("Не вдалося оновити вільні години. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }, [doctor, service]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const weeks = useMemo(
    () => groupWeeks(payload?.slots || [], payload?.generatedAt || new Date().toISOString()),
    [payload],
  );

  useEffect(() => {
    if (!weeks.length) {
      setActiveWeek("");
      setActiveDate("");
      if (value) onChange(null);
      return;
    }

    const selectableWeeks = weeks.filter((item) => item.slots.length > 0);
    const selectedWeek = value?.weekKey && selectableWeeks.some((item) => item.key === value.weekKey)
      ? value.weekKey
      : "";
    const preservedWeek = selectableWeeks.some((item) => item.key === activeWeek) ? activeWeek : "";
    const nextWeek = selectedWeek || preservedWeek || selectableWeeks[0]?.key || "";
    setActiveWeek(nextWeek);

    const dates = [...new Set((weeks.find((item) => item.key === nextWeek)?.slots || []).map((slot) => slot.date))];
    const nextDate = value?.date && dates.includes(value.date)
      ? value.date
      : dates.includes(activeDate)
        ? activeDate
        : dates[0] || "";
    setActiveDate(nextDate);
  }, [activeDate, activeWeek, onChange, value, weeks]);

  useEffect(() => {
    if (!value || !payload?.slots.length) return;
    const stillAvailable = payload.slots.some((slot) => slot.id === value.slotId || (
      slot.date === value.date && slot.time === value.time && (!value.doctorId || !slot.doctorId || value.doctorId === slot.doctorId)
    ));
    if (!stillAvailable) onChange(null);
  }, [onChange, payload, value]);

  useEffect(() => {
    onAvailabilityChange?.({
      enabled: payload?.enabled ?? false,
      loading,
      hasSlots: Boolean(payload?.slots.length),
      error: error || payload?.message,
    });
  }, [error, loading, onAvailabilityChange, payload]);

  const week = weeks.find((item) => item.key === activeWeek) || weeks.find((item) => item.slots.length > 0);
  const dates = week ? [...new Set(week.slots.map((slot) => slot.date))] : [];
  const daySlots = week?.slots.filter((slot) => slot.date === activeDate) || [];

  return (
    <section className={`booking-slot-picker${compact ? " is-compact" : ""}`} aria-labelledby="booking-slot-title">
      <div className="booking-slot-heading">
        <div>
          <span className="booking-slot-kicker">Онлайн-запис · актуальні дані Cliniccards</span>
          <h3 id="booking-slot-title">На коли вам було б зручно записатись?</h3>
          <p>Показуємо тільки актуальні майбутні вільні години. Минулі дні та вже зайняті слоти не відображаються.</p>
        </div>
        {!loading && payload?.enabled ? <button type="button" className="booking-slot-refresh" onClick={() => void load()}>Оновити</button> : null}
      </div>

      {loading && !payload ? (
        <div className="booking-slot-loading" role="status"><span />Оновлюємо вільні години…</div>
      ) : null}

      {!loading && payload && !payload.enabled ? (
        <div className="booking-slot-fallback">Онлайн-календар зараз не підключений. Залиште контакт — адміністратор підбере час вручну.</div>
      ) : null}

      {payload?.enabled && weeks.length ? (
        <>
          <div className="booking-slot-step">
            <div className="booking-slot-step-label"><span>1</span><strong>Оберіть тиждень</strong></div>
            <div className="booking-week-tabs" role="tablist" aria-label="Тиждень запису">
              {weeks.map((item) => {
                const disabled = item.slots.length === 0;
                return (
                  <button
                    type="button"
                    key={item.key}
                    role="tab"
                    disabled={disabled}
                    aria-disabled={disabled}
                    aria-selected={!disabled && item.key === week?.key}
                    className={!disabled && item.key === week?.key ? "is-active" : ""}
                    onClick={() => {
                      if (disabled) return;
                      setActiveWeek(item.key);
                      setActiveDate(item.slots[0]?.date || "");
                      if (value?.weekKey !== item.key) onChange(null);
                    }}
                  >
                    <strong>{item.label}</strong>
                    <small>{disabled ? "Немає вільних" : `${item.slots.length} вільних слотів`}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {week ? (
            <div className="booking-slot-step">
              <div className="booking-slot-step-label"><span>2</span><strong>Оберіть день</strong></div>
              <div className="booking-day-tabs" role="tablist" aria-label="Дата запису">
                {dates.map((date) => (
                  <button
                    type="button"
                    key={date}
                    role="tab"
                    aria-selected={date === activeDate}
                    className={date === activeDate ? "is-active" : ""}
                    onClick={() => {
                      setActiveDate(date);
                      if (value?.date !== date) onChange(null);
                    }}
                  >
                    {dateLabel(date)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {week && activeDate ? (
            <div className="booking-slot-step">
              <div className="booking-slot-step-label"><span>3</span><strong>Оберіть вільний час</strong></div>
              <div className="booking-time-grid" aria-label="Вільний час">
                {daySlots.map((slot) => {
                  const selected = value?.slotId === slot.id || (
                    value?.date === slot.date && value?.time === slot.time && (!value.doctorId || value.doctorId === slot.doctorId)
                  );
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      className={selected ? "is-selected" : ""}
                      aria-pressed={selected}
                      onClick={() => week && onChange(selectionFrom(slot, week))}
                    >
                      <strong>{slot.time}</strong>
                      {slot.doctorName ? <small>{slot.doctorName}</small> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {value ? (
            <div className="booking-slot-selected" role="status">
              <span>Обрано</span>
              <strong>{value.weekLabel ? `${value.weekLabel} · ` : ""}{dateLabel(value.date)} · {value.time}</strong>
              {value.doctorName ? <small>{value.doctorName}</small> : null}
            </div>
          ) : <p className="booking-slot-required">Оберіть тиждень, день і одну з вільних годин, щоб продовжити.</p>}
        </>
      ) : null}

      {payload?.enabled && !loading && !weeks.length ? (
        <div className="booking-slot-fallback">{payload.message || "На найближчі тижні вільних годин не знайдено. Залиште контакт — адміністратор допоможе."}</div>
      ) : null}

      {error ? <div className="booking-slot-error" role="alert">{error} <button type="button" onClick={() => void load()}>Спробувати ще раз</button></div> : null}
    </section>
  );
}
"use client";

import { useEffect } from "react";
import type { BookingAvailabilityResponse, BookingSelection, BookingSlot } from "../lib/booking-types";

type FormState = {
  host: HTMLElement;
  hidden: HTMLInputElement;
  selection: BookingSelection | null;
  enabled: boolean;
  hasSlots: boolean;
  loading: boolean;
  generatedAt: string;
  slots: BookingSlot[];
  activeWeek: string;
  activeDate: string;
  requestVersion: number;
  cleanups: Array<() => void>;
};

type Week = { key: string; label: string; slots: BookingSlot[] };

const states = new WeakMap<HTMLFormElement, FormState>();
const UK_DATE = new Intl.DateTimeFormat("uk-UA", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
const UK_SHORT = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", timeZone: "UTC" });

function utcDate(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

function key(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monday(date: Date) {
  const next = new Date(date);
  const day = next.getUTCDay() || 7;
  next.setUTCDate(next.getUTCDate() - day + 1);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function kyivDate(value: string) {
  const source = new Date(value);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(Number.isNaN(source.getTime()) ? new Date() : source).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function groupWeeks(slots: BookingSlot[], generatedAt: string): Week[] {
  const current = monday(utcDate(kyivDate(generatedAt)));
  const map = new Map<string, BookingSlot[]>();
  slots.forEach((slot) => {
    const weekKey = key(monday(utcDate(slot.date)));
    map.set(weekKey, [...(map.get(weekKey) || []), slot]);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([weekKey, items]) => {
    const start = utcDate(weekKey);
    const diff = Math.round((start.getTime() - current.getTime()) / 604_800_000);
    const label = diff === 0 ? "Цей тиждень" : diff === 1 ? "Наступний тиждень" : `${UK_SHORT.format(start)} — ${UK_SHORT.format(addDays(start, 6))}`;
    return { key: weekKey, label, slots: items.sort((a, b) => a.start.localeCompare(b.start)) };
  });
}

function dateLabel(date: string) {
  return UK_DATE.format(utcDate(date)).replace(/^./, (letter) => letter.toUpperCase());
}

function clean(value: string | null | undefined) {
  return (value || "").trim();
}

function filters(form: HTMLFormElement) {
  let service = "";
  let doctor = "";
  const widget = form.closest<HTMLElement>(".ccb-widget");
  const label = clean(widget?.querySelector<HTMLElement>(".ccb-native-summary-label")?.textContent).toLowerCase();
  const summary = clean(widget?.querySelector<HTMLElement>(".ccb-native-summary-value")?.textContent);
  if (label.includes("спеціаліст") && !summary.toLowerCase().includes("допоможіть")) doctor = summary;
  if (label.includes("послуг")) service = summary;

  const serviceField = form.querySelector<HTMLInputElement | HTMLSelectElement>(
    'select[name*="service" i], input[name*="service" i], select[name*="послуг" i], input[name*="послуг" i]',
  );
  if (serviceField?.value?.trim()) service = serviceField.value.trim();
  return { service, doctor };
}

function button(text: string, className: string, click: () => void) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  element.addEventListener("click", click);
  return element;
}

function setSelection(state: FormState, selection: BookingSelection | null) {
  state.selection = selection;
  state.hidden.value = selection ? JSON.stringify(selection) : "";
}

function render(form: HTMLFormElement) {
  const state = states.get(form);
  if (!state) return;
  const host = state.host;
  host.innerHTML = "";
  host.className = "booking-slot-picker legacy-live-booking is-compact";

  const heading = document.createElement("div");
  heading.className = "booking-slot-heading";
  const copy = document.createElement("div");
  copy.innerHTML = '<span class="booking-slot-kicker">Онлайн-запис · актуально зараз</span><h3>На коли вам було б зручно записатись?</h3><p>Вільні години синхронізуються з Cliniccards. Минулі години автоматично не показуються.</p>';
  heading.appendChild(copy);
  host.appendChild(heading);

  if (state.loading) {
    const loading = document.createElement("div");
    loading.className = "booking-slot-loading";
    loading.innerHTML = "<span></span>Оновлюємо вільні години…";
    host.appendChild(loading);
    return;
  }

  if (!state.enabled) {
    const fallback = document.createElement("div");
    fallback.className = "booking-slot-fallback";
    fallback.textContent = "Онлайн-календар тимчасово недоступний. Адміністратор підбере час вручну.";
    host.appendChild(fallback);
    return;
  }

  const weeks = groupWeeks(state.slots, state.generatedAt || new Date().toISOString());
  if (!weeks.length) {
    const fallback = document.createElement("div");
    fallback.className = "booking-slot-fallback";
    fallback.textContent = "На найближчі тижні вільних годин не знайдено. Залиште контакт — адміністратор допоможе.";
    host.appendChild(fallback);
    return;
  }

  const currentWeek = weeks.find((week) => week.key === state.activeWeek) || weeks[0];
  state.activeWeek = currentWeek.key;
  const dates = [...new Set(currentWeek.slots.map((slot) => slot.date))];
  if (!dates.includes(state.activeDate)) state.activeDate = state.selection?.date && dates.includes(state.selection.date) ? state.selection.date : dates[0];

  const weekTabs = document.createElement("div");
  weekTabs.className = "booking-week-tabs";
  weeks.forEach((week) => {
    const item = button("", week.key === currentWeek.key ? "is-active" : "", () => {
      state.activeWeek = week.key;
      state.activeDate = week.slots[0]?.date || "";
      if (state.selection?.weekKey !== week.key) setSelection(state, null);
      render(form);
    });
    item.innerHTML = `<strong>${week.label}</strong><small>${week.slots.length} вільних</small>`;
    weekTabs.appendChild(item);
  });
  host.appendChild(weekTabs);

  const dayTabs = document.createElement("div");
  dayTabs.className = "booking-day-tabs";
  dates.forEach((date) => {
    dayTabs.appendChild(button(dateLabel(date), date === state.activeDate ? "is-active" : "", () => {
      state.activeDate = date;
      if (state.selection?.date !== date) setSelection(state, null);
      render(form);
    }));
  });
  host.appendChild(dayTabs);

  const timeGrid = document.createElement("div");
  timeGrid.className = "booking-time-grid";
  currentWeek.slots.filter((slot) => slot.date === state.activeDate).forEach((slot) => {
    const selected = state.selection?.slotId === slot.id;
    const item = button("", selected ? "is-selected" : "", () => {
      setSelection(state, {
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
        weekKey: currentWeek.key,
        weekLabel: currentWeek.label,
      });
      render(form);
    });
    item.innerHTML = `<strong>${slot.time}</strong>${slot.doctorName ? `<small>${slot.doctorName}</small>` : ""}`;
    timeGrid.appendChild(item);
  });
  host.appendChild(timeGrid);

  if (state.selection) {
    const selected = document.createElement("div");
    selected.className = "booking-slot-selected";
    selected.innerHTML = `<span>Обрано</span><strong>${dateLabel(state.selection.date)} · ${state.selection.time}</strong>${state.selection.doctorName ? `<small>${state.selection.doctorName}</small>` : ""}`;
    host.appendChild(selected);
  } else {
    const required = document.createElement("p");
    required.className = "booking-slot-required";
    required.textContent = "Оберіть одну з вільних годин, щоб продовжити.";
    host.appendChild(required);
  }
}

async function load(form: HTMLFormElement) {
  const state = states.get(form);
  if (!state) return;
  const requestVersion = ++state.requestVersion;
  state.loading = true;
  render(form);
  const query = new URLSearchParams();
  const current = filters(form);
  if (current.service) query.set("service", current.service);
  if (current.doctor) query.set("doctor", current.doctor);

  try {
    const response = await fetch(`/api/booking/slots${query.size ? `?${query.toString()}` : ""}`, { cache: "no-store" });
    const payload = await response.json() as BookingAvailabilityResponse;
    if (requestVersion !== state.requestVersion) return;
    state.enabled = payload.enabled;
    state.slots = payload.slots || [];
    state.hasSlots = Boolean(state.slots.length);
    state.generatedAt = payload.generatedAt;
    if (state.selection && !state.slots.some((slot) => slot.id === state.selection?.slotId)) setSelection(state, null);
  } catch (error) {
    console.error("Legacy Cliniccards availability failed", error);
    if (requestVersion !== state.requestVersion) return;
    state.enabled = false;
    state.slots = [];
    state.hasSlots = false;
  } finally {
    if (requestVersion === state.requestVersion) {
      state.loading = false;
      render(form);
    }
  }
}

function hidePreferredTime(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('input[name="preferredTime"]');
  const label = input?.closest<HTMLElement>("label");
  if (label) label.style.display = "none";
}

function enhance(form: HTMLFormElement) {
  if (states.has(form) || form.closest(".promo-site") || !form.querySelector('input[type="tel"], input[name*="phone" i], input[name*="tel" i]')) return;
  if (!form.closest(".legacy-page, .ccb-widget")) return;

  const host = document.createElement("div");
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = "booking_json";
  const submit = form.querySelector('button[type="submit"], input[type="submit"]');
  form.insertBefore(host, submit || null);
  form.appendChild(hidden);
  hidePreferredTime(form);

  const state: FormState = {
    host,
    hidden,
    selection: null,
    enabled: false,
    hasSlots: false,
    loading: true,
    generatedAt: new Date().toISOString(),
    slots: [],
    activeWeek: "",
    activeDate: "",
    requestVersion: 0,
    cleanups: [],
  };
  states.set(form, state);

  const onChange = (event: Event) => {
    if (!(event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement)) return;
    if (!/service|послуг/i.test(event.target.name)) return;
    setSelection(state, null);
    void load(form);
  };
  form.addEventListener("change", onChange);
  state.cleanups.push(() => form.removeEventListener("change", onChange));
  void load(form);
}

export default function LegacyLiveBookingBridge() {
  useEffect(() => {
    const scan = () => document.querySelectorAll<HTMLFormElement>(".legacy-page form, .ccb-widget form").forEach(enhance);
    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    const submitCapture = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      const state = form ? states.get(form) : null;
      if (!form || !state) return;
      if (state.loading || (state.enabled && state.hasSlots && !state.selection)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = form.querySelector<HTMLElement>("[data-ccb-status], .elementor-message");
        if (status) status.textContent = state.loading ? "Оновлюємо вільні години — зачекайте кілька секунд." : "Оберіть зручну дату та вільну годину.";
        state.host.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    document.addEventListener("submit", submitCapture, true);

    const refresh = window.setInterval(() => {
      document.querySelectorAll<HTMLFormElement>(".legacy-page form, .ccb-widget form").forEach((form) => {
        if (states.has(form)) void load(form);
      });
    }, 60_000);

    return () => {
      observer.disconnect();
      document.removeEventListener("submit", submitCapture, true);
      window.clearInterval(refresh);
    };
  }, []);

  return null;
}

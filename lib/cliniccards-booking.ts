import type { BookingSelection, BookingSlot } from "./booking-types";

const DEFAULT_API_BASE = "https://cliniccards.com/api";
const CLINIC_TIMEZONE = "Europe/Kyiv";
const DEFAULT_HORIZON_DAYS = 28;
const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_MIN_LEAD_MINUTES = 30;

type JsonRecord = Record<string, unknown>;

type AvailabilityOptions = {
  service?: string;
  doctor?: string;
  from?: string;
  to?: string;
};

type CliniccardsBookingResult = {
  status: "booked" | "slot_unavailable" | "failed" | "disabled" | "manual_required";
  visitId?: string;
  patientId?: string;
  error?: string;
  slot?: BookingSlot;
};

type IntervalRecord = {
  date: string;
  start: string;
  end: string;
  doctorId?: string;
  doctorName?: string;
  cabinetId?: string;
  cabinetName?: string;
  serviceId?: string;
  serviceName?: string;
  explicitlyAvailable: boolean;
};

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function apiBase() {
  return (process.env.CLINIC_BOOKING_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
}

function apiKey() {
  return (process.env.CLINIC_BOOKING_API_KEY || "").trim();
}

export function isCliniccardsBookingEnabled() {
  return Boolean(apiKey());
}

export function cliniccardsBookingTimezone() {
  return CLINIC_TIMEZONE;
}

export function cliniccardsBookingHorizonDays() {
  return envInt("CLINIC_BOOKING_HORIZON_DAYS", DEFAULT_HORIZON_DAYS, 7, 90);
}

function slotMinutes() {
  return envInt("CLINIC_BOOKING_SLOT_MINUTES", DEFAULT_SLOT_MINUTES, 10, 180);
}

function minLeadMinutes() {
  return envInt("CLINIC_BOOKING_MIN_LEAD_MINUTES", DEFAULT_MIN_LEAD_MINUTES, 0, 1440);
}

function responseError(payload: unknown, fallback: string) {
  const record = asRecord(payload);
  if (!record) return fallback;
  const nested = asRecord(record.error);
  return (
    clean(record.message) ||
    clean(record.error) ||
    clean(nested?.message) ||
    clean(nested?.description) ||
    fallback
  );
}

async function cliniccardsRequest(path: string, init?: RequestInit) {
  const token = apiKey();
  if (!token) throw new Error("Cliniccards API key is not configured");

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Token: token,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text.slice(0, 1000) };
    }
  }

  const record = asRecord(payload);
  const logicalFailure = clean(record?.result).toLowerCase() === "fail" || record?.success === false;
  if (!response.ok || logicalFailure) {
    throw new Error(responseError(payload, `Cliniccards API ${response.status}`));
  }

  return payload;
}

function dateParts(value: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function todayKyiv() {
  return dateParts(new Date()).date;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return value.toISOString().slice(0, 10);
}

function normalizeTime(value: unknown) {
  const raw = clean(value);
  if (!raw) return "";
  const match = raw.match(/(?:^|[T\s])(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  const short = raw.match(/^(\d{1,2}):(\d{2})/);
  return short ? `${short[1].padStart(2, "0")}:${short[2]}` : "";
}

function normalizeDate(value: unknown) {
  const raw = clean(value);
  if (!raw) return "";
  const direct = raw.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, "0")}-${direct[3].padStart(2, "0")}`;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return dateParts(parsed).date;
  return "";
}

function localDateTime(record: JsonRecord, start: boolean) {
  const dateKeys = ["date", "schedule_date", "visit_date", "day", "work_date"];
  const timeKeys = start
    ? ["time_start", "start_time", "visit_start", "start", "datetime", "date_start", "from"]
    : ["time_end", "end_time", "visit_end", "end", "date_end", "to"];

  let date = "";
  for (const key of dateKeys) {
    date = normalizeDate(record[key]);
    if (date) break;
  }

  let time = "";
  for (const key of timeKeys) {
    const raw = record[key];
    time = normalizeTime(raw);
    if (!date) date = normalizeDate(raw);
    if (time) break;
  }

  return date && time ? { date, time } : null;
}

function firstString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = clean(record[key]);
    if (value) return value;
  }
  return undefined;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function isExplicitlyUnavailable(record: JsonRecord, path: string) {
  if (record.available === false || record.is_available === false || record.free === false || record.is_free === false) return true;
  const state = [record.status, record.state, record.type, record.kind, record.event_type]
    .map(lower)
    .filter(Boolean)
    .join(" ");
  const context = `${path} ${state}`;
  return /(break|pause|busy|blocked|unavailable|vacation|holiday|day.?off|not.?working|cancelled|canceled|moved|deleted)/i.test(context);
}

function isExplicitlyAvailable(record: JsonRecord, path: string) {
  if (record.available === true || record.is_available === true || record.free === true || record.is_free === true) return true;
  const state = [record.status, record.state, record.type, record.kind, record.event_type]
    .map(lower)
    .filter(Boolean)
    .join(" ");
  return /(free|available|slot)/i.test(`${path} ${state}`) && !isExplicitlyUnavailable(record, path);
}

function recordDoctorId(record: JsonRecord) {
  return firstString(record, ["doctor_id", "staff_id", "specialist_id", "employee_id", "user_id"]);
}

function recordCabinetId(record: JsonRecord) {
  return firstString(record, ["cabinet_id", "room_id", "office_id"]);
}

function recordServiceId(record: JsonRecord) {
  return firstString(record, ["service_id", "price_id", "manipulation_id", "procedure_id"]);
}

function recordDoctorName(record: JsonRecord) {
  return firstString(record, ["doctor_name", "staff_name", "specialist_name", "employee_name", "full_name", "name"]);
}

function recordCabinetName(record: JsonRecord) {
  return firstString(record, ["cabinet_name", "room_name", "office_name"]);
}

function recordServiceName(record: JsonRecord) {
  return firstString(record, ["service_name", "price_name", "manipulation_name", "procedure_name"]);
}

function walkRecords(value: unknown, visitor: (record: JsonRecord, path: string) => void, path = "root") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkRecords(item, visitor, `${path}[${index}]`));
    return;
  }
  const record = asRecord(value);
  if (!record) return;
  visitor(record, path);
  Object.entries(record).forEach(([key, item]) => {
    if (item && typeof item === "object") walkRecords(item, visitor, `${path}.${key}`);
  });
}

function staffNames(payload: unknown) {
  const names = new Map<string, string>();
  walkRecords(payload, (record, path) => {
    if (!/(staff|doctor|specialist|employee)/i.test(path)) return;
    const id = firstString(record, ["staff_id", "doctor_id", "specialist_id", "employee_id", "id"]);
    if (!id) return;
    const first = firstString(record, ["firstname", "first_name", "name"]);
    const last = firstString(record, ["lastname", "last_name", "surname"]);
    const full = firstString(record, ["full_name", "doctor_name", "staff_name"]) || [last, first].filter(Boolean).join(" ");
    if (full) names.set(id, full);
  });
  return names;
}

function scheduleIntervals(payload: unknown, doctorNames: Map<string, string>) {
  const intervals: IntervalRecord[] = [];
  walkRecords(payload, (record, path) => {
    const start = localDateTime(record, true);
    const end = localDateTime(record, false);
    if (!start || !end || start.date !== end.date || isExplicitlyUnavailable(record, path)) return;

    const doctorId = recordDoctorId(record);
    const pathSuggestsSchedule = /(schedule|shift|working|worktime|calendar|slot|available|free)/i.test(path);
    const looksLikeVisit = /(visit|appointment|patient|reservation)/i.test(path) || Boolean(firstString(record, ["visit_id", "patient_id"]));
    if (!pathSuggestsSchedule && looksLikeVisit && !isExplicitlyAvailable(record, path)) return;

    intervals.push({
      date: start.date,
      start: start.time,
      end: end.time,
      doctorId,
      doctorName: recordDoctorName(record) || (doctorId ? doctorNames.get(doctorId) : undefined),
      cabinetId: recordCabinetId(record),
      cabinetName: recordCabinetName(record),
      serviceId: recordServiceId(record),
      serviceName: recordServiceName(record),
      explicitlyAvailable: isExplicitlyAvailable(record, path),
    });
  });
  return intervals;
}

function busyIntervals(payload: unknown) {
  const intervals: IntervalRecord[] = [];
  walkRecords(payload, (record, path) => {
    const start = localDateTime(record, true);
    const end = localDateTime(record, false);
    if (!start || !end || start.date !== end.date) return;
    const state = [record.status, record.state].map(lower).join(" ");
    if (/(cancelled|canceled|moved|deleted|declined)/i.test(state)) return;
    if (!/(visit|appointment|patient|reservation)/i.test(path) && !firstString(record, ["visit_id", "patient_id"])) return;
    intervals.push({
      date: start.date,
      start: start.time,
      end: end.time,
      doctorId: recordDoctorId(record),
      cabinetId: recordCabinetId(record),
      explicitlyAvailable: false,
    });
  });
  return intervals;
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function overlaps(start: string, end: string, busyStart: string, busyEnd: string) {
  return minutes(start) < minutes(busyEnd) && minutes(end) > minutes(busyStart);
}

function sameResource(slot: IntervalRecord, busy: IntervalRecord) {
  if (slot.doctorId && busy.doctorId) return slot.doctorId === busy.doctorId;
  if (slot.cabinetId && busy.cabinetId) return slot.cabinetId === busy.cabinetId;
  return true;
}

function durationFromSettings(payload: unknown, service?: string) {
  const wanted = lower(service);
  let exact: number | undefined;
  let general: number | undefined;
  walkRecords(payload, (record) => {
    const durationValue = ["duration", "duration_minutes", "minutes", "visit_duration", "interval"]
      .map((key) => Number(record[key]))
      .find((value) => Number.isFinite(value) && value >= 10 && value <= 240);
    if (!durationValue) return;
    const name = lower(firstString(record, ["service_name", "price_name", "name", "title"]));
    if (wanted && name && (name.includes(wanted) || wanted.includes(name))) exact = durationValue;
    else if (!general) general = durationValue;
  });
  return exact || general || slotMinutes();
}

function matchesFilter(value: string | undefined, filter: string | undefined) {
  if (!filter) return true;
  if (!value) return true;
  const left = lower(value);
  const right = lower(filter);
  return left.includes(right) || right.includes(left);
}

function buildSlots(
  schedulePayload: unknown,
  visitsPayload: unknown,
  staffPayload: unknown,
  settingsPayload: unknown,
  options: AvailabilityOptions,
) {
  const names = staffNames(staffPayload);
  const schedule = scheduleIntervals(schedulePayload, names);
  const busy = busyIntervals(visitsPayload);
  const duration = durationFromSettings(settingsPayload, options.service);
  const threshold = dateParts(new Date(Date.now() + minLeadMinutes() * 60_000));
  const thresholdKey = `${threshold.date}T${threshold.time}`;
  const unique = new Map<string, BookingSlot>();

  for (const interval of schedule) {
    if (options.from && interval.date < options.from) continue;
    if (options.to && interval.date > options.to) continue;
    if (!matchesFilter(interval.doctorName, options.doctor)) continue;
    if (!matchesFilter(interval.serviceName, options.service)) continue;

    const startMinutes = minutes(interval.start);
    const endMinutes = minutes(interval.end);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) continue;

    const step = interval.explicitlyAvailable && endMinutes - startMinutes <= duration ? endMinutes - startMinutes : duration;
    if (step < 10) continue;

    for (let cursor = startMinutes; cursor + duration <= endMinutes; cursor += step) {
      const start = timeFromMinutes(cursor);
      const end = timeFromMinutes(cursor + duration);
      const slotKey = `${interval.date}T${start}`;
      if (slotKey <= thresholdKey) continue;

      const occupied = busy.some(
        (item) => item.date === interval.date && sameResource(interval, item) && overlaps(start, end, item.start, item.end),
      );
      if (occupied) continue;

      const id = [interval.doctorId || "any", interval.cabinetId || "any", interval.date, start, end].join("|");
      unique.set(id, {
        id,
        date: interval.date,
        time: start,
        start: `${interval.date}T${start}:00`,
        end: `${interval.date}T${end}:00`,
        doctorId: interval.doctorId,
        doctorName: interval.doctorName,
        cabinetId: interval.cabinetId,
        cabinetName: interval.cabinetName,
        serviceId: interval.serviceId,
        serviceName: interval.serviceName,
      });
    }
  }

  return [...unique.values()].sort((a, b) => a.start.localeCompare(b.start));
}

async function optionalRequest(path: string) {
  try {
    return await cliniccardsRequest(path);
  } catch {
    return null;
  }
}

export async function getCliniccardsAvailability(options: AvailabilityOptions = {}) {
  if (!isCliniccardsBookingEnabled()) return [] as BookingSlot[];

  const from = options.from || todayKyiv();
  const to = options.to || addDays(from, cliniccardsBookingHorizonDays() - 1);
  const query = new URLSearchParams({ from, to });

  const [schedule, visits, staff, settings] = await Promise.all([
    cliniccardsRequest(`/schedule?${query.toString()}`),
    optionalRequest(`/visits?${query.toString()}`),
    optionalRequest("/staff"),
    optionalRequest("/booking-settings"),
  ]);

  return buildSlots(schedule, visits, staff, settings, { ...options, from, to });
}

function sameSelectedSlot(slot: BookingSlot, selection: BookingSelection) {
  if (selection.slotId && slot.id === selection.slotId) return true;
  if (slot.date !== selection.date || slot.time !== selection.time) return false;
  if (selection.doctorId && slot.doctorId && selection.doctorId !== slot.doctorId) return false;
  if (selection.cabinetId && slot.cabinetId && selection.cabinetId !== slot.cabinetId) return false;
  return true;
}

function normalizePhone(value: string) {
  const plus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return `${plus ? "+" : ""}${digits}`;
}

function phoneKey(value: unknown) {
  return clean(value).replace(/\D/g, "").slice(-9);
}

function patientId(record: JsonRecord) {
  return firstString(record, ["patient_id", "id"]);
}

async function findPatientByPhone(phone: string) {
  const target = phoneKey(phone);
  if (!target) return undefined;
  const payload = await cliniccardsRequest("/patients");
  let found: string | undefined;
  walkRecords(payload, (record, path) => {
    if (found || !/(patient|data|root)/i.test(path)) return;
    const candidate = firstString(record, ["phone", "phone2", "mobile", "telephone"]);
    if (!candidate || phoneKey(candidate) !== target) return;
    found = patientId(record);
  });
  return found;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstname: "Пацієнт", lastname: "-" };
  if (parts.length === 1) return { firstname: parts[0], lastname: "-" };
  return { firstname: parts.slice(0, -1).join(" "), lastname: parts.at(-1) || "-" };
}

function extractId(payload: unknown, keys: string[]) {
  let result: string | undefined;
  walkRecords(payload, (record) => {
    if (result) return;
    result = firstString(record, keys);
  });
  return result;
}

async function writeWithMethodFallback(path: string, body: JsonRecord) {
  let firstError: unknown;
  for (const method of ["POST", "PUT"] as const) {
    try {
      return await cliniccardsRequest(path, { method, body: JSON.stringify(body) });
    } catch (error) {
      firstError ||= error;
      const message = error instanceof Error ? error.message : String(error);
      if (method === "POST" && /(405|method|not allowed)/i.test(message)) continue;
      throw error;
    }
  }
  throw firstError instanceof Error ? firstError : new Error("Cliniccards write failed");
}

async function createPatient(name: string, phone: string) {
  const { firstname, lastname } = splitName(name);
  const payload = await writeWithMethodFallback("/patients", {
    firstname,
    lastname,
    phone: normalizePhone(phone),
  });
  const id = extractId(payload, ["patient_id", "id"]);
  if (!id) throw new Error("Cliniccards created a patient but did not return patient_id");
  return id;
}

async function createVisit(args: {
  patientId: string;
  slot: BookingSlot;
  service?: string;
  leadId?: string;
}) {
  const { patientId: currentPatientId, slot, service, leadId } = args;
  if (!slot.doctorId || !slot.cabinetId) {
    throw new Error("Cliniccards slot has no doctor_id or cabinet_id; automatic visit creation is unsafe");
  }

  const payload = await writeWithMethodFallback("/visits", {
    patient_id: currentPatientId,
    doctor_id: slot.doctorId,
    cabinet_id: slot.cabinetId,
    date: slot.date,
    time_start: slot.time,
    time_end: slot.end.slice(11, 16),
    status: "PLANNED",
    note: [
      "Онлайн-запис із resetclinic.org",
      service ? `Послуга/запит: ${service}` : "",
      leadId ? `Lead ID: ${leadId}` : "",
    ].filter(Boolean).join(" · "),
  });

  return extractId(payload, ["visit_id", "id"]);
}

export async function bookCliniccardsSelection(args: {
  selection: BookingSelection;
  name: string;
  phone: string;
  service?: string;
  doctor?: string;
  leadId?: string;
}): Promise<CliniccardsBookingResult> {
  if (!isCliniccardsBookingEnabled()) return { status: "disabled" };

  try {
    const slots = await getCliniccardsAvailability({
      from: args.selection.date,
      to: args.selection.date,
      service: args.service,
      doctor: args.doctor || args.selection.doctorName,
    });
    const slot = slots.find((item) => sameSelectedSlot(item, args.selection));
    if (!slot) return { status: "slot_unavailable", error: "Обраний час уже недоступний" };
    if (!slot.doctorId || !slot.cabinetId) {
      return {
        status: "manual_required",
        slot,
        error: "Cliniccards schedule did not provide doctor_id/cabinet_id for safe automatic booking",
      };
    }

    let currentPatientId = await findPatientByPhone(args.phone);
    if (!currentPatientId) currentPatientId = await createPatient(args.name, args.phone);
    const visitId = await createVisit({ patientId: currentPatientId, slot, service: args.service, leadId: args.leadId });

    return { status: "booked", visitId, patientId: currentPatientId, slot };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message.slice(0, 800) : String(error).slice(0, 800),
    };
  }
}

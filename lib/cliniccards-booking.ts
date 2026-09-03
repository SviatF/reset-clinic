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

type CliniccardsMember = {
  id?: string | number;
  name?: string;
  state?: boolean;
};

type CliniccardsPriceItem = {
  id?: string | number;
  name?: string;
  alias?: string;
  items?: Record<string, number | string>;
};

type CliniccardsDateValue = {
  date?: string;
  timezone?: string;
  timezone_type?: number;
};

type CliniccardsInterval = {
  start?: CliniccardsDateValue | string;
  end?: CliniccardsDateValue | string;
  duration?: number | string;
};

type CliniccardsShift = {
  schedule_cabinets_id?: string | number;
  clinics_members_id?: string | number;
  shift_start?: string;
  shift_end?: string;
  intervals?: CliniccardsInterval[] | Record<string, CliniccardsInterval>;
  isCurrentDoctorsShift?: boolean;
};

type CliniccardsFilterData = {
  members?: CliniccardsMember[];
  priceItems?: CliniccardsPriceItem[];
  scheduleShifts?: Record<string, Record<string, CliniccardsShift[]>>;
  doctorsShiftsIntervalRemainingTime?: Record<string, unknown>;
  doctorsServicesExecutionTime?: Record<string, unknown>;
  doctorMinServiceTime?: Record<string, number | string>;
};

class CliniccardsHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CliniccardsHttpError";
    this.status = status;
  }
}

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

function fallbackSlotMinutes() {
  return envInt("CLINIC_BOOKING_SLOT_MINUTES", DEFAULT_SLOT_MINUTES, 10, 180);
}

function minLeadMinutes() {
  return envInt("CLINIC_BOOKING_MIN_LEAD_MINUTES", DEFAULT_MIN_LEAD_MINUTES, 0, 1440);
}

function responseError(payload: unknown, fallback: string) {
  const record = asRecord(payload);
  if (!record) return fallback;
  const nested = asRecord(record.error);
  const scalarError = typeof record.error === "string" || typeof record.error === "number" ? clean(record.error) : "";
  return clean(record.message) || clean(nested?.message) || clean(nested?.description) || scalarError || fallback;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 1000) };
  }
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

  const payload = await parseResponse(response);
  const record = asRecord(payload);
  const logicalFailure = clean(record?.result).toLowerCase() === "fail" || record?.success === false;
  if (!response.ok || logicalFailure) {
    throw new CliniccardsHttpError(responseError(payload, `Cliniccards API ${response.status}`), response.status);
  }
  return payload;
}

async function publicBookingRequest(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new CliniccardsHttpError(responseError(payload, `Cliniccards booking ${response.status}`), response.status);
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

function normalizeDate(value: unknown) {
  const raw = clean(value);
  const match = raw.match(/(20\d{2})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function normalizeTime(value: unknown) {
  const raw = clean(value);
  const match = raw.match(/(?:^|[T\s])(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  const short = raw.match(/^(\d{1,2}):(\d{2})/);
  return short ? `${short[1].padStart(2, "0")}:${short[2]}` : "";
}

function cliniccardsDateValue(value: CliniccardsDateValue | string | undefined) {
  if (typeof value === "string") return value;
  return value?.date || "";
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN;
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function lower(value: unknown) {
  return clean(value).toLocaleLowerCase("uk-UA");
}

function normalizedWords(value: unknown) {
  return lower(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((item) => item.length >= 3);
}

function fuzzyMatch(leftValue: unknown, rightValue: unknown) {
  const left = lower(leftValue);
  const right = lower(rightValue);
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;
  const leftWords = new Set(normalizedWords(left));
  const rightWords = normalizedWords(right);
  if (!leftWords.size || !rightWords.length) return false;
  const overlap = rightWords.filter((word) => leftWords.has(word)).length;
  return overlap >= Math.min(2, rightWords.length);
}

function firstString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = clean(record[key]);
    if (value) return value;
  }
  return undefined;
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

function bookingSettings(payload: unknown) {
  const root = asRecord(payload);
  return asRecord(root?.data) || root;
}

function bookingLinkFromSettings(payload: unknown) {
  return clean(bookingSettings(payload)?.booking_link);
}

function bookingIntervalFromSettings(payload: unknown) {
  const value = Number(bookingSettings(payload)?.booking_interval);
  return Number.isFinite(value) && value >= 5 && value <= 180 ? Math.round(value) : fallbackSlotMinutes();
}

function bookingIsActive(payload: unknown) {
  const status = lower(bookingSettings(payload)?.booking_status);
  return !status || status === "active" || status === "enabled" || status === "on" || status === "1";
}

function bookingTokenFromLink(link: string) {
  try {
    const url = new URL(link);
    return url.pathname.split("/").filter(Boolean).at(-1) || "";
  } catch {
    return "";
  }
}

async function getFilterData(settingsPayload: unknown): Promise<CliniccardsFilterData> {
  const link = bookingLinkFromSettings(settingsPayload);
  const token = bookingTokenFromLink(link);
  if (!link || !token) throw new Error("Cliniccards booking_link is missing or invalid");

  const origin = new URL(link).origin;
  const payload = await publicBookingRequest(`${origin}/booking/filter-data/${encodeURIComponent(token)}?sid=0`, {
    doctor: {},
    service: {},
    time: null,
  });
  const record = asRecord(payload);
  if (!record) throw new Error("Cliniccards booking filter-data returned invalid JSON");
  return record as CliniccardsFilterData;
}

function memberMap(data: CliniccardsFilterData) {
  const map = new Map<string, CliniccardsMember>();
  for (const member of Array.isArray(data.members) ? data.members : []) {
    const id = clean(member.id);
    if (id) map.set(id, member);
  }
  return map;
}

function matchingService(data: CliniccardsFilterData, service?: string) {
  if (!service) return undefined;
  const services = Array.isArray(data.priceItems) ? data.priceItems : [];
  return services.find((item) => fuzzyMatch(item.name, service) || fuzzyMatch(item.alias, service));
}

function serviceDuration(item: CliniccardsPriceItem | undefined, doctorId: string, fallback: number) {
  if (!item?.items) return fallback;
  const value = Number(item.items[doctorId]);
  return Number.isFinite(value) && value > 0 && value <= 360 ? Math.round(value) : fallback;
}

function serviceAvailableForDoctor(item: CliniccardsPriceItem | undefined, doctorId: string) {
  if (!item) return true;
  const value = Number(item.items?.[doctorId]);
  return Number.isFinite(value) && value > 0;
}

function intervalList(shift: CliniccardsShift) {
  if (Array.isArray(shift.intervals)) return shift.intervals;
  if (shift.intervals && typeof shift.intervals === "object") return Object.values(shift.intervals);
  return [];
}

function dateInRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

function doctorMatches(member: CliniccardsMember | undefined, doctorId: string, doctor?: string) {
  if (!doctor) return true;
  return fuzzyMatch(member?.name, doctor) || clean(doctor) === doctorId;
}

function buildSlotsFromFilterData(
  data: CliniccardsFilterData,
  settingsPayload: unknown,
  options: AvailabilityOptions,
) {
  const from = options.from || todayKyiv();
  const to = options.to || addDays(from, cliniccardsBookingHorizonDays() - 1);
  const step = bookingIntervalFromSettings(settingsPayload);
  const matchedService = matchingService(data, options.service);
  const members = memberMap(data);
  const threshold = dateParts(new Date(Date.now() + minLeadMinutes() * 60_000));
  const thresholdKey = `${threshold.date}T${threshold.time}`;
  const slots = new Map<string, BookingSlot>();
  const scheduleShifts = data.scheduleShifts || {};

  for (const days of Object.values(scheduleShifts)) {
    if (!days || typeof days !== "object") continue;

    for (const [dayKey, shifts] of Object.entries(days)) {
      if (!Array.isArray(shifts)) continue;

      for (const shift of shifts) {
        if (!shift || typeof shift !== "object") continue;
        if (shift.isCurrentDoctorsShift === false) continue;

        const doctorId = clean(shift.clinics_members_id);
        const cabinetId = clean(shift.schedule_cabinets_id);
        if (!doctorId || !cabinetId) continue;

        const member = members.get(doctorId);
        if (member?.state === false) continue;
        if (!doctorMatches(member, doctorId, options.doctor)) continue;
        if (!serviceAvailableForDoctor(matchedService, doctorId)) continue;

        const serviceId = matchedService ? clean(matchedService.id) || undefined : undefined;
        const serviceName = matchedService ? clean(matchedService.alias) || clean(matchedService.name) || undefined : undefined;
        const duration = serviceDuration(matchedService, doctorId, step);

        for (const interval of intervalList(shift)) {
          const rawStart = cliniccardsDateValue(interval?.start);
          const rawEnd = cliniccardsDateValue(interval?.end);
          const date = normalizeDate(rawStart) || normalizeDate(shift.shift_start) || normalizeDate(`${dayKey}`);
          const endDate = normalizeDate(rawEnd) || normalizeDate(shift.shift_end) || date;
          const startTime = normalizeTime(rawStart);
          const endTime = normalizeTime(rawEnd);
          if (!date || date !== endDate || !startTime || !endTime || !dateInRange(date, from, to)) continue;

          const startMinute = minutes(startTime);
          const endMinute = minutes(endTime);
          if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute) || endMinute <= startMinute) continue;

          const firstMinute = Math.ceil(startMinute / step) * step;
          for (let cursor = firstMinute; cursor + duration <= endMinute; cursor += step) {
            const time = timeFromMinutes(cursor);
            const end = timeFromMinutes(cursor + duration);
            if (`${date}T${time}` < thresholdKey) continue;

            const id = ["cliniccards", date, time, doctorId, cabinetId, serviceId || "consult"].join(":");
            slots.set(id, {
              id,
              date,
              time,
              start: `${date}T${time}:00`,
              end: `${date}T${end}:00`,
              doctorId,
              doctorName: clean(member?.name) || undefined,
              cabinetId,
              serviceId,
              serviceName,
            });
          }
        }
      }
    }
  }

  return [...slots.values()].sort((a, b) => {
    const byStart = a.start.localeCompare(b.start);
    if (byStart) return byStart;
    return (a.doctorName || a.doctorId || "").localeCompare(b.doctorName || b.doctorId || "", "uk");
  });
}

export async function getCliniccardsAvailability(options: AvailabilityOptions = {}) {
  if (!isCliniccardsBookingEnabled()) return [] as BookingSlot[];

  const settings = await cliniccardsRequest("/booking-settings");
  if (!bookingIsActive(settings)) return [] as BookingSlot[];
  const data = await getFilterData(settings);
  return buildSlotsFromFilterData(data, settings, options);
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
  try {
    return await cliniccardsRequest(path, { method: "POST", body: JSON.stringify(body) });
  } catch (error) {
    if (!(error instanceof CliniccardsHttpError) || error.status !== 405) throw error;
    return cliniccardsRequest(path, { method: "PUT", body: JSON.stringify(body) });
  }
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
        error: "Cliniccards availability did not provide doctor_id/cabinet_id for safe automatic booking",
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

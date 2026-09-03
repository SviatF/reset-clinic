import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { saveLead, updateLead, type Lead } from "../../../lib/admin-data";
import type { BookingSelection } from "../../../lib/booking-types";
import { bookCliniccardsSelection } from "../../../lib/cliniccards-booking";
import { crmErrorMessage, dispatchLeadToCrm, isCrmEnabled } from "../../../lib/crm-dispatch";
import {
  dispatchLeadToTelegram,
  isTelegramLeadNotificationsEnabled,
  telegramErrorMessage,
} from "../../../lib/telegram-leads";

type LeadPayload = {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  service?: string;
  booking?: BookingSelection | null;
  formId?: string;
  pageUrl?: string;
  pagePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  startedAt?: number;
  website?: string;
  fields?: Record<string, unknown>;
};

function text(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function bookingSelection(value: unknown): BookingSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const date = text(record.date, 20);
  const time = text(record.time, 10);
  const start = text(record.start, 40);
  const slotId = text(record.slotId, 300);
  if (!date || !time || !start || !slotId || !/^20\d{2}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return {
    slotId,
    date,
    time,
    start,
    end: text(record.end, 40) || undefined,
    doctorId: text(record.doctorId, 120) || undefined,
    doctorName: text(record.doctorName, 250) || undefined,
    cabinetId: text(record.cabinetId, 120) || undefined,
    cabinetName: text(record.cabinetName, 250) || undefined,
    serviceId: text(record.serviceId, 120) || undefined,
    serviceName: text(record.serviceName, 300) || undefined,
    weekKey: text(record.weekKey, 30) || undefined,
    weekLabel: text(record.weekLabel, 100) || undefined,
  };
}

function legacyBookingSelection(fields?: Record<string, unknown>) {
  const raw = fields?.booking_json;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return bookingSelection(JSON.parse(raw));
  } catch {
    return null;
  }
}

function ipHash(request: NextRequest) {
  const salt = process.env.LEAD_IP_SALT;
  if (!salt) return null;
  const raw = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!raw) return null;
  return createHash("sha256").update(`${salt}:${raw}`).digest("hex");
}

export async function POST(request: NextRequest) {
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (payload.website) return NextResponse.json({ ok: true });
  if (payload.startedAt && Date.now() - payload.startedAt < 700) {
    return NextResponse.json({ ok: false, error: "too_fast" }, { status: 429 });
  }

  const phone = text(payload.phone, 80);
  const email = text(payload.email, 200);
  const name = text(payload.name, 200);
  const service = text(payload.service, 300);
  const booking = bookingSelection(payload.booking) || legacyBookingSelection(payload.fields);
  if (!phone && !email) {
    return NextResponse.json({ ok: false, error: "contact_required" }, { status: 400 });
  }

  const [crmEnabled, telegramEnabled] = await Promise.all([
    isCrmEnabled(),
    Promise.resolve(isTelegramLeadNotificationsEnabled()),
  ]);
  const now = new Date().toISOString();
  let lead: Lead = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    status: "new",
    name,
    phone,
    email,
    message: text(payload.message, 2000),
    service,
    form_id: text(payload.formId, 200),
    page_url: text(payload.pageUrl, 1500),
    page_path: text(payload.pagePath, 500),
    referrer: text(payload.referrer, 1500),
    utm_source: text(payload.utmSource, 250),
    utm_medium: text(payload.utmMedium, 250),
    utm_campaign: text(payload.utmCampaign, 250),
    utm_content: text(payload.utmContent, 250),
    utm_term: text(payload.utmTerm, 250),
    gclid: text(payload.gclid, 500),
    fbclid: text(payload.fbclid, 500),
    ttclid: text(payload.ttclid, 500),
    ip_hash: ipHash(request),
    user_agent: text(request.headers.get("user-agent"), 1000),
    payload: {
      ...(payload.fields ?? {}),
      booking_selection: booking,
      booking_status: booking ? "pending" : "not_requested",
      booking_error: null,
      cliniccards_visit_id: null,
      cliniccards_patient_id: null,
      telegram_status: telegramEnabled ? "pending" : "disabled",
      telegram_error: null,
      telegram_message_id: null,
      telegram_sent_at: null,
    },
    crm_status: crmEnabled ? "pending" : "disabled",
    crm_error: null,
    crm_external_id: null,
  };

  try {
    await saveLead(lead);
  } catch (error) {
    console.error(
      "lead_save_failed",
      error instanceof Error ? error.message : "Unknown lead storage error",
    );
    return NextResponse.json({ ok: false, error: "lead_save_failed" }, { status: 502 });
  }

  let bookingResult: Awaited<ReturnType<typeof bookCliniccardsSelection>> | null = null;
  if (booking) {
    if (!phone || !name) {
      bookingResult = { status: "manual_required", error: "Для автоматичного бронювання потрібні ім’я та телефон" };
    } else {
      bookingResult = await bookCliniccardsSelection({
        selection: booking,
        name,
        phone,
        service: service || undefined,
        doctor: booking.doctorName,
        leadId: lead.id,
      });
    }

    const bookingPayload = {
      ...lead.payload,
      booking_selection: bookingResult.slot ? {
        ...booking,
        slotId: bookingResult.slot.id,
        date: bookingResult.slot.date,
        time: bookingResult.slot.time,
        start: bookingResult.slot.start,
        end: bookingResult.slot.end,
        doctorId: bookingResult.slot.doctorId,
        doctorName: bookingResult.slot.doctorName,
        cabinetId: bookingResult.slot.cabinetId,
        cabinetName: bookingResult.slot.cabinetName,
      } : booking,
      booking_status: bookingResult.status,
      booking_error: bookingResult.error || null,
      cliniccards_visit_id: bookingResult.visitId || null,
      cliniccards_patient_id: bookingResult.patientId || null,
      booking_processed_at: new Date().toISOString(),
    };
    lead = {
      ...lead,
      updated_at: new Date().toISOString(),
      status: bookingResult.status === "booked" ? "booked" : lead.status,
      payload: bookingPayload,
    };
    await updateLead(lead.id, {
      status: lead.status,
      payload: bookingPayload,
    });
  }

  // Notifications happen after persistence and after the Cliniccards booking attempt,
  // so Telegram and downstream CRM receive the final appointment state. An outage in
  // either integration must never lose or reject the already stored lead.
  if (telegramEnabled) {
    try {
      const result = await dispatchLeadToTelegram(lead);
      const nextPayload = {
        ...lead.payload,
        telegram_status: result.status,
        telegram_error: null,
        telegram_message_id: result.messageId,
        telegram_sent_at: new Date().toISOString(),
      };
      await updateLead(lead.id, { payload: nextPayload });
      lead = { ...lead, payload: nextPayload };
    } catch (error) {
      const message = telegramErrorMessage(error);
      console.error("lead_telegram_failed", lead.id, message);
      const nextPayload = {
        ...lead.payload,
        telegram_status: "failed",
        telegram_error: message,
        telegram_message_id: null,
        telegram_sent_at: null,
      };
      await updateLead(lead.id, { payload: nextPayload });
      lead = { ...lead, payload: nextPayload };
    }
  }

  if (crmEnabled) {
    try {
      const result = await dispatchLeadToCrm(lead);
      await updateLead(lead.id, {
        crm_status: result.status,
        crm_error: null,
        crm_external_id: result.externalId,
      });
    } catch (error) {
      await updateLead(lead.id, {
        crm_status: "failed",
        crm_error: crmErrorMessage(error),
      });
    }
  }

  const publicBooking = bookingResult ? {
    status: bookingResult.status,
    visitId: bookingResult.visitId,
    error: bookingResult.status === "booked" ? undefined : bookingResult.error,
  } : undefined;

  if (bookingResult?.status === "slot_unavailable") {
    return NextResponse.json({
      ok: true,
      id: lead.id,
      booking: publicBooking,
      error: "slot_unavailable",
    }, { status: 409 });
  }

  return NextResponse.json({ ok: true, id: lead.id, booking: publicBooking }, { status: 201 });
}

import { randomUUID } from "node:crypto";
import { getLead, saveLead, updateLead } from "../lib/admin-data.ts";
import { bookCliniccardsSelection, getCliniccardsAvailability } from "../lib/cliniccards-booking.ts";
import { dispatchLeadToTelegram, isTelegramLeadNotificationsEnabled } from "../lib/telegram-leads.ts";

const slots = await getCliniccardsAvailability();
if (!slots.length) throw new Error("No Cliniccards slots available for E2E test");

const slot = slots.at(-1);
const now = new Date().toISOString();
const leadId = randomUUID();
const booking = {
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
  weekKey: "e2e-test",
  weekLabel: "E2E TEST",
};

let lead = {
  id: leadId,
  created_at: now,
  updated_at: now,
  status: "new",
  name: "TEST CLINICCARDS RESET",
  phone: "+380000000000",
  email: null,
  message: "Автоматичний інтеграційний тест Cliniccards — можна видалити після перевірки.",
  service: null,
  form_id: "cliniccards-e2e-test",
  page_url: "https://resetclinic.org/cliniccards-e2e-test",
  page_path: "/cliniccards-e2e-test",
  referrer: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  gclid: null,
  fbclid: null,
  ttclid: null,
  ip_hash: null,
  user_agent: "RESET-Cliniccards-E2E/1.0",
  payload: {
    integration_test: true,
    test_label: "TEST CLINICCARDS RESET",
    booking_selection: booking,
    booking_status: "pending",
    booking_error: null,
    cliniccards_visit_id: null,
    cliniccards_patient_id: null,
    telegram_status: isTelegramLeadNotificationsEnabled() ? "pending" : "disabled",
    telegram_error: null,
    telegram_message_id: null,
    telegram_sent_at: null,
  },
  crm_status: "disabled",
  crm_error: null,
  crm_external_id: null,
};

await saveLead(lead);

const bookingResult = await bookCliniccardsSelection({
  selection: booking,
  name: lead.name,
  phone: lead.phone,
  leadId,
});

lead = {
  ...lead,
  updated_at: new Date().toISOString(),
  status: bookingResult.status === "booked" ? "booked" : lead.status,
  payload: {
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
  },
};
await updateLead(leadId, { status: lead.status, payload: lead.payload });

let telegram = { status: "disabled", messageId: null };
let telegramError = null;
if (isTelegramLeadNotificationsEnabled()) {
  try {
    telegram = await dispatchLeadToTelegram(lead);
    lead = {
      ...lead,
      payload: {
        ...lead.payload,
        telegram_status: telegram.status,
        telegram_message_id: telegram.messageId,
        telegram_error: null,
        telegram_sent_at: new Date().toISOString(),
      },
    };
    await updateLead(leadId, { payload: lead.payload });
  } catch (error) {
    telegramError = error instanceof Error ? error.message : String(error);
    lead = {
      ...lead,
      payload: {
        ...lead.payload,
        telegram_status: "failed",
        telegram_error: telegramError,
      },
    };
    await updateLead(leadId, { payload: lead.payload });
  }
}

let visitConfirmed = false;
if (bookingResult.visitId) {
  const base = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
  const token = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
  const response = await fetch(`${base}/visits?from=${slot.date}&to=${slot.date}`, {
    headers: { Accept: "application/json", Token: token },
    cache: "no-store",
  });
  const data = await response.json();
  const visits = Array.isArray(data?.data) ? data.data : [];
  visitConfirmed = visits.some((item) => String(item?.visit_id ?? item?.id ?? "") === String(bookingResult.visitId));
}

const storedLead = await getLead(leadId);
console.log(`[cliniccards-e2e] ${JSON.stringify({
  leadId,
  adminStored: Boolean(storedLead),
  storedStatus: storedLead?.status || null,
  bookingStatus: bookingResult.status,
  visitId: bookingResult.visitId || null,
  patientId: bookingResult.patientId || null,
  bookingError: bookingResult.error || null,
  visitConfirmed,
  telegramStatus: storedLead?.payload?.telegram_status || telegram.status,
  telegramMessageId: storedLead?.payload?.telegram_message_id || telegram.messageId,
  telegramError,
  slot: {
    date: slot.date,
    time: slot.time,
    doctorId: slot.doctorId || null,
    cabinetId: slot.cabinetId || null,
  },
})}`);

if (bookingResult.status !== "booked" || !bookingResult.visitId || !visitConfirmed || !storedLead) {
  throw new Error(`Cliniccards E2E failed: ${JSON.stringify({
    bookingStatus: bookingResult.status,
    bookingError: bookingResult.error,
    visitId: bookingResult.visitId,
    visitConfirmed,
    adminStored: Boolean(storedLead),
    telegramStatus: storedLead?.payload?.telegram_status || telegram.status,
  })}`);
}

import { NextRequest } from "next/server";
import { getLead, getLeads } from "../../../lib/admin-data";
import { getCliniccardsAvailability } from "../../../lib/cliniccards-booking";
import { POST as createLead } from "../../api/leads/route";

const TEST_RUN_ID = "cliniccards-e2e-2026-09-03-a";

async function runE2E() {
  const existing = (await getLeads(1000)).find(
    (lead) => lead.payload?.test_run_id === TEST_RUN_ID,
  );
  if (existing) {
    console.log(`[cliniccards-e2e-build] ${JSON.stringify({
      skipped: true,
      reason: "existing_test_run",
      leadId: existing.id,
      leadStatus: existing.status,
      bookingStatus: existing.payload?.booking_status || null,
      visitId: existing.payload?.cliniccards_visit_id || null,
      telegramStatus: existing.payload?.telegram_status || null,
    })}`);
    return;
  }

  const slots = await getCliniccardsAvailability();
  if (!slots.length) {
    console.log(`[cliniccards-e2e-build] ${JSON.stringify({ ok: false, error: "no_slots" })}`);
    return;
  }

  const slot = slots.at(-1)!;
  const payload = {
    name: "TEST CLINICCARDS RESET",
    phone: "+380000000000",
    message: "Автоматичний інтеграційний тест Cliniccards — можна видалити після перевірки.",
    formId: "cliniccards-e2e-test",
    pageUrl: "https://resetclinic.org/cliniccards-e2e-test",
    pagePath: "/cliniccards-e2e-test",
    booking: {
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
    },
    fields: {
      integration_test: true,
      test_run_id: TEST_RUN_ID,
      test_label: "TEST CLINICCARDS RESET",
    },
  };

  const request = new NextRequest("https://resetclinic.org/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "RESET-Cliniccards-E2E/1.0",
    },
    body: JSON.stringify(payload),
  });

  const response = await createLead(request);
  const body = await response.json();
  const storedLead = body.id ? await getLead(body.id) : null;
  const visitId = body.booking?.visitId ? String(body.booking.visitId) : "";

  let visitConfirmed = false;
  if (visitId) {
    const base = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
    const token = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
    const visitsResponse = await fetch(`${base}/visits?from=${slot.date}&to=${slot.date}`, {
      headers: { Accept: "application/json", Token: token },
      cache: "no-store",
    });
    const visitsPayload = await visitsResponse.json();
    const visits = Array.isArray(visitsPayload?.data) ? visitsPayload.data : [];
    visitConfirmed = visits.some((item: Record<string, unknown>) =>
      String(item?.visit_id ?? item?.id ?? "") === visitId,
    );
  }

  console.log(`[cliniccards-e2e-build] ${JSON.stringify({
    ok: body.ok === true,
    leadHttpStatus: response.status,
    leadId: body.id || null,
    bookingStatus: body.booking?.status || null,
    bookingError: body.booking?.error || null,
    visitId: visitId || null,
    visitConfirmed,
    adminStored: Boolean(storedLead),
    adminStatus: storedLead?.status || null,
    telegramStatus: storedLead?.payload?.telegram_status || null,
    telegramMessageId: storedLead?.payload?.telegram_message_id || null,
    crmStatus: storedLead?.crm_status || null,
    slot: {
      date: slot.date,
      time: slot.time,
      doctorId: slot.doctorId || null,
      cabinetId: slot.cabinetId || null,
    },
  })}`);
}

export async function generateStaticParams() {
  await runE2E();
  return [{ run: "once" }];
}

export default function CliniccardsE2EBuildPage() {
  return <main>Cliniccards E2E build verification.</main>;
}

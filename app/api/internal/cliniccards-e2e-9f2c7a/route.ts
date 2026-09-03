import { NextRequest, NextResponse } from "next/server";
import { getLead } from "../../../../../lib/admin-data";
import { getCliniccardsAvailability } from "../../../../../lib/cliniccards-booking";
import { POST as createLead } from "../../../leads/route";

export const dynamic = "force-dynamic";

const RUN_TOKEN = "9a7f4e2d8c1b5f603d9e7a42";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("run") !== RUN_TOKEN) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const slots = await getCliniccardsAvailability();
  if (!slots.length) {
    return NextResponse.json({ ok: false, error: "no_slots" }, { status: 503 });
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
      test_label: "TEST CLINICCARDS RESET",
    },
  };

  const leadRequest = new NextRequest("https://resetclinic.org/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "RESET-Cliniccards-E2E/1.0",
    },
    body: JSON.stringify(payload),
  });

  const response = await createLead(leadRequest);
  const body = await response.json();
  const storedLead = body.id ? await getLead(body.id) : null;

  let visitConfirmed = false;
  const visitId = body.booking?.visitId ? String(body.booking.visitId) : "";
  if (visitId) {
    const base = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
    const token = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
    const visitsResponse = await fetch(`${base}/visits?from=${slot.date}&to=${slot.date}`, {
      headers: { Accept: "application/json", Token: token },
      cache: "no-store",
    });
    const visitsPayload = await visitsResponse.json();
    const visits = Array.isArray(visitsPayload?.data) ? visitsPayload.data : [];
    visitConfirmed = visits.some((item: Record<string, unknown>) => String(item?.visit_id ?? item?.id ?? "") === visitId);
  }

  return NextResponse.json({
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
  }, {
    status: body.ok === true ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}

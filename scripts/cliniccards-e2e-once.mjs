import { NextRequest } from "next/server";
import { getCliniccardsAvailability } from "../lib/cliniccards-booking.ts";
import { POST as createLead } from "../app/api/leads/route.ts";

const slots = await getCliniccardsAvailability();
if (!slots.length) {
  throw new Error("No Cliniccards slots available for E2E test");
}

const slot = slots.at(-1);
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
console.log(`[cliniccards-e2e] ${JSON.stringify({
  httpStatus: response.status,
  ok: body.ok,
  leadId: body.id || null,
  bookingStatus: body.booking?.status || null,
  visitId: body.booking?.visitId || null,
  bookingError: body.booking?.error || null,
  slot: {
    date: slot.date,
    time: slot.time,
    doctorId: slot.doctorId || null,
    cabinetId: slot.cabinetId || null,
  },
})}`);

if (!body.ok || body.booking?.status !== "booked" || !body.booking?.visitId) {
  throw new Error(`Cliniccards E2E failed: ${JSON.stringify({ status: response.status, booking: body.booking })}`);
}

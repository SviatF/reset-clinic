import { getCliniccardsAvailability } from "../lib/cliniccards-booking.ts";

function kyivNowParts() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

try {
  const slots = await getCliniccardsAvailability();
  const now = kyivNowParts();
  const nowKey = `${now.date}T${now.time}`;
  const pastSlots = slots.filter((slot) => `${slot.date}T${slot.time}` < nowKey);
  const dates = [...new Set(slots.map((slot) => slot.date))];
  const doctors = [...new Set(slots.map((slot) => slot.doctorId).filter(Boolean))];
  console.log(`[cliniccards-slot-verify] ${JSON.stringify({
    ok: true,
    timezone: "Europe/Kyiv",
    generatedAtKyiv: nowKey,
    slotCount: slots.length,
    pastSlotCount: pastSlots.length,
    dateCount: dates.length,
    firstDate: dates[0] || null,
    lastDate: dates.at(-1) || null,
    doctorCount: doctors.length,
    firstSlots: slots.slice(0, 12).map((slot) => ({ date: slot.date, time: slot.time, doctorId: slot.doctorId, cabinetId: slot.cabinetId, end: slot.end.slice(11, 16) })),
  })}`);
} catch (error) {
  console.log(`[cliniccards-slot-verify] ${JSON.stringify({ ok: false, error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) })}`);
  process.exitCode = 1;
}

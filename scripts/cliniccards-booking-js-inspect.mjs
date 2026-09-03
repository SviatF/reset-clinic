const apiBase = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
const apiToken = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
const bookingJsUrl = "https://cliniccards.com/f/js/booking/booking.min.js";

function context(text, needle, before = 500, after = 1800) {
  const at = text.indexOf(needle);
  if (at < 0) return "";
  return text.slice(Math.max(0, at - before), Math.min(text.length, at + needle.length + after)).replace(/\s+/g, " ");
}

async function bookingLink() {
  const response = await fetch(`${apiBase}/booking-settings`, {
    headers: { Accept: "application/json", Token: apiToken }, cache: "no-store",
  });
  const json = await response.json();
  return String(json?.data?.booking_link || "").trim();
}

function summarizeShifts(data) {
  const result = [];
  const shifts = data?.scheduleShifts;
  if (!shifts || typeof shifts !== "object") return result;
  for (const [month, days] of Object.entries(shifts)) {
    if (!days || typeof days !== "object") continue;
    for (const [day, rows] of Object.entries(days)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        result.push({
          month,
          day,
          doctorId: row.clinics_members_id ?? null,
          cabinetId: row.schedule_cabinets_id ?? null,
          shiftStart: row.shift_start ?? null,
          shiftEnd: row.shift_end ?? null,
          intervalCount: Array.isArray(row.intervals) ? row.intervals.length : 0,
          intervals: Array.isArray(row.intervals) ? row.intervals.slice(0, 4).map((i) => ({
            start: i?.start ?? null,
            end: i?.end ?? null,
            duration: i?.duration ?? null,
          })) : [],
        });
        if (result.length >= 12) return result;
      }
    }
  }
  return result;
}

try {
  if (!apiToken) throw new Error("CLINIC_BOOKING_API_KEY missing");
  const link = await bookingLink();
  if (!link) throw new Error("booking_link missing");
  const token = new URL(link).pathname.split("/").filter(Boolean).at(-1) || "";
  const endpoint = `${new URL(link).origin}/booking/filter-data/${encodeURIComponent(token)}?sid=0`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ doctor: {}, service: {}, time: null }),
    cache: "no-store",
  });
  const data = await response.json();
  console.log(`[cliniccards-filter-summary] ${JSON.stringify({
    status: response.status,
    membersCount: Array.isArray(data?.members) ? data.members.length : 0,
    priceItemsCount: Array.isArray(data?.priceItems) ? data.priceItems.length : 0,
    shiftMonths: data?.scheduleShifts && typeof data.scheduleShifts === "object" ? Object.keys(data.scheduleShifts) : [],
    doctorMinServiceTime: data?.doctorMinServiceTime ?? null,
    doctorsShiftsIntervalRemainingTimeKeys: data?.doctorsShiftsIntervalRemainingTime && typeof data.doctorsShiftsIntervalRemainingTime === "object" ? Object.keys(data.doctorsShiftsIntervalRemainingTime).slice(0, 10) : [],
    shiftSamples: summarizeShifts(data),
  })}`);

  const jsResponse = await fetch(bookingJsUrl, { cache: "no-store" });
  const js = await jsResponse.text();
  console.log(`[cliniccards-algorithm] ${JSON.stringify({
    calculateExistedTimes: context(js, "_calculateExistedTimes(){", 100, 3400),
    calculateAvailableTimes: context(js, "_calculateAvailableTimes", 200, 3000),
  })}`);
} catch (error) {
  console.log(`[cliniccards-filter-summary] ${JSON.stringify({ error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300) })}`);
}

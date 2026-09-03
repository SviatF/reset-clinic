import { NextResponse } from "next/server";
import {
  cliniccardsBookingHorizonDays,
  cliniccardsBookingTimezone,
  getCliniccardsAvailability,
  isCliniccardsBookingEnabled,
} from "../../../../lib/cliniccards-booking";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = isCliniccardsBookingEnabled();

  if (!enabled) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        status: "not_configured",
        timezone: cliniccardsBookingTimezone(),
        horizonDays: cliniccardsBookingHorizonDays(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const slots = await getCliniccardsAvailability();
    const dates = [...new Set(slots.map((slot) => slot.date))];
    const doctors = [...new Set(slots.map((slot) => slot.doctorName).filter(Boolean))];

    return NextResponse.json(
      {
        ok: true,
        enabled: true,
        status: "connected",
        timezone: cliniccardsBookingTimezone(),
        horizonDays: cliniccardsBookingHorizonDays(),
        slotCount: slots.length,
        dateCount: dates.length,
        firstAvailableDate: dates[0] || null,
        lastAvailableDate: dates.at(-1) || null,
        doctorCount: doctors.length,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        enabled: true,
        status: "upstream_error",
        error: error instanceof Error ? error.message.slice(0, 500) : "Cliniccards health check failed",
        checkedAt: new Date().toISOString(),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

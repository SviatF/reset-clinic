import { NextRequest, NextResponse } from "next/server";
import {
  cliniccardsBookingTimezone,
  getCliniccardsAvailability,
  isCliniccardsBookingEnabled,
} from "../../../../lib/cliniccards-booking";
import type { BookingAvailabilityResponse } from "../../../../lib/booking-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeQuery(value: string | null, max = 160) {
  return (value || "").trim().slice(0, max) || undefined;
}

function response(body: BookingAvailabilityResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: NextRequest) {
  const enabled = isCliniccardsBookingEnabled();
  const generatedAt = new Date().toISOString();
  const timezone = cliniccardsBookingTimezone();

  if (!enabled) {
    return response({
      ok: true,
      enabled: false,
      timezone,
      generatedAt,
      slots: [],
      message: "Онлайн-бронювання тимчасово недоступне. Адміністратор допоможе обрати час.",
    });
  }

  try {
    const slots = await getCliniccardsAvailability({
      service: safeQuery(request.nextUrl.searchParams.get("service")),
      doctor: safeQuery(request.nextUrl.searchParams.get("doctor")),
    });

    return response({
      ok: true,
      enabled: true,
      timezone,
      generatedAt,
      slots,
      message: slots.length ? undefined : "На найближчі тижні вільних слотів не знайдено.",
    });
  } catch (error) {
    console.error("Cliniccards availability failed", error);
    return response({
      ok: false,
      enabled: true,
      timezone,
      generatedAt,
      slots: [],
      message: "Не вдалося оновити вільні години. Спробуйте ще раз або залиште контакт для адміністратора.",
    }, 502);
  }
}

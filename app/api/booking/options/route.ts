import { NextResponse } from "next/server";
import { getCliniccardsBookingOptions } from "../../../../lib/cliniccards-options";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const options = await getCliniccardsBookingOptions();
    return NextResponse.json(
      { ok: true, ...options },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("RESET Cliniccards booking options failed", error);
    return NextResponse.json(
      {
        ok: false,
        doctors: [],
        services: [],
        message: "Не вдалося оновити список послуг і лікарів. Спробуйте ще раз або залиште заявку адміністратору.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}

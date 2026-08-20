import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { supabaseRest } from "../../../../../lib/supabase";

const allowed = new Set(["new","contacted","qualified","booked","won","lost","spam"]);

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const { id } = await params;
  const form = await request.formData();
  const status = String(form.get("status") ?? "");
  if (!allowed.has(status)) return NextResponse.redirect(new URL("/admin/leads/", request.url), 303);

  await supabaseRest(
    `leads?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status }),
    },
    { accessToken: session.accessToken },
  );

  return NextResponse.redirect(new URL("/admin/leads/", request.url), 303);
}

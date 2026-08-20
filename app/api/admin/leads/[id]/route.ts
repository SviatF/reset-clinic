import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { updateLead } from "../../../../../lib/admin-data";

const allowed = new Set(["new","contacted","qualified","booked","won","lost","spam"]);
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const { id } = await params;
  const form = await request.formData();
  const status = String(form.get("status") ?? "");
  if (allowed.has(status)) await updateLead(id, { status });
  return NextResponse.redirect(new URL("/admin/leads/", request.url), 303);
}

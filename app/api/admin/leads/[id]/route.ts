import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { getLead, updateLead } from "../../../../../lib/admin-data";
import { crmErrorMessage, dispatchLeadToCrm } from "../../../../../lib/crm-dispatch";

const allowed = new Set(["new", "contacted", "qualified", "booked", "won", "lost", "spam"]);
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const { id } = await params;
  const form = await request.formData();
  const action = String(form.get("action") ?? "status");

  if (action === "retry_crm") {
    const lead = await getLead(id);
    if (!lead) return NextResponse.redirect(new URL("/admin/leads/?retry=missing", request.url), 303);

    try {
      await updateLead(id, { crm_status: "pending", crm_error: null });
      const result = await dispatchLeadToCrm(lead);
      await updateLead(id, {
        crm_status: result.status,
        crm_error: null,
        crm_external_id: result.externalId,
      });
      return NextResponse.redirect(new URL(`/admin/leads/?retry=${result.status}`, request.url), 303);
    } catch (error) {
      await updateLead(id, { crm_status: "failed", crm_error: crmErrorMessage(error) });
      return NextResponse.redirect(new URL("/admin/leads/?retry=failed", request.url), 303);
    }
  }

  const status = String(form.get("status") ?? "");
  if (allowed.has(status)) await updateLead(id, { status });
  return NextResponse.redirect(new URL("/admin/leads/", request.url), 303);
}

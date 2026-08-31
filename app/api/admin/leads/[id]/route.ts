import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { getLead, updateLead } from "../../../../../lib/admin-data";
import { crmErrorMessage, dispatchLeadToCrm } from "../../../../../lib/crm-dispatch";
import {
  dispatchLeadToTelegram,
  isTelegramLeadNotificationsEnabled,
  telegramErrorMessage,
} from "../../../../../lib/telegram-leads";

const allowed = new Set(["new", "contacted", "qualified", "booked", "won", "lost", "spam"]);
type Context = { params: Promise<{ id: string }> };

function requestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const current = new URL(request.url);
  const protocol = forwardedProto || current.protocol.replace(":", "");
  const host = forwardedHost || request.headers.get("host") || current.host;
  return `${protocol}://${host}`;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, requestOrigin(request)), 303);
}

export async function POST(request: NextRequest, { params }: Context) {
  const session = await getAdminSession();
  if (!session) return redirectTo(request, "/admin/login/");

  const { id } = await params;
  const form = await request.formData();
  const action = String(form.get("action") ?? "status");

  if (action === "retry_crm") {
    const lead = await getLead(id);
    if (!lead) return redirectTo(request, "/admin/leads/?retry=missing");

    try {
      await updateLead(id, { crm_status: "pending", crm_error: null });
      const result = await dispatchLeadToCrm(lead);
      await updateLead(id, {
        crm_status: result.status,
        crm_error: null,
        crm_external_id: result.externalId,
      });
      return redirectTo(request, `/admin/leads/?retry=${result.status}`);
    } catch (error) {
      await updateLead(id, { crm_status: "failed", crm_error: crmErrorMessage(error) });
      return redirectTo(request, "/admin/leads/?retry=failed");
    }
  }

  if (action === "retry_telegram") {
    const lead = await getLead(id);
    if (!lead) return redirectTo(request, "/admin/leads/?telegram=missing");

    if (!isTelegramLeadNotificationsEnabled()) {
      await updateLead(id, {
        payload: {
          ...lead.payload,
          telegram_status: "disabled",
          telegram_error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not configured",
        },
      });
      return redirectTo(request, "/admin/leads/?telegram=disabled");
    }

    try {
      await updateLead(id, {
        payload: { ...lead.payload, telegram_status: "pending", telegram_error: null },
      });
      const result = await dispatchLeadToTelegram(lead);
      await updateLead(id, {
        payload: {
          ...lead.payload,
          telegram_status: result.status,
          telegram_error: null,
          telegram_message_id: result.messageId,
          telegram_sent_at: new Date().toISOString(),
        },
      });
      return redirectTo(request, "/admin/leads/?telegram=sent");
    } catch (error) {
      await updateLead(id, {
        payload: {
          ...lead.payload,
          telegram_status: "failed",
          telegram_error: telegramErrorMessage(error),
        },
      });
      return redirectTo(request, "/admin/leads/?telegram=failed");
    }
  }

  const status = String(form.get("status") ?? "");
  if (allowed.has(status)) await updateLead(id, { status });
  return redirectTo(request, "/admin/leads/");
}

import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { saveLead, updateLead, type Lead } from "../../../lib/admin-data";
import { crmErrorMessage, dispatchLeadToCrm, isCrmEnabled } from "../../../lib/crm-dispatch";
import {
  dispatchLeadToTelegram,
  isTelegramLeadNotificationsEnabled,
  telegramErrorMessage,
} from "../../../lib/telegram-leads";

type LeadPayload = {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  service?: string;
  formId?: string;
  pageUrl?: string;
  pagePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  startedAt?: number;
  website?: string;
  fields?: Record<string, unknown>;
};

function text(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function ipHash(request: NextRequest) {
  const salt = process.env.LEAD_IP_SALT;
  if (!salt) return null;
  const raw = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!raw) return null;
  return createHash("sha256").update(`${salt}:${raw}`).digest("hex");
}

export async function POST(request: NextRequest) {
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (payload.website) return NextResponse.json({ ok: true });
  if (payload.startedAt && Date.now() - payload.startedAt < 700) {
    return NextResponse.json({ ok: false, error: "too_fast" }, { status: 429 });
  }

  const phone = text(payload.phone, 80);
  const email = text(payload.email, 200);
  const name = text(payload.name, 200);
  if (!phone && !email) {
    return NextResponse.json({ ok: false, error: "contact_required" }, { status: 400 });
  }

  const [crmEnabled, telegramEnabled] = await Promise.all([
    isCrmEnabled(),
    Promise.resolve(isTelegramLeadNotificationsEnabled()),
  ]);
  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    status: "new",
    name,
    phone,
    email,
    message: text(payload.message, 2000),
    service: text(payload.service, 300),
    form_id: text(payload.formId, 200),
    page_url: text(payload.pageUrl, 1500),
    page_path: text(payload.pagePath, 500),
    referrer: text(payload.referrer, 1500),
    utm_source: text(payload.utmSource, 250),
    utm_medium: text(payload.utmMedium, 250),
    utm_campaign: text(payload.utmCampaign, 250),
    utm_content: text(payload.utmContent, 250),
    utm_term: text(payload.utmTerm, 250),
    gclid: text(payload.gclid, 500),
    fbclid: text(payload.fbclid, 500),
    ttclid: text(payload.ttclid, 500),
    ip_hash: ipHash(request),
    user_agent: text(request.headers.get("user-agent"), 1000),
    payload: {
      ...(payload.fields ?? {}),
      telegram_status: telegramEnabled ? "pending" : "disabled",
      telegram_error: null,
      telegram_message_id: null,
      telegram_sent_at: null,
    },
    crm_status: crmEnabled ? "pending" : "disabled",
    crm_error: null,
    crm_external_id: null,
  };

  try {
    await saveLead(lead);
  } catch (error) {
    console.error(
      "lead_save_failed",
      error instanceof Error ? error.message : "Unknown lead storage error",
    );
    return NextResponse.json({ ok: false, error: "lead_save_failed" }, { status: 502 });
  }

  // Notification happens only after the lead has been persisted. A Telegram outage
  // must never lose or reject a valid lead.
  if (telegramEnabled) {
    try {
      const result = await dispatchLeadToTelegram(lead);
      await updateLead(lead.id, {
        payload: {
          ...lead.payload,
          telegram_status: result.status,
          telegram_error: null,
          telegram_message_id: result.messageId,
          telegram_sent_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = telegramErrorMessage(error);
      console.error("lead_telegram_failed", lead.id, message);
      await updateLead(lead.id, {
        payload: {
          ...lead.payload,
          telegram_status: "failed",
          telegram_error: message,
          telegram_message_id: null,
          telegram_sent_at: null,
        },
      });
    }
  }

  if (crmEnabled) {
    try {
      const result = await dispatchLeadToCrm(lead);
      await updateLead(lead.id, {
        crm_status: result.status,
        crm_error: null,
        crm_external_id: result.externalId,
      });
    } catch (error) {
      await updateLead(lead.id, {
        crm_status: "failed",
        crm_error: crmErrorMessage(error),
      });
    }
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

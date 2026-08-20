import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { decryptSecret } from "../../../lib/secret-box";
import { hasServiceRole, isSupabaseConfigured, supabaseRest } from "../../../lib/supabase";

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

type CrmConfig = {
  endpoint: string;
  token?: string;
  provider?: string;
  name?: string;
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

async function getCrmConfig(): Promise<CrmConfig | null> {
  if (hasServiceRole()) {
    const result = await supabaseRest<
      Array<{ endpoint: string | null; provider: string; name: string; config: { token_enc?: string } | null }>
    >(
      "crm_integrations?select=endpoint,provider,name,config&enabled=eq.true&order=created_at.asc&limit=1",
      { method: "GET" },
      { service: true },
    );
    const row = result.data?.[0];
    if (row?.endpoint) {
      let token = "";
      try {
        token = row.config?.token_enc ? decryptSecret(row.config.token_enc) : "";
      } catch {
        token = "";
      }
      return { endpoint: row.endpoint, token: token || undefined, provider: row.provider, name: row.name };
    }
  }

  return process.env.CRM_WEBHOOK_URL
    ? {
        endpoint: process.env.CRM_WEBHOOK_URL,
        token: process.env.CRM_WEBHOOK_TOKEN || undefined,
        provider: "webhook",
        name: "Environment CRM",
      }
    : null;
}

async function updateCrmState(id: string, state: Record<string, unknown>) {
  if (!hasServiceRole()) return;
  await supabaseRest(
    `leads?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(state),
    },
    { service: true },
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "lead_backend_not_configured" }, { status: 503 });
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot and minimum human interaction time. These do not replace WAF/rate limiting,
  // but remove the simplest form bots without changing the visible form.
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

  const crm = await getCrmConfig();
  const lead = {
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
    payload: payload.fields ?? {},
    crm_status: crm ? "pending" : "disabled",
  };

  const inserted = await supabaseRest<Array<{ id: string; created_at: string }>>(
    "leads?select=id,created_at",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(lead),
    },
  );

  const saved = inserted.data?.[0];
  if (!inserted.ok || !saved) {
    return NextResponse.json({ ok: false, error: "lead_save_failed" }, { status: 502 });
  }

  if (crm) {
    try {
      const crmResponse = await fetch(crm.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(crm.token ? { Authorization: `Bearer ${crm.token}` } : {}),
        },
        body: JSON.stringify({
          event: "lead.created",
          leadId: saved.id,
          source: "resetclinic.org",
          provider: crm.provider,
          lead,
        }),
        cache: "no-store",
      });

      if (!crmResponse.ok) throw new Error(`CRM HTTP ${crmResponse.status}`);
      let externalId: string | null = null;
      try {
        const crmBody = (await crmResponse.json()) as { id?: string | number; leadId?: string | number };
        externalId = String(crmBody.id ?? crmBody.leadId ?? "") || null;
      } catch {
        externalId = null;
      }
      await updateCrmState(saved.id, { crm_status: "sent", crm_error: null, crm_external_id: externalId });
    } catch (error) {
      await updateCrmState(saved.id, {
        crm_status: "failed",
        crm_error: error instanceof Error ? error.message.slice(0, 1000) : "CRM dispatch failed",
      });
    }
  }

  return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
}

import { getCrmConfig, type Lead } from "./admin-data";
import { decryptSecret } from "./secret-box";

export type RuntimeCrm = {
  endpoint: string;
  token?: string;
  provider: string;
  name: string;
};

export async function isCrmEnabled() {
  const row = await getCrmConfig();
  return Boolean(row?.enabled && row.endpoint) || Boolean(process.env.CRM_WEBHOOK_URL);
}

export async function getRuntimeCrm(): Promise<RuntimeCrm | null> {
  const row = await getCrmConfig();
  if (row?.enabled && row.endpoint) {
    let token: string | undefined;
    if (row.token_enc) {
      try {
        token = decryptSecret(row.token_enc);
      } catch {
        throw new Error("CRM token decryption failed");
      }
    }
    return {
      endpoint: row.endpoint,
      token,
      provider: row.provider || "webhook",
      name: row.name || "Primary CRM",
    };
  }

  if (!process.env.CRM_WEBHOOK_URL) return null;
  return {
    endpoint: process.env.CRM_WEBHOOK_URL,
    token: process.env.CRM_WEBHOOK_TOKEN || undefined,
    provider: "webhook",
    name: "Environment CRM",
  };
}

export async function dispatchLeadToCrm(lead: Lead) {
  const crm = await getRuntimeCrm();
  if (!crm) return { status: "disabled" as const, externalId: null };

  const response = await fetch(crm.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(crm.token ? { Authorization: `Bearer ${crm.token}` } : {}),
    },
    body: JSON.stringify({
      event: "lead.created",
      leadId: lead.id,
      source: "resetclinic.org",
      provider: crm.provider,
      lead,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) throw new Error(`CRM HTTP ${response.status}`);

  let externalId: string | null = null;
  try {
    const body = (await response.json()) as { id?: string | number; leadId?: string | number };
    externalId = String(body.id ?? body.leadId ?? "") || null;
  } catch {
    externalId = null;
  }

  return { status: "sent" as const, externalId };
}

export function crmErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "CRM dispatch failed";
  if (error.name === "TimeoutError") return "CRM timeout after 7s";
  return error.message.slice(0, 1000);
}

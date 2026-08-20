import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { encryptSecret } from "../../../../../lib/secret-box";
import { supabaseRest } from "../../../../../lib/supabase";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const form = await request.formData();
  const name = String(form.get("name") ?? "Primary CRM").trim() || "Primary CRM";
  const provider = String(form.get("provider") ?? "webhook").trim() || "webhook";
  const endpoint = String(form.get("endpoint") ?? "").trim();
  const token = String(form.get("token") ?? "").trim();
  const enabled = form.get("enabled") === "on";

  if (enabled && !endpoint) {
    return NextResponse.redirect(new URL("/admin/integrations/?crm_error=endpoint", request.url), 303);
  }

  let tokenEnc: string | undefined;
  if (token) {
    try {
      tokenEnc = encryptSecret(token);
    } catch {
      return NextResponse.redirect(new URL("/admin/integrations/?crm_error=encryption", request.url), 303);
    }
  }

  const existing = await supabaseRest<Array<{ id: string; config: Record<string, unknown> | null }>>(
    "crm_integrations?select=id,config&order=created_at.asc&limit=1",
    { method: "GET" },
    { accessToken: session.accessToken },
  );
  const row = existing.data?.[0];
  const config = { ...(row?.config ?? {}), ...(tokenEnc ? { token_enc: tokenEnc } : {}) };
  const payload = { name, provider, endpoint: endpoint || null, enabled, config };

  const response = row
    ? await supabaseRest(
        `crm_integrations?id=eq.${encodeURIComponent(row.id)}`,
        { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) },
        { accessToken: session.accessToken },
      )
    : await supabaseRest(
        "crm_integrations",
        { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) },
        { accessToken: session.accessToken },
      );

  const url = new URL("/admin/integrations/", request.url);
  url.searchParams.set(response.ok ? "crm_saved" : "crm_error", response.ok ? "1" : "save");
  return NextResponse.redirect(url, 303);
}

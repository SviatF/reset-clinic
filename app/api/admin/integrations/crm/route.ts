import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { getCrmConfig, saveCrmConfig } from "../../../../../lib/admin-data";
import { encryptSecret } from "../../../../../lib/secret-box";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login/", request.url), 303);

  const form = await request.formData();
  const name = String(form.get("name") ?? "Primary CRM").trim() || "Primary CRM";
  const provider = String(form.get("provider") ?? "webhook").trim() || "webhook";
  const endpoint = String(form.get("endpoint") ?? "").trim();
  const token = String(form.get("token") ?? "").trim();
  const enabled = form.get("enabled") === "on";
  if (enabled && !endpoint) return NextResponse.redirect(new URL("/admin/integrations/?crm_error=endpoint", request.url), 303);

  const existing = await getCrmConfig();
  let tokenEnc = existing?.token_enc;
  if (token) {
    try {
      tokenEnc = encryptSecret(token);
    } catch {
      return NextResponse.redirect(new URL("/admin/integrations/?crm_error=encryption", request.url), 303);
    }
  }

  try {
    await saveCrmConfig({ name, provider, endpoint: endpoint || null, enabled, token_enc: tokenEnc });
    return NextResponse.redirect(new URL("/admin/integrations/?crm_saved=1", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/integrations/?crm_error=storage", request.url), 303);
  }
}

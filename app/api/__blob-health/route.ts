import { NextResponse } from "next/server";
import { getAdminStoreHealth } from "../../../lib/admin-store";

export async function GET() {
  const health = await getAdminStoreHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}

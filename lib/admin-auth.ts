import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAuth, supabaseRest, type SupabaseUser } from "./supabase";

export const ACCESS_COOKIE = "rc_admin_access";
export const REFRESH_COOKIE = "rc_admin_refresh";

type AdminRow = {
  email: string;
  role: string;
  enabled: boolean;
};

export async function getAdminSession(): Promise<
  | { user: SupabaseUser; admin: AdminRow; accessToken: string }
  | null
> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const userResult = await supabaseAuth<SupabaseUser>("/user", { method: "GET" }, accessToken);
  if (!userResult.ok || !userResult.data?.email) return null;

  const email = encodeURIComponent(userResult.data.email);
  const adminResult = await supabaseRest<AdminRow[]>(
    `admin_users?select=email,role,enabled&email=eq.${email}&enabled=eq.true&limit=1`,
    { method: "GET" },
    { accessToken },
  );

  const admin = adminResult.data?.[0];
  if (!adminResult.ok || !admin) return null;

  return { user: userResult.data, admin, accessToken };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login/");
  return session;
}

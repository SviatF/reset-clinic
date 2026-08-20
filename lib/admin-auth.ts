import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "rc_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

type SessionPayload = {
  u: string;
  exp: number;
};

function adminUsername() {
  return (process.env.ADMIN_USERNAME || "").trim();
}

function signingSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function signature(payload: string) {
  const secret = signingSecret();
  if (!secret) throw new Error("RESET Admin session secret is not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdminConfigured() {
  return Boolean(adminUsername() && process.env.ADMIN_PASSWORD && signingSecret());
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = adminUsername();
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  if (!expectedUser || !expectedPassword) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPassword);
}

export function createAdminSessionToken(username: string) {
  const payload: SessionPayload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyAdminSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) return null;

  let expectedSignature = "";
  try {
    expectedSignature = signature(encoded);
  } catch {
    return null;
  }
  if (!safeEqual(providedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.u || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!safeEqual(payload.u, adminUsername())) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  const payload = verifyAdminSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return {
    user: { username: payload.u },
    admin: { role: "owner" as const },
    expiresAt: payload.exp,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login/");
  return session;
}

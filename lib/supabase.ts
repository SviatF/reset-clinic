type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type SupabaseUser = {
  id: string;
  email?: string;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
};

function config() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured");
  }

  return { url: url.replace(/\/$/, ""), publishableKey, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

export async function supabaseAuth<T = Json>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const { url, publishableKey } = config();
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken ?? publishableKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data };
}

export async function supabaseRest<T = Json>(
  path: string,
  init: RequestInit = {},
  options?: { accessToken?: string; service?: boolean },
): Promise<{ ok: boolean; status: number; data: T | null; headers: Headers }> {
  const { url, publishableKey, serviceRoleKey } = config();
  const bearer =
    options?.accessToken ?? (options?.service && serviceRoleKey ? serviceRoleKey : publishableKey);
  const apikey = options?.service && serviceRoleKey ? serviceRoleKey : publishableKey;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  let data: T | null = null;
  if (response.status !== 204) {
    try {
      data = (await response.json()) as T;
    } catch {
      data = null;
    }
  }

  return { ok: response.ok, status: response.status, data, headers: response.headers };
}

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

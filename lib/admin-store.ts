import { get, list, put } from "@vercel/blob";

function staticToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

function oidcToken() {
  return process.env.VERCEL_OIDC_TOKEN || "";
}

function storeId() {
  return process.env.BLOB_STORE_ID || "";
}

function authOptions() {
  const token = staticToken();
  if (token) return { token } as const;

  const oidc = oidcToken();
  const store = storeId();
  if (oidc && store) return { oidcToken: oidc, storeId: store } as const;

  throw new Error("Vercel Blob authentication is not configured");
}

export function isAdminStoreConfigured() {
  return Boolean(staticToken() || (oidcToken() && storeId()));
}

export async function getAdminStoreHealth() {
  if (!isAdminStoreConfigured()) {
    return { configured: false, ok: false, mode: "none" as const, error: "Blob authentication is not configured" };
  }

  try {
    await list({ prefix: "reset/", limit: 1, ...authOptions() });
    return {
      configured: true,
      ok: true,
      mode: staticToken() ? ("token" as const) : ("oidc" as const),
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      mode: staticToken() ? ("token" as const) : ("oidc" as const),
      error: error instanceof Error ? error.message.slice(0, 300) : "Blob health check failed",
    };
  }
}

async function findExactBlob(pathname: string) {
  const auth = authOptions();
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: pathname, limit: 1000, cursor, ...auth });
    const exact = result.blobs.find((blob) => blob.pathname === pathname);
    if (exact) return exact;
    cursor = result.cursor;
  } while (cursor);
  return null;
}

export async function putJson(pathname: string, value: unknown) {
  const auth = authOptions();
  return put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    ...auth,
  });
}

export async function readJson<T>(pathname: string, fallback: T): Promise<T> {
  if (!isAdminStoreConfigured()) return fallback;
  try {
    const blob = await findExactBlob(pathname);
    if (!blob) return fallback;
    const result = await get(blob.url, { access: "private", ...authOptions() });
    if (!result) return fallback;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return fallback;
  }
}

export async function listJson<T>(prefix: string, limit = 500): Promise<T[]> {
  if (!isAdminStoreConfigured()) return [];

  try {
    const auth = authOptions();
    const blobs: Array<{ url: string; pathname: string; uploadedAt: Date }> = [];
    let cursor: string | undefined;

    do {
      const result = await list({ prefix, limit: 1000, cursor, ...auth });
      blobs.push(...result.blobs);
      cursor = result.cursor;
    } while (cursor && blobs.length < Math.max(limit * 2, 1000));

    const selected = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit);

    const rows = await Promise.all(
      selected.map(async (blob): Promise<T | null> => {
        try {
          const result = await get(blob.url, { access: "private", ...auth });
          if (!result) return null;
          return JSON.parse(await new Response(result.stream).text()) as T;
        } catch {
          return null;
        }
      }),
    );

    return rows.filter((row) => row !== null) as T[];
  } catch {
    return [];
  }
}

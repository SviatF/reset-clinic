import { get, list, put } from "@vercel/blob";

function staticToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

/**
 * Modern Vercel Blob connections use OIDC at runtime. The @vercel/blob SDK
 * resolves that auth from Vercel's request context automatically, so we must
 * not require VERCEL_OIDC_TOKEN to exist in process.env before calling it.
 *
 * A long-lived BLOB_READ_WRITE_TOKEN is still supported as a fallback for
 * older connections and local development.
 */
function authOptions() {
  const token = staticToken();
  return token ? ({ token } as const) : ({} as const);
}

export function isAdminStoreConfigured() {
  // On Vercel, a connected Blob store can authenticate through runtime OIDC
  // even when VERCEL_OIDC_TOKEN is not exposed as a normal environment var.
  return Boolean(staticToken() || process.env.VERCEL);
}

export async function getAdminStoreHealth() {
  const mode = staticToken() ? ("token" as const) : process.env.VERCEL ? ("oidc" as const) : ("none" as const);

  try {
    await list({ prefix: "reset/", limit: 1, ...authOptions() });
    return {
      configured: true,
      ok: true,
      mode,
      error: null,
    };
  } catch (error) {
    return {
      configured: Boolean(staticToken() || process.env.VERCEL),
      ok: false,
      mode,
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

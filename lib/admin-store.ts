import { get, list, put } from "@vercel/blob";

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

export function isAdminStoreConfigured() {
  return Boolean(token());
}

function requireToken() {
  const value = token();
  if (!value) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  return value;
}

async function findExactBlob(pathname: string) {
  const auth = requireToken();
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: pathname, limit: 1000, cursor, token: auth });
    const exact = result.blobs.find((blob) => blob.pathname === pathname);
    if (exact) return exact;
    cursor = result.cursor;
  } while (cursor);
  return null;
}

export async function putJson(pathname: string, value: unknown) {
  const auth = requireToken();
  return put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    token: auth,
  });
}

export async function readJson<T>(pathname: string, fallback: T): Promise<T> {
  if (!isAdminStoreConfigured()) return fallback;
  const blob = await findExactBlob(pathname);
  if (!blob) return fallback;
  const result = await get(blob.url, { access: "private", token: requireToken() });
  if (!result) return fallback;
  try {
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return fallback;
  }
}

export async function listJson<T>(prefix: string, limit = 500): Promise<T[]> {
  if (!isAdminStoreConfigured()) return [];
  const auth = requireToken();
  const blobs: Array<{ url: string; pathname: string; uploadedAt: Date }> = [];
  let cursor: string | undefined;

  do {
    const result = await list({ prefix, limit: 1000, cursor, token: auth });
    blobs.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor && blobs.length < Math.max(limit * 2, 1000));

  const selected = blobs
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, limit);

  const rows = await Promise.all(
    selected.map(async (blob) => {
      try {
        const result = await get(blob.url, { access: "private", token: auth });
        if (!result) return null;
        return JSON.parse(await new Response(result.stream).text()) as T;
      } catch {
        return null;
      }
    }),
  );

  return rows.filter((row): row is T => row !== null);
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";

function staticToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

function useBlobStore() {
  return Boolean(staticToken() || process.env.VERCEL);
}

function localDataRoot() {
  const configured = process.env.RESET_DATA_DIR?.trim();
  return path.resolve(configured || path.join(process.cwd(), ".reset-data"));
}

function localPath(pathname: string) {
  const root = localDataRoot();
  const clean = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, clean);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid local admin-store path");
  }
  return resolved;
}

/**
 * Vercel uses Blob through runtime OIDC (or an optional static token).
 * Traditional Node.js hosting such as CityHost uses a private persistent
 * directory on the hosting account, so the production site has no hidden
 * dependency on Vercel for leads/admin/blog data.
 */
function authOptions() {
  const token = staticToken();
  return token ? ({ token } as const) : ({} as const);
}

export function isAdminStoreConfigured() {
  return useBlobStore() || Boolean(localDataRoot());
}

async function localHealth() {
  const root = localDataRoot();
  const probe = path.join(root, `.health-${process.pid}-${Date.now()}`);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(probe, "ok", "utf8");
  await fs.unlink(probe);
}

export async function getAdminStoreHealth() {
  const mode = useBlobStore()
    ? staticToken()
      ? ("token" as const)
      : ("oidc" as const)
    : ("filesystem" as const);

  try {
    if (useBlobStore()) {
      await list({ prefix: "reset/", limit: 1, ...authOptions() });
    } else {
      await localHealth();
    }
    return { configured: true, ok: true, mode, error: null };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      mode,
      error: error instanceof Error ? error.message.slice(0, 300) : "Admin store health check failed",
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

async function putJsonLocal(pathname: string, value: unknown) {
  const destination = localPath(pathname);
  const directory = path.dirname(destination);
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporary, JSON.stringify(value), "utf8");
  await fs.rename(temporary, destination);
  return { pathname };
}

async function readJsonLocal<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const text = await fs.readFile(localPath(pathname), "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function collectJsonFiles(directory: string): Promise<Array<{ file: string; mtimeMs: number }>> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const rows = await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectJsonFiles(full);
        if (!entry.isFile() || !entry.name.endsWith(".json")) return [];
        const stat = await fs.stat(full);
        return [{ file: full, mtimeMs: stat.mtimeMs }];
      }),
    );
    return rows.flat();
  } catch {
    return [];
  }
}

async function listJsonLocal<T>(prefix: string, limit: number): Promise<T[]> {
  const files = (await collectJsonFiles(localPath(prefix)))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit);

  const rows = await Promise.all(
    files.map(async ({ file }): Promise<T | null> => {
      try {
        return JSON.parse(await fs.readFile(file, "utf8")) as T;
      } catch {
        return null;
      }
    }),
  );

  return rows.filter((row): row is T => row !== null);
}

export function putJson(pathname: string, value: unknown) {
  if (!useBlobStore()) return putJsonLocal(pathname, value);
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
  if (!useBlobStore()) return readJsonLocal(pathname, fallback);
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
  if (!useBlobStore()) return listJsonLocal<T>(prefix, limit);
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

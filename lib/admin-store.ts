import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";

function staticToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

function useBlobStore() {
  return Boolean(staticToken() || process.env.VERCEL);
}

function requirePersistentStore() {
  return process.env.RESET_REQUIRE_PERSISTENT_STORE === "1";
}

function assertFilesystemAllowed() {
  if (requirePersistentStore()) {
    throw new Error(
      "Persistent admin storage is required, but no persistent store is configured. Refusing ephemeral filesystem storage.",
    );
  }
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
 * directory on the hosting account.
 * Cloudflare Workers must use a persistent object store; while that store is
 * not attached, reads return empty/fallback data and ordinary writes are
 * refused so no admin/SEO data is silently written to ephemeral storage.
 *
 * Lead writes are the one emergency exception: while RESET is being cut over
 * to Workers, the lead API must still be allowed to continue to ClinicCards
 * and Telegram. The temporary lead object is intentionally not persisted here;
 * R2 becomes the durable source once its binding is attached.
 */
function authOptions() {
  const token = staticToken();
  return token ? ({ token } as const) : ({} as const);
}

export function isAdminStoreConfigured() {
  return useBlobStore() || !requirePersistentStore();
}

async function localHealth() {
  assertFilesystemAllowed();
  const root = localDataRoot();
  const probe = path.join(root, `.health-${process.pid}-${Date.now()}`);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(probe, "ok", "utf8");
  await fs.unlink(probe);
}

export async function getAdminStoreHealth() {
  if (!useBlobStore() && requirePersistentStore()) {
    return {
      configured: false,
      ok: false,
      mode: "unconfigured" as const,
      error: "Persistent storage is not configured on Cloudflare Workers",
    };
  }

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
  assertFilesystemAllowed();
  const destination = localPath(pathname);
  const directory = path.dirname(destination);
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporary, JSON.stringify(value), "utf8");
  await fs.rename(temporary, destination);
  return { pathname };
}

async function readJsonLocal<T>(pathname: string, fallback: T): Promise<T> {
  if (requirePersistentStore()) return fallback;
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
  if (requirePersistentStore()) return [];

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

  return rows.filter((row) => row !== null) as T[];
}

export function putJson(pathname: string, value: unknown) {
  if (!useBlobStore()) {
    if (requirePersistentStore() && pathname.startsWith("reset/leads/")) {
      console.warn("lead_persistence_deferred_until_r2", pathname);
      return Promise.resolve({ pathname, persisted: false });
    }
    return putJsonLocal(pathname, value);
  }
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

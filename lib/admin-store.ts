import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";

type R2ObjectLike = {
  key: string;
  uploaded?: Date | string;
};

type R2ObjectBodyLike = R2ObjectLike & {
  text(): Promise<string>;
};

type R2BucketLike = {
  get(key: string): Promise<R2ObjectBodyLike | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    objects: R2ObjectLike[];
    truncated?: boolean;
    cursor?: string;
  }>;
};

type ResetRuntimeGlobal = typeof globalThis & {
  __RESET_DATA_R2?: R2BucketLike;
  [key: symbol]: unknown;
};

function runtimeR2Store(): R2BucketLike | null {
  const runtime = globalThis as ResetRuntimeGlobal;

  const direct = runtime.__RESET_DATA_R2;
  if (direct && typeof direct.get === "function" && typeof direct.put === "function") {
    return direct;
  }

  // OpenNext exposes the current Cloudflare context under this shared symbol.
  // This fallback keeps R2 available even if a request is executed inside one
  // of OpenNext's patched server contexts instead of the wrapper global.
  const context = runtime[Symbol.for("__cloudflare-context__")] as
    | { env?: { RESET_DATA_R2?: R2BucketLike } }
    | undefined;
  const contextual = context?.env?.RESET_DATA_R2;
  return contextual && typeof contextual.get === "function" && typeof contextual.put === "function"
    ? contextual
    : null;
}

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
 * Storage priority:
 * 1. Cloudflare R2 binding on Workers.
 * 2. Vercel Blob when running on Vercel / with BLOB_READ_WRITE_TOKEN.
 * 3. Private filesystem on traditional Node hosting.
 *
 * When RESET_REQUIRE_PERSISTENT_STORE=1, filesystem writes are refused so a
 * Cloudflare deployment can never silently persist important data to an
 * ephemeral disk.
 */
function authOptions() {
  const token = staticToken();
  return token ? ({ token } as const) : ({} as const);
}

export function isAdminStoreConfigured() {
  return Boolean(runtimeR2Store()) || useBlobStore() || !requirePersistentStore();
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
  const r2 = runtimeR2Store();
  if (!r2 && !useBlobStore() && requirePersistentStore()) {
    return {
      configured: false,
      ok: false,
      mode: "unconfigured" as const,
      error: "Persistent storage is not configured on Cloudflare Workers",
    };
  }

  const mode = r2
    ? ("r2" as const)
    : useBlobStore()
      ? staticToken()
        ? ("token" as const)
        : ("oidc" as const)
      : ("filesystem" as const);

  try {
    if (r2) {
      await r2.list({ prefix: "reset/", limit: 1 });
    } else if (useBlobStore()) {
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

async function putJsonR2(pathname: string, value: unknown, r2: R2BucketLike) {
  await r2.put(pathname, JSON.stringify(value), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  return { pathname, persisted: true, store: "r2" as const };
}

async function readJsonR2<T>(pathname: string, fallback: T, r2: R2BucketLike): Promise<T> {
  try {
    const object = await r2.get(pathname);
    if (!object) return fallback;
    return JSON.parse(await object.text()) as T;
  } catch {
    return fallback;
  }
}

async function listJsonR2<T>(prefix: string, limit: number, r2: R2BucketLike): Promise<T[]> {
  try {
    const objects: R2ObjectLike[] = [];
    let cursor: string | undefined;

    do {
      const result = await r2.list({ prefix, limit: 1000, cursor });
      objects.push(...result.objects.filter((object) => object.key.endsWith(".json")));
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    const selected = objects
      .sort(
        (a, b) =>
          new Date(b.uploaded || 0).getTime() - new Date(a.uploaded || 0).getTime(),
      )
      .slice(0, limit);

    const rows = await Promise.all(
      selected.map(async (object): Promise<T | null> => {
        try {
          const body = await r2.get(object.key);
          if (!body) return null;
          return JSON.parse(await body.text()) as T;
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

export async function putJson(pathname: string, value: unknown) {
  const r2 = runtimeR2Store();
  if (r2) return putJsonR2(pathname, value, r2);

  if (useBlobStore()) {
    const auth = authOptions();
    return put(pathname, JSON.stringify(value), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
      ...auth,
    });
  }

  if (requirePersistentStore() && pathname.startsWith("reset/leads/")) {
    console.warn("lead_persistence_deferred_until_r2", pathname);
    return { pathname, persisted: false };
  }

  return putJsonLocal(pathname, value);
}

export async function readJson<T>(pathname: string, fallback: T): Promise<T> {
  const r2 = runtimeR2Store();
  if (r2) return readJsonR2(pathname, fallback, r2);

  if (useBlobStore()) {
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

  return readJsonLocal(pathname, fallback);
}

export async function listJson<T>(prefix: string, limit = 500): Promise<T[]> {
  const r2 = runtimeR2Store();
  if (r2) return listJsonR2<T>(prefix, limit, r2);

  if (useBlobStore()) {
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

  return listJsonLocal<T>(prefix, limit);
}

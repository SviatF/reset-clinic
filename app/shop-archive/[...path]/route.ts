import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARCHIVE_ROOT = path.resolve(process.cwd(), "shop.resetclinic.org 3");

function mimeFromBytes(buffer: Buffer, requestedPath: string) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "wOFF") return "font/woff";
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "wOF2") return "font/woff2";

  const ext = path.extname(requestedPath).toLowerCase();
  return ({
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  } as Record<string, string>)[ext] || "application/octet-stream";
}

function unwrapSavedBinary(buffer: Buffer) {
  const signatures: Array<{ start: Buffer; end?: Buffer }> = [
    { start: Buffer.from([0xff, 0xd8, 0xff]), end: Buffer.from([0xff, 0xd9]) },
    { start: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    { start: Buffer.from("RIFF") },
    { start: Buffer.from("GIF8") },
    { start: Buffer.from("wOFF") },
    { start: Buffer.from("wOF2") },
  ];

  for (const signature of signatures) {
    const start = buffer.indexOf(signature.start);
    if (start < 0) continue;
    if (!signature.end) return buffer.subarray(start);
    const end = buffer.lastIndexOf(signature.end);
    if (end >= start) return buffer.subarray(start, end + signature.end.length);
  }
  return buffer;
}

function candidatePaths(relative: string) {
  const normalized = relative.replace(/^\/+/, "");
  const candidates = [normalized];
  const ext = path.extname(normalized);
  if (ext && ext !== ".html") {
    candidates.push(`${normalized.slice(0, -ext.length)}_${ext.slice(1).toLowerCase()}.html`);
    candidates.push(`${normalized}.html`);
  }
  return [...new Set(candidates)];
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const relative = segments.join("/");

  for (const candidate of candidatePaths(relative)) {
    const resolved = path.resolve(ARCHIVE_ROOT, candidate);
    if (resolved !== ARCHIVE_ROOT && !resolved.startsWith(`${ARCHIVE_ROOT}${path.sep}`)) continue;

    try {
      const saved = await readFile(resolved);
      const output = unwrapSavedBinary(saved);
      const contentType = mimeFromBytes(output, relative);
      return new Response(new Uint8Array(output), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Try the next Chrome-save filename variant.
    }
  }

  return new Response("Not found", { status: 404 });
}

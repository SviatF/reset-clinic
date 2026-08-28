import { readFile } from "node:fs/promises";
import path from "node:path";
import { SHOP_IMAGE_SOURCES } from "../../../../lib/shop/image-sources";

export const runtime = "nodejs";
export const dynamic = "force-static";
export function generateStaticParams() { return Object.keys(SHOP_IMAGE_SOURCES).map((slug) => ({ slug: `${slug}.webp` })); }

function extractJpeg(source: Buffer) {
  const start = source.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  const endMarker = source.lastIndexOf(Buffer.from([0xff, 0xd9]));
  if (start < 0 || endMarker < 0 || endMarker <= start) return null;
  return source.subarray(start, endMarker + 2);
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = slug.replace(/\.webp$/i, "");
  const relative = SHOP_IMAGE_SOURCES[key];
  if (!relative) return new Response("Not found", { status: 404 });
  try {
    const filePath = path.join(process.cwd(), "shop.resetclinic.org 3", "wp-content", "uploads", relative);
    const wrapped = await readFile(filePath);
    const jpeg = extractJpeg(wrapped);
    if (!jpeg) return new Response("Invalid media", { status: 500 });
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

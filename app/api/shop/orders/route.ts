import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { putJson, readJson } from "../../../../lib/admin-store";
import { getShopProduct } from "../../../../lib/shop/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredOrder = {
  id: string;
  status: "new" | "confirmed" | "processing" | "shipped" | "completed" | "cancelled";
  createdAt: string;
  customer: { name: string; phone: string; email: string; city: string; delivery: string; comment: string };
  items: Array<{ slug: string; name: string; price: number; qty: number; subtotal: number }>;
  total: number;
};

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function normalizePhone(value: string) { return value.replace(/[^\d+]/g, "").replace(/^00/, "+"); }
function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `RS-${date}-${randomBytes(2).toString("hex").toUpperCase()}`;
}
function orderPath(id: string) { return `reset/shop-orders/${id}.json`; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = clean(body.name, 120);
    const phone = normalizePhone(clean(body.phone, 40));
    const email = clean(body.email, 160);
    const city = clean(body.city, 120);
    const delivery = clean(body.delivery, 80);
    const comment = clean(body.comment, 1200);
    const inputItems = Array.isArray(body.items) ? body.items : [];

    if (name.length < 2 || phone.replace(/\D/g, "").length < 9 || city.length < 2) {
      return NextResponse.json({ ok: false, error: "Заповніть ім’я, коректний телефон і місто." }, { status: 400 });
    }
    if (!inputItems.length || inputItems.length > 100) {
      return NextResponse.json({ ok: false, error: "Кошик порожній або містить забагато позицій." }, { status: 400 });
    }

    const items: StoredOrder["items"] = [];
    for (const raw of inputItems) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      const slug = clean(row.slug, 180);
      const qty = Math.min(99, Math.max(1, Math.floor(Number(row.qty) || 1)));
      const product = getShopProduct(slug);
      if (!product) return NextResponse.json({ ok: false, error: `Товар ${slug || "без назви"} більше недоступний.` }, { status: 409 });
      items.push({ slug: product.slug, name: product.name, price: product.price, qty, subtotal: product.price * qty });
    }
    if (!items.length) return NextResponse.json({ ok: false, error: "Не вдалося перевірити товари в кошику." }, { status: 400 });

    const id = createOrderId();
    const order: StoredOrder = {
      id,
      status: "new",
      createdAt: new Date().toISOString(),
      customer: { name, phone, email, city, delivery, comment },
      items,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
    await putJson(orderPath(id), order);
    return NextResponse.json({ ok: true, orderId: id, total: order.total }, { status: 201 });
  } catch (error) {
    console.error("RESET Shop order error", error);
    return NextResponse.json({ ok: false, error: "Не вдалося зберегти замовлення. Спробуйте ще раз." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const id = clean(request.nextUrl.searchParams.get("orderId"), 40).toUpperCase();
  const phone = normalizePhone(clean(request.nextUrl.searchParams.get("phone"), 40));
  if (!/^RS-\d{8}-[A-F0-9]{4}$/.test(id) || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ ok: false, error: "Вкажіть номер замовлення та телефон." }, { status: 400 });
  }
  const order = await readJson<StoredOrder | null>(orderPath(id), null);
  if (!order || normalizePhone(order.customer.phone) !== phone) {
    return NextResponse.json({ ok: false, error: "Замовлення не знайдено." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order: { id: order.id, status: order.status, createdAt: order.createdAt, total: order.total, items: order.items.map(({ name, qty }) => ({ name, qty })) } });
}

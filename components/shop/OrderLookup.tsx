"use client";

import { FormEvent, useState } from "react";

type Order = { id: string; status: string; createdAt: string; total: number; items: Array<{ name: string; qty: number }> };

const labels: Record<string, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  processing: "Комплектується",
  shipped: "Відправлено",
  completed: "Виконано",
  cancelled: "Скасовано",
};

export function OrderLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({ orderId: String(form.get("orderId") || ""), phone: String(form.get("phone") || "") });
    try {
      const response = await fetch(`/api/shop/orders?${params.toString()}`, { cache: "no-store" });
      const result = await response.json() as { ok?: boolean; order?: Order; error?: string };
      if (!response.ok || !result.ok || !result.order) throw new Error(result.error || "Замовлення не знайдено");
      setOrder(result.order);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося перевірити замовлення");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shop-order-lookup-wrap">
      <form className="shop-order-lookup" onSubmit={submit}>
        <label>Номер замовлення<input name="orderId" required placeholder="RS-20260831-AB12" autoComplete="off" /></label>
        <label>Телефон<input name="phone" required placeholder="+380…" autoComplete="tel" /></label>
        <button type="submit" disabled={loading}>{loading ? "Перевіряємо…" : "Знайти замовлення"}</button>
      </form>
      {error ? <p className="shop-form-error">{error}</p> : null}
      {order ? <section className="shop-order-found">
        <div className="shop-order-found-head"><div><span>Замовлення</span><strong>{order.id}</strong></div><b>{labels[order.status] || order.status}</b></div>
        <p>{new Date(order.createdAt).toLocaleString("uk-UA")}</p>
        {order.items.map((item, index) => <div className="shop-order-line" key={`${item.name}-${index}`}><span>{item.name}</span><strong>× {item.qty}</strong></div>)}
        <div className="shop-order-total"><span>Разом</span><strong>{order.total.toLocaleString("uk-UA")} грн</strong></div>
      </section> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const CART_KEY = "reset_shop_cart";
type Item = { slug: string; name: string; price: number; qty: number };

export function CheckoutClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Item[]); } catch { setItems([]); }
    setReady(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      city: String(form.get("city") || ""),
      delivery: String(form.get("delivery") || ""),
      comment: String(form.get("comment") || ""),
      items: items.map(({ slug, qty }) => ({ slug, qty })),
    };
    try {
      const response = await fetch("/api/shop/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { ok?: boolean; orderId?: string; error?: string };
      if (!response.ok || !result.ok || !result.orderId) throw new Error(result.error || "Не вдалося створити замовлення");
      localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new Event("reset-cart-updated"));
      setItems([]);
      setOrderId(result.orderId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося створити замовлення");
    } finally {
      setSending(false);
    }
  }

  if (!ready) return <div className="shop-empty">Завантажуємо замовлення…</div>;
  if (orderId) return <div className="shop-order-success"><span>Замовлення прийнято</span><h2>{orderId}</h2><p>Ми зберегли замовлення. Номер можна використати на сторінці «Мої замовлення».</p><Link className="shop-button" href="/shop/">На головну</Link></div>;
  if (!items.length) return <div className="shop-empty"><p>Кошик порожній — оформлювати поки нічого.</p><Link className="shop-button" href="/shop/product-category/face/">До каталогу</Link></div>;

  return (
    <div className="shop-checkout-grid">
      <form className="shop-checkout-form" onSubmit={submit}>
        <h2>Контактні дані</h2>
        <label>Ім’я та прізвище<input name="name" required autoComplete="name" /></label>
        <label>Телефон<input name="phone" required autoComplete="tel" placeholder="+380…" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" /></label>
        <h2>Доставка</h2>
        <label>Місто<input name="city" required autoComplete="address-level2" /></label>
        <label>Спосіб отримання<select name="delivery" defaultValue="nova-poshta"><option value="nova-poshta">Нова пошта</option><option value="pickup">Самовивіз із RESET Clinic</option><option value="courier">Кур’єр — узгодити з менеджером</option></select></label>
        <label>Коментар<textarea name="comment" rows={4} placeholder="Відділення, адреса або побажання до замовлення" /></label>
        {error ? <p className="shop-form-error">{error}</p> : null}
        <button className="shop-button" type="submit" disabled={sending}>{sending ? "Створюємо замовлення…" : "Підтвердити замовлення"}</button>
      </form>
      <aside className="shop-order-summary">
        <h2>Ваше замовлення</h2>
        {items.map((item) => <div className="shop-order-line" key={item.slug}><span>{item.name} × {item.qty}</span><strong>{(item.price * item.qty).toLocaleString("uk-UA")} грн</strong></div>)}
        <div className="shop-order-total"><span>Разом</span><strong>{total.toLocaleString("uk-UA")} грн</strong></div>
        <p>Фінальна сума перевіряється на сервері за актуальними цінами каталогу.</p>
      </aside>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CART_KEY = "reset_shop_cart";
type Item = { slug: string; name: string; price: number; qty: number };

function readCart(): Item[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Item[];
    return parsed.filter((item) => item?.slug && Number(item.qty) > 0);
  } catch {
    return [];
  }
}

export function CartClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { setItems(readCart()); setReady(true); }, []);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  function save(next: Item[]) {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("reset-cart-updated"));
  }
  function change(slug: string, qty: number) {
    save(items.map((item) => item.slug === slug ? { ...item, qty } : item).filter((item) => item.qty > 0));
  }
  function remove(slug: string) { save(items.filter((item) => item.slug !== slug)); }

  if (!ready) return <div className="shop-empty">Завантажуємо кошик…</div>;
  if (!items.length) return <div className="shop-empty"><p>Ваш кошик поки порожній.</p><Link className="shop-button" href="/shop/product-category/face/">Перейти в каталог</Link></div>;

  return (
    <div className="shop-cart">
      {items.map((item) => (
        <div className="shop-cart-item" key={item.slug}>
          <div>
            <Link href={`/shop/product/${item.slug}/`}><strong>{item.name}</strong></Link>
            <small>{item.price.toLocaleString("uk-UA")} грн / шт.</small>
            <button className="shop-remove-link" type="button" onClick={() => remove(item.slug)}>Видалити</button>
          </div>
          <div className="shop-cart-qty"><button type="button" onClick={() => change(item.slug, item.qty - 1)}>−</button><span>{item.qty}</span><button type="button" onClick={() => change(item.slug, item.qty + 1)}>+</button></div>
          <strong>{(item.price * item.qty).toLocaleString("uk-UA")} грн</strong>
        </div>
      ))}
      <div className="shop-cart-total"><span>Разом</span><strong>{total.toLocaleString("uk-UA")} грн</strong></div>
      <div className="shop-cart-actions"><Link className="shop-button shop-button-secondary" href="/shop/product-category/face/">Продовжити покупки</Link><Link className="shop-button" href="/shop/checkout/">Оформити замовлення</Link></div>
    </div>
  );
}

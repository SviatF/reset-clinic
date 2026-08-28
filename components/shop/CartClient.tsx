"use client";

import { useEffect, useMemo, useState } from "react";

const CART_KEY = "reset_shop_cart";
type Item = { slug: string; name: string; price: number; qty: number };

export function CartClient() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { setItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); }, []);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  function save(next: Item[]) { setItems(next); localStorage.setItem(CART_KEY, JSON.stringify(next)); }
  function change(slug: string, qty: number) { save(items.map((item) => item.slug === slug ? { ...item, qty } : item).filter((item) => item.qty > 0)); }
  if (!items.length) return <div className="shop-empty">Ваш кошик поки порожній.</div>;
  return (
    <div className="shop-cart">
      {items.map((item) => <div className="shop-cart-item" key={item.slug}><div><strong>{item.name}</strong><small>{item.price.toLocaleString("uk-UA")} грн</small></div><div className="shop-cart-qty"><button onClick={() => change(item.slug, item.qty - 1)}>−</button><span>{item.qty}</span><button onClick={() => change(item.slug, item.qty + 1)}>+</button></div><strong>{(item.price * item.qty).toLocaleString("uk-UA")} грн</strong></div>)}
      <div className="shop-cart-total"><span>Разом</span><strong>{total.toLocaleString("uk-UA")} грн</strong></div>
      <a className="shop-button" href="mailto:reset.clinic.lviv@gmail.com?subject=Замовлення RESET Shop">Оформити замовлення</a>
    </div>
  );
}

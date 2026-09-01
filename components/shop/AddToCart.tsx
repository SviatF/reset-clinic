"use client";

import { useState } from "react";

const CART_KEY = "reset_shop_cart";

type CartItem = { slug: string; name: string; price: number; qty: number };

export function AddToCart({ slug, name, price }: { slug: string; name: string; price: number }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function add() {
    let current: CartItem[] = [];
    try { current = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartItem[]; } catch { current = []; }
    const existing = current.find((item) => item.slug === slug);
    if (existing) existing.qty += qty;
    else current.push({ slug, name, price, qty });
    localStorage.setItem(CART_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("reset-cart-updated"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="shop-add-row">
      <div className="shop-add-qty" aria-label="Кількість">
        <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>−</button>
        <span>{qty}</span>
        <button type="button" onClick={() => setQty((value) => Math.min(99, value + 1))}>+</button>
      </div>
      <button className="shop-button" type="button" onClick={add}>{added ? "Додано ✓" : "Додати в кошик"}</button>
    </div>
  );
}

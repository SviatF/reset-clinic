"use client";

const CART_KEY = "reset_shop_cart";

export function AddToCart({ slug, name, price }: { slug: string; name: string; price: number }) {
  function add() {
    const current = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Array<{slug:string;name:string;price:number;qty:number}>;
    const existing = current.find((item) => item.slug === slug);
    if (existing) existing.qty += 1; else current.push({ slug, name, price, qty: 1 });
    localStorage.setItem(CART_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("reset-cart-updated"));
  }
  return <button className="shop-button" type="button" onClick={add}>Додати в кошик</button>;
}

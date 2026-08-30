"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CART_KEY = "reset_shop_cart";
const nav = [
  ["ГОЛОВНА", "/shop/"],
  ["ОБЛИЧЧЯ", "/shop/product-category/face/"],
  ["ТІЛО", "/shop/product-category/body/"],
  ["ВОЛОССЯ", "/shop/product-category/hair/"],
  ["СЕРТИФІКАТ", "/shop/product-category/gifts/"],
  ["ПРО НАС", "/shop/about/"],
  ["КЛІЄНТУ", "/shop/delivery/"],
] as const;

function AccountIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.3 3.2-6.5 7.5-6.5s6.7 2.2 7.5 6.5"/></svg>;
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>;
}
function BagIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5h14l1 12H4l1-12Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
}

export function ShopHeader() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      try {
        const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Array<{ qty?: number }>;
        setCount(items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0));
      } catch {
        setCount(0);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("reset-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("reset-cart-updated", sync);
    };
  }, []);

  return (
    <header className="shop-header">
      <div className="shop-header-inner">
        <Link className="shop-wordmark" href="/shop/" aria-label="RESET Clinic Shop — головна">
          <span className="shop-wordmark-main">RESĒT</span>
          <span className="shop-wordmark-sub">CLINIC</span>
        </Link>
        <nav className="shop-nav" aria-label="Каталог RESET Shop">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="shop-actions">
          <Link className="shop-icon-link" href="/shop/my-account/" aria-label="Особистий кабінет"><AccountIcon /></Link>
          <Link className="shop-icon-link" href="/shop/?s=" aria-label="Пошук"><SearchIcon /></Link>
          <Link className="shop-icon-link shop-bag-link" href="/shop/cart/" aria-label={`Кошик: ${count} товарів`}><BagIcon /><span className="shop-cart-count">{count}</span></Link>
        </div>
      </div>
    </header>
  );
}

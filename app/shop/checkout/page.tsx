import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClient } from "../../../components/shop/CheckoutClient";

export const metadata: Metadata = { title: "Оформлення замовлення", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return <section className="shop-static"><div className="shop-container"><div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / <Link href="/shop/cart/">Кошик</Link> / Оформлення</div><div className="shop-static-head"><span className="shop-eyebrow">Замовлення</span><h1>Оформлення</h1></div><CheckoutClient /></div></section>;
}

import type { Metadata } from "next";
import { CartClient } from "../../../components/shop/CartClient";

export const metadata: Metadata = { title: "Кошик", robots: { index: false, follow: false } };

export default function CartPage() {
  return <section className="shop-static"><div className="shop-container shop-static-inner"><span className="shop-eyebrow">RESET Shop</span><h1>Кошик</h1><CartClient /></div></section>;
}

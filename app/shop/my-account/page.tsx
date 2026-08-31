import type { Metadata } from "next";
import Link from "next/link";
import { OrderLookup } from "../../../components/shop/OrderLookup";

export const metadata: Metadata = { title: "Мої замовлення", robots: { index: false, follow: false } };

export default function MyAccountPage() {
  return (
    <article className="shop-static">
      <div className="shop-container shop-static-inner">
        <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / Мої замовлення</div>
        <span className="shop-eyebrow">Клієнту</span>
        <h1>Перевірити замовлення</h1>
        <p>Введіть номер, який отримали після оформлення, та телефон із замовлення. Ми покажемо актуальний статус без створення окремого акаунта.</p>
        <OrderLookup />
      </div>
    </article>
  );
}

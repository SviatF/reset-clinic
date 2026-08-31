import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Про RESET Shop",
  description: "RESET Shop — професійний домашній догляд, підібраний командою RESET Clinic.",
  alternates: { canonical: "/our-story/" },
};

export default function OurStoryPage() {
  return (
    <article className="shop-static">
      <div className="shop-container shop-static-inner">
        <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / Про нас</div>
        <span className="shop-eyebrow">RESET Clinic</span>
        <h1>Догляд, який має професійну логіку</h1>
        <p>RESET Shop створений як продовження підходу RESET Clinic: не випадковий набір косметики, а зрозуміла добірка засобів для щоденного домашнього догляду.</p>
        <h2>Професійний підбір</h2>
        <p>У каталозі зібрані засоби для обличчя, тіла та волосся. Картка кожного товару містить актуальну ціну, опис, спосіб використання та склад — без залежності від старого WordPress/WooCommerce.</p>
        <h2>Оригінальна продукція</h2>
        <p>Магазин працює в єдиній екосистемі RESET Clinic. Якщо ви не впевнені, який засіб обрати, команда клініки допоможе сформувати догляд відповідно до ваших потреб.</p>
        <Link className="shop-button" href="/shop/product-category/face/">Перейти до каталогу</Link>
      </div>
    </article>
  );
}

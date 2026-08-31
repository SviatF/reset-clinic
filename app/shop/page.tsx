import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "../../components/shop/ProductCard";
import { SHOP_PRODUCTS } from "../../lib/shop/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Професійний догляд",
  description: "Професійні засоби для обличчя, тіла та волосся, підібрані командою RESET Clinic.",
  alternates: { canonical: "/" },
};

const categories = [
  { href: "/shop/product-category/face/", title: "Обличчя", caption: "Очищення, активи, креми та SPF" },
  { href: "/shop/product-category/body/", title: "Тіло", caption: "Щоденний та інтенсивний догляд" },
  { href: "/shop/product-category/hair/", title: "Волосся", caption: "Очищення, відновлення та стайлінг" },
  { href: "/shop/product-category/gifts/", title: "Сертифікат", caption: "Подарунок із турботою про себе" },
];

export default function ShopHomePage() {
  const featured = SHOP_PRODUCTS.slice(0, 8);
  const heroProducts = SHOP_PRODUCTS.slice(0, 5);

  return (
    <>
      <section className="shop-home-hero">
        <div className="shop-home-hero-stage" aria-hidden="true">
          {heroProducts.map((product, index) => (
            <img key={product.slug} className={`shop-home-bottle shop-home-bottle-${index + 1}`} src={product.image} alt="" />
          ))}
        </div>
        <div className="shop-home-hero-inner shop-container">
          <div className="shop-home-card">
            <h1>Ваша шкіра — під професійним наглядом</h1>
            <p>Добірка найкращих професійних засобів для здоров’я вашої шкіри. Консультуємо, підбираємо та допомагаємо досягти видимого результату.</p>
            <Link className="shop-button shop-button-arrow" href="/shop/product-category/face/">Перейти в каталог <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="shop-benefits" aria-label="Переваги RESET Shop">
        <div className="shop-container shop-benefits-grid">
          <div><span>01</span><strong>Безкоштовна доставка</strong><p>Для замовлень від суми, зазначеної при оформленні.</p></div>
          <div><span>02</span><strong>Професійний підбір</strong><p>Засоби, які рекомендує команда RESET Clinic.</p></div>
          <div><span>03</span><strong>Офіційна гарантія</strong><p>Оригінальна продукція та прозорі умови замовлення.</p></div>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-section-head">
            <h2>Каталог</h2>
            <p>Обирайте напрям догляду — усі картки, категорії та товари працюють як нативні Next.js сторінки.</p>
          </div>
          <div className="shop-category-grid">
            {categories.map((category) => (
              <Link className="shop-category-tile" href={category.href} key={category.href}>
                <span>{category.title}</span>
                <small>{category.caption}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-section shop-section-white">
        <div className="shop-container">
          <div className="shop-section-head">
            <h2>Добірка RESET</h2>
            <Link href="/shop/product-category/face/">Дивитися каталог →</Link>
          </div>
          <div className="shop-product-grid">
            {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </div>
      </section>
    </>
  );
}

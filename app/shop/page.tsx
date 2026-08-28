import Link from "next/link";
import { ProductCard } from "../../components/shop/ProductCard";
import { SHOP_PRODUCTS } from "../../lib/shop/catalog";

const categories = [
  ["Обличчя", "Професійний догляд", "face"],
  ["Тіло", "Щоденний ритуал", "body"],
  ["Волосся", "Очищення та відновлення", "hair"],
  ["Сертифікат", "Подарунок RESET", "gifts"],
] as const;

export default function ShopHomePage() {
  return (
    <>
      <section className="shop-hero">
        <div className="shop-hero-copy">
          <span className="shop-eyebrow">RESET Clinic · curated care</span>
          <h1>Догляд,<br />який має<br />сенс.</h1>
          <p>Добірка професійних засобів для шкіри та волосся, яку ми зібрали за принципом RESET: менше шуму, більше зрозумілого догляду.</p>
          <Link className="shop-button" href="/shop/product-category/face/">Перейти до каталогу</Link>
        </div>
        <div className="shop-hero-art" aria-hidden="true" />
      </section>

      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-section-head"><h2>Категорії</h2><p>Обирайте засоби за зоною догляду. Кожна категорія та кожен товар мають окрему SSR-сторінку для швидкого завантаження та SEO.</p></div>
          <div className="shop-category-grid">
            {categories.map(([name, caption, slug]) => (
              <Link className="shop-category-tile" key={slug} href={`/shop/product-category/${slug}/`}>
                <span>{name}</span><small>{caption}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-container">
          <div className="shop-section-head"><h2>Вибір RESET</h2><p>Перші позиції з перенесеного каталогу. Повний каталог містить {SHOP_PRODUCTS.length} товарів.</p></div>
          <div className="shop-product-grid">{SHOP_PRODUCTS.slice(0, 12).map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </div>
      </section>
    </>
  );
}

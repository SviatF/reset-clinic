import Link from "next/link";

const nav = [
  ["Обличчя", "/shop/product-category/face/"],
  ["Тіло", "/shop/product-category/body/"],
  ["Волосся", "/shop/product-category/hair/"],
  ["Сертифікат", "/shop/product-category/gifts/"],
] as const;

export function ShopHeader() {
  return (
    <header className="shop-header">
      <div className="shop-announcement">Безкоштовна доставка від 2500 грн · Оригінальна професійна косметика</div>
      <div className="shop-header-inner">
        <Link className="shop-wordmark" href="/shop/">RESET <span>SHOP</span></Link>
        <nav className="shop-nav" aria-label="Каталог RESET Shop">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="shop-actions">
          <Link href="/shop/delivery/">Доставка</Link>
          <Link className="shop-cart-link" href="/shop/cart/">Кошик</Link>
        </div>
      </div>
    </header>
  );
}

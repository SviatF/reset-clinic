import Link from "next/link";

const nav = [
  ["Обличчя", "/product-category/face/"],
  ["Тіло", "/product-category/body/"],
  ["Волосся", "/product-category/hair/"],
  ["Сертифікат", "/product-category/gifts/"],
] as const;

export function ShopHeader() {
  return (
    <header className="shop-header">
      <div className="shop-announcement">Безкоштовна доставка від 2500 грн · Оригінальна професійна косметика</div>
      <div className="shop-header-inner">
        <Link className="shop-wordmark" href="/">RESET <span>SHOP</span></Link>
        <nav className="shop-nav" aria-label="Каталог RESET Shop">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="shop-actions">
          <Link href="/delivery/">Доставка</Link>
          <Link className="shop-cart-link" href="/cart/">Кошик</Link>
        </div>
      </div>
    </header>
  );
}

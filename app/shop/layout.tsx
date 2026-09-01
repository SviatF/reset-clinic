import type { Metadata } from "next";
import Link from "next/link";
import { ShopHeader } from "../../components/shop/ShopHeader";
import "./shop.css";
import "./shop-functional.css";
import "./shop-audit.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.resetclinic.org"),
  title: { default: "RESET SHOP", template: "%s | RESET SHOP" },
  description: "Професійний догляд за обличчям, тілом і волоссям від RESET Clinic.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="reset-shop">
      <ShopHeader />
      <main>{children}</main>
      <footer className="shop-footer">
        <div>
          <Link className="shop-footer-brand" href="/shop/">RESĒT <span>CLINIC</span></Link>
          <p>Професійний догляд, підібраний командою RESET Clinic.</p>
        </div>
        <div>
          <strong>Каталог</strong>
          <Link href="/shop/product-category/face/">Обличчя</Link>
          <Link href="/shop/product-category/body/">Тіло</Link>
          <Link href="/shop/product-category/hair/">Волосся</Link>
          <Link href="/shop/product-category/gifts/">Сертифікат</Link>
        </div>
        <div>
          <strong>Клієнту</strong>
          <Link href="/shop/delivery/">Доставка</Link>
          <Link href="/shop/faq/">FAQ</Link>
          <Link href="/shop/my-account/">Мої замовлення</Link>
          <Link href="/shop/cart/">Кошик</Link>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ShopHeader } from "../../components/shop/ShopHeader";
import "./shop.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.resetclinic.org"),
  title: { default: "RESET Shop — професійна косметика", template: "%s | RESET Shop" },
  description: "Професійний догляд за обличчям, тілом і волоссям від RESET Clinic.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="reset-shop">
      <ShopHeader />
      <main>{children}</main>
      <footer className="shop-footer">
        <div><Link className="shop-wordmark" href="/shop/">RESET <span>SHOP</span></Link><p>Догляд, який має сенс. Добірка RESET Clinic.</p></div>
        <div><strong>Клієнту</strong><Link href="/shop/delivery/">Доставка</Link><Link href="/shop/return-cancellations/">Повернення</Link><Link href="/shop/faq/">FAQ</Link></div>
        <div><strong>Про нас</strong><Link href="/shop/our-story/">Філософія</Link><Link href="/shop/our-difference/">Переваги</Link><a href="https://resetclinic.org">RESET Clinic</a></div>
      </footer>
    </div>
  );
}

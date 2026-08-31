import Link from "next/link";
import { SHOP_INFO_PAGES } from "../../lib/shop/info-pages";

export function ShopInfoPage({ pageKey }: { pageKey: keyof typeof SHOP_INFO_PAGES }) {
  const page = SHOP_INFO_PAGES[pageKey];
  return <article className="shop-static"><div className="shop-container shop-static-inner"><div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / {page.title}</div><span className="shop-eyebrow">Клієнту</span><h1>{page.title}</h1>{page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div></article>;
}

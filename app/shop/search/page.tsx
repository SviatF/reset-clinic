import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "../../../components/shop/ProductCard";
import { SHOP_PRODUCTS } from "../../../lib/shop/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Пошук", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLocaleLowerCase("uk-UA");
  const products = query
    ? SHOP_PRODUCTS.filter((product) => {
        const haystack = [product.name, product.details, product.ingredients, product.usage, ...product.categories, ...Object.values(product.attributes)].join(" ").toLocaleLowerCase("uk-UA");
        return haystack.includes(query);
      })
    : [];

  return (
    <section className="shop-search-page">
      <div className="shop-container">
        <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / Пошук</div>
        <div className="shop-search-head">
          <div><span className="shop-eyebrow">Каталог</span><h1>Пошук товарів</h1></div>
          <form className="shop-search-form" action="/shop/search/" method="get">
            <input name="q" defaultValue={q} type="search" placeholder="Назва, категорія або властивість" aria-label="Пошук товарів" autoFocus />
            <button type="submit">Знайти</button>
          </form>
        </div>
        {query ? (
          <>
            <p className="shop-search-result-label">За запитом «{q}» знайдено: {products.length}</p>
            {products.length ? <div className="shop-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="shop-empty">Нічого не знайдено. Спробуйте інший запит.</div>}
          </>
        ) : <div className="shop-empty">Введіть назву засобу або категорію.</div>}
      </div>
    </section>
  );
}

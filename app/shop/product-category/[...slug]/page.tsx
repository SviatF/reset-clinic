import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../../components/shop/ProductCard";
import { getProductsByCategory, getShopCategory } from "../../../../lib/shop/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const category = getShopCategory(key);
  if (!category) return {};
  return { title: category.name, description: category.description, alternates: { canonical: `/product-category/${key}/` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const category = getShopCategory(key);
  if (!category) notFound();
  const products = getProductsByCategory(key);
  const parent = slug.length > 1 ? slug[0] : null;
  return (
    <>
      <section className="shop-category-hero"><div className="shop-container">
        <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link>{parent ? <> / <Link href={`/shop/product-category/${parent}/`}>{getShopCategory(parent)?.name}</Link></> : null}</div>
        <span className="shop-eyebrow">Каталог · {products.length} позицій</span>
        <h1>{category.name}</h1><p>{category.description}</p>
      </div></section>
      <section className="shop-section"><div className="shop-container">
        {products.length ? <div className="shop-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="shop-empty">У цій категорії поки немає товарів.</div>}
      </div></section>
    </>
  );
}

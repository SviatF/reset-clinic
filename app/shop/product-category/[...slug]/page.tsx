import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../../components/shop/ProductCard";
import { getProductsByCategory, getShopCategory } from "../../../../lib/shop/catalog";

export const dynamic = "force-dynamic";

function normalizeCategorySegments(input: string[]) {
  const segments = input.map((segment) => decodeURIComponent(segment)).filter(Boolean);
  if (segments.at(-1)?.toLowerCase() === "index.html") segments.pop();

  // Browser-saved WooCommerce archives contain /page/1/ and /page/2/. The
  // Next.js catalog renders the complete category, so treat those as the parent.
  const pageIndex = segments.findIndex((segment) => segment.toLowerCase() === "page");
  if (pageIndex !== -1 && /^\d+$/.test(segments[pageIndex + 1] || "")) {
    segments.splice(pageIndex);
  }

  return segments;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const normalized = normalizeCategorySegments(slug);
  const key = normalized.join("/");
  const category = getShopCategory(key);
  if (!category) return {};
  return { title: category.name, description: category.description, alternates: { canonical: `/product-category/${key}/` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const normalized = normalizeCategorySegments(slug);
  const key = normalized.join("/");
  const category = getShopCategory(key);
  if (!category) notFound();
  const products = getProductsByCategory(key);
  const parent = normalized.length > 1 ? normalized[0] : null;
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

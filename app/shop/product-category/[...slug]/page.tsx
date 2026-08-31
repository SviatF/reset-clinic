import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "../../../../components/shop/ProductCard";
import { SHOP_CATEGORIES, getProductsByCategory, getShopCategory } from "../../../../lib/shop/catalog";

export const dynamic = "force-dynamic";

function normalizeCategorySegments(input: string[]) {
  const segments = input.map((segment) => decodeURIComponent(segment)).filter(Boolean);
  if (segments.at(-1)?.toLowerCase() === "index.html") segments.pop();
  const pageIndex = segments.findIndex((segment) => segment.toLowerCase() === "page");
  if (pageIndex !== -1 && /^\d+$/.test(segments[pageIndex + 1] || "")) segments.splice(pageIndex);
  return segments;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = normalizeCategorySegments(slug).join("/");
  const category = getShopCategory(key);
  if (!category) return {};
  return { title: category.name, description: category.description, alternates: { canonical: `/product-category/${key}/` } };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "featured" } = await searchParams;
  const normalized = normalizeCategorySegments(slug);
  const key = normalized.join("/");
  const category = getShopCategory(key);
  if (!category) notFound();

  const products = [...getProductsByCategory(key)];
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name));

  const parent = normalized.length > 1 ? normalized[0] : null;
  const children = Object.entries(SHOP_CATEGORIES).filter(([slugKey]) => slugKey.startsWith(`${key}/`) && slugKey.split("/").length === normalized.length + 1);

  return (
    <>
      <section className="shop-category-hero"><div className="shop-container">
        <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link>{parent ? <> / <Link href={`/shop/product-category/${parent}/`}>{getShopCategory(parent)?.name}</Link></> : null}</div>
        <span className="shop-eyebrow">Каталог · {products.length} позицій</span>
        <h1>{category.name}</h1><p>{category.description}</p>
      </div></section>
      <section className="shop-section"><div className="shop-container">
        <div className="shop-catalog-toolbar">
          <div className="shop-category-pills">
            {children.map(([childKey, child]) => <Link key={childKey} href={`/shop/product-category/${childKey}/`}>{child.name}</Link>)}
          </div>
          <form className="shop-sort-form" method="get">
            <label htmlFor="shop-sort">Сортування</label>
            <select id="shop-sort" name="sort" defaultValue={sort}>
              <option value="featured">За замовчуванням</option>
              <option value="price-asc">Ціна: від нижчої</option>
              <option value="price-desc">Ціна: від вищої</option>
              <option value="name">За назвою</option>
            </select>
            <button type="submit">Застосувати</button>
          </form>
        </div>
        {products.length ? <div className="shop-product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="shop-empty">У цій категорії поки немає товарів.</div>}
      </div></section>
    </>
  );
}

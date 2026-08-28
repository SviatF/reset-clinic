import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "../../../../components/shop/AddToCart";
import { ProductCard } from "../../../../components/shop/ProductCard";
import { SHOP_PRODUCTS, formatShopPrice, getShopProduct } from "../../../../lib/shop/catalog";

export const dynamicParams = false;
export function generateStaticParams() { return SHOP_PRODUCTS.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getShopProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.details.slice(0, 160) || `${product.name} — професійна косметика в RESET Shop.`,
    alternates: { canonical: `/product/${product.slug}/` },
    openGraph: { title: product.name, description: product.details.slice(0, 160), images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getShopProduct(slug);
  if (!product) notFound();
  const related = SHOP_PRODUCTS.filter((item) => item.slug !== product.slug && item.categories.some((category) => product.categories.includes(category))).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [`https://shop.resetclinic.org${product.image}`],
    description: product.details,
    offers: { "@type": "Offer", priceCurrency: "UAH", price: product.price, availability: "https://schema.org/InStock", url: `https://shop.resetclinic.org/product/${product.slug}/` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="shop-product-page">
        <div className="shop-container">
          <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / <Link href={`/shop/product-category/${product.categories[0]}/`}>{product.categories[0]}</Link> / {product.name}</div>
          <div className="shop-product-main">
            <div className="shop-product-gallery"><img src={product.image} alt={product.name} /></div>
            <div className="shop-product-info">
              <span className="shop-eyebrow">RESET selection</span>
              <h1 className="shop-product-title">{product.name}</h1>
              <div className="shop-product-price"><strong>{formatShopPrice(product.price)}</strong>{product.compareAtPrice ? <del>{formatShopPrice(product.compareAtPrice)}</del> : null}</div>
              {product.details ? <p className="shop-product-lead">{product.details}</p> : null}
              <div className="shop-attributes">{Object.entries(product.attributes).map(([name, value]) => <div className="shop-attribute" key={name}><span>{name}</span><strong>{value}</strong></div>)}</div>
              <AddToCart slug={product.slug} name={product.name} price={product.price} />
            </div>
          </div>
          <div className="shop-detail-sections">
            <section className="shop-detail"><h2>Про засіб</h2><p>{product.details || "Професійний засіб із добірки RESET Shop."}</p></section>
            <section className="shop-detail"><h2>Як використовувати</h2><p>{product.usage || "Використовуйте відповідно до рекомендацій виробника."}</p></section>
            <section className="shop-detail"><h2>Склад</h2><p>{product.ingredients || "Склад уточнюється на упаковці товару."}</p></section>
          </div>
        </div>
      </article>
      {related.length ? <section className="shop-section"><div className="shop-container"><div className="shop-section-head"><h2>Також обирають</h2></div><div className="shop-product-grid">{related.map((item) => <ProductCard key={item.slug} product={item} />)}</div></div></section> : null}
    </>
  );
}

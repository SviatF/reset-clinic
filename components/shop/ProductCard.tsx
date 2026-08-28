import Link from "next/link";
import type { ShopProduct } from "../../lib/shop/catalog-types";
import { formatShopPrice } from "../../lib/shop/catalog";

export function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <article className="shop-product-card">
      <Link className="shop-product-image" href={`/product/${product.slug}/`}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="shop-product-copy">
        <p className="shop-product-kicker">RESET selection</p>
        <h3><Link href={`/product/${product.slug}/`}>{product.name}</Link></h3>
        <div className="shop-price-row">
          <strong>{formatShopPrice(product.price)}</strong>
          {product.compareAtPrice ? <del>{formatShopPrice(product.compareAtPrice)}</del> : null}
        </div>
      </div>
    </article>
  );
}

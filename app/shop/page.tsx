import { loadLegacyShopHome } from "../../lib/shop/legacy-renderer";

export const dynamic = "force-static";

export default async function ShopHomePage() {
  const page = await loadLegacyShopHome();

  return (
    <div
      className={`legacy-shop-root ${page.bodyClass}`}
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  );
}

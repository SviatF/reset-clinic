import type { Metadata } from "next";
import { ShopInfoPage } from "../../../components/shop/ShopInfoPage";
export const metadata: Metadata = { title: "Доставка", alternates: { canonical: "/delivery/" } };
export default function Page() { return <ShopInfoPage pageKey="delivery" />; }

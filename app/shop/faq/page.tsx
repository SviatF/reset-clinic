import type { Metadata } from "next";
import { ShopInfoPage } from "../../../components/shop/ShopInfoPage";
export const metadata: Metadata = { title: "FAQ", alternates: { canonical: "/faq/" } };
export default function Page() { return <ShopInfoPage pageKey="faq" />; }

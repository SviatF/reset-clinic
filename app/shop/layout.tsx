import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.resetclinic.org"),
  title: { default: "RESET SHOP", template: "%s | RESET SHOP" },
  description: "Професійний догляд за обличчям, тілом і волоссям від RESET Clinic.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}

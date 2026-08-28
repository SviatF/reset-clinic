import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SHOP_INFO_PAGES } from "../../../lib/shop/info-pages";

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(SHOP_INFO_PAGES).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = SHOP_INFO_PAGES[slug];
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/${slug}/` } };
}

export default async function ShopInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = SHOP_INFO_PAGES[slug];
  if (!page) notFound();
  return (
    <article className="shop-static"><div className="shop-container shop-static-inner">
      <div className="shop-breadcrumbs"><Link href="/shop/">RESET Shop</Link> / {page.title}</div>
      <span className="shop-eyebrow">Інформація</span><h1>{page.title}</h1>
      {page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
    </div></article>
  );
}

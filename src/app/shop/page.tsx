import type { Metadata } from "next";
import ShopPageClient from "./ShopPageClient";
import { CATEGORY_LABELS } from "./constants";
import { SITE_NAME } from "../lib/seo";
import { breadcrumbJsonLd } from "../lib/jsonld";

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const title = categoryLabel ? `${categoryLabel} Collection` : "Shop All Clothing";
  const description = categoryLabel
    ? `Shop ${categoryLabel} at ${SITE_NAME} — authentic, quality stitched and unstitched clothing, delivered across Pakistan.`
    : `Browse the full ${SITE_NAME} collection — Western Fashion, Pakistani Fashion, Top & Jeans, and Maxi styles for men and women.`;
  const canonical = categoryLabel ? `/shop?category=${category}` : "/shop";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: categoryLabel ?? "Shop", path: categoryLabel ? `/shop?category=${category}` : "/shop" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ShopPageClient />
    </>
  );
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";
import { CATEGORY_LABELS } from "./shop/constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type SitemapProduct = {
  slug: string;
  updatedAt?: string;
};

async function fetchProductSlugs(): Promise<SitemapProduct[]> {
  if (!API_BASE_URL) return [];
  try {
    const res = await fetch(
      `${API_BASE_URL}/universalFilter?status=active&limit=500`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []) as SitemapProduct[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about-us`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact-us`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(CATEGORY_LABELS).map(
    (category) => ({
      url: `${SITE_URL}/shop?category=${category}`,
      changeFrequency: "daily",
      priority: 0.8,
    }),
  );

  const products = await fetchProductSlugs();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => !!p.slug)
    .map((product) => ({
      url: `${SITE_URL}/shop/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { SITE_NAME, absoluteUrl } from "../../lib/seo";
import { productJsonLd, breadcrumbJsonLd } from "../../lib/jsonld";
import { CATEGORY_LABELS } from "../constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

type FetchedProduct = {
  _id: string;
  productId: number;
  title: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  colors: ColorVariant[];
  isNew: boolean;
  stock: boolean;
  status: "active" | "inactive";
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

async function fetchProduct(slug: string): Promise<FetchedProduct | null> {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/getProductById?slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success && data.data ? (data.data as FetchedProduct) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  const title = product.title;
  const description =
    product.description?.slice(0, 160) ||
    `Shop ${product.title} at ${SITE_NAME} — authentic, quality clothing delivered across Pakistan.`;
  const image = product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/shop/${product.slug}`,
      type: "website",
      images: image ? [{ url: absoluteUrl(image), width: 1200, height: 1500, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  const product = await fetchProduct(slug);

  const categoryLabel = product?.category?.[0]
    ? CATEGORY_LABELS[product.category[0]] ?? product.category[0]
    : undefined;

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
        />
      )}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: "Shop", path: "/shop" },
                ...(categoryLabel
                  ? [{ name: categoryLabel, path: `/shop?category=${product!.category[0]}` }]
                  : []),
                { name: product.title, path: `/shop/${product.slug}` },
              ]),
            ),
          }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}

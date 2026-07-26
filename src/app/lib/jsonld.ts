import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, CONTACT_EMAIL, SOCIAL_LINKS, absoluteUrl } from "./seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/updated-logo-social.png"),
    image: absoluteUrl("/updated-logo-social.png"),
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    telephone: "+92-348-3935003",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
    sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook, SOCIAL_LINKS.tiktok],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?title={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type ProductForJsonLd = {
  title: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  stock: boolean;
  category: string[];
};

export function productJsonLd(product: ProductForJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || SITE_DESCRIPTION,
    image: product.images.map((img) => absoluteUrl(img)),
    url: absoluteUrl(`/shop/${product.slug}`),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category?.[0],
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.slug}`),
      priceCurrency: "PKR",
      price: product.price,
      availability: product.stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

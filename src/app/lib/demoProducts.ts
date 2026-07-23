export type ProductCategory = "maxi" | "fashion" | "top-jeans" | "western";

export type DemoProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  comparePrice: number | null;
  discountPercent: number | null;
  isNew: boolean;
  stock: boolean;
  category: ProductCategory;
  images: string[];
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  maxi: "Maxi",
  fashion: "Fashion",
  "top-jeans": "Top & Jeans",
  western: "Western",
};

export const demoProducts: DemoProduct[] = [
  {
    id: "p1",
    slug: "embroidered-maxi-dress",
    title: "Embroidered Maxi Dress",
    description:
      "A flowing maxi dress finished with delicate embroidery along the yoke. Soft, breathable fabric drapes beautifully for effortless all-day wear.",
    price: 2699,
    comparePrice: 5100,
    discountPercent: 47,
    isNew: false,
    stock: true,
    category: "maxi",
    images: ["/products/p1-main.jpg", "/products/p1-hover.jpg"],
  },
  {
    id: "p2",
    slug: "printed-flower-2-piece-maxi",
    title: "Printed Flower 2-Piece Maxi",
    description:
      "A relaxed two-piece maxi set in an all-over floral print, cut from a lightweight fabric that moves with you. Pairs a flowy top with a matching skirt.",
    price: 2599,
    comparePrice: 5199,
    discountPercent: 50,
    isNew: false,
    stock: true,
    category: "maxi",
    images: ["/products/p2-main.png", "/products/p2-hover.png"],
  },
  {
    id: "p3",
    slug: "effortless-elegance-desi-touch",
    title: "Effortless Elegance with a Desi Touch",
    description:
      "A versatile kurta styled with traditional detailing and a modern silhouette. Easy to dress up or down for everyday wear.",
    price: 2999,
    comparePrice: 6000,
    discountPercent: 50,
    isNew: false,
    stock: true,
    category: "fashion",
    images: ["/products/p3-main.jpg", "/products/p3-hover.jpg"],
  },
  {
    id: "p4",
    slug: "elegant-florals-refined-embellishments",
    title: "Elegant Florals with Refined Embellishments",
    description:
      "A refined two-piece suit featuring delicate floral embellishments and a tailored fit. Perfect for both everyday wear and special occasions.",
    price: 2699,
    comparePrice: 5399,
    discountPercent: 50,
    isNew: true,
    stock: true,
    category: "fashion",
    images: ["/products/p4-main.png", "/products/p4-hover.png"],
  },
  {
    id: "p5",
    slug: "classical-party-wear-romper-maxi",
    title: "Classical Party Wear Romper Maxi",
    description:
      "A structured romper maxi with a fitted bodice and a tiered flowing skirt, designed to make a statement at any evening event.",
    price: 2599,
    comparePrice: 5199,
    discountPercent: 50,
    isNew: false,
    stock: false,
    category: "maxi",
    images: ["/products/p5-main.png", "/products/p5-hover.png"],
  },
  {
    id: "p6",
    slug: "3-piece-ladies-long-maxi",
    title: "3 Piece Ladies Long Maxi",
    description:
      "A coordinated three-piece maxi set including an outer layer, inner top, and bottoms — layered for a polished, put-together look.",
    price: 2599,
    comparePrice: 5199,
    discountPercent: 50,
    isNew: false,
    stock: true,
    category: "maxi",
    images: ["/products/p6-main.png", "/products/p6-hover.png"],
  },
  {
    id: "p7",
    slug: "pastel-bloom-co-ord-set",
    title: "Pastel Bloom Co-Ord Set",
    description:
      "A soft pastel co-ord set pairing a floral-printed top with matching wide-leg bottoms. Lightweight fabric ideal for warm-weather styling.",
    price: 2699,
    comparePrice: 5399,
    discountPercent: 50,
    isNew: true,
    stock: true,
    category: "top-jeans",
    images: ["/products/p7-main.jpg", "/products/p7-hover.jpg"],
  },
  {
    id: "p8",
    slug: "trendy-matching-jacket-set",
    title: "Trendy Matching Jacket Set",
    description:
      "A western-style two-piece suit with a relaxed, comfortable cut. Finished in a high-quality washable fabric that's ideal for everyday wear.",
    price: 2499,
    comparePrice: 5000,
    discountPercent: 50,
    isNew: false,
    stock: false,
    category: "western",
    images: [
      "/products/p8-main.jpg",
      "/products/p8-hover.jpg",
      "/products/p8-gallery-3.jpg",
      "/products/p8-gallery-4.jpg",
      "/products/p8-gallery-5.jpg",
      "/products/p8-gallery-6.jpg",
    ],
  },
];

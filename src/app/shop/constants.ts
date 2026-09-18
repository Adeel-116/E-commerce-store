export type ShopColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

export type ShopProduct = {
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
  colors: ShopColorVariant[];
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

export const CATEGORY_LABELS: Record<string, string> = {
  maxi: "Maxi",
  fashion: "Pakistani Fashion",
  "top-jeans": "Top & Jeans",
  western: "Western Fashion",
  "kids-collection": "Kids Collection",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS);


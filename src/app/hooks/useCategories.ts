"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/axios";

export type StoreCategory = {
  _id?: string;
  name: string;
  slug: string;
  image: { url: string; publicId?: string };
  status: "active" | "inactive";
  order: number;
};

export const FALLBACK_CATEGORIES: StoreCategory[] = [
  { name: "Western Fashion", slug: "western", image: { url: "/category-western.avif" }, status: "active", order: 1 },
  { name: "Top & Jeans", slug: "top-jeans", image: { url: "/category-top-jeans.avif" }, status: "active", order: 2 },
  { name: "Pakistani Fashion", slug: "fashion", image: { url: "/category-fashion.avif" }, status: "active", order: 3 },
  { name: "Maxi", slug: "maxi", image: { url: "/category-maxi.avif" }, status: "active", order: 4 },
];

let categoriesCache: StoreCategory[] | null = null;
let categoriesRequest: Promise<StoreCategory[]> | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>(categoriesCache ?? FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(!categoriesCache);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (categoriesCache) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    categoriesRequest ??= api.get("/categories", { signal: controller.signal })
      .then(({ data }) => {
        if (!data?.success || !Array.isArray(data.data)) {
          throw new Error("Invalid category response");
        }
        const validCategories = data.data.filter(
          (category: StoreCategory) =>
            category &&
            typeof category.name === "string" &&
            typeof category.slug === "string" &&
            typeof category.image?.url === "string",
        );
        categoriesCache = validCategories;
        return validCategories;
      })
      .catch(() => {
        categoriesRequest = null;
        throw new Error("Categories request failed");
      })
    categoriesRequest.then((items) => {
      if (!controller.signal.aborted) {
        setCategories(items);
        setUsingFallback(false);
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setCategories(FALLBACK_CATEGORIES);
        setUsingFallback(true);
      }
    })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { categories, loading, usingFallback };
}

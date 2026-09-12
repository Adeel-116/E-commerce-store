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

export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/categories", { signal: controller.signal })
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
        setCategories(validCategories);
        setUsingFallback(false);
      })
      .catch(() => {
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
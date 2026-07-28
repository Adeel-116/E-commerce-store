"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { gaAddToWishlist } from "../lib/gaEvents";

export type WishlistItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  stock?: boolean;
  price: number;
  /** sizes available for this product, used to default the size when adding to cart from the wishlist */
  sizes?: string[];
};

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = "monk_wishlist";

function loadFromStorage(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const isWishlisted = (id: string) =>
    wishlistItems.some((item) => item.id === id);

  const toggleWishlist = (item: WishlistItem) => {
    const alreadyWishlisted = wishlistItems.some((i) => i.id === item.id);
    if (!alreadyWishlisted) {
      gaAddToWishlist({
        item_id: item.id,
        item_name: item.name,
        value: item.price ?? 0,
      });
    }
    setWishlistItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const removeFromWishlist = (id: string) =>
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, isWishlisted, toggleWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};

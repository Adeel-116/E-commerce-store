"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import api from "../lib/axios";
import { clearGuestId } from "../lib/guestId";
import { fetchBundlesFromApi, getStoredBundles, PerfumeBundle, saveBundlesToStorage } from "../lib/cartBundles";
import { ttqAddToCart } from "../lib/tiktokEvents";

export type CartItem = {
  id: string;
  productName: string;
  brand: string;
  prices: { "50ml": number; "100ml": number };
  size: "50ml" | "100ml";
  quantity: number;
  productImage: string;
  /** undiscounted unit price the backend charged for this line */
  unitPrice: number;
  /** undiscounted total for this line (unitPrice * quantity) — backend only reports discounts/bundle savings in aggregate, not per line */
  lineSubtotal: number;
  /** whether this line contributed to an active bundle */
  bundleApplied: boolean;
  /** product-level discount (if any) so line totals can show a discounted price */
  activeDiscount?: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

export type AppliedBundle = {
  size: string;
  numberOfPerfumes: number;
  bundlePrice: number;
  timesApplied: number;
  totalSavings: number;
};

export type AppliedDiscount = {
  discountId: string;
  name: string;
  type: string;
  valueType: "percentage" | "flat" | string;
  value: number;
  amountSaved: number;
};

export type CartPricing = {
  /** subtotal before any discount or bundle savings */
  subtotal: number;
  /** total saved from product/category discounts */
  discountSavings: number;
  /** subtotal - discountSavings */
  afterDiscountSubtotal: number;
  /** total saved from bundle pricing, applied on top of the discounted subtotal */
  bundleSavings: number;
  /** final payable total: afterDiscountSubtotal - bundleSavings */
  total: number;
  appliedBundles: AppliedBundle[];
  appliedDiscounts: AppliedDiscount[];
};

type CartContextType = {
  cartItems: CartItem[];
  pricing: CartPricing | null;
  bundles: PerfumeBundle[];
  isCartOpen: boolean;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, "quantity" | "unitPrice" | "lineSubtotal" | "bundleApplied"> & { quantity?: number }) => void;
  removeItem: (id: string, size?: "50ml" | "100ml") => void;
  increaseQuantity: (id: string, size?: "50ml" | "100ml") => void;
  decreaseQuantity: (id: string, size?: "50ml" | "100ml") => void;
  changeSize: (id: string, size: "50ml" | "100ml", currentSize?: "50ml" | "100ml") => void;
  clearCart: () => void;
  mergeCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

function mapBackendItem(item: any): CartItem {
  const p = item.productId ?? {};
  const size = item.size ?? item.selectedSize ?? "";
  const quantity = item.quantity ?? 1;
  const unitPrice = item.originalPrice ?? item.price ?? p.price?.[size] ?? 0;
  return {
    id: p._id ?? p.id,
    productName: p.title ?? p.name ?? "",
    brand: p.brand ?? "",
    prices: {
      "50ml": p.price?.["50ml"] ?? 0,
      "100ml": p.price?.["100ml"] ?? 0,
    },
    size,
    quantity,
    productImage: p.image || "/new-perfume-bottle.avif",
    unitPrice,
    lineSubtotal: unitPrice * quantity,
    bundleApplied: item.bundleApplied ?? false,
    activeDiscount: item.activeDiscount ?? null,
  };
}

/** Backend is the source of truth for discounts and bundle pricing — never recompute totals client-side. */
function mapCartResponse(cart: any): { items: CartItem[]; pricing: CartPricing | null } {
  const p = cart?.pricing;
  const pricing: CartPricing | null = p
    ? {
        subtotal: p.subtotal ?? 0,
        discountSavings: p.discountSavings ?? 0,
        afterDiscountSubtotal: p.afterDiscountSubtotal ?? p.subtotal ?? 0,
        bundleSavings: p.bundleSavings ?? 0,
        total: p.total ?? p.afterDiscountSubtotal ?? p.subtotal ?? 0,
        appliedBundles: cart?.appliedBundles ?? [],
        appliedDiscounts: cart?.appliedDiscounts ?? [],
      }
    : null;

  return {
    items: (cart?.items ?? []).map(mapBackendItem),
    pricing,
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pricing, setPricing] = useState<CartPricing | null>(null);
  const [bundles, setBundles] = useState<PerfumeBundle[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refetchCart = () => {
    api
      .get("/cart")
      .then((res) => {
        const { items, pricing } = mapCartResponse(res.data.cart);
        // console.log("Items", items, "Pricing", pricing)
        setCartItems(items);
        setPricing(pricing);
      })
      .catch((err) => {
        console.error("Refetch cart failed:", err?.response?.data?.message ?? err.message);
      });
  };

  useEffect(() => {
    const loadBundles = async () => {
      const storedBundles = getStoredBundles();
      if (storedBundles.length > 0) {
        setBundles(storedBundles);
      }

      const fetchedBundles = await fetchBundlesFromApi();
      const nextBundles = fetchedBundles.length > 0 ? fetchedBundles : storedBundles;
      setBundles(nextBundles);
      saveBundlesToStorage(nextBundles);
    };

    loadBundles();

    api
      .get("/cart")
      .then((res) => {
        const { items, pricing } = mapCartResponse(res.data.cart);
        setCartItems(items);
        setPricing(pricing);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addToCart = (item: Omit<CartItem, "quantity" | "unitPrice" | "lineSubtotal" | "bundleApplied"> & { quantity?: number }) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.prices[item.size] ?? 0;

    api.post("/cart/add", { productId: item.id, size: item.size, quantity })
      .then(() => {
        refetchCart();
        setIsCartOpen(true);
        ttqAddToCart({
          content_id: item.id,
          content_type: "product",
          content_name: item.productName,
          price: unitPrice,
          num_items: quantity,
          value: unitPrice * quantity,
        });
      })
      .catch((err) => {
        console.error("Add to cart failed:", err?.response?.data?.message ?? err.message);
      });
  };

  const removeItem = (id: string, size?: "50ml" | "100ml") => {
    setCartItems((prev) => prev.filter((i) => !(i.id === id && (!size || i.size === size))));
    api
      .delete("/cart/remove", { params: { productId: id, size } })
      .then(() => refetchCart())
      .catch((err) => {
        console.error("Remove from cart failed:", err?.response?.data?.message ?? err.message);
        refetchCart();
      });
  };

  const increaseQuantity = (id: string, size?: "50ml" | "100ml") => {
    const item = cartItems.find((i) => i.id === id && (!size || i.size === size));
    if (!item) return;
    const newQty = item.quantity + 1;
    const perUnit = item.lineSubtotal / item.quantity;
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id && i.size === item.size
          ? { ...i, quantity: newQty, lineSubtotal: perUnit * newQty }
          : i
      )
    );
    api
      .patch("/cart/quantity", { productId: id, size: item.size, quantity: newQty })
      .then(() => refetchCart())
      .catch((err) => {
        console.error("Update quantity failed:", err?.response?.data?.message ?? err.message);
        setCartItems((prev) =>
          prev.map((i) =>
            i.id === id && i.size === item.size
              ? { ...i, quantity: newQty - 1, lineSubtotal: item.lineSubtotal }
              : i
          )
        );
      });
  };

  const decreaseQuantity = (id: string, size?: "50ml" | "100ml") => {
    const item = cartItems.find((i) => i.id === id && (!size || i.size === size));
    if (!item) return;
    if (item.quantity <= 1) {
      removeItem(id, item.size);
      return;
    }
    const newQty = item.quantity - 1;
    const perUnit = item.lineSubtotal / item.quantity;
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id && i.size === item.size
          ? { ...i, quantity: newQty, lineSubtotal: perUnit * newQty }
          : i
      )
    );
    api
      .patch("/cart/quantity", { productId: id, size: item.size, quantity: newQty })
      .then(() => refetchCart())
      .catch((err) => {
        console.error("Update quantity failed:", err?.response?.data?.message ?? err.message);
        setCartItems((prev) =>
          prev.map((i) =>
            i.id === id && i.size === item.size
              ? { ...i, quantity: newQty + 1, lineSubtotal: item.lineSubtotal }
              : i
          )
        );
      });
  };

  const changeSize = (id: string, size: "50ml" | "100ml", currentSize?: "50ml" | "100ml") => {
    const item = cartItems.find((i) => i.id === id && (!currentSize || i.size === currentSize));
    if (!item || item.size === size) return;
    const oldSize = item.size;

    setCartItems((prev) =>
      prev.map((i) => (i.id === id && i.size === oldSize ? { ...i, size } : i))
    );

    api
      .post("/cart/updateSize", { productId: id, oldSize, newSize: size })
      .then(() => refetchCart())
      .catch((err) => {
        console.error("Update size failed:", err?.response?.data?.message ?? err.message);
        setCartItems((prev) =>
          prev.map((i) => (i.id === id && i.size === size ? { ...i, size: oldSize } : i))
        );
      });
  };

  const clearCart = () => {
    api
      .delete("/cart/clear")
      .then(() => {
        setCartItems([]);
        setPricing(null);
      })
      .catch((err) => {
        console.error("Clear cart failed:", err?.response?.data?.message ?? err.message);
      });
  };

  const mergeCart = async (): Promise<void> => {
    try {
      await api.post("/cart/merge");
      clearGuestId();
      const res = await api.get("/cart");
      const { items, pricing } = mapCartResponse(res.data.cart);
      setCartItems(items);
      setPricing(pricing);
    } catch (err: any) {
      console.error("Cart merge failed:", err?.response?.data?.message ?? err.message);
    }
  };

  const effectivePricing = useMemo<CartPricing | null>(() => {
    if (cartItems.length === 0) return null;
    if (pricing) return pricing;

    const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    return {
      subtotal,
      discountSavings: 0,
      afterDiscountSubtotal: subtotal,
      bundleSavings: 0,
      total: subtotal,
      appliedBundles: [],
      appliedDiscounts: [],
    };
  }, [cartItems, pricing]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        pricing: effectivePricing,
        bundles,
        isCartOpen,
        isLoading,
        addToCart,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        changeSize,
        clearCart,
        mergeCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

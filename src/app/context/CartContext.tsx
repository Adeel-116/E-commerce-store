"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import api from "../lib/axios";
import { clearGuestId } from "../lib/guestId";
import {
  fetchBundlesFromApi,
  getStoredBundles,
  ProductBundle,
  saveBundlesToStorage,
} from "../lib/cartBundles";
import { gaAddToCart, gaRemoveFromCart } from "../lib/gaEvents";
import { metaAddToCart } from "../lib/metaEvents";

export type CartItem = {
  id: string;
  productName: string;
  brand: string;
  /** flat catalog price for this product */
  price: number;
  size: string;
  /** selected color name, if the product has color variants */
  color?: string | null;
  /** whether the item is stitched or unstitched */
  stitching?: "stitched" | "unstitched" | null;
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
  productId: string;
  numberOfItems: number;
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
  bundles: ProductBundle[];
  isCartOpen: boolean;
  isLoading: boolean;
  addToCart: (
    item: Omit<
      CartItem,
      "quantity" | "unitPrice" | "lineSubtotal" | "bundleApplied"
    > & { quantity?: number },
  ) => Promise<void>;
  removeItem: (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => Promise<void>;
  increaseQuantity: (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => Promise<void>;
  decreaseQuantity: (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => Promise<void>;
  changeSize: (
    id: string,
    size: string,
    currentSize?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => void;
  clearCart: () => void;
  mergeCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

// A cart line is uniquely identified by (id, size, color) — normalize missing
// color to null so "no color selected" always compares consistently.
const normalizeColor = (color?: string | null) => color || null;
const normalizeStitching = (stitching?: string | null) => stitching || null;
const matchesLine = (
  item: CartItem,
  id: string,
  size?: string,
  color?: string | null,
  stitching?: "stitched" | "unstitched" | null,
) =>
  item.id === id &&
  (!size || item.size === size) &&
  (color === undefined ||
    normalizeColor(item.color) === normalizeColor(color)) &&
  (stitching === undefined ||
    normalizeStitching(item.stitching) === normalizeStitching(stitching));

function mapBackendItem(item: any): CartItem {
  const p = item.productId ?? {};
  const size = item.size ?? item.selectedSize ?? "";
  const quantity = item.quantity ?? 1;
  const price = p.price ?? 0;
  const unitPrice = item.originalPrice ?? item.price ?? price ?? 0;
  // Cart lines only store the selected color's name, not an image — look up
  // that color's own photos on the populated product so the cart shows the
  // variant the shopper actually picked, instead of always the product's
  // first/default photo.
  const variantColor = item.color
    ? (p.colors ?? []).find((c: { name: string }) => c.name === item.color)
    : null;
  const productImage = variantColor?.images?.[0] || p.images?.[0] || "";
  return {
    id: p._id ?? p.id,
    productName: p.title ?? p.name ?? "",
    brand: p.brand ?? "",
    price,
    size,
    color: item.color ?? null,
    stitching: item.stitching ?? null,
    quantity,
    productImage,
    unitPrice,
    lineSubtotal: unitPrice * quantity,
    bundleApplied: item.bundleApplied ?? false,
    activeDiscount: item.activeDiscount ?? null,
  };
}

/** Backend is the source of truth for discounts and bundle pricing — never recompute totals client-side. */
function mapCartResponse(cart: any): {
  items: CartItem[];
  pricing: CartPricing | null;
} {
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
  // Mirrors `cartItems` synchronously so code queued inside a chained
  // Promise (see `runQuantityChange`) can read the latest line state at the
  // moment it actually runs, instead of whatever `cartItems` closure value
  // was captured back when the chain step was first queued.
  const cartItemsRef = useRef<CartItem[]>([]);
  cartItemsRef.current = cartItems;
  const [pricing, setPricing] = useState<CartPricing | null>(null);
  // True right after a local cart mutation (add/remove/quantity change) until
  // the backend confirms — while true, `pricing` reflects the *previous*
  // cart state, so consumers should show a frontend-computed total instead.
  const [pricingStale, setPricingStale] = useState(false);
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mutations (add/remove/quantity/size) can overlap in flight — e.g. two
  // quick clicks on the quantity stepper fire two PATCH+refetch pairs, and
  // the network can resolve them out of order. Without a guard, an older
  // refetch that lands after a newer one would stomp the newer state back
  // down (the bug where a quantity flashes to the new value then reverts).
  // Every refetch is tagged with a ticket; only the most recent one is
  // allowed to apply its result.
  const refetchTicket = useRef(0);

  const refetchCart = async (): Promise<void> => {
    const ticket = ++refetchTicket.current;
    try {
      const res = await api.get("/cart");
      if (ticket !== refetchTicket.current) return;
      const { items, pricing } = mapCartResponse(res.data.cart);
      setCartItems(items);
      setPricing(pricing);
      setPricingStale(false);
    } catch (err: any) {
      if (ticket !== refetchTicket.current) return;
      console.error(
        "Refetch cart failed:",
        err?.response?.data?.message ?? err.message,
      );
      setPricingStale(false);
    }
  };
  useEffect(() => {
    const loadBundles = async () => {
      const storedBundles = getStoredBundles();
      if (storedBundles.length > 0) {
        setBundles(storedBundles);
      }

      const fetchedBundles = await fetchBundlesFromApi();
      const nextBundles =
        fetchedBundles.length > 0 ? fetchedBundles : storedBundles;
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

  const addToCart = async (
    item: Omit<
      CartItem,
      "quantity" | "unitPrice" | "lineSubtotal" | "bundleApplied"
    > & { quantity?: number },
  ) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.price ?? 0;

    setCartItems((prev) => {
      const existing = prev.find((i) =>
        matchesLine(i, item.id, item.size, item.color, item.stitching),
      );
      if (existing) {
        return prev.map((i) =>
          matchesLine(i, item.id, item.size, item.color, item.stitching)
            ? {
                ...i,
                quantity: i.quantity + quantity,
                lineSubtotal: i.unitPrice * (i.quantity + quantity),
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity,
          unitPrice,
          lineSubtotal: unitPrice * quantity,
          bundleApplied: false,
        },
      ];
    });
    setPricingStale(true);
    setIsCartOpen(true);
    gaAddToCart({
      item_id: item.id,
      item_name: item.productName,
      item_variant: item.color ?? undefined,
      price: unitPrice,
      quantity,
      value: unitPrice * quantity,
    });
    metaAddToCart({
      item_id: item.id,
      item_name: item.productName,
      item_variant: item.color ?? undefined,
      price: unitPrice,
      quantity,
      value: unitPrice * quantity,
    });

    try {
      await api.post("/cart/add", {
        productId: item.id,
        size: item.size,
        color: item.color ?? null,
        stitching: item.stitching ?? null,
        quantity,
      });
      await refetchCart();
    } catch (err: any) {
      console.error(
        "Add to cart failed:",
        err?.response?.data?.message ?? err.message,
      );
      await refetchCart();
      throw err;
    }
  };

  const removeItem = async (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ): Promise<void> => {
    const item = cartItems.find((cartItem) =>
      matchesLine(cartItem, id, size, color, stitching),
    );

    try {
      await api.delete("/cart/remove", {
        params: {
          productId: id,
          size,
          color: color ?? undefined,
          stitching: stitching ?? undefined,
        },
      });
      setPricingStale(true);
      if (item) {
        gaRemoveFromCart({
          item_id: item.id,
          item_name: item.productName,
          item_variant: item.color ?? undefined,
          price: item.unitPrice,
          quantity: item.quantity,
          value: item.unitPrice * item.quantity,
        });
      }
      await refetchCart();
    } catch (err: any) {
      console.error(
        "Remove from cart failed:",
        err?.response?.data?.message ?? err.message,
      );
      throw err;
    }
  };
  // Per-line in-flight guard: while a quantity PATCH for a given line is
  // pending, a second click on the same stepper queues behind it instead of
  // firing a second overlapping PATCH+refetch — that overlap was the source
  // of the "flashes to 2, reverts to 1" bug (two absolute-quantity writes on
  // the backend, whichever save() lands last wins, and the frontend can't
  // tell which refetch is fresher without this).
  const quantityInFlight = useRef<Map<string, Promise<void>>>(new Map());
  const lineKey = (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) =>
    `${id}::${size ?? ""}::${normalizeColor(color)}::${normalizeStitching(stitching)}`;

  const runQuantityChange = (
    id: string,
    size: string | undefined,
    color: string | null | undefined,
    stitching: "stitched" | "unstitched" | null | undefined,
    step: 1 | -1,
  ): Promise<void> => {
    const key = lineKey(id, size, color, stitching);
    const prior = quantityInFlight.current.get(key) ?? Promise.resolve();
    const next = prior
      .catch(() => {})
      .then(() => {
        const item = cartItemsRef.current.find((i) =>
          matchesLine(i, id, size, color, stitching),
        );
        if (!item) return;

        if (step === -1 && item.quantity <= 1) {
          return removeItem(id, item.size, item.color, item.stitching);
        }

        const newQty = item.quantity + step;
        const perUnit = item.lineSubtotal / item.quantity;
        setCartItems((prev) =>
          prev.map((i) =>
            matchesLine(i, id, item.size, item.color, item.stitching)
              ? { ...i, quantity: newQty, lineSubtotal: perUnit * newQty }
              : i,
          ),
        );
        setPricingStale(true);

        return api
          .patch("/cart/quantity", {
            productId: id,
            size: item.size,
            color: item.color ?? null,
            stitching: item.stitching ?? null,
            quantity: newQty,
          })
          .then(() => refetchCart())
          .catch((err) => {
            console.error(
              "Update quantity failed:",
              err?.response?.data?.message ?? err.message,
            );
            setCartItems((prev) =>
              prev.map((i) =>
                matchesLine(i, id, item.size, item.color, item.stitching)
                  ? {
                      ...i,
                      quantity: item.quantity,
                      lineSubtotal: item.lineSubtotal,
                    }
                  : i,
              ),
            );
          });
      });

    quantityInFlight.current.set(key, next);
    return next;
  };

  const increaseQuantity = (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => {
    return runQuantityChange(id, size, color, stitching, 1);
  };

  const decreaseQuantity = (
    id: string,
    size?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => {
    return runQuantityChange(id, size, color, stitching, -1);
  };

  const changeSize = (
    id: string,
    size: string,
    currentSize?: string,
    color?: string | null,
    stitching?: "stitched" | "unstitched" | null,
  ) => {
    const item = cartItems.find((i) =>
      matchesLine(i, id, currentSize, color, stitching),
    );
    if (!item || item.size === size) return;
    const oldSize = item.size;

    setCartItems((prev) =>
      prev.map((i) =>
        matchesLine(i, id, oldSize, item.color, item.stitching)
          ? { ...i, size }
          : i,
      ),
    );

    api
      .post("/cart/updateSize", {
        productId: id,
        oldSize,
        newSize: size,
        color: item.color ?? null,
        stitching: item.stitching ?? null,
      })
      .then(() => refetchCart())
      .catch((err) => {
        console.error(
          "Update size failed:",
          err?.response?.data?.message ?? err.message,
        );
        setCartItems((prev) =>
          prev.map((i) =>
            matchesLine(i, id, size, item.color, item.stitching)
              ? { ...i, size: oldSize }
              : i,
          ),
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
        console.error(
          "Clear cart failed:",
          err?.response?.data?.message ?? err.message,
        );
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
      console.error(
        "Cart merge failed:",
        err?.response?.data?.message ?? err.message,
      );
    }
  };

  // While a mutation is in flight, `pricing` still reflects the cart's
  // previous contents — recompute from `cartItems` (which already updated
  // optimistically) so the total on screen never lags behind what's shown.
  // This ignores cross-item bundle savings (only the backend can compute
  // those), but per-item discounts are applied so it stays close.
  const effectivePricing = useMemo<CartPricing | null>(() => {
    if (cartItems.length === 0) return null;
    if (pricing && !pricingStale) return pricing;

    const subtotal = cartItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
    const discountSavings = cartItems.reduce((acc, item) => {
      if (!item.activeDiscount) return acc;
      const lineTotal = item.unitPrice * item.quantity;
      const amount =
        item.activeDiscount.valueType === "percentage"
          ? Math.round(lineTotal * (item.activeDiscount.value / 100))
          : Math.round(item.activeDiscount.value * item.quantity);
      return acc + amount;
    }, 0);
    const afterDiscountSubtotal = subtotal - discountSavings;

    return {
      subtotal,
      discountSavings,
      afterDiscountSubtotal,
      bundleSavings: pricing?.bundleSavings ?? 0,
      total: afterDiscountSubtotal - (pricing?.bundleSavings ?? 0),
      appliedBundles: pricing?.appliedBundles ?? [],
      appliedDiscounts: pricing?.appliedDiscounts ?? [],
    };
  }, [cartItems, pricing, pricingStale]);

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

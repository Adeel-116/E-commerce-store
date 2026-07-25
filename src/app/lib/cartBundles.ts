export type BundlePriceTier = {
  itemCount: number;
  price: number;
};

export type ProductBundle = {
  title: string;
  productId: string;
  numberOfItems: number;
  prices: BundlePriceTier[];
  savedAmount: number;
};

export type BundleSuggestion = {
  productId: string;
  unitsNeeded: number;
  numberOfItems: number;
  savedAmount: number;
};

export type CartBundleDetail = {
  title: string;
  productId: string;
  numberOfItems: number;
  appliedCount: number;
  discountAmount: number;
  message: string;
};

export type CartBundlePricingResult = {
  originalSubtotal: number;
  discountedSubtotal: number;
  totalDiscount: number;
  lineSubtotals: Record<string, number>;
  appliedBundles: CartBundleDetail[];
};

export type CartLineInput = {
  id: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal?: number;
};

import api from "../lib/axios";

export const BUNDLE_STORAGE_KEY = "azan-product-bundles";

const normalizeBundle = (bundle: any): ProductBundle | null => {
  if (!bundle || typeof bundle !== "object") return null;

  const title =
    typeof bundle.title === "string" ? bundle.title : "Product Bundle";

  const productId =
    typeof bundle.productId === "string"
      ? bundle.productId
      : bundle.productId?._id ?? "";

  const numberOfItems = Number(bundle.numberOfItems ?? 0);

  const prices = Array.isArray(bundle.prices)
    ? bundle.prices
        .map((entry: any) => ({
          itemCount: Number(entry?.itemCount ?? 0),
          price: Number(entry?.price ?? 0),
        }))
        .filter((entry: BundlePriceTier) => entry.itemCount > 0)
    : [];

  if (!productId || !numberOfItems || prices.length === 0) return null;

  return {
    title,
    productId,
    numberOfItems,
    prices,
    savedAmount: Number(bundle.savedAmount ?? 0),
  };
};

export const normalizeBundles = (payload: any): ProductBundle[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeBundle).filter(Boolean) as ProductBundle[];
  }

  const bundles = payload?.bundles ?? payload?.data ?? payload?.items ?? [];

  if (Array.isArray(bundles)) {
    return bundles.map(normalizeBundle).filter(Boolean) as ProductBundle[];
  }

  return [];
};

export const getStoredBundles = (): ProductBundle[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BUNDLE_STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return normalizeBundles(parsed);
  } catch {
    return [];
  }
};

export const saveBundlesToStorage = (bundles: ProductBundle[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundles));
  } catch {
    // Ignore storage write failures.
  }
};

export const fetchBundlesFromApi = async (): Promise<ProductBundle[]> => {
  try {
    const response = await api.get("/getAllBundles");

    const bundles = normalizeBundles(response?.data);

    if (bundles.length > 0) {
      saveBundlesToStorage(bundles);
    }

    return bundles;
  } catch (error) {
    console.error("Failed to fetch bundles:", error);

    return getStoredBundles();
  }
};

export const loadBundlesOnWebsiteStart = async (): Promise<ProductBundle[]> => {
  const storedBundles = getStoredBundles();

  if (storedBundles.length > 0) {
    return storedBundles;
  }

  const fetchedBundles = await fetchBundlesFromApi();

  return fetchedBundles;
};

export const clearStoredBundles = () => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BUNDLE_STORAGE_KEY);
  } catch {
    // Ignore storage remove failures.
  }
};

/**
 * For each product present in the cart, finds the smallest bundle tier not yet
 * reached and reports how many more units would unlock it. Approximates the
 * backend's actual best-combo bundle pricing with "nearest unreached tier" —
 * good enough for a cart nudge, not meant to be charged.
 */
export const getNextBundleSuggestions = (
  cartItems: { id: string; quantity: number }[],
  bundles: ProductBundle[]
): BundleSuggestion[] => {
  const unitsByProduct = new Map<string, number>();
  cartItems.forEach((item) => {
    unitsByProduct.set(item.id, (unitsByProduct.get(item.id) ?? 0) + item.quantity);
  });

  const suggestions: BundleSuggestion[] = [];

  unitsByProduct.forEach((totalUnits, productId) => {
    const nextTier = bundles
      .filter((bundle) => bundle.productId === productId)
      .sort((a, b) => a.numberOfItems - b.numberOfItems)
      .find((bundle) => bundle.numberOfItems > totalUnits);

    if (!nextTier) return;

    suggestions.push({
      productId,
      unitsNeeded: nextTier.numberOfItems - totalUnits,
      numberOfItems: nextTier.numberOfItems,
      savedAmount: nextTier.savedAmount,
    });
  });

  return suggestions;
};

export const calculateCartBundlePricing = (
  cartItems: CartLineInput[],
  bundles: ProductBundle[]
): CartBundlePricingResult => {
  const lineSubtotals: Record<string, number> = {};
  const appliedBundles: CartBundleDetail[] = [];
  const productGroups = new Map<string, CartLineInput[]>();

  cartItems.forEach((item) => {
    const productId = item.id ?? "";
    if (!productId) return;

    const group = productGroups.get(productId) ?? [];
    group.push(item);
    productGroups.set(productId, group);
  });

  let originalSubtotal = 0;
  let discountedSubtotal = 0;

  productGroups.forEach((itemsForProduct, productId) => {
    const matchingBundles = bundles
      .filter((bundle) => bundle.productId === productId)
      .sort((a, b) => b.numberOfItems - a.numberOfItems);

    const totalUnits = itemsForProduct.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const activeBundle =
      matchingBundles.find(
        (bundle) => bundle.numberOfItems <= totalUnits
      ) ?? null;

    if (!activeBundle || totalUnits < 2) {
      itemsForProduct.forEach((item) => {
        const lineKey = `${item.id}-${item.size}`;
        const subtotal = (item.unitPrice ?? 0) * item.quantity;

        lineSubtotals[lineKey] = subtotal;
        originalSubtotal += subtotal;
        discountedSubtotal += subtotal;
      });

      return;
    }

    const bundleSize = activeBundle.numberOfItems;
    let slotIndex = 0;
    let groupOriginalSubtotal = 0;
    let groupDiscountedSubtotal = 0;

    itemsForProduct.forEach((item) => {
      const lineKey = `${item.id}-${item.size}`;
      const baseSubtotal = (item.unitPrice ?? 0) * item.quantity;
      let lineTotal = 0;

      for (let unit = 0; unit < item.quantity; unit += 1) {
        const subtotalForUnit =
          slotIndex < bundleSize
            ? (() => {
                const priceTier = activeBundle.prices.find(
                  (entry) => entry.itemCount === slotIndex + 1
                );

                return (
                  priceTier?.price ??
                  activeBundle.prices[slotIndex]?.price ??
                  item.unitPrice
                );
              })()
            : item.unitPrice;

        lineTotal += subtotalForUnit;
        slotIndex += 1;
      }

      groupOriginalSubtotal += baseSubtotal;
      groupDiscountedSubtotal += lineTotal;

      originalSubtotal += baseSubtotal;
      discountedSubtotal += lineTotal;

      lineSubtotals[lineKey] = lineTotal;
    });

    appliedBundles.push({
      title: activeBundle.title,
      productId,
      numberOfItems: bundleSize,
      appliedCount: totalUnits,
      discountAmount: Math.max(
        0,
        groupOriginalSubtotal - groupDiscountedSubtotal
      ),
      message: `${activeBundle.title} activated`,
    });
  });

  return {
    originalSubtotal,
    discountedSubtotal,
    totalDiscount: Math.max(0, originalSubtotal - discountedSubtotal),
    lineSubtotals,
    appliedBundles,
  };
};

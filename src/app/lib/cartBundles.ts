export type BundlePriceTier = {
  perfumeCount: number;
  price: number;
};

export type PerfumeBundle = {
  title: string;
  type: "50ml" | "100ml" | string;
  numberOfPerfumes: number;
  prices: BundlePriceTier[];
  savedAmount: number;
};

export type BundleSuggestion = {
  size: string;
  unitsNeeded: number;
  numberOfPerfumes: number;
  savedAmount: number;
};

export type CartBundleDetail = {
  title: string;
  type: string;
  numberOfPerfumes: number;
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
  size: "50ml" | "100ml" | string;
  quantity: number;
  unitPrice: number;
  lineSubtotal?: number;
};

import api from "../lib/axios";

export const BUNDLE_STORAGE_KEY = "monk-perfume-bundles";

const normalizeBundle = (bundle: any): PerfumeBundle | null => {
  if (!bundle || typeof bundle !== "object") return null;

  const title =
    typeof bundle.title === "string" ? bundle.title : "Perfume Bundle";

  const type = typeof bundle.type === "string" ? bundle.type : "";

  const numberOfPerfumes = Number(bundle.numberOfPerfumes ?? 0);

  const prices = Array.isArray(bundle.prices)
    ? bundle.prices
        .map((entry: any) => ({
          perfumeCount: Number(entry?.perfumeCount ?? 0),
          price: Number(entry?.price ?? 0),
        }))
        .filter((entry: BundlePriceTier) => entry.perfumeCount > 0)
    : [];

  if (!type || !numberOfPerfumes || prices.length === 0) return null;

  return {
    title,
    type,
    numberOfPerfumes,
    prices,
    savedAmount: Number(bundle.savedAmount ?? 0),
  };
};

export const normalizeBundles = (payload: any): PerfumeBundle[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeBundle).filter(Boolean) as PerfumeBundle[];
  }

  const bundles = payload?.bundles ?? payload?.data ?? payload?.items ?? [];

  if (Array.isArray(bundles)) {
    return bundles.map(normalizeBundle).filter(Boolean) as PerfumeBundle[];
  }

  return [];
};

export const getStoredBundles = (): PerfumeBundle[] => {
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

export const saveBundlesToStorage = (bundles: PerfumeBundle[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundles));
  } catch {
    // Ignore storage write failures.
  }
};

export const fetchBundlesFromApi = async (): Promise<PerfumeBundle[]> => {
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

export const loadBundlesOnWebsiteStart = async (): Promise<PerfumeBundle[]> => {
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
 * For each size present in the cart, finds the smallest bundle tier not yet
 * reached and reports how many more units would unlock it. Approximates the
 * backend's actual best-combo bundle pricing with "nearest unreached tier" —
 * good enough for a cart nudge, not meant to be charged.
 */
export const getNextBundleSuggestions = (
  cartItems: { size: string; quantity: number }[],
  bundles: PerfumeBundle[]
): BundleSuggestion[] => {
  const unitsBySize = new Map<string, number>();
  cartItems.forEach((item) => {
    unitsBySize.set(item.size, (unitsBySize.get(item.size) ?? 0) + item.quantity);
  });

  const suggestions: BundleSuggestion[] = [];

  unitsBySize.forEach((totalUnits, size) => {
    const nextTier = bundles
      .filter((bundle) => bundle.type === size)
      .sort((a, b) => a.numberOfPerfumes - b.numberOfPerfumes)
      .find((bundle) => bundle.numberOfPerfumes > totalUnits);

    if (!nextTier) return;

    suggestions.push({
      size,
      unitsNeeded: nextTier.numberOfPerfumes - totalUnits,
      numberOfPerfumes: nextTier.numberOfPerfumes,
      savedAmount: nextTier.savedAmount,
    });
  });

  return suggestions;
};

export const calculateCartBundlePricing = (
  cartItems: CartLineInput[],
  bundles: PerfumeBundle[]
): CartBundlePricingResult => {
  const lineSubtotals: Record<string, number> = {};
  const appliedBundles: CartBundleDetail[] = [];
  const sizeGroups = new Map<string, CartLineInput[]>();

  cartItems.forEach((item) => {
    const size = item.size ?? "";
    if (!size) return;

    const group = sizeGroups.get(size) ?? [];
    group.push(item);
    sizeGroups.set(size, group);
  });

  let originalSubtotal = 0;
  let discountedSubtotal = 0;

  sizeGroups.forEach((itemsForSize, size) => {
    const matchingBundles = bundles
      .filter((bundle) => bundle.type === size)
      .sort((a, b) => b.numberOfPerfumes - a.numberOfPerfumes);

    const totalUnits = itemsForSize.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const activeBundle =
      matchingBundles.find(
        (bundle) => bundle.numberOfPerfumes <= totalUnits
      ) ?? null;

    if (!activeBundle || totalUnits < 2) {
      itemsForSize.forEach((item) => {
        const lineKey = `${item.id}-${item.size}`;
        const subtotal = (item.unitPrice ?? 0) * item.quantity;

        lineSubtotals[lineKey] = subtotal;
        originalSubtotal += subtotal;
        discountedSubtotal += subtotal;
      });

      return;
    }

    const bundleSize = activeBundle.numberOfPerfumes;
    let slotIndex = 0;
    let groupOriginalSubtotal = 0;
    let groupDiscountedSubtotal = 0;

    itemsForSize.forEach((item) => {
      const lineKey = `${item.id}-${item.size}`;
      const baseSubtotal = (item.unitPrice ?? 0) * item.quantity;
      let lineTotal = 0;

      for (let unit = 0; unit < item.quantity; unit += 1) {
        const subtotalForUnit =
          slotIndex < bundleSize
            ? (() => {
                const priceTier = activeBundle.prices.find(
                  (entry) => entry.perfumeCount === slotIndex + 1
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
      type: size,
      numberOfPerfumes: bundleSize,
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
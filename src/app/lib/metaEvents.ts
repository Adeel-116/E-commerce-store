declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const META_CURRENCY = "PKR";

export type MetaItem = {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
};

function fbq(...args: unknown[]) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq(...args);
}

function track(name: string, params?: Record<string, unknown>) {
  fbq("track", name, params);
}

function toContents(items: MetaItem[]) {
  return items.map((i) => ({
    id: i.item_id,
    quantity: i.quantity ?? 1,
    item_price: i.price,
  }));
}

/** Re-inits the pixel with hashed-at-source contact info so Meta can match the visitor via Advanced Matching. */
export function metaIdentify(params: { email?: string | null; phone?: string | null }) {
  const em = params.email?.trim().toLowerCase();
  const ph = params.phone?.replace(/[^\d]/g, "");
  if (!em && !ph) return;
  fbq("init", "2049359839276860", {
    ...(em ? { em } : {}),
    ...(ph ? { ph } : {}),
  });
}

export function metaViewContent(item: MetaItem & { value: number; currency?: string }) {
  track("ViewContent", {
    currency: item.currency ?? META_CURRENCY,
    value: item.value,
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_category: item.item_category,
    contents: toContents([item]),
    content_type: "product",
  });
}

export function metaSearch(params: { searchString: string }) {
  track("Search", { search_string: params.searchString });
}

export function metaAddToWishlist(item: MetaItem & { value: number; currency?: string }) {
  track("AddToWishlist", {
    currency: item.currency ?? META_CURRENCY,
    value: item.value,
    content_ids: [item.item_id],
    content_name: item.item_name,
    contents: toContents([item]),
    content_type: "product",
  });
}

export function metaAddToCart(item: MetaItem & { value: number; currency?: string }) {
  track("AddToCart", {
    currency: item.currency ?? META_CURRENCY,
    value: item.value,
    content_ids: [item.item_id],
    content_name: item.item_name,
    contents: toContents([item]),
    content_type: "product",
  });
}

export function metaInitiateCheckout(params: { items: MetaItem[]; value: number; currency?: string }) {
  track("InitiateCheckout", {
    currency: params.currency ?? META_CURRENCY,
    value: params.value,
    content_ids: params.items.map((i) => i.item_id),
    contents: toContents(params.items),
    num_items: params.items.reduce((s, i) => s + (i.quantity ?? 1), 0),
    content_type: "product",
  });
}

export function metaAddPaymentInfo(params: { items: MetaItem[]; value: number; currency?: string }) {
  track("AddPaymentInfo", {
    currency: params.currency ?? META_CURRENCY,
    value: params.value,
    content_ids: params.items.map((i) => i.item_id),
    contents: toContents(params.items),
    content_type: "product",
  });
}

export function metaPurchase(params: {
  transactionId: string;
  items: MetaItem[];
  value: number;
  currency?: string;
}) {
  track("Purchase", {
    currency: params.currency ?? META_CURRENCY,
    value: params.value,
    content_ids: params.items.map((i) => i.item_id),
    contents: toContents(params.items),
    content_type: "product",
    order_id: params.transactionId,
  });
}

export function metaCompleteRegistration(params?: { method?: string }) {
  track("CompleteRegistration", { registration_method: params?.method ?? "email" });
}

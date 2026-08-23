declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_CURRENCY = "PKR";

export type GaItem = {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
};

// Calls the real gtag.js send queue directly so events reach GA4 even if
// GTM has no tag wired up for them. Falls back to a raw dataLayer push
// only if gtag.js hasn't finished loading yet.
function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function event(name: string, params: Record<string, unknown>) {
  gtag("event", name, params);
}

/** Sets the current visitor's identity (user_id + hashed contact info) so GA4 can stitch sessions across devices. */
export function gaIdentify(params: { userId?: string | null; email?: string | null; phone?: string | null }) {
  if (params.userId) gtag("set", { user_id: params.userId });
  const email = params.email?.trim().toLowerCase();
  const phone = params.phone?.replace(/[^\d+]/g, "");
  if (email || phone) {
    gtag("set", "user_data", {
      ...(email ? { email } : {}),
      ...(phone ? { phone_number: phone } : {}),
    });
  }
}

export function gaViewItem(item: GaItem & { value: number; currency?: string }) {
  event("view_item", {
    currency: item.currency ?? GA_CURRENCY,
    value: item.value,
    items: [item],
  });
}

export function gaViewItemList(params: { items: GaItem[]; listName?: string }) {
  event("view_item_list", {
    item_list_name: params.listName,
    items: params.items,
  });
}

export function gaSelectItem(params: { item: GaItem; listName?: string }) {
  event("select_item", {
    item_list_name: params.listName,
    items: [params.item],
  });
}

export function gaAddToWishlist(item: GaItem & { value: number; currency?: string }) {
  event("add_to_wishlist", {
    currency: item.currency ?? GA_CURRENCY,
    value: item.value,
    items: [item],
  });
}

export function gaSearch(params: { searchString: string }) {
  event("search", { search_term: params.searchString });
}

export function gaAddToCart(item: GaItem & { value: number; currency?: string }) {
  event("add_to_cart", {
    currency: item.currency ?? GA_CURRENCY,
    value: item.value,
    items: [item],
  });
}

export function gaRemoveFromCart(item: GaItem & { value: number; currency?: string }) {
  event("remove_from_cart", {
    currency: item.currency ?? GA_CURRENCY,
    value: item.value,
    items: [item],
  });
}

export function gaViewCart(params: { items: GaItem[]; value: number; currency?: string }) {
  event("view_cart", {
    currency: params.currency ?? GA_CURRENCY,
    value: params.value,
    items: params.items,
  });
}

export function gaBeginCheckout(params: { items: GaItem[]; value: number; currency?: string }) {
  event("begin_checkout", {
    currency: params.currency ?? GA_CURRENCY,
    value: params.value,
    items: params.items,
  });
}

export function gaAddShippingInfo(params: {
  items: GaItem[];
  value: number;
  currency?: string;
  shippingTier?: string;
}) {
  event("add_shipping_info", {
    currency: params.currency ?? GA_CURRENCY,
    value: params.value,
    ...(params.shippingTier ? { shipping_tier: params.shippingTier } : {}),
    items: params.items,
  });
}

export function gaAddPaymentInfo(params: {
  items: GaItem[];
  value: number;
  currency?: string;
  paymentType?: string;
}) {
  event("add_payment_info", {
    currency: params.currency ?? GA_CURRENCY,
    value: params.value,
    ...(params.paymentType ? { payment_type: params.paymentType } : {}),
    items: params.items,
  });
}

export function gaPurchase(params: {
  transactionId: string;
  items: GaItem[];
  value: number;
  currency?: string;
  shipping?: number;
}) {
  event("purchase", {
    transaction_id: params.transactionId,
    currency: params.currency ?? GA_CURRENCY,
    value: params.value,
    ...(params.shipping !== undefined ? { shipping: params.shipping } : {}),
    items: params.items,
  });
}

export function gaSignUp(params?: { method?: string }) {
  event("sign_up", { method: params?.method ?? "email" });
}

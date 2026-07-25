declare global {
  interface Window {
    ttq?: any;
  }
}

export const TIKTOK_CURRENCY = "PKR";

type ContentType = "product" | "product_group";

export type TikTokContent = {
  content_id: string;
  content_type?: ContentType;
  content_name?: string;
  price?: number;
  num_items?: number;
};

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getTtq() {
  if (typeof window === "undefined") return null;
  return window.ttq ?? null;
}

function track(event: string, payload: Record<string, unknown>) {
  getTtq()?.track(event, payload);
}

/** Identifies the current visitor to TikTok so subsequent events on any page can be matched to them. PII is SHA-256 hashed client-side before it ever leaves the browser. */
export async function ttqIdentify(params: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
}) {
  const ttq = getTtq();
  if (!ttq) return;

  const identity: Record<string, string> = {};
  const email = params.email?.trim().toLowerCase();
  const phone = params.phone?.replace(/[^\d+]/g, "");
  const externalId = params.externalId?.trim();

  if (email) identity.email = await sha256Hex(email);
  if (phone) identity.phone_number = await sha256Hex(phone);
  if (externalId) identity.external_id = await sha256Hex(externalId);

  if (Object.keys(identity).length === 0) return;
  ttq.identify(identity);
}

export function ttqViewContent(content: TikTokContent & { value: number; currency?: string }) {
  track("ViewContent", {
    contents: [content],
    value: content.value,
    currency: content.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqAddToWishlist(content: TikTokContent & { value: number; currency?: string }) {
  track("AddToWishlist", {
    contents: [content],
    value: content.value,
    currency: content.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqSearch(params: { searchString: string; currency?: string }) {
  track("Search", {
    currency: params.currency ?? TIKTOK_CURRENCY,
    search_string: params.searchString,
  });
}

export function ttqAddToCart(content: TikTokContent & { value: number; currency?: string }) {
  track("AddToCart", {
    contents: [content],
    value: content.value,
    currency: content.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqInitiateCheckout(params: { contents: TikTokContent[]; value: number; currency?: string }) {
  track("InitiateCheckout", {
    contents: params.contents,
    value: params.value,
    currency: params.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqAddPaymentInfo(params: {
  contents: TikTokContent[];
  value: number;
  currency?: string;
  status?: string;
}) {
  track("AddPaymentInfo", {
    contents: params.contents,
    value: params.value,
    currency: params.currency ?? TIKTOK_CURRENCY,
    ...(params.status ? { status: params.status } : {}),
  });
}

export function ttqPlaceAnOrder(params: { contents: TikTokContent[]; value: number; currency?: string }) {
  track("PlaceAnOrder", {
    contents: params.contents,
    value: params.value,
    currency: params.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqCompleteRegistration(params?: { value?: number; currency?: string }) {
  track("CompleteRegistration", {
    value: params?.value ?? 0,
    currency: params?.currency ?? TIKTOK_CURRENCY,
  });
}

export function ttqPurchase(params: { contents: TikTokContent[]; value: number; currency?: string }) {
  track("Purchase", {
    contents: params.contents,
    value: params.value,
    currency: params.currency ?? TIKTOK_CURRENCY,
  });
}

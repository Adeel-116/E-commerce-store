export const SHIPPING_COST = 20;
export const FREE_SHIPPING_THRESHOLD = 200;

// Mirrors backend's shipping.service.ts — rawSubtotal must be pre-discount, pre-bundle.
export const getShippingRate = (rawSubtotal: number) =>
  rawSubtotal >= FREE_SHIPPING_THRESHOLD
    ? { label: "Free shipping", price: 0 }
    : { label: "Standard shipping", price: SHIPPING_COST };

export const FREE_SHIPPING_BANNER_TEXT = `Get free shipping when you spend AED ${FREE_SHIPPING_THRESHOLD} or more`;

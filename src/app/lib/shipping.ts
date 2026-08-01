export const SHIPPING_COST = 0;
export const FREE_SHIPPING_THRESHOLD = 0;

// Shipping is free site-wide, no minimum spend.
export const getShippingRate = () => ({ label: "Free shipping", price: 0 });

export const FREE_SHIPPING_BANNER_TEXT = "Free shipping on all orders";

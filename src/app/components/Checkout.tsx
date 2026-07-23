// "use client";

// import React, { useState, useEffect } from "react";
// import "../../app/styles/Checkout.css";
// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";
// import api from "../lib/axios";
// import { getShippingRate, FREE_SHIPPING_BANNER_TEXT } from "../lib/shipping";
// import NavbarController from "./NavbarController";

// const COUNTRY_OPTIONS = ["United Arab Emirates"];

// interface SavedAddress {
//   firstName: string;
//   lastName: string;
//   line1: string;
//   line2?: string;
//   city: string;
//   state: string;
//   postalCode: string;
//   country: string;
//   phone: string;
// }

// export default function Checkout() {
//   const { cartItems, pricing } = useCart();
//   const { user } = useAuth();

//   // Backend computes discounts (stacking, coupon rules, etc.) — never re-derive totals here.
//   const fallbackSubtotal = cartItems.reduce((s, i) => s + i.lineSubtotal, 0);
//   const originalSubtotal = pricing?.subtotal ?? fallbackSubtotal;
//   const discountSavings = pricing?.discountSavings ?? 0;
//   const bundleSavings = pricing?.bundleSavings ?? 0;
//   // subtotal net of product discounts + bundle savings, before any checkout coupon or shipping
//   const subtotal = pricing?.total ?? fallbackSubtotal;
//   const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

//   const [discountCode, setDiscountCode] = useState("");
//   const [newsEmail, setNewsEmail] = useState(false);
//   const [email, setEmail] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [line1, setLine1] = useState("");
//   const [line2, setLine2] = useState("");
//   const [city, setCity] = useState("");
//   const [stateField, setStateField] = useState("");
//   const [postalCode, setPostalCode] = useState("");
//   const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
//   const [phone, setPhone] = useState("");

//   // The account only ever holds a single saved address
//   const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
//   const [addressesLoading, setAddressesLoading] = useState(false);
//   const [usingSavedAddress, setUsingSavedAddress] = useState(false);
//   // AuthContext's cached user doesn't reliably carry email — source it from /me instead
//   const [accountEmail, setAccountEmail] = useState("");

//   const [isProcessing, setIsProcessing] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");

//   const isGuest = !user;
//   const shippingRate = getShippingRate(originalSubtotal);
//   const shipping = shippingRate.price;

//   // Coupan Code State
//   const [coupon, setCoupon] = useState<any>(null);
//   const [couponSummary, setCouponSummary] = useState<{
//     subtotal: number;
//     discount: number;
//     total: number;
//   } | null>(null);

//   const [couponLoading, setCouponLoading] = useState(false);

//   const [couponError, setCouponError] = useState("");

//   // couponSummary.total already reflects subtotal minus discount — shipping is added on top
//   const total = (couponSummary ? couponSummary.total : subtotal) + shipping;

//   const applyAddress = (addr: SavedAddress) => {
//     setFirstName(addr.firstName || "");
//     setLastName(addr.lastName || "");
//     setLine1(addr.line1);
//     setLine2(addr.line2 || "");
//     setCity(addr.city);
//     setStateField(addr.state);
//     setPostalCode(addr.postalCode);
//     setCountry(addr.country || COUNTRY_OPTIONS[0]);
//     setPhone(addr.phone);
//   };

//   const handleClearAddress = () => {
//     setUsingSavedAddress(false);
//     setFirstName("");
//     setLastName("");
//     setLine1("");
//     setLine2("");
//     setCity("");
//     setStateField("");
//     setPostalCode("");
//     setCountry(COUNTRY_OPTIONS[0]);
//     setPhone("");
//   };

//   const handleUseSavedAddress = () => {
//     if (!savedAddress) return;
//     applyAddress(savedAddress);
//     setUsingSavedAddress(true);
//   };

//   // Only digits, spaces, +, -, () are valid phone characters
//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setPhone(e.target.value.replace(/[^\d\s+()-]/g, ""));
//   };

//   // Postal codes here are numeric-only
//   const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setPostalCode(e.target.value.replace(/\D/g, ""));
//   };


//   // handle Apply Coupon
//   const handleApplyCoupon = async () => {
//     if (!discountCode.trim()) return;
//     try {
//       setCouponLoading(true);
//       setCouponError("");
//       const { data } = await api.post("/checkout/apply-coupon", {
//         code: discountCode,
//         subtotal
//       });
//       setCoupon(data.coupon);
//       setCouponSummary(data.summary);

//     } catch (err: any) {
//       setCoupon(null);
//       setCouponSummary(null);
//       setCouponError(
//         err?.response?.data?.message ??
//         "Failed to apply coupon."
//       );
//     } finally {
//       setCouponLoading(false);
//     }
//   };

//   const handleRemoveCoupon = () => {
//     setCoupon(null);
//     setCouponSummary(null);
//     setCouponError("");
//     setDiscountCode("");
//   };

//   const isAddressComplete = Boolean(
//     firstName.trim() &&
//     lastName.trim() &&
//     line1.trim() &&
//     city.trim() &&
//     stateField.trim() &&
//     postalCode.trim() &&
//     country.trim() &&
//     phone.trim()
//   );
//   const isContactComplete = !isGuest || Boolean(email.trim());
//   const canSubmit = isContactComplete && isAddressComplete && !isProcessing;

//   // Fetch the logged-in user's account email + saved address so they don't have to retype them
//   useEffect(() => {
//     if (!user) {
//       setSavedAddress(null);
//       setUsingSavedAddress(false);
//       setAccountEmail("");
//       return;
//     }
//     setAddressesLoading(true);
//     api
//       .get("/me")
//       .then(({ data }) => {
//         setAccountEmail(data?.user?.email || "");
//         const addr: SavedAddress | null = data?.user?.address || null;
//         setSavedAddress(addr);
//         if (addr) {
//           applyAddress(addr);
//           setUsingSavedAddress(true);
//         }
//       })
//       .catch(() => { })
//       .finally(() => setAddressesLoading(false));
//   }, [user]);


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsProcessing(true);
//     setErrorMsg("");

//     const shippingAddress = {
//       fullName: `${firstName} ${lastName}`.trim(),
//       email: isGuest ? email.trim() : (accountEmail || user!.email),
//       line1,
//       ...(line2.trim() ? { line2: line2.trim() } : {}),
//       city,
//       state: stateField,
//       postalCode,
//       country,
//       phone,
//     };

//     try {
//       const { data } = await api.post("/checkout/create-session", {
//         shippingAddress,
//         ...(isGuest ? { guestEmail: email } : {}),
//         ...(coupon ? { couponCode: coupon.code } : {}),
//       });

//       window.location.href = data.sessionUrl;
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message ??
//         err?.response?.data?.error ??
//         "Something went wrong. Please try again.";
//       setErrorMsg(msg);
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <>
//       <NavbarController />
//       <form className="co-wrap" onSubmit={handleSubmit}>
//       <div className="co-left">
//         {/* Contact */}
//         <div className="co-section">
//           <div className="co-section-header">
//             <h2 className="co-heading">Contact</h2>
//             {isGuest && (
//               <a href="/login" className="co-sign-in">Sign in</a>
//             )}
//           </div>
//           {isGuest ? (
//             <div className="co-field">
//               <input
//                 className="co-input"
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//           ) : (
//             <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
//               Signed in as <strong>{user.name}</strong>
//               {(accountEmail || user.email) && ` (${accountEmail || user.email})`}
//             </p>
//           )}
//           {/* <label className="co-checkbox-label">
//             <input
//               type="checkbox"
//               checked={newsEmail}
//               onChange={() => setNewsEmail(!newsEmail)}
//             />
//             <span>Email me with news and offers</span>
//           </label> */}
//         </div>

//         {/* Delivery */}
//         <div className="co-section">
//           <h2 className="co-heading">Delivery</h2>

//           {!isGuest && addressesLoading && (
//             <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Loading your saved address…</p>
//           )}

//           {!isGuest && savedAddress && (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 gap: 12,
//                 background: usingSavedAddress ? "var(--bg-soft)" : "var(--bg-soft)",
//                 border: `1px solid ${usingSavedAddress ? "var(--bg-soft-2)" : "var(--bg-soft-2)"}`,
//                 borderRadius: 6,
//                 padding: "10px 14px",
//                 marginBottom: 14,
//                 fontSize: 13,
//               }}
//             >
//               <span>
//                 {usingSavedAddress
//                   ? "Using your saved address — feel free to edit it below just for this order."
//                   : "You have a saved address on file."}
//               </span>
//               <button
//                 type="button"
//                 className="co-sign-in"
//                 style={{ whiteSpace: "nowrap" }}
//                 onClick={usingSavedAddress ? handleClearAddress : handleUseSavedAddress}
//               >
//                 {usingSavedAddress ? "Enter a different address" : "Use saved address"}
//               </button>
//             </div>
//           )}

//           <div className="co-field">
//             <label className="co-float-label">Country/Region</label>
//             <select
//               className="co-input co-select"
//               value={country}
//               onChange={(e) => setCountry(e.target.value)}
//             >
//               {COUNTRY_OPTIONS.map((c) => (
//                 <option key={c}>{c}</option>
//               ))}
//             </select>
//             <svg className="co-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a5a5a" strokeWidth="2.5">
//               <polyline points="6 9 12 15 18 9" />
//             </svg>
//           </div>
//           <div className="co-grid-2">
//             <div className="co-field">
//               <input className="co-input" type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
//             </div>
//             <div className="co-field">
//               <input className="co-input" type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
//             </div>
//           </div>
//           <div className="co-field co-field-icon">
//             <input className="co-input" type="text" placeholder="Area" value={line1} onChange={(e) => setLine1(e.target.value)} required />
//             <svg className="co-field-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2">
//               <circle cx="11" cy="11" r="8" />
//               <line x1="21" y1="21" x2="16.65" y2="16.65" />
//             </svg>
//           </div>
//           <div className="co-field">
//             <input className="co-input" type="text" placeholder="Apartment, suite, etc. (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
//           </div>
//           <div className="co-grid-3">
//             <div className="co-field">
//               <input className="co-input" type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
//             </div>
//             <div className="co-field">
//               <input className="co-input" type="text" placeholder="State" value={stateField} onChange={(e) => setStateField(e.target.value)} required />
//             </div>
//             <div className="co-field">
//               <input
//                 className="co-input"
//                 type="text"
//                 inputMode="numeric"
//                 pattern="\d*"
//                 placeholder="ZIP code"
//                 value={postalCode}
//                 onChange={handlePostalCodeChange}
//                 required
//               />
//             </div>
//           </div>
//           <div className="co-field">
//             <input
//               className="co-input"
//               type="tel"
//               inputMode="tel"
//               placeholder="Phone"
//               value={phone}
//               onChange={handlePhoneChange}
//               required
//             />
//           </div>
//         </div>

//         {/* Shipping method */}
//         <div className="co-section">
//           <h2 className="co-heading">Shipping method</h2>
//           <p className="co-shipping-banner">{FREE_SHIPPING_BANNER_TEXT}</p>
//           <div className="co-shipping-placeholder" style={{ background: "var(--bg-soft-2)", border: "1px solid var(--bg-soft-2)" }}>
//             <span className="co-shipping-rate">
//               {shippingRate.label} — <strong>{shippingRate.price === 0 ? "Free" : `AED ${shippingRate.price.toFixed(2)}`}</strong>
//             </span>
//           </div>
//         </div>

//         {errorMsg && (
//           <div style={{ background: "var(--bg-soft-2)", border: "1px solid var(--gold-soft)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "var(--brandblack)", fontSize: 14 }}>
//             {errorMsg}
//           </div>
//         )}

//         <button type="submit" className="co-pay-btn" disabled={!canSubmit}>
//           {isProcessing ? "Redirecting to payment…" : "Proceed to Payment"}
//         </button>

//         <div className="co-footer-links">
//           <a href="#">Refund policy</a>
//           <a href="#">Shipping</a>
//           <a href="#">Privacy policy</a>
//           <a href="#">Terms of service</a>
//           <a href="#">Contact</a>
//         </div>
//       </div>

//       {/* RIGHT STICKY SUMMARY */}
//       <div className="co-right" data-lenis-prevent="true" data-lenis-prevent-wheel="true" data-lenis-prevent-touch="true">
//         <div className="co-summary">
//           <div className="co-order-items">
//             {cartItems.length === 0 ? (
//               <p style={{ color: "var(--muted)", fontSize: 13 }}>No items in cart. <a href="/shop" style={{ color: "var(--brandgreen)" }}>Browse products</a></p>
//             ) : (
//               cartItems.map((item) => (
//                 <div className="co-order-item" key={`${item.id}-${item.size}`}>
//                   <div className="co-item-img-wrap">
//                     <img src={item.productImage} alt={item.productName} className="co-item-img" />
//                     <span className="co-item-badge">{item.quantity}</span>
//                   </div>
//                   <div className="co-item-info">
//                     <p className="co-item-name">{item.productName}</p>
//                     <p className="co-item-variant">{item.brand}</p>
//                   </div>
//                   <p className="co-item-price">AED {item.lineSubtotal.toFixed(2)}</p>
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="co-discount-row">
//             {coupon ? (
//               <div className="co-coupon-applied">
//                 <span className="co-coupon-chip">
//                   {coupon.code}
//                   <span className="co-coupon-chip-value">
//                     {coupon.valueType === "percentage" ? `${coupon.value}% off` : `AED ${coupon.value} off`}
//                   </span>
//                 </span>
//                 <button type="button" className="co-coupon-remove" onClick={handleRemoveCoupon}>
//                   Remove
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <div className="co-field co-discount-field">
//                   <input
//                     className="co-input co-discount-input"
//                     type="text"
//                     placeholder="Promo Code"
//                     value={discountCode}
//                     onChange={(e) => {
//                       setDiscountCode(e.target.value);
//                       if (couponError) setCouponError("");
//                     }}
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   className="co-discount-btn"
//                   onClick={handleApplyCoupon}
//                   disabled={couponLoading || !discountCode.trim()}
//                 >
//                   {couponLoading ? "Applying..." : "Apply"}
//                 </button>
//               </>
//             )}
//             {couponError && <div className="co-coupon-error">{couponError}</div>}
//           </div>

//           <div className="co-price-rows">
//             <div className="co-price-row">
//               <span>Subtotal &middot; {totalItems} {totalItems === 1 ? "item" : "items"}</span>
//               <span>AED {originalSubtotal.toFixed(2)}</span>
//             </div>
//             {discountSavings > 0 && (
//               <div className="co-price-row co-discount-price-row">
//                 <span>Discount</span>
//                 <span className="co-discount-amount">-AED {discountSavings.toFixed(2)}</span>
//               </div>
//             )}
//             {bundleSavings > 0 && (
//               <div className="co-price-row co-discount-price-row">
//                 <span>Bundle savings</span>
//                 <span className="co-discount-amount">-AED {bundleSavings.toFixed(2)}</span>
//               </div>
//             )}
//             {couponSummary && (
//               <div className="co-price-row co-discount-price-row">
//                 <span>Discount ({coupon?.code})</span>
//                 <span className="co-discount-amount">-AED {couponSummary.discount.toFixed(2)}</span>
//               </div>
//             )}
//             <div className="co-price-row">
//               <span className="co-shipping-label">
//                 Shipping
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2">
//                   <circle cx="12" cy="12" r="10" />
//                   <line x1="12" y1="8" x2="12" y2="12" />
//                   <line x1="12" y1="16" x2="12.01" y2="16" />
//                 </svg>
//               </span>
//               <span style={{ fontSize: "14px", fontWeight: 500 }}>
//                 {shippingRate.price === 0 ? "Free" : `AED ${shippingRate.price.toFixed(2)}`}
//               </span>
//             </div>
//             <div className="co-price-row co-total-row">
//               <span>Total</span>
//               <span><span className="co-total-currency">AED</span> <strong>{total.toFixed(2)}</strong></span>
//             </div>
//           </div>
//         </div>
//       </div>
//       </form>
//     </>
//   );
// }


"use client";

import React, { useState, useEffect } from "react";
import "../../app/styles/Checkout.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import { getShippingRate, FREE_SHIPPING_BANNER_TEXT } from "../lib/shipping";
import {
  ttqIdentify,
  ttqInitiateCheckout,
  ttqAddPaymentInfo,
  ttqPlaceAnOrder,
  ttqPurchase,
  TikTokContent,
} from "../lib/tiktokEvents";
import NavbarController from "./NavbarController";

const COUNTRY_OPTIONS = ["United Arab Emirates"];

type PaymentMethod = "card" | "cod";

interface SavedAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export default function Checkout() {
  const { cartItems, pricing } = useCart();
  const { user } = useAuth();

  const fallbackSubtotal = cartItems.reduce((s, i) => s + i.lineSubtotal, 0);
  const originalSubtotal = pricing?.subtotal ?? fallbackSubtotal;
  const discountSavings = pricing?.discountSavings ?? 0;
  const bundleSavings = pricing?.bundleSavings ?? 0;
  const subtotal = pricing?.total ?? fallbackSubtotal;
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  const [discountCode, setDiscountCode] = useState("");
  const [newsEmail, setNewsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [phone, setPhone] = useState("");

  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // COD doesn't redirect anywhere — success/failure is shown in a modal on this page
  const [codModal, setCodModal] = useState<
    | { status: "success"; orderId: string; total: number }
    | { status: "error"; message: string }
    | null
  >(null);

  const isGuest = !user;
  const shippingRate = getShippingRate(originalSubtotal);
  const shipping = shippingRate.price;

  const [coupon, setCoupon] = useState<any>(null);
  const [couponSummary, setCouponSummary] = useState<{
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);

  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const total = (couponSummary ? couponSummary.total : subtotal) + shipping;

  const checkoutContents: TikTokContent[] = cartItems.map((item) => ({
    content_id: item.id,
    content_type: "product",
    content_name: item.productName,
    price: item.unitPrice,
    num_items: item.quantity,
  }));

  const initiateCheckoutFiredRef = React.useRef(false);
  useEffect(() => {
    if (initiateCheckoutFiredRef.current || cartItems.length === 0) return;
    initiateCheckoutFiredRef.current = true;
    ttqInitiateCheckout({ contents: checkoutContents, value: subtotal });
  }, [cartItems]);

  const applyAddress = (addr: SavedAddress) => {
    setFirstName(addr.firstName || "");
    setLastName(addr.lastName || "");
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setStateField(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country || COUNTRY_OPTIONS[0]);
    setPhone(addr.phone);
  };

  const handleClearAddress = () => {
    setUsingSavedAddress(false);
    setFirstName("");
    setLastName("");
    setLine1("");
    setLine2("");
    setCity("");
    setStateField("");
    setPostalCode("");
    setCountry(COUNTRY_OPTIONS[0]);
    setPhone("");
  };

  const handleUseSavedAddress = () => {
    if (!savedAddress) return;
    applyAddress(savedAddress);
    setUsingSavedAddress(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^\d\s+()-]/g, ""));
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value.replace(/\D/g, ""));
  };

  const handleApplyCoupon = async () => {
    if (!discountCode.trim()) return;
    try {
      setCouponLoading(true);
      setCouponError("");
      const { data } = await api.post("/checkout/apply-coupon", {
        code: discountCode,
        subtotal,
        email: isGuest ? email.trim() : (accountEmail || user!.email),
      });
      setCoupon(data.coupon);
      setCouponSummary(data.summary);

    } catch (err: any) {
      setCoupon(null);
      setCouponSummary(null);
      setCouponError(
        err?.response?.data?.message ??
        "Failed to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponSummary(null);
    setCouponError("");
    setDiscountCode("");
  };

  const isAddressComplete = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    line1.trim() &&
    city.trim() &&
    stateField.trim() &&
    postalCode.trim() &&
    country.trim() &&
    phone.trim()
  );
  const isContactComplete = !isGuest || Boolean(email.trim());
  const canSubmit = isContactComplete && isAddressComplete && !isProcessing;

  useEffect(() => {
    if (!user) {
      setSavedAddress(null);
      setUsingSavedAddress(false);
      setAccountEmail("");
      return;
    }
    setAddressesLoading(true);
    api
      .get("/me")
      .then(({ data }) => {
        setAccountEmail(data?.user?.email || "");
        const addr: SavedAddress | null = data?.user?.address || null;
        setSavedAddress(addr);
        if (addr) {
          applyAddress(addr);
          setUsingSavedAddress(true);
        }
      })
      .catch(() => { })
      .finally(() => setAddressesLoading(false));
  }, [user]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg("");

    const shippingAddress = {
      fullName: `${firstName} ${lastName}`.trim(),
      email: isGuest ? email.trim() : (accountEmail || user!.email),
      line1,
      ...(line2.trim() ? { line2: line2.trim() } : {}),
      city,
      state: stateField,
      postalCode,
      country,
      phone,
    };

    ttqIdentify({ email: shippingAddress.email, phone: shippingAddress.phone });
    ttqAddPaymentInfo({ contents: checkoutContents, value: total, status: paymentMethod });

    try {
      if (paymentMethod === "cod") {
        const { data } = await api.post("/checkout/create-cod-order", {
          shippingAddress,
          ...(isGuest ? { guestEmail: email } : {}),
          ...(coupon ? { couponCode: coupon.code } : {}),
        });

        ttqPlaceAnOrder({ contents: checkoutContents, value: data.total ?? total });
        ttqPurchase({ contents: checkoutContents, value: data.total ?? total });
        setCodModal({ status: "success", orderId: data.orderId, total: data.total });
        setIsProcessing(false);
        return;
      }

      const { data } = await api.post("/checkout/create-session", {
        shippingAddress,
        ...(isGuest ? { guestEmail: email } : {}),
        ...(coupon ? { couponCode: coupon.code } : {}),
      });

      ttqPlaceAnOrder({ contents: checkoutContents, value: total });
      window.location.href = data.sessionUrl;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Something went wrong. Please try again.";

      if (paymentMethod === "cod") {
        setCodModal({ status: "error", message: msg });
      } else {
        setErrorMsg(msg);
      }
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavbarController />
      <form className="co-wrap" onSubmit={handleSubmit}>
        <div className="co-left">
          {/* Contact */}
          <div className="co-section">
            <div className="co-section-header">
              <h2 className="co-heading">Contact</h2>
              {isGuest && (
                <a href="/login" className="co-sign-in">Sign in</a>
              )}
            </div>
            {isGuest ? (
              <div className="co-field">
                <input
                  className="co-input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
                Signed in as <strong>{user.name}</strong>
                {(accountEmail || user.email) && ` (${accountEmail || user.email})`}
              </p>
            )}
          </div>

          {/* Delivery */}
          <div className="co-section">
            <h2 className="co-heading">Delivery</h2>

            {!isGuest && addressesLoading && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Loading your saved address…</p>
            )}

            {!isGuest && savedAddress && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  background: usingSavedAddress ? "var(--bg-soft)" : "var(--bg-soft)",
                  border: `1px solid ${usingSavedAddress ? "var(--bg-soft-2)" : "var(--bg-soft-2)"}`,
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 13,
                }}
              >
                <span>
                  {usingSavedAddress
                    ? "Using your saved address — feel free to edit it below just for this order."
                    : "You have a saved address on file."}
                </span>
                <button
                  type="button"
                  className="co-sign-in"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={usingSavedAddress ? handleClearAddress : handleUseSavedAddress}
                >
                  {usingSavedAddress ? "Enter a different address" : "Use saved address"}
                </button>
              </div>
            )}

            <div className="co-field">
              <label className="co-float-label">Country/Region</label>
              <select
                className="co-input co-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <svg className="co-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a5a5a" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="co-grid-2">
              <div className="co-field">
                <input className="co-input" type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="co-field">
                <input className="co-input" type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="co-field co-field-icon">
              <input className="co-input" type="text" placeholder="Area" value={line1} onChange={(e) => setLine1(e.target.value)} required />
              <svg className="co-field-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="co-field">
              <input className="co-input" type="text" placeholder="Apartment, suite, etc. (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
            </div>
            <div className="co-grid-3">
              <div className="co-field">
                <input className="co-input" type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="co-field">
                <input className="co-input" type="text" placeholder="State" value={stateField} onChange={(e) => setStateField(e.target.value)} required />
              </div>
              <div className="co-field">
                <input
                  className="co-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="ZIP code"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  required
                />
              </div>
            </div>
            <div className="co-field">
              <input
                className="co-input"
                type="tel"
                inputMode="tel"
                placeholder="Phone"
                value={phone}
                onChange={handlePhoneChange}
                required
              />
            </div>
          </div>

          {/* Shipping method */}
          <div className="co-section">
            <h2 className="co-heading">Shipping method</h2>
            <p className="co-shipping-banner">{FREE_SHIPPING_BANNER_TEXT}</p>
            <div className="co-shipping-placeholder" style={{ background: "var(--bg-soft-2)", border: "1px solid var(--bg-soft-2)" }}>
              <span className="co-shipping-rate">
                {shippingRate.label} — <strong>{shippingRate.price === 0 ? "Free" : `AED ${shippingRate.price.toFixed(2)}`}</strong>
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="co-section">
            <h2 className="co-heading">Payment</h2>
            <div className="co-payment-options">
              <label
                className="co-payment-option"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid ${paymentMethod === "card" ? "var(--brandgreen)" : "var(--bg-soft-2)"}`,
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span>Pay with Card</span>
              </label>
              <label
                className="co-payment-option"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid ${paymentMethod === "cod" ? "var(--brandgreen)" : "var(--bg-soft-2)"}`,
                  borderRadius: 6,
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: "var(--bg-soft-2)", border: "1px solid var(--gold-soft)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "var(--brandblack)", fontSize: 14 }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" className="co-pay-btn" disabled={!canSubmit}>
            {isProcessing
              ? (paymentMethod === "cod" ? "Placing order…" : "Redirecting to payment…")
              : (paymentMethod === "cod" ? "Place Order (Cash on Delivery)" : "Proceed to Payment")}
          </button>

          <div className="co-footer-links">
            <a href="#">Refund policy</a>
            <a href="#">Shipping</a>
            <a href="#">Privacy policy</a>
            <a href="#">Terms of service</a>
            <a href="#">Contact</a>
          </div>
        </div>

        {/* RIGHT STICKY SUMMARY */}
        <div className="co-right" data-lenis-prevent="true" data-lenis-prevent-wheel="true" data-lenis-prevent-touch="true">
          <div className="co-summary">
            <div className="co-order-items">
              {cartItems.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No items in cart. <a href="/shop" style={{ color: "var(--brandgreen)" }}>Browse products</a></p>
              ) : (
                cartItems.map((item) => (
                  <div className="co-order-item" key={`${item.id}-${item.size}`}>
                    <div className="co-item-img-wrap">
                      <img src={item.productImage} alt={item.productName} className="co-item-img" />
                      <span className="co-item-badge">{item.quantity}</span>
                    </div>
                    <div className="co-item-info">
                      <p className="co-item-name">{item.productName}</p>
                      <p className="co-item-variant">{item.brand}</p>
                    </div>
                    <p className="co-item-price">AED {item.lineSubtotal.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="co-discount-row">
              {coupon ? (
                <div className="co-coupon-applied">
                  <span className="co-coupon-chip">
                    {coupon.code}
                    <span className="co-coupon-chip-value">
                      {coupon.valueType === "percentage" ? `${coupon.value}% off` : `AED ${coupon.value} off`}
                    </span>
                  </span>
                  <button type="button" className="co-coupon-remove" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="co-field co-discount-field">
                    <input
                      className="co-input co-discount-input"
                      type="text"
                      placeholder="Promo Code"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        if (couponError) setCouponError("");
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="co-discount-btn"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !discountCode.trim()}
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                </>
              )}
              {couponError && <div className="co-coupon-error">{couponError}</div>}
            </div>

            <div className="co-price-rows">
              <div className="co-price-row">
                <span>Subtotal &middot; {totalItems} {totalItems === 1 ? "item" : "items"}</span>
                <span>AED {originalSubtotal.toFixed(2)}</span>
              </div>
              {discountSavings > 0 && (
                <div className="co-price-row co-discount-price-row">
                  <span>Discount</span>
                  <span className="co-discount-amount">-AED {discountSavings.toFixed(2)}</span>
                </div>
              )}
              {bundleSavings > 0 && (
                <div className="co-price-row co-discount-price-row">
                  <span>Bundle savings</span>
                  <span className="co-discount-amount">-AED {bundleSavings.toFixed(2)}</span>
                </div>
              )}
              {couponSummary && (
                <div className="co-price-row co-discount-price-row">
                  <span>Discount ({coupon?.code})</span>
                  <span className="co-discount-amount">-AED {couponSummary.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="co-price-row">
                <span className="co-shipping-label">
                  Shipping
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <span style={{ fontSize: "14px", fontWeight: 500 }}>
                  {shippingRate.price === 0 ? "Free" : `AED ${shippingRate.price.toFixed(2)}`}
                </span>
              </div>
              <div className="co-price-row co-total-row">
                <span>Total</span>
                <span><span className="co-total-currency">AED</span> <strong>{total.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </form>
      {codModal && (
        <div className="co-modal-overlay" role="dialog" aria-modal="true">
          <div className="co-modal">
            {codModal.status === "success" ? (
              <>
                <div className="co-modal-icon co-modal-icon-success">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brandgreen)" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h3 className="co-modal-title">Order placed!</h3>
                <p className="co-modal-sub">
                  Thanks{firstName ? `, ${firstName}` : ""} — we've received your order and will get it ready for delivery.
                </p>

                <div className="co-modal-details">
                  <div className="co-modal-detail-row">
                    <span>Order number</span>
                    <strong>{codModal.orderId}</strong>
                  </div>
                  <div className="co-modal-detail-row">
                    <span>Payment method</span>
                    <span>Cash on Delivery</span>
                  </div>
                  <div className="co-modal-detail-row">
                    <span>Amount due</span>
                    <strong>AED {codModal.total.toFixed(2)}</strong>
                  </div>
                </div>

                <button type="button" className="co-modal-cta" onClick={() => (window.location.href = "/shop")}>
                  Continue Shopping
                </button>
              </>
            ) : (
              <>
                <div className="co-modal-icon co-modal-icon-error">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brandblack)" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 className="co-modal-title co-modal-title-error">Couldn't place order</h3>
                <p className="co-modal-sub">{codModal.message}</p>
                <button type="button" className="co-modal-retry" onClick={() => setCodModal(null)}>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

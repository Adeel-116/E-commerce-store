"use client";

import { useState } from "react";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";
import { CheckCircle, Gift, Lock } from "lucide-react";
import { useCart } from "../context/CartContext";
import "../../app/styles/Cart.css";
import { ChevronDown } from "lucide-react";
import { getNextBundleSuggestions } from "../lib/cartBundles";

const Cart = () => {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructions, setInstructions] = useState("");

  const { cartItems, pricing, bundles, increaseQuantity, decreaseQuantity, removeItem, clearCart } =
    useCart();

  const fallbackSubtotal = cartItems.reduce((acc, item) => acc + item.lineSubtotal, 0);
  const originalSubtotal = pricing?.subtotal ?? fallbackSubtotal;
  const subtotal = pricing?.total ?? fallbackSubtotal;
  const discountSavings = pricing?.discountSavings ?? 0;
  const bundleSavings = pricing?.bundleSavings ?? 0;
  const totalSavings = discountSavings + bundleSavings;
  const appliedBundles = pricing?.appliedBundles ?? [];
  const bundleSuggestions = getNextBundleSuggestions(cartItems, bundles);
  const appliedDiscounts = pricing?.appliedDiscounts ?? [];

  return (
    <section className="cart-page">
      <div className="cart-container">
        <h1 className="cart-title">My cart</h1>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon-wrap">
              <FaShoppingCart className="empty-cart-icon" />
            </div>

            <h2>Oops! Your cart is empty.</h2>

            <p>
              But don&apos;t worry, we&apos;ve got amazing pieces waiting for you.
              <br />
              <span>
                Start exploring our collection and find something made for you.
              </span>
            </p>

            <Link href="/shop" className="browse-btn">
              Browse Our Collection
            </Link>
          </div>
        ) : (
          <div className="cart-layout"
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
          >
            <div className="cart-box">
              {bundleSuggestions.map((s) => {
                const item = cartItems.find((i) => i.id === s.productId);
                return (
                  <div className="cart-bundle-suggestion-banner" key={s.productId}>
                    <Gift size={18} className="cart-bundle-suggestion-icon" />
                    <p>
                      Add {s.unitsNeeded} more {item?.productName ?? "item"}
                      {s.unitsNeeded > 1 ? "s" : ""} to create a bundle of{" "}
                      {s.numberOfItems} and save PKR {s.savedAmount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
              <div className="cart-header">
                <span>Product</span>
                <span>Title</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>

              {cartItems.map((item) => (
                <div className="cart-row" key={`${item.id}-${item.size}-${item.color ?? ''}`}>
                  <div className="product-image-wrap">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="product-image"
                    />
                  </div>

                  <div className="product-info">
                    <h3>{item.productName}</h3>

                    {(item.size || item.color) && (
                      <p className="cart-item-size">
                        {item.size && <>Size: {item.size}</>}
                        {item.size && item.color ? " · " : ""}
                        {item.color && <>Color: {item.color}</>}
                      </p>
                    )}

                    {item.lineSubtotal < item.unitPrice * item.quantity ? (
                      <p className="product-price">
                        <span className="product-price--original">
                          PKR {item.unitPrice.toFixed(2)}
                        </span>{" "}
                        <span className="product-price--discounted">
                          PKR {(item.lineSubtotal / item.quantity).toFixed(2)}
                        </span>
                      </p>
                    ) : (
                      <p className="product-price">PKR {item.unitPrice.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="quantity-wrap">
                    <div className="quantity-box">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id, item.size, item.color)}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id, item.size, item.color)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeItem(item.id, item.size, item.color)}
                    >
                      Remove
                    </button>
                  </div>

                  <p className="item-total">
                    PKR {item.lineSubtotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* make this sticky */}
            <aside className="checkout-side sticky">
              {appliedBundles.map((bundle, i) => {
                const item = cartItems.find((it) => it.id === bundle.productId);
                return (
                  <div className="bundle-activation-banner" key={`${bundle.productId}-${bundle.numberOfItems}-${i}`}>
                    <div className="bundle-banner-content">
                      <CheckCircle size={24} className="bundle-banner-icon" />
                      <div className="bundle-banner-text">
                        <h3 className="bundle-banner-title">Bundle Activated</h3>
                        <p className="bundle-banner-subtitle">
                          {bundle.numberOfItems} × {item?.productName ?? "item"}
                          {bundle.timesApplied > 1 ? ` (×${bundle.timesApplied})` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="bundle-banner-savings">
                      <p className="bundle-savings-label">You Saved</p>
                      <p className="bundle-savings-amount">PKR {bundle.totalSavings.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}

              <div className="checkout-box">
                <div className="checkout-total-row">
                  <h2>Total</h2>
                  <strong>PKR {subtotal.toFixed(2)}</strong>
                </div>

                {totalSavings > 0 && (
                  <div className="cart-savings-box">
                    <p className="tax-text">
                      Original subtotal: PKR {originalSubtotal.toFixed(2)}
                    </p>
                    {discountSavings > 0 && (
                      <p className="tax-text">
                        {appliedDiscounts.map((d) => d.name).join(", ") || "Discount"} savings: −PKR {discountSavings.toFixed(2)}
                      </p>
                    )}
                    {bundleSavings > 0 && (
                      <p className="tax-text">
                        Bundle savings: −PKR {bundleSavings.toFixed(2)}
                      </p>
                    )}
                    <p className="tax-text cart-savings-highlight">
                      <CheckCircle size={14} className="cart-savings-check" />
                      You saved PKR {totalSavings.toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="order-instructions">
                  <button
                    type="button"
                    onClick={() => setInstructionsOpen(!instructionsOpen)}
                  >
                    <span>Order instructions</span>
                    <span
                      className={`order-chevron${instructionsOpen ? " open" : ""}`}
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  <div
                    className={`order-instructions-body${instructionsOpen ? " open" : ""}`}
                  >
                    <textarea
                      className="order-instructions-input"
                      placeholder="Add a note for your order..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <p className="tax-text">
                  Taxes and <span>shipping</span> calculated at checkout
                </p>

                <Link href="/checkout" className="checkout-btn">
                  Checkout
                </Link>
              </div>

              <div className="secure-payment">
                <p>
                  <Lock size={13} className="secure-payment-icon" />
                  Cash on Delivery — pay when your order arrives
                </p>
              </div>

              <button
                type="button"
                className="clear-cart-btn"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default Cart;

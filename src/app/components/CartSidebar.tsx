"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";
import { CheckCircle } from "lucide-react";
import gsap from "gsap";
import { useCart } from "../context/CartContext";
import "../styles/CartSidebar.css";
import { getNextBundleSuggestions } from "../lib/cartBundles";
import { gaViewCart } from "../lib/gaEvents";

const CartSidebar = () => {
  const {
    cartItems,
    pricing,
    bundles,
    isCartOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const fallbackSubtotal = cartItems.reduce(
    (acc, item) => acc + item.lineSubtotal,
    0,
  );
  const originalSubtotal = pricing?.subtotal ?? fallbackSubtotal;
  const total = pricing?.total ?? fallbackSubtotal;
  const discountSavings = pricing?.discountSavings ?? 0;
  const bundleSavings = pricing?.bundleSavings ?? 0;
  const totalSavings = discountSavings + bundleSavings;
  const appliedBundles = pricing?.appliedBundles ?? [];
  const appliedDiscounts = pricing?.appliedDiscounts ?? [];
  const bundleSuggestions = getNextBundleSuggestions(cartItems, bundles);

  const showBundleActivation = appliedBundles.length > 0;
  const showBundleSuggestion =
    !showBundleActivation && bundleSuggestions.length > 0;
  const bundleBannerKey = showBundleActivation
    ? "active"
    : showBundleSuggestion
      ? "suggest"
      : "none";

  const bundleBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;
    gaViewCart({
      value: total,
      items: cartItems.map((item) => ({
        item_id: item.id,
        item_name: item.productName,
        item_variant: item.color ?? undefined,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen]);

  useLayoutEffect(() => {
    const el = bundleBannerRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: -8, height: 0 },
      { opacity: 1, y: 0, height: "auto", duration: 0.35, ease: "power2.out" },
    );
  }, [bundleBannerKey]);

  return (
    <>
      <div
        className={`cart-sidebar-backdrop${isCartOpen ? " open" : ""}`}
        onClick={closeCart}
      />

      <div className={`cart-sidebar${isCartOpen ? " open" : ""}`}>
        <div className="cart-sidebar-header">
          <h2 className="cart-sidebar-title">
            My Cart{cartItems.length > 0 ? ` (${cartItems.length})` : ""}
          </h2>
          <button
            type="button"
            className="cart-sidebar-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-sidebar-empty">
            <FaShoppingCart className="cart-sidebar-empty-icon" />
            <h3>Your cart is empty</h3>
            <p>Add some products to get started.</p>
            <Link href="/shop" className="csb-browse-btn" onClick={closeCart}>
              Browse Collection
            </Link>
          </div>
        ) : (
          <>
            <div
              className="cart-sidebar-items"
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
            >
              {cartItems.map((item) => {
                const originalLineTotal = item.unitPrice * item.quantity;
                const hasDiscount = !!item.activeDiscount;
                const discountAmount = item.activeDiscount
                  ? item.activeDiscount.valueType === "percentage"
                    ? Math.round(
                        originalLineTotal * (item.activeDiscount.value / 100),
                      )
                    : Math.round(item.activeDiscount.value * item.quantity)
                  : 0;
                const discountedLineTotal = hasDiscount
                  ? originalLineTotal - discountAmount
                  : item.lineSubtotal;

                return (
                  <div
                    className="cart-sidebar-item"
                    key={`${item.id}-${item.size}-${item.color ?? ""}-${item.stitching ?? ""}`}
                  >
                    <div className="cart-sidebar-img-wrap">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        title={item.productName}
                        className="cart-sidebar-img"
                      />
                    </div>

                    <div className="cart-sidebar-info">
                      <h4 className="cart-sidebar-item-name">
                        {item.productName}
                      </h4>

                      {(item.size || item.color || item.stitching) && (
                        <p className="csb-item-size">
                          {[
                            item.size ? `Size: ${item.size}` : "",
                            item.color ? `Color: ${item.color}` : "",
                            item.stitching ? `Type: ${item.stitching}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <div className="cart-sidebar-controls">
                        <div className="csb-quantity-box">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item.id,
                                item.size,
                                item.color,
                                item.stitching,
                              )
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item.id,
                                item.size,
                                item.color,
                                item.stitching,
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="csb-remove-btn"
                          onClick={() =>
                            removeItem(
                              item.id,
                              item.size,
                              item.color,
                              item.stitching,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="cart-sidebar-item-price-group">
                      {hasDiscount ? (
                        <>
                          <p className="cart-sidebar-item-total cart-sidebar-item-total--original">
                            PKR {originalLineTotal.toFixed(2)}
                          </p>
                          <p className="cart-sidebar-item-total cart-sidebar-item-total--discounted">
                            PKR {discountedLineTotal.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="cart-sidebar-item-total">
                          PKR {discountedLineTotal.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-sidebar-footer">
              {(showBundleActivation || showBundleSuggestion) && (
                <div
                  className="csb-bundle-banner-zone"
                  ref={bundleBannerRef}
                  key={bundleBannerKey}
                >
                  {showBundleSuggestion &&
                    bundleSuggestions.map((s) => {
                      const item = cartItems.find((i) => i.id === s.productId);
                      return (
                        <p
                          className="csb-bundle-suggestion-banner"
                          key={s.productId}
                        >
                          Add {s.unitsNeeded} more {item?.productName ?? "item"}
                          {s.unitsNeeded > 1 ? "s" : ""} to get a discount of
                          PKR {s.savedAmount.toFixed(2)}.
                        </p>
                      );
                    })}

                  {showBundleActivation &&
                    appliedBundles.map((bundle, i) => {
                      const item = cartItems.find(
                        (it) => it.id === bundle.productId,
                      );
                      return (
                        <div
                          className="csb-bundle-activation-banner"
                          key={`${bundle.productId}-${bundle.numberOfItems}-${i}`}
                        >
                          <div className="csb-bundle-banner-content">
                            <CheckCircle
                              size={20}
                              className="csb-bundle-banner-icon"
                            />
                            <div className="csb-bundle-banner-text">
                              <h3 className="csb-bundle-banner-title">
                                Bundle Activated
                              </h3>
                              <p className="csb-bundle-banner-subtitle">
                                {bundle.numberOfItems} ×{" "}
                                {item?.productName ?? "item"}
                                {bundle.timesApplied > 1
                                  ? ` (×${bundle.timesApplied})`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="csb-bundle-banner-savings">
                            <p className="csb-bundle-savings-amount">
                              Save PKR {bundle.totalSavings.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="csb-total-row">
                <h2>Total</h2>
                <strong>PKR: {total.toFixed(2)}</strong>
              </div>

              {totalSavings > 0 && (
                <>
                  {/* <p className="csb-savings-text">
                    Original subtotal: PKR {originalSubtotal.toFixed(2)}
                  </p> */}
                  {/* {discountSavings > 0 && (
                    <p className="csb-savings-text">
                      {appliedDiscounts.map((d) => d.name).join(", ") || "Discount"} savings: −PKR {discountSavings.toFixed(2)}
                    </p>
                  )} */}
                  {/* {bundleSavings > 0 && (
                    <p className="csb-savings-text">
                      Bundle savings: −PKR {bundleSavings.toFixed(2)}
                    </p>
                  )} */}
                  {/* <p className="csb-savings-text">
                    You saved PKR {totalSavings.toFixed(2)}
                  </p> */}
                </>
              )}
              <div className="csb-btn-row">
                <Link
                  href="/cart"
                  className="csb-open-cart-btn"
                  onClick={closeCart}
                >
                  Open Cart
                </Link>
                <Link
                  href="/checkout"
                  className="csb-checkout-btn"
                  onClick={closeCart}
                >
                  Checkout
                </Link>
              </div>

              <button
                type="button"
                className="csb-clear-btn"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;

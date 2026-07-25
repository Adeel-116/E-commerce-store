"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import "../../styles/ProductInner.css";
import "../../styles/ProductGrid.css";
import StickNavbar from "@/app/components/StickNavbar";
import api from "@/app/lib/axios";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { Shirt, ShieldCheck, Lock, Truck } from "lucide-react";

type Product = {
  _id: string;
  productId: number;
  title: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  isNew: boolean;
  stock: boolean;
  status: "active" | "inactive";
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

function getDiscountPercent(product: Product): number | null {
  return product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;
}

export default function ShopInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setActiveImage(0);
      setQuantity(1);
      setSelectedSize(null);

      try {
        const { data } = await api.get("/getProductById", { params: { slug } });
        if (cancelled) return;

        if (data?.success && data.data) {
          setProduct(data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", limit: 5 },
        });
        if (cancelled) return;
        const list: Product[] = (data?.data ?? [])
          .filter((p: Product) => p._id !== product._id)
          .slice(0, 4);
        setSimilarProducts(list);
      } catch {
        if (!cancelled) setSimilarProducts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product]);

  const toggleAccordion = (index: number) => {
    setActiveAccordion((prev) => (prev === index ? null : index));
  };

  if (loading) {
    return (
      <div className="shop-inner-page">
        <StickNavbar />
        <div className="shop-inner-status">Loading…</div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="shop-inner-page">
        <StickNavbar />
        <div className="shop-inner-status">Product not found.</div>
      </div>
    );
  }

  const discountPercent = getDiscountPercent(product);
  const wishlisted = isWishlisted(product._id);
  const hasSizes = product.sizes.length > 0;
  const canAddToCart = product.stock && (!hasSizes || !!selectedSize);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: product.price,
      size: selectedSize ?? "",
      quantity,
      productImage: product.images[0],
    });
    openCart();
  };

  return (
    <div className="shop-inner-page">
      <StickNavbar />

      <div className="shop-inner-page-container">
        <div className="shop-inner-container shop-inner-container--stretch">
          {/* Left: Image gallery */}
          <div className="shop-inner-product-image-col">
            <nav className="breadcrumb">
              <Link href="/">Home</Link>
              <span className="sep">|</span>
              <Link href="/shop">Shop</Link>
              <span className="sep">|</span>
              <span>{product.title}</span>
            </nav>

            <div className="shop-inner-bundle-banner">
              <div className="shop-inner-bundle-banner-icon">
                <Truck size={16} />
              </div>
              <div className="shop-inner-bundle-banner-text">
                <p>
                  <strong>Free Delivery:</strong> On all orders above Rs. 3,000.
                </p>
              </div>
            </div>

            <div className="shop-inner-gallery">
              {product.images.length > 1 && (
                <div className="shop-inner-gallery-thumbs">
                  {product.images.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      className={`shop-inner-gallery-thumb${activeImage === index ? " active" : ""}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              <div className="shop-inner-fixed-image-wrap">
                {discountPercent !== null && (
                  <div className="shop-inner-discount-ribbon">
                    <span className="shop-inner-discount-tag">
                      -{discountPercent}%
                    </span>
                  </div>
                )}
                <button
                  className={`shop-inner-wishlist-btn ${wishlisted ? "active" : ""}`}
                  onClick={() =>
                    toggleWishlist({
                      id: product._id,
                      name: product.title,
                      description: product.description,
                      image: product.images[0],
                      stock: product.stock,
                      price: product.price,
                      sizes: product.sizes,
                    })
                  }
                  aria-label="Add to wishlist"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                      2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09
                      3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
                      3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={wishlisted ? "#1c1c1c" : "none"}
                      stroke={wishlisted ? "#1c1c1c" : "#5a5a5a"}
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>

                <img
                  src={product.images[activeImage]}
                  alt={product.title}
                  className="shop-inner-static-img"
                />
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="shop-inner-right-container shop-inner-right-centered">
            <h1 className="shop-inner-title">{product.title}</h1>

            <p className="shop-inner-description">{product.description}</p>

            <hr className="section-divider" />

            {/* Price */}
            <div className="shop-inner-size-price">
              <div className="price-box-container">
                <span className="price-current">
                  Rs.{(product.price * quantity).toLocaleString()}
                </span>
                {product.comparePrice && (
                  <span className="price-original">
                    Rs.{" "}
                    <span className="price-original-value">
                      {(product.comparePrice * quantity).toLocaleString()}
                    </span>
                  </span>
                )}
                {discountPercent !== null && (
                  <span className="discount-label">-{discountPercent}%</span>
                )}
              </div>

              {/* Size selector */}
              {hasSizes ? (
                <div className="shop-inner-size-selector">
                  <span className="shop-inner-size-label">Select Size</span>
                  <div className="shop-inner-size-options">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`shop-inner-size-pill${selectedSize === size ? " active" : ""}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="shop-inner-size-hint">No sizes available for this product.</p>
              )}
            </div>

            {/* Qty + Cart */}
            <div className="qty-block" style={{ marginTop: "20px" }}>
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>

              <button
                className="add-to-cart-btn"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                {!product.stock
                  ? "SOLD OUT"
                  : hasSizes && !selectedSize
                  ? "SELECT A SIZE"
                  : "ADD TO CART"}
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </button>

              <Link href="/checkout" className="checkout-btn">
                CHECKOUT
              </Link>
            </div>

            <hr className="section-divider" style={{ marginTop: "24px" }} />

            <div className="trust-badges">
              <div className="trust-item">
                <div className="trust-icon">
                  <Shirt />
                </div>
                <div className="trust-text">
                  <strong>Premium Fabric Quality</strong>
                  <span>Comfortable everyday wear</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <ShieldCheck />
                </div>
                <div className="trust-text">
                  <strong>Authenticity Guarantee</strong>
                  <span>On all the products</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <Lock />
                </div>
                <div className="trust-text">
                  <strong>Safe and Secure Checkout</strong>
                  <span>Ensures data protection</span>
                </div>
              </div>
            </div>

            <div className="accordion-section">
              {/* PRODUCT DETAILS */}
              <div className={`accordion-item ${activeAccordion === 0 ? "active" : ""}`}>
                <button className="accordion-header" onClick={() => toggleAccordion(0)}>
                  <span>PRODUCT DETAILS</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="accordion-content">
                  <div className="accordion-inner">
                    <ul>
                      <li>
                        <strong>Fabric:</strong> High-quality, breathable and washable
                        fabric designed for everyday comfort.
                      </li>
                      <li>
                        <strong>Care:</strong> Machine washable, avoid harsh detergents to
                        preserve embellishments.
                      </li>
                      <li>
                        <strong>Fit:</strong> True to size, relaxed comfortable cut.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* DELIVERY */}
              <div className={`accordion-item ${activeAccordion === 1 ? "active" : ""}`}>
                <button className="accordion-header" onClick={() => toggleAccordion(1)}>
                  <span>DELIVERY</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="accordion-content">
                  <div className="accordion-inner">
                    <ul>
                      <li>Free delivery on orders above Rs. 3,000</li>
                      <li>Standard delivery charges: Rs. 200</li>
                      <li>3-5 working days all over Pakistan</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* RETURNS */}
              <div className={`accordion-item ${activeAccordion === 2 ? "active" : ""}`}>
                <button className="accordion-header" onClick={() => toggleAccordion(2)}>
                  <span>EXCHANGE POLICY</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="accordion-content">
                  <div className="accordion-inner">
                    <ul>
                      <li>Exchanges accepted within 7 days of delivery.</li>
                      <li>Item must be unworn, unwashed, and with tags attached.</li>
                      <li>Processing time: 2-3 working days.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        {similarProducts.length > 0 && (
          <div className="similar-products-section">
            <h2 id="similar-text">You May Also Like</h2>
            <div className="cg-grid similar-products-grid">
              {similarProducts.map((item) => {
                const itemDiscount = getDiscountPercent(item);
                return (
                  <Link href={`/shop/${item.slug}`} key={item._id} className="cg-card">
                    <div className="cg-card-image-container">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="cg-card-image"
                      />
                    </div>
                    <div className="cg-card-bottom-section">
                      <h3 className="cg-card-heading">{item.title}</h3>
                      <div className="cg-card-price-row">
                        <span className="cg-card-price cg-card-price--discounted">
                          Rs.{item.price.toLocaleString()}
                        </span>
                        {itemDiscount !== null && item.comparePrice && (
                          <span className="cg-card-price cg-card-price--original">
                            Rs.{item.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

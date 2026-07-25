"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import '../styles/ProductGrid.css'
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import api from "../lib/axios";
import { ProductGridSkeleton } from "./Skeleton";

export type GridProduct = {
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

function ProductCard({ product }: { product: GridProduct }) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const [activeImage, setActiveImage] = useState(0);

  const wishlisted = isWishlisted(product._id);
  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;
  const firstSize = product.sizes?.[0];

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist({
      id: product._id,
      name: product.title,
      image: product.images[0],
      stock: product.stock,
      price: product.price,
      sizes: product.sizes,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstSize) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: product.price,
      size: firstSize,
      productImage: product.images[0],
    });
    openCart();
  };

  const swapImage = (dir: 1 | -1) => {
    setActiveImage((prev) => (prev + dir + product.images.length) % product.images.length);
  };

  return (
    <div className="cg-card">
      <div className="cg-card-badges">
        {discountPercent !== null && (
          <span className="cg-badge cg-badge-sale">-{discountPercent}%</span>
        )}
        {product.isNew && <span className="cg-badge cg-badge-new">New</span>}
      </div>

      <div
        className="cg-card-image-container"
        onClick={() => router.push(`/shop/${product.slug}`)}
      >
        <img
          src={product.images[activeImage]}
          alt={product.title}
          draggable={false}
          className="cg-card-image"
        />

        {product.images.length > 1 && (
          <>
            <button
              className="cg-card-arrow cg-card-arrow-left"
              onClick={(e) => { e.stopPropagation(); swapImage(-1); }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="cg-card-arrow cg-card-arrow-right"
              onClick={(e) => { e.stopPropagation(); swapImage(1); }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="cg-card-bottom-section">
        <h3 className="cg-card-heading">{product.title}</h3>

        <div className="cg-card-price-row">
          {product.comparePrice ? (
            <>
              <span className="cg-card-price cg-card-price--discounted">
                Rs.{product.price.toLocaleString()}
              </span>
              <span className="cg-card-price cg-card-price--original">
                Rs.{product.comparePrice.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="cg-card-price">Rs.{product.price.toLocaleString()}</span>
          )}
        </div>

        <div className="cg-card-actions">
          <button
            className="cg-card-add-cart"
            onClick={handleAddToCart}
            disabled={!firstSize}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {firstSize ? "Add to Cart" : "Unavailable"}
          </button>
          <button
            className={`cg-card-add-wishlist${wishlisted ? " active" : ""}`}
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={wishlisted ? "#1c1c1c" : "none"}
              stroke={wishlisted ? "#1c1c1c" : "currentColor"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const ProductGrid = ({ title = "Best Sellers", limit = 8 }: { title?: string; limit?: number }) => {
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", limit },
        });
        if (!cancelled) setProducts(data?.data ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div className="cg-section">
      <div className="cg-section-header">
        <p className="cg-section-tag">Shop The Look</p>
        <h2 className="cg-section-title">{title}</h2>
        <span className="cg-section-divider" />
      </div>

      {loading ? (
        <ProductGridSkeleton count={limit} />
      ) : products.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
          No products found.
        </p>
      ) : (
        <div className="cg-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../styles/ProductGrid.css";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import api from "../lib/axios";
import { ProductGridSkeleton } from "./Skeleton";
import ProductImageSwiper from "./ProductImageSwiper";
import {
  useProductCardImages,
  isRealColor,
} from "../hooks/useProductCardImages";

type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

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
  colors: ColorVariant[];
  isNew: boolean;
  isBestSeller: boolean;
  stock: boolean;
  status: "active" | "inactive";
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

function getMockProducts(): GridProduct[] {
  return [
    {
      _id: "mock1",
      productId: 1,
      title: "Zainab Floral Maxi",
      slug: "zainab-floral-maxi",
      description: "A beautiful floral maxi dress perfect for any occasion.",
      images: ["/p1-main.jpg", "/p1-hover.jpg"],
      price: 3500,
      comparePrice: 4200,
      category: ["maxi", "fashion"],
      sizes: ["S", "M", "L", "XL"],
      colors: [
        {
          name: "Rose",
          hex: "#c97b7b",
          images: ["/p1-main.jpg", "/p1-hover.jpg"],
        },
        {
          name: "Ivory",
          hex: "#f5f0e8",
          images: ["/p2-main.png", "/p2-hover.png"],
        },
      ],
      isNew: true,
      isBestSeller: true,
      stock: true,
      status: "active",
      activeDiscount: {
        discountId: "d1",
        name: "Sale",
        valueType: "percentage",
        value: 17,
      },
    },
    {
      _id: "mock2",
      productId: 2,
      title: "Classic Lawn Suit",
      slug: "classic-lawn-suit",
      description: "Breathable premium lawn 3-piece suit.",
      images: ["/p2-main.png", "/p2-hover.png"],
      price: 4800,
      comparePrice: null,
      category: ["fashion"],
      sizes: ["S", "M", "L"],
      colors: [
        {
          name: "Mint",
          hex: "#a8d8b9",
          images: ["/p2-main.png", "/p2-hover.png"],
        },
        {
          name: "Peach",
          hex: "#f4a79d",
          images: ["/p1-main.jpg", "/p1-hover.jpg"],
        },
      ],
      isNew: true,
      isBestSeller: true,
      stock: true,
      status: "active",
      activeDiscount: null,
    },
    {
      _id: "mock3",
      productId: 3,
      title: "Denim Co-ord Set",
      slug: "denim-co-ord-set",
      description: "Trendy denim co-ord set — available in multiple washes.",
      images: ["/p3-main.jpg", "/p3-hover.jpg"],
      price: 5200,
      comparePrice: 6000,
      category: ["top-jeans", "western"],
      sizes: ["XS", "S", "M", "L"],
      colors: [
        {
          name: "Light Blue",
          hex: "#a0bfd9",
          images: ["/p3-main.jpg", "/p3-hover.jpg"],
        },
        {
          name: "Dark Wash",
          hex: "#3a5068",
          images: ["/p4-main.png", "/p4-hover.png"],
        },
      ],
      isNew: false,
      isBestSeller: true,
      stock: true,
      status: "active",
      activeDiscount: {
        discountId: "d2",
        name: "Sale",
        valueType: "percentage",
        value: 13,
      },
    },
    {
      _id: "mock4",
      productId: 4,
      title: "Embroidered Kurtis",
      slug: "embroidered-kurtis",
      description: "Hand-embroidered kurti with delicate threadwork.",
      images: ["/p4-main.png", "/p4-hover.png"],
      price: 2800,
      comparePrice: null,
      category: ["fashion"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: [
        {
          name: "Gold",
          hex: "#c8a84b",
          images: ["/p4-main.png", "/p4-hover.png"],
        },
        {
          name: "Emerald",
          hex: "#3d7a5a",
          images: ["/p5-main.png", "/p5-hover.png"],
        },
      ],
      isNew: false,
      isBestSeller: true,
      stock: true,
      status: "active",
      activeDiscount: null,
    },
    {
      _id: "mock5",
      productId: 5,
      title: "Chiffon Evening Gown",
      slug: "chiffon-evening-gown",
      description: "Flowy chiffon gown ideal for formal events.",
      images: ["/p5-main.png", "/p5-hover.png"],
      price: 7500,
      comparePrice: 9000,
      category: ["fashion", "maxi"],
      sizes: ["S", "M", "L"],
      colors: [
        {
          name: "Blush",
          hex: "#e8b4b8",
          images: ["/p5-main.png", "/p5-hover.png"],
        },
        {
          name: "Navy",
          hex: "#1e3a5f",
          images: ["/p6-main.png", "/p6-hover.png"],
        },
      ],
      isNew: true,
      isBestSeller: true,
      stock: true,
      status: "active",
      activeDiscount: {
        discountId: "d3",
        name: "Eid Sale",
        valueType: "percentage",
        value: 17,
      },
    },
    {
      _id: "mock6",
      productId: 6,
      title: "Casual Palazzo Set",
      slug: "casual-palazzo-set",
      description: "Comfortable palazzo pants with matching top.",
      images: ["/p6-main.png", "/p6-hover.png"],
      price: 3200,
      comparePrice: null,
      category: ["western"],
      sizes: ["S", "M", "L", "XL"],
      colors: [
        {
          name: "White",
          hex: "#f5f5f5",
          images: ["/p6-main.png", "/p6-hover.png"],
        },
        {
          name: "Black",
          hex: "#1c1c1c",
          images: ["/p3-main.jpg", "/p3-hover.jpg"],
        },
      ],
      isNew: false,
      isBestSeller: true,
      stock: false,
      status: "active",
      activeDiscount: null,
    },
  ];
}

export function ProductCard({ product }: { product: GridProduct }) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const {
    displayImages,
    activeColorName,
    previewColor,
    activeImageIndex,
    onIndexChange,
  } = useProductCardImages(product.images, product.colors ?? []);

  const wishlisted = isWishlisted(product._id);
  const firstSize = product.sizes?.[0];
  const visibleColors = (product.colors ?? []).filter(isRealColor);
  const firstColor = visibleColors[0]?.name ?? null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist({
      id: product._id,
      name: product.title,
      image: displayImages[0] ?? product.images[0],
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
      color: firstColor,
      productImage: displayImages[0] ?? product.images[0],
    });
    openCart();
  };

  return (
    <div className="cg-card">
      <div className="cg-card-image-container">
        <ProductImageSwiper
          images={displayImages}
          alt={product.title}
          onImageClick={() => router.push(`/shop/${product.slug}`)}
          activeIndex={activeImageIndex}
          onIndexChange={onIndexChange}
        />

        <div className="cg-card-scrim" />

        <div className="cg-card-badges">
          {product.isNew && (
            <span className="cg-badge cg-badge-new">New In</span>
          )}
        </div>

        <button
          className={`cg-card-wishlist-float${wishlisted ? " active" : ""}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            width="16"
            height="16"
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

        <button
          className="cg-card-quick-add"
          onClick={handleAddToCart}
          disabled={!firstSize}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {firstSize ? "Add to Cart" : "Unavailable"}
        </button>
      </div>

      <div className="cg-card-bottom-section">
        <div className="cg-card-heading-row">
          <h3 className="cg-card-heading">{product.title}</h3>
          <span className="cg-card-price">
            Rs.{product.price.toLocaleString()}
          </span>
        </div>

        {visibleColors.length > 0 && (
          <div
            className="cg-card-color-swatches"
            onMouseLeave={() => previewColor(null)}
          >
            {visibleColors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                className={`cg-card-color-dot${activeColorName === color.name ? " active" : ""}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                onMouseEnter={() => previewColor(color.name)}
                onClick={(e) => {
                  e.stopPropagation();
                  previewColor(
                    activeColorName === color.name ? null : color.name,
                  );
                }}
              />
            ))}
            {visibleColors.length > 5 && (
              <span className="cg-card-color-more">
                +{visibleColors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ProductGrid = ({
  title = "Best Sellers",
  limit = 8,
}: {
  title?: string;
  limit?: number;
}) => {
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", isBestSeller: "true", limit },
        });
        if (!cancelled)
          setProducts(data?.data?.length > 0 ? data.data : getMockProducts());
      } catch {
        if (!cancelled) setProducts(getMockProducts());
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
        <div className="cg-section-eyebrow">
          <span className="cg-section-eyebrow-line" />
          <p className="cg-section-tag">Shop The Look</p>
          <span className="cg-section-eyebrow-line" />
        </div>
        <h2 className="cg-section-title">{title}</h2>
        <p className="cg-section-subtitle">
          Handpicked favourites our customers keep coming back for.
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={limit} />
      ) : products.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "var(--muted)",
          }}
        >
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

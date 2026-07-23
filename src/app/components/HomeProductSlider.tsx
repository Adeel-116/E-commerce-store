"use client";
import { useRouter } from "next/navigation";
import '../styles/ProductGrid.css'
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

type Card = {
  id: number;
  _id: string;
  slug: string;
  images: string[];
  heading: string;
  stock?: boolean;
  price: { "50ml": number; "100ml": number };
  category: string;
  tag?: string | null;
  _slot: number;
  activeDiscount?: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

type Props = {
  card: Card;
  currentImage: string;
};

function applyDiscount(
  price: number,
  discount: { valueType: "percentage" | "fixed"; value: number } | null | undefined
): number | null {
  if (!discount) return null;
  if (discount.valueType === "percentage") return Math.round(price * (1 - discount.value / 100));
  return Math.max(0, price - discount.value);
}

export default function HomeProductSlider({ card, currentImage }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const disc = card.activeDiscount;
  const discounted50 = applyDiscount(card.price["50ml"], disc);
  const badgeLabel = disc
    ? disc.valueType === "percentage"
      ? `-${disc.value}%`
      : `-${disc.value}`
    : null;

  const addToCartMethod = () => {
    addToCart({
      id: card._id,
      productName: card.heading,
      brand: "",
      prices: card.price,
      size: "50ml",
      productImage: currentImage,
    });
  };

  const addToWishlist = () => {
    toggleWishlist({
      id: card._id,
      name: card.heading,
      description: "",
      image: currentImage,
      stock: card.stock,
      price: card.price,
    });
  };

  return (
    <div key={`slot-${card._slot}`} className="cg-card">
      {badgeLabel && (
        <span className="cg-card-discount-tag">{badgeLabel}</span>
      )}

      <div className="cg-card-top-row">
        {card.tag ? (
          <span className={`card-tag-pill${badgeLabel ? " cg-pill-margin-left" : ""}`}>{card.tag}</span>
        ) : (
          <span />
        )}
        <button
          className={`cg-card-wishlist-btn${isWishlisted(card._id) ? " active" : ""}`}
          onClick={(e) => { e.stopPropagation(); addToWishlist(); }}
          aria-label={isWishlisted(card._id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isWishlisted(card._id) ? "#1f1f1f" : "none"}
            stroke={isWishlisted(card._id) ? "#1f1f1f" : "currentColor"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div
        className="cg-card-image-container"
        onClick={() => router.push(`/shop/${card.slug}`)}
        style={{ cursor: "pointer" }}
      >
        <img
          src={currentImage}
          alt={card.heading}
          draggable={false}
          className="cg-card-image"
        />
      </div>

      <div className="cg-card-bottom-section">
        <h3 className="cg-card-heading">{card.heading}</h3>

        <div className="cg-card-bottom-row">
          <div className="cg-card-price-group">
            {disc ? (
              <span className="cg-card-price-row">
                <span className="cg-card-price cg-card-price--original">
                  AED <span className="cg-card-price-value">{card.price["50ml"]}</span>
                </span>
                <span className="cg-card-price cg-card-price--discounted">
                  {discounted50}
                </span>
              </span>
            ) : (
              <span className="cg-card-price">
                AED {card.price["50ml"]}
              </span>
            )}
          </div>
          <button
            className="cg-card-cart-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCartMethod();
            }}
            aria-label="Add to cart"
          >
            <svg
              width="18"
              height="18"
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
          </button>
        </div>
      </div>
    </div>
  );
}

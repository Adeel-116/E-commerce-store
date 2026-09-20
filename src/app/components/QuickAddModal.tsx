"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import type { GridProduct } from "./ProductGrid";
import SizeGuideContent from "./SizeGuideContent";
import { isRealColor } from "../hooks/useProductCardImages";
import "../styles/QuickAddModal.css";
import "../styles/QuickAddModalEnhancements.css";

type Props = {
  product: GridProduct;
  image?: string;
  onClose: () => void;
  onConfirm: (size: string, color: string | null, image?: string) => void;
};

export default function QuickAddModal({
  product,
  image,
  onClose,
  onConfirm,
}: Props) {

  const sizes = product.sizes ?? [];
  const images = product.images ?? [];
  const [size, setSize] = useState(
    product.category?.includes("kids-collection") || sizes.length === 1
      ? sizes[0]
      : "",
  );
  const colors = product.category?.includes("western")
    ? []
    : (product.colors ?? []).filter(isRealColor);
  const [color, setColor] = useState(colors.length === 1 ? colors[0].name : "");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const chosenColor = colors.find((item) => item.name === color);
  const chosenImage = chosenColor?.images?.[0] ?? image;
  const ready = (!sizes.length || !!size) && (!colors.length || !!color);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector(".qa-size-guide")) setSizeGuideOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", keydown);
    };
  }, [onClose]);

  return createPortal(
    <div

         data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    data-lenis-prevent-touch="true"
      className="qa-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="qa-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`qa-${product._id}`}
      >
        <button className="qa-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.7} />
        </button>
        <div className="qa-image">
          <img src={chosenImage ?? images[0]} alt={product.title} />
        </div>
        <div className="qa-content">
          <p className="qa-eyebrow">Quick add</p>
          <h2 id={`qa-${product._id}`}>{product.title}</h2>
          <p className="qa-price">
            Rs. {(product.sizePrices?.[size] ?? product.price).toLocaleString()}
          </p>
          {colors.length > 0 && (
            <fieldset>
              <legend>Colour {color && <span>— {color}</span>}</legend>
              <div className="qa-colors">
                {colors.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    title={item.name}
                    aria-label={item.name}
                    aria-pressed={color === item.name}
                    className={color === item.name ? "active" : ""}
                    style={{ backgroundColor: item.hex }}
                    onClick={() => setColor(item.name)}
                  />
                ))}
              </div>
            </fieldset>
          )}
          {sizes.length > 0 && (
            <fieldset>
              <legend className="qa-size-legend">
                <span>Select size</span>
                {(product.measurementImage ||
                  product.measurementCharts?.length) && (
                  <button type="button" onClick={() => setSizeGuideOpen(true)}>
                    Size Guide
                  </button>
                )}
              </legend>
              <div className="qa-sizes">
                {sizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={size === item ? "active" : ""}
                    aria-pressed={size === item}
                    onClick={() => setSize(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <button
            className="qa-submit"
            disabled={!ready}
            onClick={() => onConfirm(size, color || null, chosenImage)}
          >
            <ShoppingBag size={16} strokeWidth={1.7} />
            {ready
              ? "Add to cart"
              : colors.length && !color
                ? "Select a colour"
                : "Select a size"}
          </button>
          <a className="qa-details" href={`/shop/${product.slug}`}>
            View full details <ArrowRight size={15} strokeWidth={1.7} />
          </a>
        </div>
      </div>
      {sizeGuideOpen &&
        (product.measurementImage || product.measurementCharts?.length) && (
          <div
            className="qa-size-guide"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.title} size guide`}
            onMouseDown={(event) =>
              event.target === event.currentTarget && setSizeGuideOpen(false)
            }
          >
            <div className="qa-size-guide__panel">
              <button
                type="button"
                className="qa-size-guide__close"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
              >
                <X size={22} />
              </button>
              <SizeGuideContent
                title={product.title}
                image={product.measurementImage}
                charts={product.measurementCharts}
              />
            </div>
          </div>
        )}{" "}
    </div>,
    document.body,
  );
}

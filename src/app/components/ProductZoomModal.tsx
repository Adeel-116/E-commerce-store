"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import "../styles/ProductZoomModal.css";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function ProductZoomModal({
  images,
  initialIndex,
  productTitle,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  productTitle: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const pinchState = useRef<{ startDist: number; startScale: number } | null>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const goTo = (next: number) => {
    resetZoom();
    setIndex((next + images.length) % images.length);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, onClose]);

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomBy = (delta: number, center?: { x: number; y: number }) => {
    setScale((prev) => {
      const next = clampScale(prev + delta);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
    void center;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.4 : -0.4);
  };

  const handleDoubleClick = () => {
    if (scale > 1) resetZoom();
    else setScale(2.2);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchState.current = { startDist: getTouchDistance(e.touches), startScale: scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches);
      const ratio = dist / pinchState.current.startDist;
      setScale(clampScale(pinchState.current.startScale * ratio));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchState.current = null;
  };

  return (
    <div className="pzm-overlay" role="dialog" aria-modal="true" aria-label={`${productTitle} zoomed image`} onClick={onClose}>
      <div className="pzm-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pzm-close" onClick={onClose} aria-label="Close zoom">
          <X size={22} />
        </button>

        <div className="pzm-toolbar">
          <button
            type="button"
            className="pzm-tool-btn"
            onClick={() => zoomBy(-0.6)}
            disabled={scale <= MIN_SCALE}
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="pzm-zoom-level">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="pzm-tool-btn"
            onClick={() => zoomBy(0.6)}
            disabled={scale >= MAX_SCALE}
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button type="button" className="pzm-nav pzm-nav-prev" onClick={() => goTo(index - 1)} aria-label="Previous image">
              <ChevronLeft size={26} />
            </button>
            <button type="button" className="pzm-nav pzm-nav-next" onClick={() => goTo(index + 1)} aria-label="Next image">
              <ChevronRight size={26} />
            </button>
          </>
        )}

        <div
          className={`pzm-image-wrap${scale > 1 ? " pzm-image-wrap--zoomed" : ""}`}
          ref={imgWrapRef}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[index]}
            alt={`${productTitle} ${index + 1}`}
            className="pzm-image"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <div className="pzm-thumbs">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                className={`pzm-thumb${i === index ? " active" : ""}`}
                onClick={() => goTo(i)}
              >
                <img src={img} alt={`${productTitle} ${i + 1}`} draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

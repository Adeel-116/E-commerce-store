import { useMemo, useState } from "react";

export type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

// Sentinel name for a photo group added without a real color (i.e. the admin
// just wanted to upload extra photos). Never rendered as a swatch dot.
export const DEFAULT_VARIANT_NAME = "Default";

export function isRealColor(color: ColorVariant): boolean {
  return color.name !== DEFAULT_VARIANT_NAME;
}

/**
 * Drives which photo set a product card shows: the first variation's photos
 * by default (falling back to the product's own `images`), or — while a
 * color swatch is hovered/tapped — that color's own photos.
 */
export function useProductCardImages(images: string[], colors: ColorVariant[]) {
  const [activeColorName, setActiveColorName] = useState<string | null>(null);

  const realColors = colors.filter(isRealColor);

  const displayImages = useMemo(() => {
    if (realColors.length > 0) {
      // Collect the first image from each color to let Swiper slide through variations
      const arr = realColors.map((c) => c.images?.[0] || images[0]).filter(Boolean);
      if (arr.length > 0) return Array.from(new Set(arr));
    }
    return images;
  }, [images, realColors]);

  const activeImageIndex = useMemo(() => {
    if (!activeColorName || realColors.length === 0) return 0;
    const idx = realColors.findIndex((c) => c.name === activeColorName);
    return idx !== -1 ? idx : 0;
  }, [activeColorName, realColors]);

  const onIndexChange = (index: number) => {
    if (realColors.length > 0 && realColors[index]) {
      setActiveColorName(realColors[index].name);
    }
  };

  return {
    displayImages,
    activeColorName,
    previewColor: setActiveColorName,
    activeImageIndex,
    onIndexChange,
  };
}

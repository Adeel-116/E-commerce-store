import { useMemo, useState } from "react";

export type ColorVariant = { name: string; hex: string; images: string[] };
export const DEFAULT_VARIANT_NAME = "Default";
export function isRealColor(color: ColorVariant): boolean {
  return color.name !== DEFAULT_VARIANT_NAME;
}

export function useProductCardImages(images: string[], colors: ColorVariant[]) {
  const [activeColorName, setActiveColorName] = useState<string | null>(null);
  const displayImages = useMemo(() => {
    const selected = colors.find(color => color.name === activeColorName);
    const source = selected?.images?.length ? selected.images : images.length ? images : colors[0]?.images ?? [];
    return Array.from(new Set(source.filter(Boolean))).slice(0, 2);
  }, [images, colors, activeColorName]);
  return { displayImages, activeColorName, previewColor: setActiveColorName, activeImageIndex: 0 };
}

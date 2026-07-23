import SliderCardSkeleton from "./SliderCardSkeleton";

const ProductSliderSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="skeleton-slider-row">
      {Array.from({ length: count }).map((_, i) => (
        <SliderCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductSliderSkeleton;

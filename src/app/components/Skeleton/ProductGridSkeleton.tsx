import GridCardSkeleton from "./GridCardSkeleton";

const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="cg-grid">
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;

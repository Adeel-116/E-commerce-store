import ShopCardSkeleton from "./ShopCardSkeleton";

const ShopGridSkeleton = ({ count = 15 }: { count?: number }) => {
  return (
    <div className="shop-page__grid">
      {Array.from({ length: count }).map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ShopGridSkeleton;

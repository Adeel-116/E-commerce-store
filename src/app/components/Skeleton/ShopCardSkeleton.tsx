import Skeleton from "react-loading-skeleton";
import "../../styles/ShopPage.css";

const ShopCardSkeleton = () => {
  return (
    <div className="shop-page__card">
      <div className="shop-page__card-image-wrap">
        <Skeleton containerClassName="skeleton-fill" height="100%" />
      </div>

      <div className="shop-page__card-info">
        <p className="shop-page__card-name">
          <Skeleton width="80%" />
        </p>
        <div className="shop-page__card-pricing">
          <Skeleton width={100} />
        </div>
      </div>
    </div>
  );
};

export default ShopCardSkeleton;

import Skeleton from "react-loading-skeleton";
import "../../styles/ProductSlider.css";

const SliderCardSkeleton = () => {
  return (
    <div className="card">
      <div className="card-top-row">
        <h3 className="card-heading">
          <Skeleton width="70%" />
        </h3>
      </div>

      <div className="card-image-container">
        <Skeleton containerClassName="skeleton-fill" height="100%" />
      </div>

      <div className="card-bottom-row">
        <div className="card-price-group">
          <Skeleton width={90} />
        </div>
      </div>
    </div>
  );
};

export default SliderCardSkeleton;

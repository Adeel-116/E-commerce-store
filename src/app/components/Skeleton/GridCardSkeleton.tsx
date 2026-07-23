import Skeleton from "react-loading-skeleton";
import "../../styles/ProductGrid.css";

const GridCardSkeleton = () => {
  return (
    <div className="cg-card">
      <div className="cg-card-top-row">
        <h3 className="cg-card-heading">
          <Skeleton width="70%" />
        </h3>
      </div>

      <div className="cg-card-image-container">
        <Skeleton containerClassName="skeleton-fill" height="100%" />
      </div>

      <div className="cg-card-bottom-row">
        <Skeleton width={70} />
      </div>
    </div>
  );
};

export default GridCardSkeleton;

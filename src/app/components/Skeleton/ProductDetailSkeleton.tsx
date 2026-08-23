import Skeleton from "react-loading-skeleton";
import "../../styles/ProductInner.css";

const ProductDetailSkeleton = () => {
  return (
    <>
      <div className="shop-inner-top-bar">
        <div className="breadcrumb">
          <Skeleton width={180} />
        </div>
      </div>

      <div className="shop-inner-page-container">
        <div className="shop-inner-container shop-inner-container--stretch">
          {/* Left: image gallery */}
          <div className="shop-inner-product-image-col">
            <div className="shop-inner-gallery">
              <div className="shop-inner-gallery-thumbs">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="shop-inner-gallery-thumb">
                    <Skeleton containerClassName="skeleton-fill" height="100%" />
                  </div>
                ))}
              </div>

              <div className="shop-inner-fixed-image-wrap">
                <Skeleton containerClassName="skeleton-fill" height="100%" />
              </div>
            </div>
          </div>

          {/* Right: product details */}
          <div className="shop-inner-right-container shop-inner-right-centered">
            <h1 className="shop-inner-title">
              <Skeleton width="70%" />
            </h1>

            <p className="shop-inner-description">
              <Skeleton count={2} />
            </p>

            <hr className="section-divider" />

            <div className="shop-inner-size-price">
              <Skeleton width={120} height={32} />

              <div className="shop-inner-size-selector">
                <span className="shop-inner-size-label">
                  <Skeleton width={60} />
                </span>
                <div className="shop-inner-size-options">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} width={44} height={38} borderRadius={6} />
                  ))}
                </div>
              </div>

              <div className="shop-inner-color-options">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} width={32} height={32} circle />
                ))}
              </div>

              <Skeleton height={48} borderRadius={6} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailSkeleton;

import "../styles/ImageSection.css";
import Image from "next/image";
import Link from "next/link";

function ImageSection() {
  return (
    <div className="main-image-holder">
      <div className="image-left">
        <Image
          className="banner-img"
          src="/monkscents-perfume-banner3.png"
          alt="Professional scents"
          width={1000}
          height={500}
        />
        <div className="image-text-holder">
          <h1>Professional Scents</h1>
          <h3>
            Built for professionals who want to smell sharp all day. These
            fragrances combine freshness, cleanliness, and modern elegance to
            create a signature scent ideal for office environments and formal
            occasions.
          </h3>
          <Link href="/shop">
            <button className="main-btn-dark">View Collection</button>
          </Link>
        </div>
      </div>
      <div className="image-left">
        <Image
          className="banner-img"
          src="/monkscents-perfume-banner1.png"
          alt="Party scents"
          width={1000}
          height={500}
        />
        <div className="image-text-holder">
          <h1>Party Scents</h1>
          <h3>
            Built for professionals who want to smell sharp all day. These
            fragrances combine freshness, cleanliness, and modern elegance to
            create a signature scent ideal for office environments and formal
            occasions.
          </h3>
          <Link href="/shop">
            <button className="main-btn-dark">View Collection</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ImageSection;

import type { Metadata } from "next";
import Wishlist from "../components/Wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return <Wishlist />;
}

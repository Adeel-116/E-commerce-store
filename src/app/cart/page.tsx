import type { Metadata } from "next";
import Cart from "../components/Cart";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return <Cart />;
}

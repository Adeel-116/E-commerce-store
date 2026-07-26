import type { Metadata } from "next";
import Checkout from "../components/Checkout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
  return <Checkout />;
}

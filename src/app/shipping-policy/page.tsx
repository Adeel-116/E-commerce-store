import type { Metadata } from "next";
import ShippingPolicy from "../components/ShippingPolicy";

export const metadata: Metadata = { title: "Shipping Policy", description: "Shipping and delivery policy for Zarya Style orders within Pakistan.", alternates: { canonical: "/shipping-policy" } };
export default function ShippingPage() { return <ShippingPolicy />; }

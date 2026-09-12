import type { Metadata } from "next";
import ReturnsExchanges from "../components/ReturnsExchanges";

export const metadata: Metadata = { title: "Returns & Exchanges", description: "Returns and exchanges policy for Zarya Style orders within Pakistan.", alternates: { canonical: "/returns-and-exchanges" } };
export default function ReturnsPage() { return <ReturnsExchanges />; }

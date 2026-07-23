import { Suspense } from "react";
import CheckoutSuccess from "../../components/CheckoutSuccess";

export const metadata = { title: "Order Confirmed" };

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccess />
    </Suspense>
  );
}

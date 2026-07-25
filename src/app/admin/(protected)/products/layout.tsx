import { AdminFilterProvider } from "@/context/AdminFilterContext";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <AdminFilterProvider>{children}</AdminFilterProvider>;
}

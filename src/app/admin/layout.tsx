import { AuthProvider } from "@/context/AdminAuthContext";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

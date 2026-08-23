import "@/styles/admin-theme.css";
import "@/styles/admin.css";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { AdminToastProvider } from "@/components/AdminToast";
import AdminGuard from "@/components/AdminGuard";
import { AdminSidebarProvider } from "@/context/AdminSidebarContext";

export const metadata = {
  title: "Zarya Style — Dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminToastProvider>
      <AdminGuard>
        <AdminSidebarProvider>
          <div className="admin-scope admin-wrapper">
            <AdminSidebar />
            <div className="admin-main">
              <AdminHeader />
              <main className="admin-content">
                {children}
              </main>
            </div>
          </div>
        </AdminSidebarProvider>
      </AdminGuard>
    </AdminToastProvider>
  );
}

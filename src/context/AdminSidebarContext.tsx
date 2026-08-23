'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type AdminSidebarContextType = {
  mobileOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const AdminSidebarContext = createContext<AdminSidebarContextType | null>(null);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on every route change so navigating doesn't leave it open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AdminSidebarContext.Provider
      value={{
        mobileOpen,
        openMobileSidebar: () => setMobileOpen(true),
        closeMobileSidebar: () => setMobileOpen(false),
        toggleMobileSidebar: () => setMobileOpen((o) => !o),
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const ctx = useContext(AdminSidebarContext);
  if (!ctx) throw new Error('useAdminSidebar must be used within AdminSidebarProvider');
  return ctx;
}

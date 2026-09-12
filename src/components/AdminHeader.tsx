'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdminSidebar } from '@/context/AdminSidebarContext';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin/banners': { title: 'Banners', subtitle: 'Manage desktop and mobile homepage banners' },
  '/admin': { title: 'Dashboard', subtitle: 'Overview of your store performance' },
  '/admin/orders': { title: 'Order Management', subtitle: 'Track and manage all customer orders' },
  '/admin/products': { title: 'Product Management', subtitle: 'Manage your product catalogue' },
  '/admin/categories': { title: 'Categories', subtitle: 'Manage storefront category names and images' },
  '/admin/bundles': { title: 'Bundles', subtitle: 'Manage quantity-based bundle pricing' },
  '/admin/discounts': { title: 'Discounts', subtitle: 'Create and manage promotional codes' },
  '/admin/customers': { title: 'Customers', subtitle: 'View customer order history' },
  '/admin/contact-us': { title: 'Contact Us', subtitle: 'Messages submitted by customers' },
  '/admin/subscribers': { title: 'Subscribers', subtitle: 'Newsletter subscriber list' },
};

export default function AdminHeader() {
  const pathname = usePathname();
  const meta = pageTitles[pathname] ?? { title: 'Dashboard', subtitle: '' };
  const { toggleMobileSidebar } = useAdminSidebar();

  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const user = localStorage.getItem('auth_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setAdminName(parsed?.name || 'Admin');
      } catch {
        setAdminName('Admin');
      }
    }
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button
          className="admin-header-menu-btn"
          onClick={toggleMobileSidebar}
          title="Menu"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="admin-header-left-text">
          <h1 className="admin-header-title">{meta.title}</h1>
          <span className="admin-header-date">{today}</span>
        </div>
      </div>

      <div className="admin-header-actions">
        <button className="admin-header-icon-btn" title="Notifications">
          <Bell size={16} />
        </button>

        <div className="admin-avatar" title={adminName}>
          {adminName.charAt(0).toUpperCase()}
        </div>

        <div className="admin-title">{adminName}</div>
      </div>
    </header>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Dashboard', subtitle: 'Overview of your store performance' },
  '/admin/orders': { title: 'Order Management', subtitle: 'Track and manage all customer orders' },
  '/admin/products': { title: 'Product Management', subtitle: 'Manage your product catalogue' },
  '/admin/bundles': { title: 'Bundles', subtitle: 'Manage quantity-based bundle pricing' },
  '/admin/discounts': { title: 'Discounts', subtitle: 'Create and manage promotional codes' },
  '/admin/customers': { title: 'Customers', subtitle: 'View customer order history' },
  '/admin/contact-us': { title: 'Contact Us', subtitle: 'Messages submitted by customers' },
  '/admin/subscribers': { title: 'Subscribers', subtitle: 'Newsletter subscriber list' },
};

export default function AdminHeader() {
  const pathname = usePathname();
  const meta = pageTitles[pathname] ?? { title: 'Dashboard', subtitle: '' };

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
        <h1 className="admin-header-title">{meta.title}</h1>
        <span className="admin-header-date">{today}</span>
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

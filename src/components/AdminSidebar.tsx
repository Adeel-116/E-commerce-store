'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AdminAuthContext';
import '@/styles/admin-sidebar.css';

const navItems = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, exact: false },
      { href: '/admin/products', label: 'Products', icon: Package, exact: false },
      { href: '/admin/bundles', label: 'Bundles', icon: Boxes, exact: false },
      { href: '/admin/discounts', label: 'Discounts', icon: Tag, exact: false },
      { href: '/admin/contact-us', label: 'Contact Us', icon: MessageSquare, exact: false },
      { href: '/admin/subscribers', label: 'Subscribers', icon: Mail, exact: false },
      { href: '/admin/customers', label: 'Customers', icon: Mail, exact: false },

    ],
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={`admin-sidebar${collapsed ? ' admin-sidebar-collapsed' : ''}`}>
      <div className="admin-sidebar-logo">
        <img src="/white-version.avif" alt="Zarya Style" className="admin-sidebar-logo-img" />
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map(({ section, items }) => (
          <div key={section}>
            <div className="admin-sidebar-section-label">{section}</div>
            {items.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                data-label={label}
                className={`admin-sidebar-item${isActive(href, exact) ? ' admin-sidebar-item-active' : ''}`}
              >
                <Icon size={18} className="admin-sidebar-icon" />
                <span className="admin-sidebar-item-label">{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          className="admin-sidebar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          data-label="Logout"
          title="Logout"
        >
          <LogOut size={15} className="admin-sidebar-icon" />
          <span className="admin-sidebar-toggle-label">
            {loggingOut ? 'Logging out…' : 'Logout'}
          </span>
        </button>

        <button
          className="admin-sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          <span className="admin-sidebar-toggle-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
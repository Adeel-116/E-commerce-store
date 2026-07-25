'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import '@/styles/admin-modal.css';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  headerSlot?: React.ReactNode;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  headerSlot,
}: AdminModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`admin-modal admin-modal-${size}`} role="dialog" aria-modal={true}>
        <div className="admin-modal-header">
          <div className="admin-modal-header-left">
            <h2 className="admin-modal-title">{title}</h2>
            {subtitle && <span className="admin-modal-subtitle">{subtitle}</span>}
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {headerSlot && <div className="admin-modal-header-slot">{headerSlot}</div>}

        <div className="admin-modal-body">{children}</div>

        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

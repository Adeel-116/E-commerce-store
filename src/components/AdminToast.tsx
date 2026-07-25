'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '@/styles/admin-toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (opts: { type: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

function ToastEl({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  return (
    <div className={`admin-toast admin-toast-${item.type}${item.exiting ? ' admin-toast-exiting' : ''}`}>
      <div className="admin-toast-icon">{ICON[item.type]}</div>
      <div className="admin-toast-body">
        <div className="admin-toast-title">{item.title}</div>
        {item.message && <div className="admin-toast-message">{item.message}</div>}
      </div>
      <button className="admin-toast-close" onClick={() => onRemove(item.id)}>
        <X size={13} />
      </button>
      <div
        className="admin-toast-progress"
        style={{ animationDuration: `${item.duration}ms` }}
      />
    </div>
  );
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback(({ type, title, message, duration = 4000 }: {
    type: ToastType; title: string; message?: string; duration?: number;
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration, exiting: false }]);
    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {mounted && createPortal(
        <div className="admin-toast-portal">
          {toasts.map((item) => (
            <ToastEl key={item.id} item={item} onRemove={remove} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside AdminToastProvider');
  return ctx;
}

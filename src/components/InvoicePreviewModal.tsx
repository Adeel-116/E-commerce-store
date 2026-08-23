'use client';

import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, X } from 'lucide-react';
import '@/styles/invoice.css';

type InvoiceOrderItem = {
  productId: string;
  title: string;
  image: string;
  size: string;
  color?: string | null;
  price: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
};

type InvoiceAppliedDiscount = {
  discountId: string;
  name: string;
  type: 'coupon' | 'product' | 'global';
  code?: string;
  valueType: 'percentage' | 'fixed';
  value: number;
  amountSaved: number;
};

export type InvoiceOrder = {
  orderId: string;
  guestEmail?: string;
  userId?: string;
  items: InvoiceOrderItem[];
  pricing: { subtotal: number; shipping: number; discount: number; bundleSavings: number; total: number };
  appliedDiscounts: InvoiceAppliedDiscount[];
  shippingAddress: { fullName: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone: string };
  payment: { method: string; status: string; paidAt?: string };
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  processing: 'Processing',
  pending_payment: 'Pending Payment',
  cancelled: 'Cancelled',
  delivered: 'Delivered',
  shipped: 'Shipped',
  refunded: 'Refunded',
};

const fmt = (n: number) => `PKR ${n.toFixed(2)}`;

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function InvoicePreviewModal({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: InvoiceOrder | null;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: order ? `Invoice-${order.orderId}` : 'Invoice',
  });

  const handleDownloadPdf = async () => {
    if (!printRef.current || !order) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `Invoice-${order.orderId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save();
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen || !order) return null;

  const invoiceNumber = `INV-${order.orderId}`;
  const customerName = order.shippingAddress?.fullName || order.guestEmail || order.userId || '—';

  return (
    <div className="invoice-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="invoice-modal">
        <div className="invoice-modal-toolbar">
          <span className="invoice-modal-toolbar-title">Invoice Preview</span>
          <div className="invoice-modal-toolbar-actions">
            <button className="admin-btn admin-btn-secondary" onClick={() => handlePrint()}>
              <Printer size={15} /> Print Invoice
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
              <Download size={15} /> {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button className="invoice-modal-close" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="invoice-modal-scroll">
          <div className="invoice-page" ref={printRef}>
            <div className="invoice-header">
              <img src="/updated-logo.avif" alt="Zarya Style" className="invoice-logo" />
              <div className="invoice-header-meta">
                <h1 className="invoice-title">INVOICE</h1>
                <div className="invoice-meta-row"><span>Invoice No.</span><strong>{invoiceNumber}</strong></div>
                <div className="invoice-meta-row"><span>Order No.</span><strong>{order.orderId}</strong></div>
                <div className="invoice-meta-row"><span>Invoice Date</span><strong>{fmtDate(new Date())}</strong></div>
              </div>
            </div>

            <div className="invoice-divider" />

            <div className="invoice-parties">
              <div className="invoice-party">
                <span className="invoice-label">Customer Details</span>
                <div className="invoice-party-text">
                  <div>{customerName}</div>
                  {order.guestEmail && <div>{order.guestEmail}</div>}
                  {order.shippingAddress?.phone && <div>{order.shippingAddress.phone}</div>}
                </div>
              </div>
              <div className="invoice-party">
                <span className="invoice-label">Shipping Address</span>
                <div className="invoice-party-text">
                  <div>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</div>
                  <div>{order.shippingAddress.country}</div>
                </div>
              </div>
              <div className="invoice-party">
                <span className="invoice-label">Status</span>
                <div className="invoice-party-text">
                  <div>Payment: <strong>{order.payment.status}</strong></div>
                  <div>Order: <strong>{STATUS_LABEL[order.status] ?? order.status}</strong></div>
                </div>
              </div>
            </div>

            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th className="invoice-align-right">Price</th>
                  <th className="invoice-align-right">Qty</th>
                  <th className="invoice-align-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={`${item.productId}-${item.size}-${item.color ?? ''}`}>
                    <td>{item.title}</td>
                    <td>{item.size}</td>
                    <td>{item.color ?? '—'}</td>
                    <td className="invoice-align-right">{fmt(item.originalPrice)}</td>
                    <td className="invoice-align-right">{item.quantity}</td>
                    <td className="invoice-align-right">{fmt(item.originalPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="invoice-totals-row"><span>Subtotal</span><span>{fmt(order.pricing.subtotal)}</span></div>
              <div className="invoice-totals-row"><span>Shipping</span><span>{fmt(order.pricing.shipping)}</span></div>
              {order.pricing.discount > 0 && (
                <div className="invoice-totals-row"><span>Discount</span><span>-{fmt(order.pricing.discount)}</span></div>
              )}
              {order.pricing.bundleSavings > 0 && (
                <div className="invoice-totals-row"><span>Bundle Savings</span><span>-{fmt(order.pricing.bundleSavings)}</span></div>
              )}
              <div className="invoice-totals-row invoice-grand-total"><span>Grand Total</span><span>{fmt(order.pricing.total)}</span></div>
            </div>

            <div className="invoice-footer">Thank you for shopping with Zarya Style</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import AdminTable, { AdminColumn } from "@/components/AdminTable";
import AdminModal from "@/components/AdminModal";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";
import api from "@/lib/axios";
import Papa from "papaparse";

type ApiOrderItem = {
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

type ApiAppliedDiscount = {
  discountId: string;
  name: string;
  type: "coupon" | "product" | "global";
  code?: string;
  valueType: "percentage" | "fixed";
  value: number;
  amountSaved: number;
};

type ApiOrder = {
  _id: string;
  orderId: string;
  userId?: string;
  guestEmail?: string;
  items: ApiOrderItem[];
  pricing: {
    subtotal: number;
    shipping: number;
    discount: number;
    bundleSavings: number;
    total: number;
  };
  appliedDiscounts: ApiAppliedDiscount[];
  shippingAddress: {
    fullName: string;
    email?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  payment: { method: string; status: string; paidAt?: string; transactionId?: string };
  status: string;
  lastEmailSent?: boolean;
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
};

type OrderRow = {
  _id: string;
  orderId: string;
  select: string;
  customer: string;
  lastEmail: boolean;
  qty: number;
  itemPrices: { title: string; price: number; quantity: number }[];
  subtotal: string;
  extraCharges: { shipping: number; discount: number; bundleSavings: number };
  total: string;
  paymentStatus: string;
  status: string;
  date: string;
  _raw: ApiOrder;
};

const STATUS_LABEL: Record<string, string> = {
  processing: "Processing",
  dispatch: "Dispatch",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_OPTIONS = [
  "processing",
  "dispatch",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "disputed",
];

const statusClass: Record<string, string> = {
  // Order statuses
  processing: "admin-badge-info",
  dispatch: "admin-badge-teal",
  delivered: "admin-badge-success",
  cancelled: "admin-badge-danger",
  returned: "admin-badge-purple",

  // Payment statuses
  paid: "admin-badge-success",
  pending: "admin-badge-warning",
  failed: "admin-badge-danger",
  refunded: "admin-badge-danger",
  disputed: "admin-badge-danger",
};

const fmt = (n: number) => `PKR ${n.toFixed(2)}`;

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0e8"/><text x="32" y="36" font-size="9" text-anchor="middle" fill="%23aaa" font-family="Arial">No Image</text></svg>';

type EditItemDraft = {
  productId: string;
  title: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
  originalPrice: number;
  image?: string;
};

type TitleSuggestion = {
  _id: string;
  title: string;
  slug: string;
};

type EditDetailsForm = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  orderDate: string;
  items: EditItemDraft[];
  // Pricing overrides
  shipping: number;
  discount: number;
  bundleSavings: number;
  notes: string;
};

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function mapOrder(o: ApiOrder): OrderRow {
  const totalQty = o.items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    _id: o._id,
    orderId: o.orderId,
    select: o.orderId,
    customer: o.shippingAddress?.fullName || o.guestEmail || o.userId || "—",
    lastEmail: !!o.lastEmailSent,
    qty: totalQty,
    itemPrices: o.items.map((i) => ({
      title: i.title,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: fmt(o.pricing.subtotal),
    extraCharges: {
      shipping: o.pricing.shipping,
      discount: o.pricing.discount,
      bundleSavings: o.pricing.bundleSavings,
    },
    total: fmt(o.pricing.total),
    paymentStatus: o.payment.status,
    status: o.status,
    date: new Date(o.createdAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    _raw: o,
  };
}

const PAGE_LIMIT = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRow | null>(null);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<OrderRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // --- Selection + export state ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [editDetailsOrder, setEditDetailsOrder] = useState<OrderRow | null>(
    null,
  );
  const [editDetailsForm, setEditDetailsForm] =
    useState<EditDetailsForm | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>(
    [],
  );
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<
    number | null
  >(null);
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveDetailsLoading, setSaveDetailsLoading] = useState(false);
  const [saveDetailsError, setSaveDetailsError] = useState<string | null>(null);

  // --- Selection helpers (inside component — they use orders/selectedIds state) ---
  const toggleSelectOne = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = orders.every((o) => next.has(o.orderId));
      orders.forEach((o) =>
        allSelected ? next.delete(o.orderId) : next.add(o.orderId),
      );
      return next;
    });
  };

  const columns: AdminColumn[] = useMemo(
    () => [
      {
        key: "select",
        label: "",
        width: "36px",
        render: (val) => (
          <input
            type="checkbox"
            checked={selectedIds.has(val as string)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleSelectOne(val as string)}
          />
        ),
      },
      { key: "orderId", label: "Order ID", width: "175px" },
      { key: "customer", label: "Customer" },
      { key: "date", label: "Date", width: "140px" },
      { key: "qty", label: "Qty", width: "60px" },
      {
        key: "extraCharges",
        label: "Extra Charges",
        width: "160px",
        render: (val) => {
          const { shipping, discount, bundleSavings } =
            val as OrderRow["extraCharges"];
          return (
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              <div>
                Shipping: <strong>{fmt(shipping)}</strong>
              </div>
              {discount > 0 && (
                <div style={{ color: "var(--brandgreen)" }}>
                  Discount: <strong>-{fmt(discount)}</strong>
                </div>
              )}
              {bundleSavings > 0 && (
                <div style={{ color: "var(--brandgreen)" }}>
                  Bundle: <strong>-{fmt(bundleSavings)}</strong>
                </div>
              )}
            </div>
          );
        },
      },
      { key: "total", label: "Total", width: "90px" },
      {
        key: "paymentStatus",
        label: "Payment",
        width: "100px",
        render: (val) => (
          <span
            className={`admin-badge ${statusClass[val as string] ?? "admin-badge-neutral"}`}
          >
            {String(val)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: "155px",
        render: (val) => (
          <span
            className={`admin-badge ${statusClass[val as string] ?? "admin-badge-neutral"}`}
          >
            {STATUS_LABEL[val as string] ?? String(val)}
          </span>
        ),
      },
      {
        key: "lastEmail",
        label: "Last Email",
        width: "100px",
        render: (val) => String(!!val),
      },
    ],
    [selectedIds, orders],
  );

  // --- Export helpers ---
  const buildExportRows = (list: ApiOrder[]) => {
    const money = (n: unknown) => Number(Number(n ?? 0).toFixed(2));
    return list.map((order) => {
      const shipping =
        order.shippingAddress ?? ({} as ApiOrder["shippingAddress"]);
      const isPaid = order.payment?.status === "paid";
      const items = order.items ?? [];

      return {
        Reference: order.orderId ?? "",
        "Order Date": new Date(order.createdAt).toLocaleString("en-GB"),
        "Recipient Name": shipping.fullName || order.guestEmail || "",
        "Recipient Phone": shipping.phone || "",
        "Recipient Email": shipping.email || order.guestEmail || "",
        "Recipient Address": [shipping.line1, shipping.line2]
          .filter(Boolean)
          .join(", "),
        "Recipient City": shipping.city || "",
        "Recipient Postal Code": shipping.postalCode || "",
        "Product Name(s)": items
          .map((i) => i.title)
          .filter(Boolean)
          .join(" | "),
        Quantity: items.reduce((sum, i) => sum + (i.quantity || 0), 0),
        "Item Total": money(
          items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        ),
        Subtotal: money(order.pricing?.subtotal),
        Shipping: money(order.pricing?.shipping),
        Discount: money(order.pricing?.discount),
        "Bundle Savings": money(order.pricing?.bundleSavings),
        Total: money(order.pricing?.total),
        "Payment Method": order.payment?.method?.toUpperCase() || "",
        "Payment Status": order.payment?.status || "",
        "Order Status": order.status || "",
        COD: isPaid ? "No" : "Yes",
      };
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const { data } = await api.post("/admin/orders/export", {
        orderIds: Array.from(selectedIds), // empty => backend returns all
      });
      const rows = buildExportRows(data.orders as ApiOrder[]);
      const filenameBase = `orders-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        const csv = Papa.unparse(rows, { quotes: true });
        downloadBlob(
          new Blob([csv], { type: "text/csv;charset=utf-8;" }),
          `${filenameBase}.csv`,
        );
      } else {
        const XLSX = await import("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
      }
    } catch (err) {
      console.error("Failed to export orders", err);
    } finally {
      setExporting(false);
    }
  };

  const fetchOrders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/orders", {
        params: { page, limit: PAGE_LIMIT },
      });
      setOrders(data.orders.map(mapOrder));
      setPagination({
        page: data.pagination.page,
        total: data.pagination.total,
        pages: data.pagination.totalPages,
      });
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const openEdit = (row: Record<string, unknown>) => {
    const o = row as unknown as OrderRow;
    setEditOrder(o);
    setEditStatus(o.status);
    setEditError(null);
    setEditPaymentStatus(o.paymentStatus);
    setPaymentError(null);
  };

  const openDelete = (row: Record<string, unknown>) =>
    setDeleteOrder(row as unknown as OrderRow);
  const openView = (row: Record<string, unknown>) =>
    setViewOrder(row as unknown as OrderRow);

  const openEditDetails = (order: OrderRow) => {
    const raw = order._raw;
    setEditDetailsOrder(order);
    setEditDetailsForm({
      fullName: raw.shippingAddress.fullName || "",
      email: raw.shippingAddress.email || raw.guestEmail || "",
      phone: raw.shippingAddress.phone || "",
      line1: raw.shippingAddress.line1 || "",
      line2: raw.shippingAddress.line2 || "",
      city: raw.shippingAddress.city || "",
      state: raw.shippingAddress.state || "",
      postalCode: raw.shippingAddress.postalCode || "",
      country: raw.shippingAddress.country || "",
      orderDate: toDatetimeLocalValue(raw.createdAt),
      items: raw.items.map((i) => ({
        productId: i.productId,
        title: i.title,
        size: i.size,
        color: i.color ?? null,
        quantity: i.quantity,
        price: i.price,
        originalPrice: i.originalPrice,
        image: i.image || "",
      })),
      // Pricing fields
      shipping: raw.pricing.shipping,
      discount: raw.pricing.discount,
      bundleSavings: raw.pricing.bundleSavings,
      notes: raw.notes || "",
    });
    setViewOrder(null);
  };

  const updateEditField = <K extends keyof EditDetailsForm>(
    field: K,
    value: EditDetailsForm[K],
  ) => {
    setEditDetailsForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateEditItem = <K extends keyof EditItemDraft>(
    index: number,
    field: K,
    value: EditItemDraft[K],
  ) => {
    setEditDetailsForm((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      );
      return { ...prev, items };
    });
  };

  const removeEditItem = (index: number) => {
    setEditDetailsForm((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const addBlankItem = () => {
    setEditDetailsForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: "",
            title: "",
            size: "",
            color: null,
            quantity: 1,
            price: 0,
            originalPrice: 0,
            image: "",
          },
        ],
      };
    });
  };

  const fetchTitleSuggestions = useCallback((query: string, index: number) => {
    if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setTitleSuggestions([]);
      setActiveSuggestionIndex(null);
      return;
    }
    suggestionTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/getTitleSuggestion", {
          params: { search: trimmed, limit: 5 },
        });
        setTitleSuggestions(data?.data ?? []);
        setActiveSuggestionIndex(index);
      } catch (err) {
        console.error("Failed to fetch title suggestions", err);
      }
    }, 300);
  }, []);

  const selectTitleSuggestion = (
    index: number,
    suggestion: TitleSuggestion,
  ) => {
    setEditDetailsForm((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, i) =>
        i === index
          ? { ...item, title: suggestion.title, productId: suggestion._id }
          : item,
      );
      return { ...prev, items };
    });
    setTitleSuggestions([]);
    setActiveSuggestionIndex(null);
  };

  const editDetailsSubtotal =
    editDetailsForm?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ??
    0;
  const editDetailsTotal = editDetailsForm
    ? Math.max(
        0,
        editDetailsSubtotal +
          (editDetailsForm.shipping ?? 0) -
          (editDetailsForm.discount ?? 0) -
          (editDetailsForm.bundleSavings ?? 0),
      )
    : 0;

  const saveEditDetails = async () => {
    if (!editDetailsOrder || !editDetailsForm) return;
    setSaveDetailsLoading(true);
    setSaveDetailsError(null);
    try {
      const payload = {
        shippingAddress: {
          fullName: editDetailsForm.fullName,
          email: editDetailsForm.email,
          phone: editDetailsForm.phone,
          line1: editDetailsForm.line1,
          line2: editDetailsForm.line2,
          city: editDetailsForm.city,
          state: editDetailsForm.state,
          postalCode: editDetailsForm.postalCode,
          country: editDetailsForm.country,
        },
        createdAt: new Date(editDetailsForm.orderDate).toISOString(),
        items: editDetailsForm.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          size: item.size,
          color: item.color ?? null,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image || "",
        })),
        pricing: {
          shipping: editDetailsForm.shipping,
          discount: editDetailsForm.discount,
          bundleSavings: editDetailsForm.bundleSavings,
        },
        notes: editDetailsForm.notes,
      };
      await api.patch(`/admin/edit-order/${editDetailsOrder.orderId}`, payload);
      await fetchOrders(pagination.page);
      setEditDetailsOrder(null);
      setEditDetailsForm(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update order";
      setSaveDetailsError(msg);
    } finally {
      setSaveDetailsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    try {
      await api.delete("/admin/orders/delete", {
        params: { orderId: deleteOrder.orderId },
      });
      setOrders((prev) => prev.filter((o) => o._id !== deleteOrder._id));
      setDeleteOrder(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete order";
      setDeleteError(msg);
    }
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await api.patch(`/admin/orders/status/${editOrder.orderId}`, {
        status: editStatus,
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === editOrder._id ? { ...o, status: editStatus } : o,
        ),
      );
      setEditOrder(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update order status";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const savePaymentStatus = async () => {
    if (!editOrder) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      await api.patch(`/admin/orders/payment-status/${editOrder.orderId}`, {
        paymentStatus: editPaymentStatus,
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === editOrder._id
            ? { ...o, paymentStatus: editPaymentStatus }
            : o,
        ),
      );
      setEditOrder((prev) =>
        prev ? { ...prev, paymentStatus: editPaymentStatus } : prev,
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update payment status";
      setPaymentError(msg);
    } finally {
      setPaymentLoading(false);
    }
  };

  const raw = viewOrder?._raw;
  const allOnPageSelected =
    orders.length > 0 && orders.every((o) => selectedIds.has(o.orderId));

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">All Orders</h2>
          <p className="admin-page-subtitle">{pagination.total} total orders</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={toggleSelectAllOnPage}
          >
            {allOnPageSelected ? "Unselect Page" : "Select Page"}
          </button>

          {selectedIds.size > 0 && (
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear ({selectedIds.size})
            </button>
          )}

          <div style={{ position: "relative" }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exporting}
            >
              <Plus size={15} />
              {exporting
                ? "Exporting…"
                : selectedIds.size > 0
                  ? `Export Selected (${selectedIds.size})`
                  : "Export Orders"}
            </button>

            {exportMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #e2e2e2",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  zIndex: 30,
                  minWidth: 160,
                  overflow: "hidden",
                }}
              >
                <button
                  className="admin-btn admin-btn-ghost"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    borderRadius: 0,
                  }}
                  onClick={() => handleExport("csv")}
                >
                  Export as CSV
                </button>
                <button
                  className="admin-btn admin-btn-ghost"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    borderRadius: 0,
                  }}
                  onClick={() => handleExport("excel")}
                >
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={orders as unknown as Record<string, unknown>[]}
        pageSize={PAGE_LIMIT}
        onView={openView}
        onEdit={openEdit}
        onDelete={openDelete}
        searchKeys={["orderId", "customer", "status", "paymentStatus"]}
        loading={loading}
        serverPagination={{
          page: pagination.page,
          totalPages: pagination.pages,
          total: pagination.total,
          pageSize: PAGE_LIMIT,
          onPageChange: fetchOrders,
        }}
      />

      <AdminModal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={`Order ${viewOrder?.orderId}`}
        subtitle={`Placed on ${viewOrder?.date}`}
        size="md"
      >
        {viewOrder && raw && (
          <>
            <div className="admin-modal-detail-grid">
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Customer</span>
                <span className="admin-modal-detail-value">
                  {viewOrder.customer}
                </span>
              </div>

              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Email</span>
                <span className="admin-modal-detail-value">
                  {raw.shippingAddress.email || raw.guestEmail || "—"}
                </span>
              </div>

              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Phone</span>
                <span className="admin-modal-detail-value">
                  {raw.shippingAddress.phone}
                </span>
              </div>

              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Address</span>
                <span className="admin-modal-detail-value">
                  {raw.shippingAddress.line2} {raw.shippingAddress.line1}{" "}
                  {raw.shippingAddress.city}
                </span>
              </div>

              {raw.specialInstructions && (
                <div
                  className="admin-modal-detail-item"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <span className="admin-modal-detail-label">
                    Special Instructions
                  </span>
                  <span className="admin-modal-detail-value">
                    {raw.specialInstructions}
                  </span>
                </div>
              )}

              <hr
                className="admin-modal-detail-divider"
                style={{ gridColumn: "1 / -1" }}
              />
              <div
                className="admin-modal-detail-item"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="admin-modal-detail-label">
                  Items ({viewOrder.qty})
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  {raw.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt={item.title}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #eee",
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            PLACEHOLDER_IMG;
                        }}
                      />
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ color: "#888" }}>
                          {item.size}
                          {item.color ? ` · ${item.color}` : ""} · Qty:{" "}
                          {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {fmt(item.originalPrice * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {raw.appliedDiscounts.length > 0 && (
                <>
                  <hr
                    className="admin-modal-detail-divider"
                    style={{ gridColumn: "1 / -1" }}
                  />
                  <div
                    className="admin-modal-detail-item"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <span className="admin-modal-detail-label">
                      Discounts Applied
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {raw.appliedDiscounts.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                          }}
                        >
                          <span>
                            {d.name}
                            {d.code ? ` (${d.code})` : ""}
                          </span>
                          <span
                            style={{
                              color: "var(--brandgreen)",
                              fontWeight: 600,
                            }}
                          >
                            -{fmt(d.amountSaved)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <hr
                className="admin-modal-detail-divider"
                style={{ gridColumn: "1 / -1" }}
              />
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Subtotal</span>
                <span className="admin-modal-detail-value">
                  {viewOrder.subtotal}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Shipping</span>
                <span className="admin-modal-detail-value">
                  {fmt(raw.pricing.shipping)}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Discount</span>
                <span
                  className="admin-modal-detail-value"
                  style={{ color: "var(--brandgreen)" }}
                >
                  -{fmt(raw.pricing.discount)}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Bundle Savings</span>
                <span
                  className="admin-modal-detail-value"
                  style={{ color: "var(--brandgreen)" }}
                >
                  -{fmt(raw.pricing.bundleSavings)}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Total</span>
                <span
                  className="admin-modal-detail-value"
                  style={{ color: "var(--brandgreen)", fontWeight: 700 }}
                >
                  {viewOrder.total}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Payment Method</span>
                <span className="admin-modal-detail-value">
                  {raw.payment.method?.toUpperCase()}
                </span>
              </div>
              {raw.payment.transactionId && <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Transaction ID</span>
                <span className="admin-modal-detail-value" style={{fontFamily:"monospace",fontWeight:700}}>
                  {raw.payment.transactionId}
                </span>
              </div>}
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Payment</span>
                <span
                  className={`admin-badge ${statusClass[viewOrder.paymentStatus] ?? "admin-badge-neutral"}`}
                >
                  {viewOrder.paymentStatus}
                </span>
              </div>
              <div className="admin-modal-detail-item">
                <span className="admin-modal-detail-label">Status</span>
                <span
                  className={`admin-badge ${statusClass[viewOrder.status] ?? "admin-badge-neutral"}`}
                >
                  {STATUS_LABEL[viewOrder.status] ?? viewOrder.status}
                </span>
              </div>
              {raw.payment.paidAt && (
                <div className="admin-modal-detail-item">
                  <span className="admin-modal-detail-label">Paid At</span>
                  <span className="admin-modal-detail-value">
                    {new Date(raw.payment.paidAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div
              className="admin-view-details-generate-invoice"
              style={{ gap: 10 }}
            >
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => openEditDetails(viewOrder)}
              >
                <Pencil size={15} /> Edit Order
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setInvoiceOrder(viewOrder);
                  setViewOrder(null);
                }}
              >
                <Plus size={15} /> Generate Invoice
              </button>
            </div>
          </>
        )}
      </AdminModal>

      <InvoicePreviewModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder?._raw ?? null}
      />

      <AdminModal
        isOpen={!!editDetailsOrder && !!editDetailsForm}
        onClose={() => {
          setEditDetailsOrder(null);
          setEditDetailsForm(null);
          setSaveDetailsError(null);
        }}
        title="Edit Order"
        subtitle={editDetailsOrder?.orderId}
        size="lg"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setEditDetailsOrder(null);
                setEditDetailsForm(null);
                setSaveDetailsError(null);
              }}
              disabled={saveDetailsLoading}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={saveEditDetails}
              disabled={saveDetailsLoading}
            >
              {saveDetailsLoading ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        {editDetailsForm && (
          <>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">Customer Name</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.fullName}
                  onChange={(e) => updateEditField("fullName", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Order Date</label>
                <input
                  type="datetime-local"
                  className="admin-form-input"
                  value={editDetailsForm.orderDate}
                  onChange={(e) => updateEditField("orderDate", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Email</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.email}
                  onChange={(e) => updateEditField("email", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Phone</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.phone}
                  onChange={(e) => updateEditField("phone", e.target.value)}
                />
              </div>

              <hr
                className="admin-modal-detail-divider"
                style={{ gridColumn: "1 / -1" }}
              />

              <div className="admin-form-group admin-form-grid-full">
                <label className="admin-form-label">Area</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.line1}
                  onChange={(e) => updateEditField("line1", e.target.value)}
                />
              </div>
              <div className="admin-form-group admin-form-grid-full">
                <label className="admin-form-label">
                  Apartment, suite, etc
                </label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.line2}
                  onChange={(e) => updateEditField("line2", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">City</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.city}
                  onChange={(e) => updateEditField("city", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">State</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.state}
                  onChange={(e) => updateEditField("state", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Postal Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="admin-form-input"
                  value={editDetailsForm.postalCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    updateEditField("postalCode", v);
                  }}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Country</label>
                <input
                  className="admin-form-input"
                  value={editDetailsForm.country}
                  onChange={(e) => updateEditField("country", e.target.value)}
                />
              </div>
            </div>

            <hr
              className="admin-modal-detail-divider"
              style={{ margin: "18px 0" }}
            />

            <div className="admin-form-group">
              <label className="admin-form-label">
                Items ({editDetailsForm.items.length})
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {editDetailsForm.items.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: 8,
                      padding: "12px 12px 8px",
                      background: "#fafaf8",
                      marginBottom: 6,
                    }}
                  >
                    {/* Row 1: Title + Size + Color + Delete */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 100px 90px 32px",
                        gap: 8,
                        alignItems: "end",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        className="admin-form-group"
                        style={{ position: "relative", margin: 0 }}
                      >
                        <label className="admin-form-label">Title</label>
                        <input
                          className="admin-form-input"
                          autoComplete="off"
                          value={item.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateEditItem(index, "title", value);
                            fetchTitleSuggestions(value, index);
                          }}
                          onFocus={() => {
                            if (item.title)
                              fetchTitleSuggestions(item.title, index);
                          }}
                          onBlur={() =>
                            setTimeout(
                              () => setActiveSuggestionIndex(null),
                              150,
                            )
                          }
                        />
                        {activeSuggestionIndex === index &&
                          titleSuggestions.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 20,
                                background: "var(--admin-surface, #fff)",
                                border: "1px solid #e2e2e2",
                                borderRadius: 6,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                marginTop: 4,
                                maxHeight: 220,
                                overflowY: "auto",
                              }}
                            >
                              {titleSuggestions.map((s) => (
                                <div
                                  key={s._id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectTitleSuggestion(index, s);
                                  }}
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: 13,
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#f5f5f5")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  {s.title}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Size</label>
                        <input
                          className="admin-form-input"
                          value={item.size}
                          onChange={(e) =>
                            updateEditItem(index, "size", e.target.value)
                          }
                        />
                      </div>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Color</label>
                        <input
                          className="admin-form-input"
                          value={item.color ?? ""}
                          placeholder="—"
                          onChange={(e) =>
                            updateEditItem(
                              index,
                              "color",
                              e.target.value || null,
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost"
                        onClick={() => removeEditItem(index)}
                        disabled={editDetailsForm.items.length <= 1}
                        title={
                          editDetailsForm.items.length <= 1
                            ? "An order must have at least one item"
                            : "Remove item"
                        }
                        style={{ padding: 6, marginTop: 18, color: "#e53e3e" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Row 2: Qty + Price + Original Price + Subtotal */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "80px 1fr 1fr 1fr",
                        gap: 8,
                        alignItems: "end",
                      }}
                    >
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Qty</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-form-input"
                          value={item.quantity}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, "");
                            updateEditItem(
                              index,
                              "quantity",
                              Math.max(1, Number(v) || 1),
                            );
                          }}
                        />
                      </div>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Price (PKR)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="admin-form-input"
                          value={item.price}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            updateEditItem(
                              index,
                              "price",
                              Math.max(0, Number(v) || 0),
                            );
                          }}
                        />
                      </div>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">
                          Orig. Price (PKR)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="admin-form-input"
                          value={item.originalPrice}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            updateEditItem(
                              index,
                              "originalPrice",
                              Math.max(0, Number(v) || 0),
                            );
                          }}
                        />
                      </div>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label
                          className="admin-form-label"
                          style={{ color: "#888" }}
                        >
                          Subtotal
                        </label>
                        <div
                          className="admin-form-input"
                          style={{
                            background: "#f0f0e8",
                            color: "#555",
                            cursor: "default",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {fmt(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Product Button */}
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={addBlankItem}
                  style={{
                    marginTop: 4,
                    width: "100%",
                    justifyContent: "center",
                    border: "1px dashed #ccc",
                  }}
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            <hr
              className="admin-modal-detail-divider"
              style={{ margin: "18px 0" }}
            />

            {/* Pricing Section */}
            <div style={{ marginBottom: 12 }}>
              <label
                className="admin-form-label"
                style={{
                  marginBottom: 10,
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Pricing &amp; Charges
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label className="admin-form-label">Shipping (PKR)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="admin-form-input"
                    value={editDetailsForm.shipping}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      updateEditField("shipping", Math.max(0, Number(v) || 0));
                    }}
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label className="admin-form-label">Discount (PKR)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="admin-form-input"
                    value={editDetailsForm.discount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      updateEditField("discount", Math.max(0, Number(v) || 0));
                    }}
                  />
                </div>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label className="admin-form-label">
                    Bundle Savings (PKR)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="admin-form-input"
                    value={editDetailsForm.bundleSavings}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      updateEditField(
                        "bundleSavings",
                        Math.max(0, Number(v) || 0),
                      );
                    }}
                  />
                </div>
              </div>

              {/* Coupon / Notes */}
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label">Coupon Code / Notes</label>
                <input
                  className="admin-form-input"
                  placeholder="e.g. PROMO10, reward coupon, special instructions…"
                  value={editDetailsForm.notes}
                  onChange={(e) => updateEditField("notes", e.target.value)}
                />
              </div>
            </div>

            {/* Live Order Summary */}
            <div
              style={{
                background: "#f8f7f4",
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#666" }}>Subtotal</span>
                <strong>{fmt(editDetailsSubtotal)}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#666" }}>Shipping</span>
                <strong>+{fmt(editDetailsForm.shipping)}</strong>
              </div>
              {editDetailsForm.discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--brandgreen, #2e7d32)" }}>
                    Discount
                  </span>
                  <strong style={{ color: "var(--brandgreen, #2e7d32)" }}>
                    -{fmt(editDetailsForm.discount)}
                  </strong>
                </div>
              )}
              {editDetailsForm.bundleSavings > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--brandgreen, #2e7d32)" }}>
                    Bundle Savings
                  </span>
                  <strong style={{ color: "var(--brandgreen, #2e7d32)" }}>
                    -{fmt(editDetailsForm.bundleSavings)}
                  </strong>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px solid #ddd",
                }}
              >
                <span style={{ fontWeight: 700 }}>Total</span>
                <strong
                  style={{ fontSize: 15, color: "var(--brandgreen, #2e7d32)" }}
                >
                  {fmt(editDetailsTotal)}
                </strong>
              </div>
            </div>

            {saveDetailsError && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#e53e3e",
                  fontWeight: 500,
                }}
              >
                {saveDetailsError}
              </p>
            )}
          </>
        )}
      </AdminModal>

      <AdminModal
        isOpen={!!editOrder}
        onClose={() => {
          setEditOrder(null);
          setEditError(null);
        }}
        title="Update Order Status"
        subtitle={editOrder?.orderId}
        size="sm"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setEditOrder(null);
                setEditError(null);
              }}
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={saveEdit}
              disabled={editLoading}
            >
              {editLoading ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        {editOrder && (
          <div className="admin-form-group">
            <label className="admin-form-label">
              Current Status:{" "}
              <span
                className={`admin-badge ${statusClass[editOrder.status] ?? "admin-badge-neutral"}`}
                style={{ marginLeft: 6 }}
              >
                {STATUS_LABEL[editOrder.status] ?? editOrder.status}
              </span>
            </label>
            <select
              className="admin-form-select"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              disabled={editLoading}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s] ?? s}
                </option>
              ))}
            </select>
            {editError && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#e53e3e",
                  fontWeight: 500,
                }}
              >
                {editError}
              </p>
            )}

            {editOrder._raw.payment.method === "cod" && (
              <>
                <hr
                  className="admin-modal-detail-divider"
                  style={{ margin: "16px 0" }}
                />
                <label className="admin-form-label">
                  Payment Status:{" "}
                  <span
                    className={`admin-badge ${statusClass[editOrder.paymentStatus] ?? "admin-badge-neutral"}`}
                    style={{ marginLeft: 6 }}
                  >
                    {editOrder.paymentStatus}
                  </span>
                </label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <select
                    className="admin-form-select"
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    disabled={paymentLoading}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={savePaymentStatus}
                    disabled={
                      paymentLoading ||
                      editPaymentStatus === editOrder.paymentStatus
                    }
                  >
                    {paymentLoading ? "Saving…" : "Update"}
                  </button>
                </div>
                {paymentError && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "#e53e3e",
                      fontWeight: 500,
                    }}
                  >
                    {paymentError}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </AdminModal>

      <AdminModal
        isOpen={!!deleteOrder}
        onClose={() => {
          setDeleteOrder(null);
          setDeleteError(null);
        }}
        title="Delete Order"
        size="sm"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => setDeleteOrder(null)}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-danger"
              onClick={confirmDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon">
            <Trash2 size={22} />
          </div>
          <div className="admin-modal-confirm-title">
            Delete {deleteOrder?.orderId}?
          </div>
          <p className="admin-modal-confirm-text">
            This will permanently remove the order. This action cannot be
            undone.
          </p>
          {deleteError && (
            <p
              className="admin-modal-confirm-text"
              style={{ color: "#ef4444", marginTop: "0.5rem", fontWeight: 500 }}
            >
              {deleteError}
            </p>
          )}
        </div>
      </AdminModal>
    </>
  );
}

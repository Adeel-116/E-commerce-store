"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import AdminTable, { AdminColumn } from "@/components/AdminTable";
import AdminModal from "@/components/AdminModal";
import api from "@/lib/axios";

type Checkout = {
  _id: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: { city: string; state: string };
  items: { title: string; quantity: number }[];
  subtotal: number;
  status: "open" | "contacted" | "recovered" | "dismissed";
  notes: string;
  lastActivityAt: string;
  isAbandoned: boolean;
};

type EditForm = {
  firstName: string; lastName: string; email: string; phone: string;
  status: Checkout["status"]; notes: string;
};

const EMPTY_FORM: EditForm = {
  firstName: "", lastName: "", email: "", phone: "", status: "open", notes: "",
};
const PAGE_SIZE = 20;

export default function AbandonedCheckoutsPage() {
  const [records, setRecords] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Checkout | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/abandoned-checkouts", {
        params: { page, limit: PAGE_SIZE },
      });
      setRecords(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setSelectedIds([]);
    } catch {
      setError("Unable to load abandoned checkouts.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => records.map((record) => {
    const name = `${record.customer?.firstName || ""} ${record.customer?.lastName || ""}`.trim();
    return {
      ...record,
      id: record._id,
      customerName: name || "Anonymous",
      contact: record.customer?.phone || record.customer?.email || "Not provided",
      products: record.items?.map((item) => `${item.title} × ${item.quantity}`).join(", ") || "—",
      location: [record.shippingAddress?.city, record.shippingAddress?.state].filter(Boolean).join(", ") || "—",
      amount: `PKR ${(record.subtotal || 0).toLocaleString()}`,
      activity: new Date(record.lastActivityAt).toLocaleString(),
      displayStatus: record.status === "open" ? (record.isAbandoned ? "Abandoned" : "Active") : record.status,
      _raw: record,
    };
  }), [records]);

  const columns: AdminColumn[] = [
    { key: "customerName", label: "Customer" },
    { key: "contact", label: "Contact" },
    { key: "products", label: "Products", width: "260px" },
    { key: "location", label: "Location" },
    { key: "amount", label: "Value" },
    { key: "activity", label: "Last Activity" },
    {
      key: "displayStatus", label: "Status",
      render: (value) => <span className={`admin-badge ${value === "recovered" ? "admin-badge-success" : value === "Abandoned" ? "admin-badge-danger" : "admin-badge-neutral"}`}>{String(value)}</span>,
    },
  ];

  const openEdit = (row: Record<string, unknown>) => {
    const record = row._raw as Checkout;
    setEditing(record);
    setForm({
      firstName: record.customer?.firstName || "",
      lastName: record.customer?.lastName || "",
      email: record.customer?.email || "",
      phone: record.customer?.phone || "",
      status: record.status,
      notes: record.notes || "",
    });
    setError("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      await api.patch(`/admin/abandoned-checkouts/${editing._id}`, form);
      setEditing(null);
      await load();
    } catch {
      setError("Unable to save this record.");
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteIds.length) return;
    setSaving(true); setError("");
    try {
      await api.delete("/admin/abandoned-checkouts", { data: { ids: deleteIds } });
      setDeleteIds([]); setSelectedIds([]);
      await load();
    } catch {
      setError("Unable to delete the selected records.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Abandoned Checkouts</h2>
          <p className="admin-page-subtitle">Checkout leads that have not placed an order</p>
        </div>
        {selectedIds.length > 0 && (
          <button className="admin-btn admin-btn-danger" onClick={() => setDeleteIds(selectedIds)}>
            <Trash2 size={15} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {error && !editing && !deleteIds.length && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      <AdminTable
        columns={columns}
        data={rows}
        searchable
        searchKeys={["customerName", "contact", "products", "location", "displayStatus"]}
        loading={loading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteIds([String(row._id)])}
        selectable rowKey="_id" selectedKeys={selectedIds} onSelectionChange={setSelectedIds}
        serverPagination={{ page, totalPages, total, pageSize: PAGE_SIZE, onPageChange: setPage }}
      />

      <AdminModal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Checkout" size="md"
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></>}>
        <div className="admin-form-grid">
          {(["firstName", "lastName", "email", "phone"] as const).map((key) => (
            <div className="admin-form-group" key={key}>
              <label className="admin-form-label">{{ firstName: "First Name", lastName: "Last Name", email: "Email", phone: "Phone" }[key]}</label>
              <input className="admin-form-input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <select className="admin-form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EditForm["status"] })}>
              <option value="open">Open</option><option value="contacted">Contacted</option><option value="recovered">Recovered</option><option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="admin-form-label">Notes</label>
            <textarea className="admin-form-input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        {error && <p style={{ color: "#ef4444", marginTop: 10 }}>{error}</p>}
      </AdminModal>

      <AdminModal isOpen={deleteIds.length > 0} onClose={() => setDeleteIds([])} title={deleteIds.length > 1 ? "Delete Selected Checkouts" : "Delete Checkout"} size="sm"
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDeleteIds([])} disabled={saving}>Cancel</button><button className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={saving}><Trash2 size={14} /> {saving ? "Deleting…" : `Delete ${deleteIds.length}`}</button></>}>
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete {deleteIds.length} checkout record{deleteIds.length !== 1 ? "s" : ""}?</div>
          <p className="admin-modal-confirm-text">This action cannot be undone.</p>
          {error && <p className="admin-modal-confirm-text" style={{ color: "#ef4444" }}>{error}</p>}
        </div>
      </AdminModal>
    </>
  );
}

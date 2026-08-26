"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Coins,
  TrendingUp,
  CheckCircle,
  PauseCircle,
} from "lucide-react";
import AdminTable, { AdminColumn } from "@/components/AdminTable";
import AdminModal from "@/components/AdminModal";
import api from "@/lib/axios";
import "@/styles/admin-dashboard.css";

const PAGE_LIMIT = 10;

type ApiCampaign = {
  _id: string;
  adName: string;
  platform: string;
  totalBudget: number;
  dailyBudget: number;
  startDate: string;
  endDate: string;
  totalSpent: number;
  status: string;
  notes: string;
  createdAt: string;
};

type CampaignRow = ApiCampaign & { id: string; days: number };

const EMPTY_FORM = {
  adName: "",
  platform: "Facebook",
  totalBudget: 0,
  dailyBudget: 0,
  startDate: "",
  endDate: "",
  totalSpent: 0,
  status: "Active",
  notes: "",
};

const calculateDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const diff =
    (new Date(end).getTime() - new Date(start).getTime()) /
    (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const columns: AdminColumn[] = [
  { key: "adName", label: "Ad Name" },
  { key: "platform", label: "Platform", width: "110px" },
  {
    key: "totalBudget",
    label: "Total Budget",
    width: "130px",
    render: (val) => `Rs. ${Number(val).toLocaleString()}`,
  },
  {
    key: "dailyBudget",
    label: "Daily Budget",
    width: "120px",
    render: (val) => `Rs. ${Number(val).toLocaleString()}`,
  },
  {
    key: "startDate",
    label: "Start",
    width: "110px",
    render: (val) => fmtDate(String(val)),
  },
  {
    key: "endDate",
    label: "End",
    width: "110px",
    render: (val) => fmtDate(String(val)),
  },
  { key: "days", label: "Days", width: "70px" },
  {
    key: "totalSpent",
    label: "Total Spent",
    width: "130px",
    render: (val) => (
      <strong style={{ color: "#005ec3" }}>
        Rs. {Number(val).toLocaleString()}
      </strong>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "100px",
    render: (val) => (
      <span
        className={`admin-badge ${
          val === "Active"
            ? "admin-badge-success"
            : val === "Completed"
              ? "admin-badge-info"
              : "admin-badge-warning"
        }`}
      >
        {String(val)}
      </span>
    ),
  },
];

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Summary
  const [summary, setSummary] = useState({
    budget: 0,
    spent: 0,
    active: 0,
    completed: 0,
  });

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteRow, setDeleteRow] = useState<CampaignRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/marketing");
      const list: ApiCampaign[] = data.campaigns ?? [];

      const rows = list.map((c) => ({
        ...c,
        id: c._id,
        days: calculateDays(c.startDate, c.endDate),
      }));
      setCampaigns(rows as Record<string, unknown>[]);
      setTotal(list.length);

      setSummary({
        budget: list.reduce((a, c) => a + (c.totalBudget || 0), 0),
        spent: list.reduce((a, c) => a + (c.totalSpent || 0), 0),
        active: list.filter((c) => c.status === "Active").length,
        completed: list.filter((c) => c.status === "Completed").length,
      });
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  /* ── Open Add ── */
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  /* ── Open Edit ── */
  const handleEdit = (row: Record<string, unknown>) => {
    const c = row as unknown as ApiCampaign;
    setFormData({
      adName: c.adName,
      platform: c.platform,
      totalBudget: c.totalBudget,
      dailyBudget: c.dailyBudget,
      startDate: c.startDate?.substring(0, 10) ?? "",
      endDate: c.endDate?.substring(0, 10) ?? "",
      totalSpent: c.totalSpent,
      status: c.status,
      notes: c.notes || "",
    });
    setEditingId(c._id);
    setFormError(null);
    setShowForm(true);
  };

  /* ── Submit form ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError("End date cannot be before start date.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.put(`/admin/marketing/${editingId}`, formData);
      } else {
        await api.post("/admin/marketing", formData);
      }
      setShowForm(false);
      fetchCampaigns();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save campaign.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const openDelete = (row: Record<string, unknown>) =>
    setDeleteRow(row as unknown as CampaignRow);

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/admin/marketing/${deleteRow._id}`);
      setDeleteRow(null);
      fetchCampaigns();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete campaign.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const estDays = calculateDays(formData.startDate, formData.endDate);
  const estCost = estDays * (formData.dailyBudget || 0);

  return (
    <>
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Marketing Management</h2>
          <p className="admin-page-subtitle">
            {total} total campaign{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Campaign
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-blue">
            <Coins size={20} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">
              Total Budget
              <div className="admin-stat-change admin-stat-change-neutral">
                All campaigns
              </div>
            </div>
            <div className="admin-stat-value">
              Rs. {summary.budget.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-purple">
            <TrendingUp size={20} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">
              Total Spent
              <div className="admin-stat-change admin-stat-change-neutral">
                Actual spend
              </div>
            </div>
            <div className="admin-stat-value">
              Rs. {summary.spent.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-green">
            <CheckCircle size={20} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">
              Active Campaigns
              <div className="admin-stat-change admin-stat-change-neutral">
                Currently running
              </div>
            </div>
            <div className="admin-stat-value">{summary.active}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap admin-stat-icon-amber">
            <PauseCircle size={20} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">
              Completed
              <div className="admin-stat-change admin-stat-change-neutral">
                Finished campaigns
              </div>
            </div>
            <div className="admin-stat-value">{summary.completed}</div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <AdminTable
        columns={columns}
        data={campaigns}
        rowKey="id"
        onEdit={handleEdit}
        onDelete={openDelete}
        searchable={true}
        searchKeys={["adName", "platform", "status"]}
        loading={loading}
        pageSize={PAGE_LIMIT}
      />

      {/* ── Add / Edit Modal ── */}
      <AdminModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Campaign" : "Add Marketing Campaign"}
        subtitle={
          editingId
            ? "Update campaign details"
            : "Fill in the campaign information"
        }
        size="lg"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              form="marketing-form"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update Campaign"
                  : "Save Campaign"}
            </button>
          </>
        }
      >
        <form id="marketing-form" onSubmit={handleSubmit}>
          <div className="admin-modal-detail-grid">
            {/* Ad Name */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Ad Name *</span>
              <input
                required
                type="text"
                className="admin-modal-input"
                value={formData.adName}
                onChange={(e) =>
                  setFormData({ ...formData, adName: e.target.value })
                }
                placeholder="e.g. Summer Sale Campaign"
              />
            </div>

            {/* Platform */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Platform *</span>
              <select
                required
                className="admin-modal-input"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
              >
                <option>Facebook</option>
                <option>Instagram</option>
                <option>Google</option>
                <option>TikTok</option>
                <option>Other</option>
              </select>
            </div>

            {/* Total Budget */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">
                Total Budget (Rs.)
              </span>
              <input
                type="number"
                min="0"
                className="admin-modal-input"
                value={formData.totalBudget}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalBudget: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Daily Budget */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">
                Daily Budget (Rs.) *
              </span>
              <input
                required
                type="number"
                min="0"
                className="admin-modal-input"
                value={formData.dailyBudget}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyBudget: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Start Date */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Start Date *</span>
              <input
                required
                type="date"
                className="admin-modal-input"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            {/* End Date */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">End Date *</span>
              <input
                required
                type="date"
                className="admin-modal-input"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            {/* Total Spent */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">
                Total Spent (Rs.) *
              </span>
              <input
                required
                type="number"
                min="0"
                className="admin-modal-input"
                value={formData.totalSpent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalSpent: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Status */}
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Status</span>
              <select
                className="admin-modal-input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option>Active</option>
                <option>Completed</option>
                <option>Paused</option>
              </select>
            </div>

            {/* Estimated Cost Banner */}
            {estDays > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{
                    background: "rgba(0, 94, 195, 0.06)",
                    border: "1px solid rgba(0, 94, 195, 0.2)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#005ec3",
                  }}
                >
                  <strong>
                    Estimated Cost: Rs. {estCost.toLocaleString()}
                  </strong>
                  <span style={{ marginLeft: 8, color: "#555" }}>
                    ({estDays} days × Rs. {formData.dailyBudget}/day)
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div
              className="admin-modal-detail-item"
              style={{ gridColumn: "1 / -1" }}
            >
              <span className="admin-modal-detail-label">Notes</span>
              <textarea
                rows={2}
                className="admin-modal-input"
                style={{ resize: "vertical" }}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes about the campaign…"
              />
            </div>
          </div>

          {formError && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "13px",
                marginTop: "10px",
                fontWeight: 500,
              }}
            >
              {formError}
            </p>
          )}
        </form>
      </AdminModal>

      {/* ── Delete Confirmation Modal ── */}
      <AdminModal
        isOpen={!!deleteRow}
        onClose={() => {
          setDeleteRow(null);
          setDeleteError(null);
        }}
        title="Delete Campaign"
        size="sm"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => setDeleteRow(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon">
            <Trash2 size={22} />
          </div>
          <div className="admin-modal-confirm-title">
            Delete &quot;{deleteRow?.adName}&quot;?
          </div>
          <p className="admin-modal-confirm-text">
            This will permanently remove this marketing campaign. This action
            cannot be undone.
          </p>
          {deleteError && (
            <p
              style={{
                color: "#ef4444",
                marginTop: "0.5rem",
                fontWeight: 500,
                fontSize: "13px",
              }}
            >
              {deleteError}
            </p>
          )}
        </div>
      </AdminModal>
    </>
  );
}

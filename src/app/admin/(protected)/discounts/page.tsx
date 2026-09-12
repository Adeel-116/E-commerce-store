'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import api from '@/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PAGE_LIMIT = 10;
const FIXED_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0e8"/><text x="32" y="36" font-size="9" text-anchor="middle" fill="%23aaa" font-family="Arial">No Image</text></svg>';

type ApiProduct = {
  _id: string;
  title: string;
  images?: string[];
  price?: number;
  status: 'active' | 'inactive';
};

type DiscountKind = 'coupon' | 'product' | 'all_products';
type CouponKind = 'general' | 'reward';
type DiscountValueType = 'percentage' | 'fixed';

type ApiDiscount = {
  _id: string;
  name: string;
  type: DiscountKind;
  couponType?: CouponKind | null;
  valueType: DiscountValueType;
  value: number;
  code?: string;
  productIds?: (string | { _id: string; title: string })[];
  usageLimit?: number | null;
  customerEmails?: string[];
  usedCount: number;
  isActive: boolean;
  endDate?: string | null;
  startDate?: string | null;
  createdAt: string;
};

type TableDiscount = {
  _id: string;
  kindRaw: DiscountKind;
  couponTypeRaw?: CouponKind | null;
  type: string;
  code: string;
  discount: string;
  product: string;
  usage: string;
  expires: string;
  status: string;
  _raw: ApiDiscount;
};

const kindLabel: Record<DiscountKind, string> = {
  coupon: 'Coupon',
  product: 'Product',
  all_products: 'All Products',
};

const kindBadgeClass: Record<DiscountKind, string> = {
  coupon: 'admin-badge-info',
  product: 'admin-badge-warning',
  all_products: 'admin-badge-neutral',
};

const statusClass: Record<string, string> = {
  active: 'admin-badge-success',
  expired: 'admin-badge-danger',
  inactive: 'admin-badge-neutral',
};

const deriveStatus = (d: ApiDiscount): 'active' | 'inactive' | 'expired' => {
  if (d.endDate && new Date(d.endDate) < new Date()) return 'expired';
  return d.isActive ? 'active' : 'inactive';
};

const mapDiscount = (d: ApiDiscount): TableDiscount => ({
  _id: d._id,
  kindRaw: d.type,
  couponTypeRaw: d.couponType,
  type: kindLabel[d.type] ?? d.type,
  code: d.code || '—',
  discount: d.valueType === 'percentage' ? `${d.value}%` : `${d.value} PKR`,
  product:
    d.productIds && d.productIds.length > 0
      ? typeof d.productIds[0] === 'object'
        ? d.productIds[0].title || d.productIds[0]._id
        : d.productIds[0]
      : '—',
  usage: d.usageLimit ? `${d.usedCount}/${d.usageLimit}` : `${d.usedCount}/∞`,
  expires: d.endDate ? new Date(d.endDate).toLocaleDateString('en-GB') : '—',
  status: deriveStatus(d),
  _raw: d,
});

const columns: AdminColumn[] = [
  {
    key: 'type',
    label: 'Type',
    width: '150px',
    render: (_val, row) => {
      const t = row as unknown as TableDiscount;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className={`admin-badge ${kindBadgeClass[t.kindRaw] ?? 'admin-badge-neutral'}`}>
            {t.type}
          </span>
          {t.kindRaw === 'coupon' && t.couponTypeRaw && (
            <span
              className={`admin-badge ${t.couponTypeRaw === 'reward' ? 'admin-badge-warning' : 'admin-badge-neutral'}`}
              style={{ fontSize: 10 }}
            >
              {t.couponTypeRaw === 'reward' ? 'Reward' : 'General'}
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: 'code',
    label: 'Code / Scope',
    render: (val, row) => {
      const t = row as unknown as TableDiscount;
      if (t.kindRaw === 'coupon' && val !== '—') {
        return (
          <code style={{ background: '#f7f5f2', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'var(--brandblack)' }}>
            {val as string}
          </code>
        );
      }
      if (t.kindRaw === 'product') {
        return <span style={{ fontSize: 12, color: '#555' }}>{t.product}</span>;
      }
      return <span style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>All Products</span>;
    },
  },
  { key: 'discount', label: 'Discount', width: '110px' },
  { key: 'usage', label: 'Usage', width: '90px' },
  { key: 'expires', label: 'Expires', width: '110px' },
  {
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (val) => (
      <span
        className={`admin-badge ${statusClass[val as string] ?? 'admin-badge-neutral'}`}
        style={{ textTransform: 'capitalize' }}
      >
        {val as string}
      </span>
    ),
  },
];

type FormState = {
  kind: DiscountKind;
  name: string;
  code: string;
  couponType: CouponKind;
  valueType: DiscountValueType;
  value: string;
  productIds: string[];
  customerEmails: string;
  usageLimit: string;
  endDate: string;
  status: 'active' | 'inactive';
};

const emptyForm = (): FormState => ({
  kind: 'coupon',
  name: '',
  code: '',
  couponType: 'general',
  valueType: 'percentage',
  value: '',
  productIds: [],
  customerEmails: '',
  usageLimit: '',
  endDate: '',
  status: 'active',
});

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<TableDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDiscount, setDeleteDiscount] = useState<TableDiscount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fetchDiscounts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE_URL}/admin/all/discount`, {
        params: { page: p, limit: PAGE_LIMIT },
      });
      setDiscounts((data.data ?? []).map(mapDiscount));
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiscounts(page); }, [page, fetchDiscounts]);

  const fetchAllProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data } = await api.get(`${BASE_URL}/universalFilter`, {
        params: { status: 'active', limit: 500 },
      });
      setAllProducts(data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modalMode !== null && (form.kind === 'product' || form.kind === 'coupon') && allProducts.length === 0) {
      fetchAllProducts();
    }
  }, [modalMode, form.kind, allProducts.length, fetchAllProducts]);

  const field = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleProduct = (id: string) =>
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((pid) => pid !== id)
        : [...f.productIds, id],
    }));

  const openAdd = () => {
    setForm(emptyForm());
    setSelectedId(null);
    setSaveError(null);
    setProductSearch('');
    setModalMode('add');
  };

  const openEdit = (row: Record<string, unknown>) => {
    const t = row as unknown as TableDiscount;
    const raw = t._raw;
    setSelectedId(raw._id);
    setSaveError(null);
    setProductSearch('');
    setForm({
      kind: raw.type,
      name: raw.name,
      code: raw.code ?? '',
      couponType: raw.couponType ?? 'general',
      valueType: raw.valueType,
      value: String(raw.value),
      productIds: (raw.productIds ?? []).map((p) =>
        typeof p === 'object' ? p._id : p
      ),
      usageLimit: raw.usageLimit ? String(raw.usageLimit) : '',
      customerEmails: (raw.customerEmails ?? []).join(', '),
      endDate: raw.endDate ? raw.endDate.slice(0, 10) : '',
      status: raw.isActive ? 'active' : 'inactive',
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setSaveError(null);
  };

  // Only one "All Products" discount may be active at a time — the backend
  // rejects activating a second one. General/reward coupons and product
  // discounts can all be active simultaneously alongside it.
  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.kind,
        valueType: form.valueType,
        value: Number(form.value),
        isActive: form.status === 'active',
        ...(form.usageLimit ? { usageLimit: Number(form.usageLimit) } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
        ...(form.kind === 'coupon' ? { code: form.code, couponType: form.couponType, productIds: form.productIds, customerEmails: form.customerEmails.split(/[\n,]+/).map(e => e.trim()).filter(Boolean) } : {}),
        ...(form.kind === 'product' ? { productIds: form.productIds } : {}),
      };

      if (modalMode === 'add') {
        await api.post(`${BASE_URL}/admin/create/discount`, payload);
      } else {
        await api.put(`${BASE_URL}/admin/discount/update`, payload, {
          params: { id: selectedId },
        });
      }

      closeModal();
      fetchDiscounts(page);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDiscount) return;
    setDeleting(true);
    try {
      await api.delete(`${BASE_URL}/admin/discount/delete`, {
        params: { id: deleteDiscount._id },
      });
      setDeleteDiscount(null);
      fetchDiscounts(page);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Only "all_products" discounts are mutually exclusive with each other.
  const activeAllProductsElsewhere = discounts.find(
    (d) => d.kindRaw === 'all_products' && d.status === 'active' && d._id !== selectedId
  );

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Discounts</h2>
          <p className="admin-page-subtitle">
            {total} total &nbsp;·&nbsp; only one &quot;All Products&quot; discount can be active at a time
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> New Discount
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={discounts as unknown as Record<string, unknown>[]}
        pageSize={PAGE_LIMIT}
        onEdit={openEdit}
        onDelete={(row) => { setDeleteError(null); setDeleteDiscount(row as unknown as TableDiscount); }}
        searchable={false}
        loading={loading}
        serverPagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
      />

      <AdminModal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Create Discount' : 'Edit Discount'}
        size="md"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : modalMode === 'add' ? 'Create Discount' : 'Save Changes'}
            </button>
          </>
        }
      >
        {saveError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 7, background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
            {saveError}
          </div>
        )}

        {!saveError && form.kind === 'all_products' && form.status === 'active' && activeAllProductsElsewhere && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 7, background: '#fffbea', border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
            &quot;{activeAllProductsElsewhere._raw.name}&quot; is currently the active All Products discount.
            Only one may be active at a time, so saving this as Active will be rejected until you deactivate it.
          </div>
        )}

        <div className="admin-form-grid">
          {/* Type selector */}
          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Discount Applies To</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['coupon', 'product', 'all_products'] as DiscountKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => field('kind', k)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 7, border: '1.5px solid',
                    borderColor: form.kind === k ? 'var(--brandgreen)' : '#e0e0d8',
                    background: form.kind === k ? 'var(--brandgreen)' : '#fff',
                    color: form.kind === k ? '#fff' : '#666',
                    fontWeight: form.kind === k ? 600 : 400,
                    fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'Arial, Helvetica, sans-serif', textAlign: 'center',
                  }}
                >
                  {k === 'coupon' ? 'Coupon Code' : k === 'product' ? 'Specific Product' : 'All Products'}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Discount Name</label>
            <input
              className="admin-form-input"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              placeholder="e.g. Summer Sale 2025"
            />
          </div>

          {/* Coupon code + sub-type */}
          {form.kind === 'coupon' && (
            <>
              <div className="admin-form-group admin-form-grid-full">
                <label className="admin-form-label">Coupon Code</label>
                <input
                  className="admin-form-input"
                  value={form.code}
                  onChange={(e) => field('code', e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                />
                <span className="admin-form-hint">Customers enter this code at checkout</span>
              </div>

              <div className="admin-form-group admin-form-grid-full">
                <label className="admin-form-label">Coupon Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['general', 'reward'] as CouponKind[]).map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => field('couponType', ct)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 7, border: '1.5px solid',
                        borderColor: form.couponType === ct ? 'var(--brandgreen)' : '#e0e0d8',
                        background: form.couponType === ct ? 'var(--brandgreen)' : '#fff',
                        color: form.couponType === ct ? '#fff' : '#666',
                        fontWeight: form.couponType === ct ? 600 : 400,
                        fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'Arial, Helvetica, sans-serif', textAlign: 'center',
                      }}
                    >
                      {ct === 'general' ? 'General (anyone)' : 'Reward (existing customers)'}
                    </button>
                  ))}
                </div>
                <span className="admin-form-hint">
                  {form.couponType === 'reward'
                    ? 'Only customers who have placed at least one prior order can redeem this code, and each may redeem it once. Eligibility is automatic — no email list needed.'
                    : 'Anyone can use this code, up to the usage limit below.'}
                </span>
              </div>
            </>
          )}

          {/* Product picker */}
          {form.kind === 'coupon' && <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Specific Customer Emails <span style={{fontWeight:400,color:'#888'}}>(optional)</span></label>
            <textarea
              className="admin-form-input"
              style={{minHeight:82,paddingTop:10,resize:'vertical'}}
              value={form.customerEmails}
              onChange={(e) => field('customerEmails', e.target.value)}
              placeholder="customer@example.com&#10;another@example.com"
            />
            <span className="admin-form-hint">
              Leave empty for all customers. Separate multiple emails with commas or new lines.
            </span>
          </div>}

          {(form.kind === 'product' || form.kind === 'coupon') && (
            <div className="admin-form-group admin-form-grid-full">
              <label className="admin-form-label">
                Select Products
                {form.productIds.length > 0 && (
                  <span style={{ marginLeft: 8, fontWeight: 400, color: '#888', fontSize: 11 }}>
                    {form.productIds.length} selected
                  </span>
                )}
              </label>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
                <input
                  className="admin-form-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1.5px solid #e0e0d8', borderRadius: 8, background: '#fff' }}>
                {productsLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading products…</div>
                ) : allProducts.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No products found</div>
                ) : (
                  allProducts
                    .filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p, i, arr) => {
                      const selected = form.productIds.includes(p._id);
                      return (
                        <div
                          key={p._id}
                          onClick={() => toggleProduct(p._id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', cursor: 'pointer',
                            background: selected ? '#f0f5ea' : '#fff',
                            borderBottom: i < arr.length - 1 ? '1px solid #f0f0e8' : 'none',
                            transition: 'background 0.1s',
                          }}
                        >
                          <input type="checkbox" readOnly checked={selected}
                            style={{ accentColor: 'var(--brandgreen)', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.images?.[0] || FIXED_IMAGE} alt={p.title}
                            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid #e8e8e0' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FIXED_IMAGE; }}
                          />
                          <span style={{ fontSize: 13, flex: 1, color: '#222' }}>{p.title}</span>
                          {p.price != null && (
                            <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{p.price} PKR</span>
                          )}
                          {selected && <X size={13} style={{ color: '#aaa', flexShrink: 0 }} />}
                        </div>
                      );
                    })
                )}
              </div>
              <span className="admin-form-hint">
                Multiple product discounts can be active at once — each only affects its own products.
              </span>
            </div>
          )}

          {form.kind === 'all_products' && (
            <div
              className="admin-form-grid-full"
              style={{ padding: '10px 14px', borderRadius: 7, background: '#f7f5f2', border: '1px solid #e8e8e0', fontSize: 12, color: '#777' }}
            >
              This discount applies automatically to every product in the store. Only one can be active at a time.
            </div>
          )}

          <div className="admin-form-group">
            <label className="admin-form-label">Value Type</label>
            <select
              className="admin-form-select"
              value={form.valueType}
              onChange={(e) => field('valueType', e.target.value as DiscountValueType)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">
              {form.valueType === 'percentage' ? 'Discount (%)' : 'Amount (PKR)'}
            </label>
            <input
              className="admin-form-input"
              type="number"
              min="0"
              value={form.value}
              onChange={(e) => field('value', e.target.value)}
              placeholder={form.valueType === 'percentage' ? '25' : '50'}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Usage Limit</label>
            <input
              className="admin-form-input"
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={(e) => field('usageLimit', e.target.value)}
              placeholder="Optional — total times this can be used"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Expiry Date</label>
            <input
              className="admin-form-input"
              type="date"
              value={form.endDate}
              onChange={(e) => field('endDate', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <select
              className="admin-form-select"
              value={form.status}
              onChange={(e) => field('status', e.target.value as 'active' | 'inactive')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="admin-form-hint">
              {form.kind === 'all_products'
                ? 'Only one All Products discount may be active at a time across the whole store.'
                : 'Multiple coupons and product discounts can be active at the same time.'}
            </span>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={!!deleteDiscount}
        onClose={() => { setDeleteDiscount(null); setDeleteError(null); }}
        title="Delete Discount"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => { setDeleteDiscount(null); setDeleteError(null); }} disabled={deleting}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        {deleteError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 7, background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
            {deleteError}
          </div>
        )}
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">
            {deleteDiscount?.kindRaw === 'coupon'
              ? `Delete coupon "${deleteDiscount.code}"?`
              : deleteDiscount?.kindRaw === 'product'
              ? 'Delete product discount?'
              : 'Delete all-products discount?'}
          </div>
          <p className="admin-modal-confirm-text">
            This discount will be permanently removed and will stop being applied.
          </p>
        </div>
      </AdminModal>
    </>
  );
}

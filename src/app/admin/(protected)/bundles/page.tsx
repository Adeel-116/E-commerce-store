'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, AlertCircle, Search, X } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import api from '@/lib/axios';

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0e8"/><text x="32" y="36" font-size="9" text-anchor="middle" fill="%23aaa" font-family="Arial">No Image</text></svg>';

type BundlePrice = {
  itemCount: number;
  price: number;
};

type ApiProduct = {
  _id: string;
  title: string;
  images?: string[];
  price?: number;
  status?: 'active' | 'inactive';
};

type ApiBundle = {
  _id: string;
  title: string;
  productId: { _id: string; title: string; images?: string[]; price?: number } | string;
  numberOfItems: number;
  prices?: BundlePrice[];
  savedAmount?: number;
  createdAt?: string;
};

type TableBundle = {
  _id: string;
  title: string;
  productTitle: string;
  productImage: string;
  numberOfItems: number;
  priceSummary: string;
  savedAmount: number;
  _raw: ApiBundle;
};

type FormState = {
  title: string;
  productId: string;
  numberOfItems: string;
  prices: Array<{ itemCount: number; price: string }>;
};

type ApiResponse<T> = {
  data?: T[];
  success?: boolean;
  message?: string;
};

const emptyForm = (): FormState => ({
  title: '',
  productId: '',
  numberOfItems: '',
  prices: [],
});

const buildPriceRows = (count: number, prev: Array<{ itemCount: number; price: string }>) => {
  return Array.from({ length: count }, (_, index) => {
    const itemCount = index + 1;
    const existing = prev.find((row) => row.itemCount === itemCount);
    return {
      itemCount,
      price: existing?.price ?? '',
    };
  });
};

const mapBundle = (bundle: ApiBundle): TableBundle => {
  const product = typeof bundle.productId === 'object' ? bundle.productId : null;
  return {
    _id: bundle._id,
    title: bundle.title,
    productTitle: product?.title ?? '—',
    productImage: product?.images?.[0] || '',
    numberOfItems: bundle.numberOfItems,
    priceSummary: (bundle.prices ?? [])
      .map((row) => ` ${row.itemCount}: PKR ${row.price}`)
      .join(' • '),
    savedAmount: bundle.savedAmount ?? 0,
    _raw: bundle,
  };
};

const columns: AdminColumn[] = [
  { key: 'title', label: 'Bundle Title' },
  {
    key: 'productTitle',
    label: 'Product',
    render: (value, row) => {
      const t = row as unknown as TableBundle;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.productImage || PLACEHOLDER_IMG}
            alt={String(value)}
            style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 5, border: '1px solid #e8e8e0' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
          <span style={{ fontSize: 13, color: '#333' }}>{String(value || '—')}</span>
        </div>
      );
    },
  },
  { key: 'numberOfItems', label: 'No. of Items', width: '130px' },
  {
    key: 'priceSummary',
    label: 'Pricing',
    render: (value) => <span style={{ fontSize: 13, color: '#555' }}>{String(value || '—')}</span>,
  },
  {
    key: 'savedAmount',
    label: 'Saved Amount',
    width: '140px',
    render: (value) => (
      <span className="admin-badge admin-badge-success">PKR {Number(value ?? 0)}</span>
    ),
  },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState<TableBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<TableBundle | null>(null);
  const [deleteBundle, setDeleteBundle] = useState<TableBundle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<ApiBundle>>('/getAllBundles');
      const list = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      setBundles(list.map(mapBundle));
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Unable to load bundles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const fetchAllProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data } = await api.get('/universalFilter', {
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
    if (modalMode !== null && allProducts.length === 0) {
      fetchAllProducts();
    }
  }, [modalMode, allProducts.length, fetchAllProducts]);

  const handleNumberOfItemsChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const count = digits === '' ? 0 : Number(digits);
    setForm((prev) => ({
      ...prev,
      numberOfItems: digits,
      prices: buildPriceRows(count, prev.prices),
    }));
  };

  const openAdd = () => {
    setForm(emptyForm());
    setSelectedBundle(null);
    setSavingError(null);
    setProductSearch('');
    setModalMode('add');
  };

  const openEdit = (row: Record<string, unknown>) => {
    const bundle = row as unknown as TableBundle;
    const product = typeof bundle._raw.productId === 'object' ? bundle._raw.productId : null;
    setSelectedBundle(bundle);
    setForm({
      title: bundle.title,
      productId: product?._id ?? (typeof bundle._raw.productId === 'string' ? bundle._raw.productId : ''),
      numberOfItems: String(bundle.numberOfItems),
      prices: buildPriceRows(bundle.numberOfItems, (bundle._raw.prices ?? []).map((item) => ({
        itemCount: item.itemCount,
        price: String(item.price),
      }))),
    });
    setSavingError(null);
    setProductSearch('');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedBundle(null);
    setSavingError(null);
  };

  const saveBundle = async () => {
    if (!form.title.trim()) {
      setSavingError('Bundle title is required.');
      return;
    }
    if (!form.productId) {
      setSavingError('Please select a product for this bundle.');
      return;
    }
    if (!form.numberOfItems || Number(form.numberOfItems) <= 0) {
      setSavingError('Number of items must be greater than zero.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      productId: form.productId,
      numberOfItems: Number(form.numberOfItems),
      prices: form.prices.map((row) => ({
        itemCount: row.itemCount,
        price: Number(row.price || 0),
      })),
    };

    setSaving(true);
    setSavingError(null);
    try {
      if (modalMode === 'edit' && selectedBundle) {
        await api.patch(`/update-bundle/${selectedBundle._id}`, payload);
      } else {
        await api.post('/create-bundle', payload);
      }
      closeModal();
      fetchBundles();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSavingError(msg || 'Unable to save bundle.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteBundle) return;
    setDeleteError(null);
    try {
      await api.delete(`/delete-bundle/${deleteBundle._id}`);
      setDeleteBundle(null);
      fetchBundles();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg || 'Unable to delete bundle.');
    }
  };

  const priceRows = useMemo(() => form.prices, [form.prices]);
  const selectedProduct = useMemo(
    () => allProducts.find((p) => p._id === form.productId) ?? null,
    [allProducts, form.productId]
  );

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Bundles</h2>
          <p className="admin-page-subtitle">{bundles.length} bundle{bundles.length === 1 ? '' : 's'} in your catalog</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Create Bundle
        </button>
      </div>

      {error ? (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fff2f2', border: '1px solid #f8c8c8', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <AdminTable
        columns={columns}
        data={bundles as unknown as Record<string, unknown>[]}
        pageSize={10}
        onEdit={openEdit}
        onDelete={(row) => setDeleteBundle(row as unknown as TableBundle)}
        searchable={false}
        loading={loading}
      />

      <AdminModal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Create Bundle' : 'Edit Bundle'}
        size="md"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={saveBundle} disabled={saving}>
              {saving ? 'Saving…' : modalMode === 'add' ? 'Create Bundle' : 'Save Changes'}
            </button>
          </>
        }
      >
        {savingError ? (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 7, background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
            {savingError}
          </div>
        ) : null}

        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Bundle Title</label>
            <input
              className="admin-form-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Starter Product Bundle"
            />
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Product</label>

            {selectedProduct ? (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  border: '1.5px solid #e0e0d8', borderRadius: 8, background: '#fafaf6',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProduct.images?.[0] || PLACEHOLDER_IMG}
                  alt={selectedProduct.title}
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 5, border: '1px solid #e8e8e0' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
                <span style={{ fontSize: 13, flex: 1, color: '#222' }}>{selectedProduct.title}</span>
                {selectedProduct.price != null && (
                  <span style={{ fontSize: 11, color: '#aaa' }}>{selectedProduct.price} PKR</span>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  onClick={() => setForm((prev) => ({ ...prev, productId: '' }))}
                >
                  <X size={13} /> Change
                </button>
              </div>
            ) : (
              <>
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
                      .map((p, i, arr) => (
                        <div
                          key={p._id}
                          onClick={() => setForm((prev) => ({ ...prev, productId: p._id }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', cursor: 'pointer', background: '#fff',
                            borderBottom: i < arr.length - 1 ? '1px solid #f0f0e8' : 'none',
                            transition: 'background 0.1s',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images?.[0] || PLACEHOLDER_IMG}
                            alt={p.title}
                            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid #e8e8e0' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                          />
                          <span style={{ fontSize: 13, flex: 1, color: '#222' }}>{p.title}</span>
                          {p.price != null && (
                            <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{p.price} PKR</span>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">No. of Items</label>
            <input
              className="admin-form-input"
              type="number"
              min="1"
              value={form.numberOfItems}
              onChange={(e) => handleNumberOfItemsChange(e.target.value)}
              placeholder="2"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Price Setup</label>
            <div style={{ fontSize: 12, color: '#888' }}>
              Enter the pricing for each item count from 1 up to the selected number.
            </div>
          </div>

          {priceRows.map((row) => (
            <div key={row.itemCount} className="admin-form-group">
              <label className="admin-form-label">{row.itemCount} Item{row.itemCount > 1 ? 's' : ''}</label>
              <input
                className="admin-form-input"
                type="number"
                min="0"
                value={row.price}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    prices: prev.prices.map((item) =>
                      item.itemCount === row.itemCount ? { ...item, price: nextValue } : item,
                    ),
                  }));
                }}
                placeholder={`PKR for ${row.itemCount}`}
              />
            </div>
          ))}
        </div>
      </AdminModal>

      <AdminModal
        isOpen={!!deleteBundle}
        onClose={() => setDeleteBundle(null)}
        title="Delete Bundle"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteBundle(null)}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={confirmDelete}><Trash2 size={14} /> Delete</button>
          </>
        }
      >
        {deleteError ? (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 7, background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>
            {deleteError}
          </div>
        ) : null}
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete &quot;{deleteBundle?.title}&quot;?</div>
          <p className="admin-modal-confirm-text">This bundle will be removed from the catalog.</p>
        </div>
      </AdminModal>
    </>
  );
}

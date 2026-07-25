'use client';
import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import AdminProductModal, { TableProduct, ProductSaveData } from '@/components/AdminProductModal';
import AdminProductFilter from '@/components/AdminProductFilter';
import AdminBulkUploadModal from '@/components/AdminBulkUploadModal';
import { useFilter } from '@/context/AdminFilterContext';
import api from '@/lib/axios';

const PAGE_LIMIT = 10;

type ApiProduct = {
  _id: string;
  productId: number;
  title: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  stock: boolean;
  status: 'active' | 'inactive';
};

const CATEGORY_LABELS: Record<string, string> = {
  western: 'Western Fashion',
  'top-jeans': 'Top & Jeans',
  fashion: 'Pakistani Fashion',
  maxi: 'Maxi',
};

const mapProduct = (p: ApiProduct): TableProduct => ({
  _id: p._id,
  id: String(p.productId),
  image: p.images?.[0] || '',
  title: p.title,
  price: p.price != null ? `${p.price} PKR` : '—',
  comparePrice: p.comparePrice ? `${p.comparePrice} PKR` : '—',
  category: Array.isArray(p.category) && p.category.length > 0
    ? p.category.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')
    : '—',
  stock: p.stock ? 'In Stock' : 'Out of Stock',
  status: p.status === 'active' ? 'Active' : 'Inactive',
});

const tableColumns: AdminColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'image', label: 'Image', type: 'image' },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category', width: '150px' },
  { key: 'price', label: 'Price', width: '110px' },
  { key: 'comparePrice', label: 'Compare Price', width: '130px' },
  {
    key: 'stock',
    label: 'Stock',
    width: '120px',
    render: (val) => (
      <span className={`admin-badge ${val === 'In Stock' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
        {val as string}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '110px',
    render: (val) => (
      <span className={`admin-badge ${val === 'Active' ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
        {val as string}
      </span>
    ),
  },
];

export default function ProductsPage() {
  const { products: rawProducts, loading, total, totalPages, page, setPage, refresh } = useFilter();

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<TableProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<TableProduct | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');

  const products = (rawProducts as unknown as ApiProduct[]).map(mapProduct);
  const allProductsSelected = total > 0 && selectedIds.length >= total;

  const handleSelectAllProducts = async () => {
    if (allProductsSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectAllLoading(true);
    try {
      const { data } = await api.get('/universalFilter', {
        params: { limit: total || 50000 },
      });
      const ids = ((data?.data ?? []) as { _id: string }[]).map((p) => p._id);
      setSelectedIds(ids);
    } catch (err) {
      console.error('Select all failed:', err);
    } finally {
      setSelectAllLoading(false);
    }
  };

  const confirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await api.delete('/admin/delete-product', { params: { deleteAll: 'true' } });
      setSelectedIds([]);
      setDeleteAllOpen(false);
      setDeleteAllConfirmText('');
      refresh();
    } catch (err) {
      console.error('Delete all failed:', err);
    } finally {
      setDeletingAll(false);
    }
  };

  const openAdd = () => { setSelectedProduct(null); setModalMode('add'); };
  const openEdit = (row: Record<string, unknown>) => { setSelectedProduct(row as unknown as TableProduct); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setSelectedProduct(null); };
  const handleSave = (_data: ProductSaveData) => { refresh(); closeModal(); };

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    try {
      await api.delete('/admin/delete-product', { params: { id: deleteProduct._id } });
      setDeleteProduct(null);
      refresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await api.delete('/admin/delete-product', { params: { ids: selectedIds.join(',') } });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refresh();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Products</h2>
          <p className="admin-page-subtitle">{total} products in catalogue</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {total > 0 && (
            <button className="admin-btn admin-btn-ghost" onClick={handleSelectAllProducts} disabled={selectAllLoading}>
              {selectAllLoading ? 'Selecting…' : allProductsSelected ? 'Clear Selection' : `Select All (${total})`}
            </button>
          )}
          {selectedIds.length > 0 && (
            <button className="admin-btn admin-btn-danger" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={15} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button className="admin-btn admin-btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Product
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={() => setBulkUploadOpen(true)}>
            <Upload size={15} /> Bulk Upload
          </button>

          {total > 0 && (
            <button className="admin-btn admin-btn-danger" onClick={() => setDeleteAllOpen(true)}>
              <Trash2 size={15} /> Delete All
            </button>
          )}
        </div>
      </div>

      <AdminProductFilter />

      <AdminTable
        columns={tableColumns}
        data={products as unknown as Record<string, unknown>[]}
        pageSize={PAGE_LIMIT}
        onEdit={openEdit}
        onDelete={(row) => setDeleteProduct(row as unknown as TableProduct)}
        searchable={false}
        loading={loading}
        serverPagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
        selectable
        rowKey="_id"
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <AdminProductModal mode={modalMode} selectedProduct={selectedProduct} onClose={closeModal} onSave={handleSave} />

      <AdminBulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onImport={() => { setBulkUploadOpen(false); refresh(); }}
      />

      <AdminModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteProduct(null)}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={confirmDelete}><Trash2 size={14} /> Delete</button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete &quot;{deleteProduct?.title}&quot;?</div>
          <p className="admin-modal-confirm-text">This product will be permanently removed from your catalogue. This action cannot be undone.</p>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete Selected Products"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={confirmBulkDelete} disabled={bulkDeleting}>
              <Trash2 size={14} /> {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.length}`}
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''}?</div>
          <p className="admin-modal-confirm-text">The selected products will be permanently removed from your catalogue. This action cannot be undone.</p>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={deleteAllOpen}
        onClose={() => { setDeleteAllOpen(false); setDeleteAllConfirmText(''); }}
        title="Delete All Products"
        size="sm"
        footer={
          <>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => { setDeleteAllOpen(false); setDeleteAllConfirmText(''); }}
              disabled={deletingAll}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-danger"
              onClick={confirmDeleteAll}
              disabled={deletingAll || deleteAllConfirmText !== 'DELETE ALL'}
            >
              <Trash2 size={14} /> {deletingAll ? 'Deleting…' : 'Delete All'}
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete all {total} product{total !== 1 ? 's' : ''}?</div>
          <p className="admin-modal-confirm-text">
            This will permanently remove your entire product catalogue. This action cannot be undone.
          </p>
          <p className="admin-modal-confirm-text">
            Type <strong>DELETE ALL</strong> to confirm.
          </p>
          <input
            className="admin-form-input"
            value={deleteAllConfirmText}
            onChange={(e) => setDeleteAllConfirmText(e.target.value)}
            placeholder="DELETE ALL"
          />
        </div>
      </AdminModal>
    </>
  );
}

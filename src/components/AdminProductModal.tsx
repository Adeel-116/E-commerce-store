'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, X, Upload } from 'lucide-react';
import AdminModal from './AdminModal';
import axios from 'axios';
import api from '@/lib/axios';
import '@/styles/admin-products.css';

export type TableProduct = {
  id: string;
  _id: string;
  image?: string;
  title: string;
  price: string;
  comparePrice: string;
  category: string;
  stock: string;
  status: string;
};

type RawProduct = {
  _id: string;
  productId: number;
  title: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  isNew: boolean;
  stock: boolean;
  status: 'active' | 'inactive';
};

export type ProductSaveData = {
  title: string;
  stock: boolean;
  status: string;
};

const categoryOptions = ['maxi', 'fashion', 'top-jeans', 'western'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

type FormValues = {
  title: string;
  description: string;
  images: string[];
  price: string;
  comparePrice: string;
  stock: boolean;
  status: 'active' | 'inactive';
  sizes: string[];
  category: string[];
  isNew: boolean;
};

const emptyForm = (): FormValues => ({
  title: '',
  description: '',
  images: [],
  price: '',
  comparePrice: '',
  stock: true,
  status: 'active',
  sizes: [],
  category: [],
  isNew: false,
});

interface AdminProductModalProps {
  mode: 'add' | 'edit' | null;
  selectedProduct?: TableProduct | null;
  onClose: () => void;
  onSave: (data: ProductSaveData) => void;
}

export default function AdminProductModal({ mode, selectedProduct, onClose, onSave }: AdminProductModalProps) {
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (mode === null) return;
    setApiError(null);
    setIsLoading(false);

    if (mode === 'add') {
      setForm(emptyForm());
      return;
    }

    if (mode === 'edit' && selectedProduct) {
      setIsFetching(true);

      api
        .get<{ success: boolean; data: RawProduct }>('/getProductById', {
          params: { id: selectedProduct._id },
        })
        .then(({ data }) => {
          if (!data.success) { setApiError('Failed to load product'); return; }
          const p = data.data;
          setForm({
            title: p.title ?? '',
            description: p.description ?? '',
            images: Array.isArray(p.images) ? p.images : [],
            price: p.price != null ? String(p.price) : '',
            comparePrice: p.comparePrice != null ? String(p.comparePrice) : '',
            stock: p.stock,
            status: p.status ?? 'active',
            sizes: Array.isArray(p.sizes) ? p.sizes : [],
            category: Array.isArray(p.category) ? p.category : [],
            isNew: !!p.isNew,
          });
        })
        .catch(() => setApiError('Failed to load product'))
        .finally(() => setIsFetching(false));
    }
  }, [mode, selectedProduct]);

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => {
    setApiError(null);
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    setApiError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/admin/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success && res.data?.url) {
          uploadedUrls.push(res.data.url);
        }
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploadedUrls] }));
    } catch (err) {
      setApiError(
        axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to upload image'
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setApiError('Product title is required.');
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        images: form.images,
        price: Number(form.price) || 0,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        category: Array.isArray(form.category) ? form.category : [],
        sizes: Array.isArray(form.sizes) ? form.sizes : [],
        isNew: form.isNew,
        stock: form.stock,
        status: form.status,
      };

      if (mode === 'add') {
        const res = await api.post('/admin/create-product', body);
        if (res.data?.success) {
          onSave({ title: form.title, stock: form.stock, status: form.status });
        } else {
          setApiError(res.data?.message || 'Failed to create product');
        }
      } else if (mode === 'edit' && selectedProduct) {
        const res = await api.put(`/admin/edit-product?id=${selectedProduct._id}`, body);
        if (res.data?.success) {
          onSave({ title: form.title, stock: form.stock, status: form.status });
        } else {
          setApiError(res.data?.message || 'Failed to update product');
        }
      }
    } catch (err: unknown) {
      setApiError(
        axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to save'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={mode !== null}
      onClose={onClose}
      title={mode === 'add' ? 'Add Product' : 'Edit Product'}
      subtitle={mode === 'edit' ? `ID: ${selectedProduct?.id}` : 'Fill in the details below'}
      size="md"
      footer={
        <>
          {apiError && (
            <span style={{ fontSize: 12, color: '#f87171', flex: 1 }}>{apiError}</span>
          )}
          <button className="admin-btn admin-btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={isLoading || isFetching || isUploadingImage}
          >
            {isLoading ? (
              <><Loader2 size={14} className="admin-spin" /> Saving…</>
            ) : (
              mode === 'add' ? 'Add Product' : 'Save Changes'
            )}
          </button>
        </>
      }
    >
      {isFetching ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: '#aaa' }}>
          <Loader2 size={18} className="admin-spin" />
          <span style={{ fontSize: 13 }}>Loading product data…</span>
        </div>
      ) : (
        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {form.images.map((url) => (
                <div key={url} style={{ position: 'relative', width: 74, height: 74 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Product"
                    style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                      background: '#c62828', color: '#fff', border: '2px solid #fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                    title="Remove image"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              <div
                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                style={{
                  width: 74, height: 74, borderRadius: 8, border: '1.5px dashed #d0d4c8', background: '#fafaf6',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: isUploadingImage ? 'not-allowed' : 'pointer', color: '#aaa', gap: 4,
                }}
              >
                {isUploadingImage ? (
                  <Loader2 size={18} className="admin-spin" />
                ) : (
                  <>
                    <Upload size={16} />
                    <span style={{ fontSize: 10 }}>Upload</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>
            <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>
              First image is used as the primary/cover image.
            </span>
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Title *</label>
            <input
              className="admin-form-input"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Embroidered Maxi Dress"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Price</label>
            <input
              className="admin-form-input"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="e.g. 250 PKR"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Compare Price</label>
            <input
              className="admin-form-input"
              type="number"
              min={0}
              value={form.comparePrice}
              onChange={(e) => setField('comparePrice', e.target.value)}
              placeholder="Optional — original/was price"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Category</label>

            <div className="admin-dropdown" ref={categoryDropdownRef}>
              <div
                className={`admin-dropdown-trigger${categoryDropdownOpen ? ' admin-dropdown-trigger--open' : ''}`}
                onClick={() => setCategoryDropdownOpen((p) => !p)}
              >
                <span className="admin-dropdown-chips">
                  {form.category.length > 0
                    ? form.category.map((c) => <span key={c} className="admin-selected-chip">{c}</span>)
                    : <span className="admin-dropdown-placeholder">Select category…</span>}
                </span>
                <ChevronDown size={14} className={`admin-dropdown-chevron${categoryDropdownOpen ? ' admin-dropdown-chevron--open' : ''}`} />
              </div>

              {categoryDropdownOpen && (
                <div className="admin-dropdown-menu">
                  {categoryOptions.map((cat) => {
                    const isSelected = form.category.includes(cat);
                    return (
                      <label key={cat} className={`admin-dropdown-item${isSelected ? ' admin-dropdown-item--selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setForm((prev) => ({
                              ...prev,
                              category: isSelected
                                ? prev.category.filter((c) => c !== cat)
                                : [...prev.category, cat],
                            }));
                          }}
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Sizes</label>

            <div className="admin-multi-select">
              {sizeOptions.map((option) => (
                <label key={option} className="admin-checkbox-pill">
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(option)}
                    onChange={() => {
                      setForm((prev) => ({
                        ...prev,
                        sizes: prev.sizes.includes(option)
                          ? prev.sizes.filter((s) => s !== option)
                          : [...prev.sizes, option],
                      }));
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">New Arrival</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">{form.isNew ? 'Marked as New' : 'Not New'}</span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => setField('isNew', e.target.checked)}
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Stock</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">{form.stock ? 'In Stock' : 'Out of Stock'}</span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.stock}
                  onChange={(e) => setField('stock', e.target.checked)}
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <select
              className="admin-form-select"
              value={form.status}
              onChange={(e) => setField('status', e.target.value as 'active' | 'inactive')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-textarea"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="A flowing maxi dress with embroidered detailing…"
              style={{ minHeight: 100 }}
            />
          </div>
        </div>
      )}
    </AdminModal>
  );
}

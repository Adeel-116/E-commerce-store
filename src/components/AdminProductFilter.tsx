'use client';

import { useState, useCallback, useRef } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useFilter } from '@/context/AdminFilterContext';
import '@/styles/admin-products.css';

export default function AdminProductFilter() {
  const { filters, saveFilter, clearFilter } = useFilter();

  const [name, setName] = useState(filters.title ?? '');
  const [stock, setStock] = useState(filters.stock ?? '');
  const [status, setStatus] = useState(filters.status ?? '');

  const nameRef = useRef(name);
  nameRef.current = name;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    saveFilter({
      title: nameRef.current.trim() || undefined,
      stock: stock || undefined,
      status: status || undefined,
    });
  }, [saveFilter, stock, status]);

  const scheduleFlush = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flush, 400);
  }, [flush]);

  const hasActive = !!(filters.title || filters.stock || filters.status);

  const handleClear = () => {
    clearTimeout(debounceTimer.current);
    setName('');
    setStock('');
    setStatus('');
    clearFilter();
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearTimeout(debounceTimer.current);
    const val = e.target.value;
    setStock(val);
    saveFilter({
      title: nameRef.current.trim() || undefined,
      stock: val || undefined,
      status: status || undefined,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearTimeout(debounceTimer.current);
    const val = e.target.value;
    setStatus(val);
    saveFilter({
      title: nameRef.current.trim() || undefined,
      stock: stock || undefined,
      status: val || undefined,
    });
  };

  return (
    <div className="admin-filter-bar">
      <span className="admin-filter-bar-label">
        <SlidersHorizontal size={14} />
        Filters
      </span>

      <div className="admin-filter-inputs">
        <input
          className="admin-filter-input"
          placeholder="Search by name…"
          value={name}
          onChange={(e) => { setName(e.target.value); scheduleFlush(); }}
        />
        <select className="admin-filter-select" value={stock} onChange={handleStockChange}>
          <option value="">All stock</option>
          <option value="true">In Stock</option>
          <option value="false">Out of Stock</option>
        </select>
        <select className="admin-filter-select" value={status} onChange={handleStatusChange}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {hasActive && (
        <button className="admin-filter-clear-btn" onClick={handleClear}>
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}

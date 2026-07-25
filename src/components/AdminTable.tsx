'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import '@/styles/admin-table.css';

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0e8"/><text x="32" y="36" font-size="9" text-anchor="middle" fill="%23aaa" font-family="Arial">No Image</text></svg>';

export interface AdminColumn {
  key: string;
  label: string;
  width?: string;
  type?: "text" | "image";
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface ServerPagination {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface AdminTableProps {
  columns: AdminColumn[];
  data: Record<string, unknown>[];
  pageSize?: number;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onView?: (row: Record<string, unknown>) => void;
  searchable?: boolean;
  searchKeys?: string[];
  showActions?: boolean;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  serverPagination?: ServerPagination;
  loading?: boolean;
  selectable?: boolean;
  rowKey?: string;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
}

export default function AdminTable({
  columns,
  data,
  pageSize = 8,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  searchKeys,
  showActions = true,
  toolbarLeft,
  toolbarRight,
  serverPagination,
  loading = false,
  selectable = false,
  rowKey = 'id',
  selectedKeys = [],
  onSelectionChange,
}: AdminTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const keys = searchKeys ?? columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys, columns]);

  const isServer = !!serverPagination;
  const clientTotalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const clientPage = Math.min(page, clientTotalPages);
  const start = (clientPage - 1) * pageSize;

  const activeTotalPages = isServer ? serverPagination.totalPages : clientTotalPages;
  const activeCurrentPage = isServer ? serverPagination.page : clientPage;
  const visibleData = isServer ? filteredData : filteredData.slice(start, start + pageSize);

  const visibleKeys = visibleData.map((row) => String(row[rowKey] ?? ''));
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys.includes(k));
  const someSelected = !allSelected && visibleKeys.some((k) => selectedKeys.includes(k));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange?.(selectedKeys.filter((k) => !visibleKeys.includes(k)));
    } else {
      onSelectionChange?.([...new Set([...selectedKeys, ...visibleKeys])]);
    }
  };

  const toggleRow = (key: string) => {
    if (selectedKeys.includes(key)) {
      onSelectionChange?.(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  };

  const handlePageChange = (p: number) => {
    if (isServer) serverPagination.onPageChange(p);
    else setPage(p);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const hasActions = showActions && (onEdit || onDelete || onView);
  const totalCols = columns.length + (hasActions ? 1 : 0) + (selectable ? 1 : 0);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (activeTotalPages <= 7) {
      for (let i = 1; i <= activeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (activeCurrentPage > 3) pages.push('ellipsis');
      for (
        let i = Math.max(2, activeCurrentPage - 1);
        i <= Math.min(activeTotalPages - 1, activeCurrentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (activeCurrentPage < activeTotalPages - 2) pages.push('ellipsis');
      pages.push(activeTotalPages);
    }
    return pages;
  };

  const recordCount = isServer ? serverPagination.total : filteredData.length;
  const paginationInfo = isServer
    ? serverPagination.total === 0
      ? 'No results'
      : `Showing ${(serverPagination.page - 1) * serverPagination.pageSize + 1}–${Math.min(serverPagination.page * serverPagination.pageSize, serverPagination.total)} of ${serverPagination.total}`
    : filteredData.length === 0
      ? 'No results'
      : `Showing ${start + 1}–${Math.min(start + pageSize, filteredData.length)} of ${filteredData.length}`;

  return (
    <div className="admin-table-wrapper">
      {(searchable || toolbarLeft || toolbarRight) && (
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar-left">
            {searchable && (
              <div className="admin-table-search">
                <Search size={14} className="admin-table-search-icon" />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            )}
            {toolbarLeft}
            <span className="admin-table-count">
              {recordCount} record{recordCount !== 1 ? 's' : ''}
            </span>
          </div>
          {toolbarRight && (
            <div className="admin-table-toolbar-right">{toolbarRight}</div>
          )}
        </div>
      )}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {selectable && (
                <th className="admin-table-checkbox-col">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="admin-table-check"
                    checked={allSelected}
                    onChange={toggleAll}
                    title="Select all on this page"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
              {hasActions && <th style={{ width: '140px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {selectable && <td className="admin-table-checkbox-col" />}
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div style={{
                        height: 14, borderRadius: 6,
                        background: 'linear-gradient(90deg, #f0f0e8 25%, #e8e8e0 50%, #f0f0e8 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'admin-filter-shimmer 1.2s linear infinite',
                        opacity: 1 - i * 0.15,
                        width: `${70 + (i % 3) * 10}%`,
                      }} />
                    </td>
                  ))}
                  {hasActions && <td><div style={{ height: 14, borderRadius: 6, background: '#f0f0e8', width: 80 }} /></td>}
                </tr>
              ))
            ) : visibleData.length === 0 ? (
              <tr>
                <td colSpan={totalCols}>
                  <div className="admin-table-empty">
                    <Inbox size={32} className="admin-table-empty-icon" />
                    <span>Not Found</span>
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((row, i) => {
                const key = String(row[rowKey] ?? i);
                const isSelected = selectedKeys.includes(key);
                return (
                  <tr key={i} className={isSelected ? 'admin-table-row-selected' : undefined}>
                    {selectable && (
                      <td className="admin-table-checkbox-col">
                        <input
                          type="checkbox"
                          className="admin-table-check"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? (
                          col.render(row[col.key], row)
                        ) : col.type === "image" ? (
                          row[col.key] ? (
                            <img
                              src={String(row[col.key])}
                              alt=""
                              style={{ width: 50, height: 50, padding: "5px", borderRadius: "50%", objectFit: "cover", border: "0.3px solid #eee" }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  PLACEHOLDER_IMG;
                              }}
                            />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#f5f5f5", border: "0.3px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#aaa" }}>
                              N/A
                            </div>
                          )
                        ) : (
                          String(row[col.key] ?? "")
                        )}
                      </td>
                    ))}
                    {hasActions && (
                      <td>
                        <div className="admin-table-actions">
                          {onView && (
                            <button className="admin-table-action-btn admin-table-action-view" onClick={() => onView(row)}>View</button>
                          )}
                          {onEdit && (
                            <button className="admin-table-action-btn admin-table-action-edit" onClick={() => onEdit(row)}>Edit</button>
                          )}
                          {onDelete && (
                            <button className="admin-table-action-btn admin-table-action-delete" onClick={() => onDelete(row)}>Delete</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span className="admin-pagination-info">{paginationInfo}</span>
        <div className="admin-pagination-controls">
          <button
            className="admin-pagination-btn"
            onClick={() => handlePageChange(Math.max(1, activeCurrentPage - 1))}
            disabled={activeCurrentPage === 1}
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers().map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`e-${idx}`} className="admin-pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`admin-pagination-btn${p === activeCurrentPage ? ' admin-pagination-btn-active' : ''}`}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="admin-pagination-btn"
            onClick={() => handlePageChange(Math.min(activeTotalPages, activeCurrentPage + 1))}
            disabled={activeCurrentPage === activeTotalPages}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

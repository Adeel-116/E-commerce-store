'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Download, Search } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import api from '@/lib/axios';
import Papa from 'papaparse';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PAGE_LIMIT = 10;

type ApiSubscriber = {
  _id: string;
  email: string;
  createdAt: string;
};

type SubscriberRow = {
  _id: string;
  email: string;
  date: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const mapSubscriber = (s: ApiSubscriber): SubscriberRow => ({
  _id: s._id,
  email: s.email,
  date: fmtDate(s.createdAt),
});

const columns: AdminColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'date', label: 'Subscribed On', width: '160px' },
];

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteSubscriber, setDeleteSubscriber] = useState<SubscriberRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const searchRef = useRef('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const downloadCSV = useCallback(async () => {
    setExportLoading(true);
    try {
      const { data } = await api.get(`${BASE_URL}/admin/subscribers`, {
        params: { search: searchRef.current.trim() || undefined },
      });
      const list: ApiSubscriber[] = data.data ?? [];

      const csvData = list.map((s) => ({
        Email: s.email,
        'Subscribed On': fmtDate(s.createdAt),
      }));

      const csv = Papa.unparse(csvData, { quotes: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export subscribers', err);
    } finally {
      setExportLoading(false);
    }
  }, []);

  const fetchSubscribers = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE_URL}/admin/subscribers`, {
        params: { page: p, limit: PAGE_LIMIT, search: search.trim() || undefined },
      });
      const list: ApiSubscriber[] = data.data ?? [];
      setSubscribers(list.map(mapSubscriber));
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to fetch subscribers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(page, searchRef.current); }, [page, fetchSubscribers]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    searchRef.current = val;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchSubscribers(1, val);
    }, 400);
  };

  const openDelete = (row: Record<string, unknown>) => setDeleteSubscriber(row as unknown as SubscriberRow);

  const confirmDelete = async () => {
    if (!deleteSubscriber) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`${BASE_URL}/admin/subscribers/delete`, { params: { id: deleteSubscriber._id } });
      setDeleteSubscriber(null);
      fetchSubscribers(page, searchRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete subscriber';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Subscribers</h2>
          <p className="admin-page-subtitle">{total} total subscribers</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={downloadCSV} disabled={exportLoading}>
          <Download size={15} /> {exportLoading ? 'Exporting…' : 'Download CSV'}
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={subscribers as unknown as Record<string, unknown>[]}
        rowKey="_id"
        onDelete={openDelete}
        searchable={false}
        loading={loading}
        toolbarLeft={
          <div className="admin-table-search">
            <Search size={14} className="admin-table-search-icon" />
            <input
              placeholder="Search by email…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        }
        serverPagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
      />

      <AdminModal
        isOpen={!!deleteSubscriber}
        onClose={() => { setDeleteSubscriber(null); setDeleteError(null); }}
        title="Delete Subscriber"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteSubscriber(null)} disabled={deleting}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete &quot;{deleteSubscriber?.email}&quot;?</div>
          <p className="admin-modal-confirm-text">This will permanently remove this subscriber. This action cannot be undone.</p>
          {deleteError && <p className="admin-modal-confirm-text" style={{ color: '#ef4444', marginTop: '0.5rem', fontWeight: 500 }}>{deleteError}</p>}
        </div>
      </AdminModal>
    </>
  );
}

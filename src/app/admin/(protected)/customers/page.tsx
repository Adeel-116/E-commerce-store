'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import api from '@/lib/axios';
import Papa from 'papaparse';

const PAGE_LIMIT = 10;

type ApiCustomer = {
  email: string;
  totalOrders: number;
  totalItems: number;
  totalSpent: number;
  lastOrderDate: string;
};

type CustomerRow = {
  email: string;
  totalOrders: number;
  totalItems: number;
  totalSpent: string;
  lastOrderDate: string;
};

const fmt = (n: number) => `PKR ${n.toFixed(2)}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const mapCustomer = (c: ApiCustomer): CustomerRow => ({
  email: c.email,
  totalOrders: c.totalOrders,
  totalItems: c.totalItems,
  totalSpent: fmt(c.totalSpent),
  lastOrderDate: fmtDate(c.lastOrderDate),
});

const columns: AdminColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'totalOrders', label: 'Orders', width: '90px' },
  { key: 'totalItems', label: 'Total Items', width: '110px' },
  { key: 'totalSpent', label: 'Life Time Spent', width: '130px' },
  { key: 'lastOrderDate', label: 'Last Order', width: '140px' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  const [exportLoading, setExportLoading] = useState(false);

  const searchRef = useRef('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const downloadCSV = useCallback(async () => {
    setExportLoading(true);
    try {
      const { data } = await api.get('/admin/get-orders-email', {
        params: { search: searchRef.current.trim() || undefined },
      });
      const list: ApiCustomer[] = data.data?.data ?? [];

      const csvData = list.map((c) => ({
        Email: c.email,
        Orders: c.totalOrders,
        'Total Items': c.totalItems,
        'Life Time Spent': Number(c.totalSpent.toFixed(2)),
        'Last Order': fmtDate(c.lastOrderDate),
      }));

      const csv = Papa.unparse(csvData, { quotes: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export customers', err);
    } finally {
      setExportLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/get-orders-email', {
        params: { page: p, limit: PAGE_LIMIT, search: search.trim() || undefined },
      });
      const list: ApiCustomer[] = data.data?.data ?? [];
      setCustomers(list.map(mapCustomer));
      setTotal(data.data?.pagination?.total ?? 0);
      setTotalPages(data.data?.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(page, searchRef.current); }, [page, fetchCustomers]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    searchRef.current = val;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, val);
    }, 400);
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Customers</h2>
          <p className="admin-page-subtitle">{total} total customers</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={downloadCSV} disabled={exportLoading}>
          <Download size={15} /> {exportLoading ? 'Exporting…' : 'Download CSV'}
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={customers as unknown as Record<string, unknown>[]}
        rowKey="email"
        searchable={false}
        showActions={false}
        loading={loading}
        toolbarRight={
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
    </>
  );
}

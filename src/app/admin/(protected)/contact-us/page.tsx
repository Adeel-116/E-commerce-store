'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Mail } from 'lucide-react';
import AdminTable, { AdminColumn } from '@/components/AdminTable';
import AdminModal from '@/components/AdminModal';
import api from '@/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PAGE_LIMIT = 10;

type ApiContact = {
  _id: string;
  fullName: string;
  email: string;
  contact: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

type ContactRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  messagePreview: string;
  date: string;
  _raw: ApiContact;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const mapContact = (c: ApiContact): ContactRow => ({
  _id: c._id,
  name: c.fullName,
  email: c.email,
  phone: c.contact || '—',
  message: c.message,
  messagePreview: c.message.length > 60 ? `${c.message.slice(0, 60)}…` : c.message,
  date: fmtDate(c.createdAt),
  _raw: c,
});

const columns: AdminColumn[] = [
  { key: 'name', label: 'Name', width: '160px' },
  { key: 'email', label: 'Email', width: '220px' },
  { key: 'phone', label: 'Phone', width: '140px' },
  { key: 'messagePreview', label: 'Message' },
  { key: 'date', label: 'Created', width: '120px' },
];

export default function ContactUsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [viewContact, setViewContact] = useState<ContactRow | null>(null);
  const [deleteContact, setDeleteContact] = useState<ContactRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContacts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE_URL}/contact-us/all`, {
        params: { page: p, limit: PAGE_LIMIT },
      });
      const list: ApiContact[] = data.data ?? [];
      setContacts(list.map(mapContact));
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to fetch contact submissions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(page); }, [page, fetchContacts]);

  const openView = (row: Record<string, unknown>) => setViewContact(row as unknown as ContactRow);
  const openDelete = (row: Record<string, unknown>) => setDeleteContact(row as unknown as ContactRow);

  const confirmDelete = async () => {
    if (!deleteContact) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`${BASE_URL}/contact-us/delete`, { params: { id: deleteContact._id } });
      setDeleteContact(null);
      fetchContacts(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete message';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2 className="admin-page-title">Contact Us</h2>
          <p className="admin-page-subtitle">{total} total submissions</p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={contacts as unknown as Record<string, unknown>[]}
        rowKey="_id"
        onView={openView}
        onDelete={openDelete}
        searchKeys={['name', 'email', 'phone', 'message']}
        loading={loading}
        serverPagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
      />

      <AdminModal
        isOpen={!!viewContact}
        onClose={() => setViewContact(null)}
        title={viewContact?.name ?? ''}
        subtitle={`Submitted on ${viewContact?.date ?? ''}`}
        size="md"
      >
        {viewContact && (
          <div className="admin-modal-detail-grid">
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Email</span>
              <span className="admin-modal-detail-value">
                <a href={`mailto:${viewContact.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} /> {viewContact.email}
                </a>
              </span>
            </div>
            <div className="admin-modal-detail-item">
              <span className="admin-modal-detail-label">Phone</span>
              <span className="admin-modal-detail-value">{viewContact.phone}</span>
            </div>
            <hr className="admin-modal-detail-divider" style={{ gridColumn: '1 / -1' }} />
            <div className="admin-modal-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="admin-modal-detail-label">Message</span>
              <span className="admin-modal-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{viewContact.message}</span>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        isOpen={!!deleteContact}
        onClose={() => { setDeleteContact(null); setDeleteError(null); }}
        title="Delete Message"
        size="sm"
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteContact(null)} disabled={deleting}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <div className="admin-modal-confirm-body">
          <div className="admin-modal-confirm-icon"><Trash2 size={22} /></div>
          <div className="admin-modal-confirm-title">Delete message from {deleteContact?.name}?</div>
          <p className="admin-modal-confirm-text">This will permanently remove this contact submission. This action cannot be undone.</p>
          {deleteError && <p className="admin-modal-confirm-text" style={{ color: '#ef4444', marginTop: '0.5rem', fontWeight: 500 }}>{deleteError}</p>}
        </div>
      </AdminModal>
    </>
  );
}

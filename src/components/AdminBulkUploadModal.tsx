'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, Download, CheckCircle } from 'lucide-react';
import AdminModal from './AdminModal';
import '@/styles/admin-products.css';
import '@/styles/admin-table.css';
import Papa from 'papaparse';
import { useToast } from './AdminToast';
import api from '@/lib/axios';

const TEMPLATE_COLUMNS = ['title', 'description', 'price', 'comparePrice', 'category', 'sizes', 'images', 'isNew', 'stock', 'status'] as const;

type CsvColumn = (typeof TEMPLATE_COLUMNS)[number];
type ParsedRow = Record<CsvColumn, string> & { _row: number };

interface UploadStats {
  inserted: number;
  failed: number;
  total: number;
  duration: string;
}

const COL_WIDTH: Record<CsvColumn, number> = {
  title: 200, description: 260, price: 100, comparePrice: 120, category: 150, sizes: 120, images: 260, isNew: 90, stock: 100, status: 100,
};

const SAMPLE_ROW: Record<CsvColumn, string> = {
  title: 'Embroidered Maxi Dress',
  description: 'A flowing maxi dress with embroidered detailing ....',
  price: '250',
  comparePrice: '320',
  category: 'maxi,fashion',
  sizes: 'S,M,L',
  images: 'https://res.cloudinary.com/example/1.jpg,https://res.cloudinary.com/example/2.jpg',
  isNew: 'true',
  stock: 'true',
  status: 'active',
};

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadTemplate() {
  const headers = TEMPLATE_COLUMNS.join(',');
  const sample = TEMPLATE_COLUMNS.map((col) => csvEscape(SAMPLE_ROW[col])).join(',');
  const csv = [headers, sample].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data.map((row, i) => ({
    _row: i + 2,
    title: row.title ?? '',
    description: row.description ?? '',
    price: row.price ?? '',
    comparePrice: row.comparePrice ?? '',
    category: row.category ?? '',
    sizes: row.sizes ?? '',
    images: row.images ?? '',
    isNew: row.isNew ?? '',
    stock: row.stock ?? '',
    status: row.status ?? '',
  }));
}

function renderCell(col: CsvColumn, value: string) {

  const isInStock = String(value).toLowerCase() === "true";

  if (!value) return <span style={{ color: '#ccc' }}>—</span>;
  if (col === 'stock') {
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: isInStock
            ? "rgba(135,158,110,0.12)"
            : "rgba(220,50,50,0.08)",
          color: isInStock ? "var(--brandgreen)" : "#c0392b",
        }}
      >
        {isInStock ? "In Stock" : "Out of Stock"}
      </span>
    );
  }
  if (col === 'status') {
    return (
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: value === 'active' ? 'rgba(135,158,110,0.12)' : 'rgba(80,80,80,0.08)', color: value === 'active' ? 'var(--brandgreen)' : '#888' }}>
        {value}
      </span>
    );
  }
  return <span style={{ fontSize: 12 }}>{value}</span>;
}

function CsvTable({ rows }: { rows: ParsedRow[] }) {
  return (
    <div style={{ border: '1px solid #e8e8e0', borderRadius: 10, overflowX: 'auto', maxHeight: 280 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#fafaf6', borderBottom: '1px solid #e8e8e0' }}>
            {TEMPLATE_COLUMNS.map((col) => (
              <th key={col} style={{ width: COL_WIDTH[col], padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#aaa', position: 'sticky', top: 0, background: '#fafaf6' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #f0f0e8' }}>
              {TEMPLATE_COLUMNS.map((col) => (
                <td key={col} style={{ width: COL_WIDTH[col], padding: '8px 12px', overflow: 'hidden' }}>
                  {renderCell(col, row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) onFile(file);
  }, [onFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className={`admin-upload-area ${dragging ? 'admin-upload-area-drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="admin-upload-empty" style={{ padding: '40px 24px' }}>
          <Upload size={22} />
          <span>Drop your CSV file here</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>or browse to upload</span>
        </div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>
      <CsvTable rows={[{ ...SAMPLE_ROW, _row: 2 }]} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: '12px 16px', border: '1px solid #e8e8e0' }}>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function AdminBulkUploadModal({ isOpen, onClose, onImport }: { isOpen: boolean; onClose: () => void; onImport: () => void }) {
  const { error: toastError } = useToast();

  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isUploading) {
      setUploadProgress(5);
      progressTimerRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 88) return prev;
          return Math.min(prev + Math.random() * 5 + 1, 88);
        });
      }, 350);
    } else {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
    }
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, [isUploading]);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toastError('Invalid file', 'Only CSV files are allowed'); return; }
    setSelectedFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const text = e.target?.result as string; setParsedRows(parseCSV(text)); };
    reader.readAsText(file);
  };

  const handleReset = () => { setParsedRows(null); setFileName(''); setSelectedFile(null); setUploadStats(null); setUploadProgress(0); };
  const handleClose = () => { if (isUploading) return; handleReset(); onClose(); };
  const handleDone = () => { handleReset(); onClose(); };

  const handleImport = async () => {
    if (!selectedFile || !parsedRows) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsUploading(true);
    setUploadStats(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      const res = await api.post(`${baseUrl}/admin/bulk-upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadProgress(100);
      setUploadStats(res.data?.stats ?? { inserted: parsedRows.length, failed: 0, total: parsedRows.length, duration: '' });
      onImport();
    } catch (err) {
      console.error(err);
      toastError('Upload failed', 'Something went wrong. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const isPreviewing = parsedRows !== null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Upload Products"
      subtitle={isUploading ? 'Import in progress…' : uploadStats ? 'Import finished' : isPreviewing ? `Preview — ${parsedRows.length} rows` : 'Upload a CSV file to import products'}
      size="lg"
      footer={
        isUploading || uploadStats ? null : (
          <>
            <button className="admin-btn admin-btn-ghost" onClick={downloadTemplate}><Download size={13} /> Template</button>
            <div style={{ flex: 1 }} />
            <button className="admin-btn admin-btn-ghost" onClick={handleClose}>Cancel</button>
            {isPreviewing && (
              <button className="admin-btn admin-btn-primary" onClick={handleImport} disabled={parsedRows.length === 0}>
                <Upload size={13} /> Import {parsedRows.length}
              </button>
            )}
          </>
        )
      }
    >
      {isUploading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px', gap: 20 }}>
          <div className="upload-icon-pulse" style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(135,158,110,0.1)', border: '2px solid rgba(135,158,110,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={26} color="var(--brandgreen)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Processing your CSV</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>Importing {parsedRows?.length ?? 0} records — please keep this window open</p>
          </div>
          <div style={{ width: '100%' }}>
            <div className="upload-progress-bar-track">
              <div className="upload-progress-bar-fill upload-progress-bar-shimmer" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Uploading…</span>
              <span style={{ fontSize: 11, color: 'var(--brandgreen)', fontWeight: 600 }}>{Math.round(uploadProgress)}%</span>
            </div>
          </div>
        </div>
      )}

      {!isUploading && uploadStats && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(135,158,110,0.1)', border: '2px solid var(--brandgreen)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} color="var(--brandgreen)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Import Complete!</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>Your products are now live in the store</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%' }}>
            <StatCard label="Inserted" value={uploadStats.inserted} color="var(--brandgreen)" />
            <StatCard label="Failed" value={uploadStats.failed} color={uploadStats.failed > 0 ? '#c62828' : '#aaa'} />
            <StatCard label="Total rows" value={uploadStats.total} color="#555" />
            <StatCard label="Duration" value={uploadStats.duration || '—'} color="#555" />
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleDone} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
        </div>
      )}

      {!isUploading && !uploadStats && (
        isPreviewing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600 }}>{fileName}</p>
                <p style={{ fontSize: 12, color: '#aaa' }}>{parsedRows.length} rows found</p>
              </div>
              <button onClick={handleReset} className="admin-btn admin-btn-ghost admin-btn-sm"><X size={13} /> Remove</button>
            </div>
            {parsedRows.length === 0 ? (
              <div style={{ background: '#fff8e1', padding: 12, borderRadius: 8 }}><AlertCircle size={15} /> No valid rows found.</div>
            ) : (
              <CsvTable rows={parsedRows} />
            )}
          </div>
        ) : (
          <DropZone onFile={handleFile} />
        )
      )}
    </AdminModal>
  );
}

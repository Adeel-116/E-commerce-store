'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  Coins, ShoppingCart, Package, Users,
  UserPlus, TrendingUp, Shirt,
  ArrowRight, RefreshCw, Loader2, AlertCircle, Calendar,
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import DateRangeCalendar from '@/components/DateRangeCalendar';
import '@/styles/admin-dashboard.css';

type Period = '7d' | '30d' | '90d';

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface DashboardData {
  success?: boolean;
  period?: string;

  // Financial Stats
  revenue: number;
  grossProfit: number;
  netProfit: number;
  totalOrders: number;
  totalPaidOrderAmount: number;

  orders?: {
    total?: number;
    byStatus?: Record<string, number>;
  };
  users?: {
    total?: number;
    new?: number;
  };
  totalProducts?: number;
  itemsSoldBySize?: Record<string, number>;
  topProducts?: Array<{
    _id: string;
    title?: string;
    totalSold?: number;
    revenue?: number;
  }>;
  recentOrders?: Array<{
    _id: string;
    orderId?: string;
    pricing?: { total?: number };
    status?: string;
    createdAt?: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  processing: '#1565c0',
  preparation: '#f57f17',
  shipped: '#00838f',
  delivered: '#c9a961',
  cancelled: '#c62828',
  returned: '#6a1b9a',
};

const SIZE_COLORS: string[] = ['#1565c0', '#c9a961', '#f57f17', '#6a1b9a', '#00838f', '#c62828'];

const STATUS_BADGE: Record<string, string> = {
  processing: 'admin-badge-info',
  preparation: 'admin-badge-warning',
  shipped: 'admin-badge-teal',
  delivered: 'admin-badge-success',
  cancelled: 'admin-badge-danger',
  returned: 'admin-badge-purple',
};

function fmtPKR(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number }>;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon-wrap ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div className="admin-stat-info">
        <div className="admin-stat-label">{label}</div>
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-change admin-stat-change-neutral">{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = customRange
        ? `startDate=${customRange.from}&endDate=${customRange.to}`
        : `period=${period}`;
      const { data: res } = await api.get<DashboardData>(`/admin/dashboard/stats?${query}`);
      setData(res);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [period, customRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const selectPeriod = (p: Period) => {
    setCustomRange(null);
    setShowCalendar(false);
    setRangeAnchor(null);
    setPeriod(p);
  };

  const applyCustomRange = () => {
    if (!draftFrom || !draftTo) return;
    if (draftFrom > draftTo) return;
    setCustomRange({ from: draftFrom, to: draftTo });
    setShowCalendar(false);
  };

  // First click selects a single day (from === to, already a valid range).
  // Second click extends it into a range; the click after that starts over.
  const handleSelectDay = (iso: string) => {
    if (!rangeAnchor) {
      setRangeAnchor(iso);
      setDraftFrom(iso);
      setDraftTo(iso);
    } else {
      if (iso < rangeAnchor) {
        setDraftFrom(iso);
        setDraftTo(rangeAnchor);
      } else {
        setDraftFrom(rangeAnchor);
        setDraftTo(iso);
      }
      setRangeAnchor(null);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 size={28} className="dash-spin" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <AlertCircle size={28} />
        <span>{error}</span>
        <button className="dash-error-retry" onClick={fetchStats}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const revenue = data.revenue ?? 0;
  const ordersTotal = data.orders?.total ?? 0;
  const ordersByStatus = data.orders?.byStatus ?? {};
  const usersTotal = data.users?.total ?? 0;
  const usersNew = data.users?.new ?? 0;
  const totalProducts = data.totalProducts ?? 0;
  const topProducts = data.topProducts ?? [];
  const recentOrders = data.recentOrders ?? [];
  const itemsSoldBySize = data.itemsSoldBySize ?? {};
  const itemsSoldBySizeEntries = Object.entries(itemsSoldBySize);
  const totalItemsSold = itemsSoldBySizeEntries.reduce((sum, [, val]) => sum + val, 0);

  const itemsSoldBySizeChartData = itemsSoldBySizeEntries.map(([size, count], i) => ({
    name: size,
    count,
    fill: SIZE_COLORS[i % SIZE_COLORS.length],
  }));

  const avgOrderValue = ordersTotal > 0
    ? Math.round(revenue / ordersTotal)
    : 0;

  const orderStatusEntries = Object.entries(ordersByStatus);

  const orderStatusChartData = orderStatusEntries.map(([key, val]) => ({
    name: key.replace('_', ' '),
    count: val,
    fill: STATUS_COLORS[key] ?? '#ccc',
  }));

  const periodLabel = customRange
    ? `${fmtShortDate(customRange.from)} – ${fmtShortDate(customRange.to)}`
    : period === '7d' ? 'last 7 days' : period === '30d' ? 'last 30 days' : 'last 90 days';

  return (
    <>
      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-subtitle">Overview for {periodLabel}</div>
        </div>
        <div className="dash-period-btns">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              className={`dash-period-btn${!customRange && period === p ? ' active' : ''}`}
              onClick={() => selectPeriod(p)}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}

          <div className="dash-calendar-wrap" ref={calendarRef}>
            <button
              className={`dash-period-btn dash-calendar-btn${customRange ? ' active' : ''}`}
              onClick={() => {
                setDraftFrom(customRange?.from ?? '');
                setDraftTo(customRange?.to ?? '');
                setRangeAnchor(null);
                setShowCalendar((v) => !v);
              }}
            >
              <Calendar size={13} />
              {customRange ? `${fmtShortDate(customRange.from)} – ${fmtShortDate(customRange.to)}` : 'Custom'}
            </button>

            {showCalendar && (
              <div className="dash-calendar-popover">
                <div className="dash-calendar-summary">
                  <span>{draftFrom ? fmtShortDate(draftFrom) : 'Start date'}</span>
                  <ArrowRight size={12} />
                  <span>{draftTo ? fmtShortDate(draftTo) : 'End date'}</span>
                </div>

                <DateRangeCalendar from={draftFrom} to={draftTo} onSelectDay={handleSelectDay} />

                <div className="dash-calendar-actions">
                  <button
                    className="dash-calendar-cancel"
                    onClick={() => {
                      setRangeAnchor(null);
                      setShowCalendar(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="dash-calendar-apply"
                    disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                    onClick={applyCustomRange}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="dash-refresh-btn" onClick={fetchStats} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stat Cards — Row 1 */}

      <div className="admin-stats-grid">
        <StatCard
          icon={Coins}
          iconClass="admin-stat-icon-blue"
          label="Revenue"
          value={fmtPKR(data.revenue)}
          sub="This period"
        />

        <StatCard
          icon={TrendingUp}
          iconClass="admin-stat-icon-green"
          label="Gross Profit"
          value={fmtPKR(data.grossProfit)}
          sub="Before operating expenses"
        />

        <StatCard
          icon={TrendingUp}
          iconClass="admin-stat-icon-purple"
          label="Net Profit"
          value={fmtPKR(data.netProfit)}
          sub="After all expenses"
        />

        <StatCard
          icon={Coins}
          iconClass="admin-stat-icon-blue"
          label="Paid Order Amount"
          value={fmtPKR(data.totalPaidOrderAmount)}
          sub="Total value of paid orders"
        />

      </div>

      {/* Stat Cards — Row 2 */}
      <div className="admin-stats-grid">

        <StatCard
          icon={ShoppingCart}
          iconClass="admin-stat-icon-amber"
          label="Total Orders"
          value={String(data.totalOrders)}
          sub="Orders"
        />

        <StatCard
          icon={Package}
          iconClass="admin-stat-icon-amber"
          label="Total Products"
          value={String(totalProducts)}
          sub="In catalog"
        />
        <StatCard
          icon={Users}
          iconClass="admin-stat-icon-purple"
          label="Total Users"
          value={String(usersTotal)}
          sub="All time"
        />

        <StatCard
          icon={Shirt}
          iconClass="admin-stat-icon-blue"
          label="Items Sold"
          value={String(totalItemsSold)}
          sub={itemsSoldBySizeEntries.map(([size, count]) => `${size}: ${count}`).join(' · ') || 'This period'}
        />
      </div>

      {/* Order Status */}
      <div className="dash-charts-row dash-charts-row-main">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Order Status</span>
          </div>
          <div className="dash-order-status-list">
            {orderStatusEntries.map(([key, val]) => (
              <div key={key} className="dash-order-status-item">
                <div className="dash-order-status-label">
                  <span
                    className="dash-status-dot"
                    style={{ background: STATUS_COLORS[key] ?? '#ccc' }}
                  />
                  <span>{key.replace('_', ' ')}</span>
                </div>
                <span className="dash-order-status-count">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Orders by Status</span>
          </div>
          <div className="dash-chart-pad">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderStatusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0e8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#aaa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#aaa' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                  {orderStatusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Items Sold by Size */}
      <div className="dash-charts-row dash-charts-row-main">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Items Sold by Size</span>
          </div>
          <div className="dash-order-status-list">
            {itemsSoldBySizeEntries.length === 0 && (
              <div className="dash-empty-state">No data available</div>
            )}
            {itemsSoldBySizeEntries.map(([size, count], i) => (
              <div key={size} className="dash-order-status-item">
                <div className="dash-order-status-label">
                  <span
                    className="dash-status-dot"
                    style={{ background: SIZE_COLORS[i % SIZE_COLORS.length] }}
                  />
                  <span>{size}</span>
                </div>
                <span className="dash-order-status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Items Sold by Size</span>
          </div>
          <div className="dash-chart-pad">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={itemsSoldBySizeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0e8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#aaa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#aaa' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Items" radius={[4, 4, 0, 0]}>
                  {itemsSoldBySizeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="dash-charts-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Top Selling Products</span>
            <Link href="/admin/products" className="dash-view-link">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {topProducts.length === 0 && (
            <div className="dash-empty-state">No data available</div>
          )}
          {topProducts.map((p, i) => (
            <div key={p._id} className="dash-top-product-item">
              <div
                className={`admin-top-item-rank ${i === 0
                  ? 'admin-top-item-rank-gold'
                  : i === 1
                    ? 'admin-top-item-rank-silver'
                    : i === 2
                      ? 'admin-top-item-rank-bronze'
                      : ''
                  }`}
              >
                {i + 1}
              </div>
              <div className="admin-top-item-info">
                <div className="admin-top-item-name">{p.title ?? 'Untitled'}</div>
                <div className="admin-top-item-units">{p.totalSold ?? 0} units sold</div>
              </div>
              <span className="admin-top-item-revenue">{fmtPKR(p.revenue ?? 0)}</span>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Recent Orders</span>
            <Link href="/admin/orders" className="dash-view-link">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="admin-recent-list">
            {recentOrders.length === 0 && (
              <div className="dash-empty-state">No data available</div>
            )}
            {recentOrders.map((order) => (
              <div key={order._id} className="admin-recent-item">
                <span className="admin-recent-item-id">{order.orderId ?? '—'}</span>
                <div className="admin-recent-item-info">
                  <div className="admin-recent-item-sub">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '—'}
                  </div>
                </div>
                <span className="admin-recent-item-amount">
                  {fmtPKR(order.pricing?.total ?? 0)}
                </span>
                <span
                  className={`admin-badge ${(order.status && STATUS_BADGE[order.status]) ?? 'admin-badge-neutral'
                    }`}
                >
                  {order.status ?? 'unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Status Pie */}
      <div className="dash-charts-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Order Distribution</span>
          </div>
          <div className="dash-chart-pad">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {orderStatusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

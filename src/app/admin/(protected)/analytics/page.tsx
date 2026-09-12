"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Eye, ShoppingCart, Users, Loader2, AlertCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/axios";
import "@/styles/admin-dashboard.css";

type NamedStat = { name: string; sessions: number };
type Report = {
  visitors: number; sessions: number; pageViews: number; checkoutStarted: number;
  orders: number; abandoned: number; checkoutRate: number; conversionRate: number;
  pages: { page: string; views: number; visitors: number }[];
  sources: NamedStat[]; devices: NamedStat[]; countries: NamedStat[];
  daily: { date: string; visitors: number; sessions: number; checkouts: number }[];
};

const COLORS = ["#c9a961", "#1565c0", "#6a1b9a", "#00838f", "#e65100", "#c62828"];

function Metric({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string | number; sub: string }) {
  return <div className="admin-stat-card"><div className="admin-stat-icon-wrap admin-stat-icon-blue"><Icon size={20} /></div><div className="admin-stat-info"><div className="admin-stat-label">{label}<div className="admin-stat-change admin-stat-change-neutral">{sub}</div></div><div className="admin-stat-value">{value}</div></div></div>;
}

function Ranking({ title, rows }: { title: string; rows: NamedStat[] }) {
  return <div className="admin-card"><div className="admin-card-header"><span className="admin-card-title">{title}</span></div><div className="dash-order-status-list">{rows.length === 0 && <div className="dash-empty-state">No data yet</div>}{rows.map((row, index) => <div className="dash-order-status-item" key={row.name}><div className="dash-order-status-label"><span className="dash-status-dot" style={{ background: COLORS[index % COLORS.length] }} /><span>{row.name || "Unknown"}</span></div><span className="dash-order-status-count">{row.sessions}</span></div>)}</div></div>;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await api.get<Report>("/admin/visitor-analytics", { params: { days, _t: Date.now() } }); setData(response.data); }
    catch { setError("Unable to load visitor analytics."); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  if (loading) return <div className="dash-loading"><Loader2 size={28} className="dash-spin" /><span>Loading analytics…</span></div>;
  if (error || !data) return <div className="dash-error"><AlertCircle size={28} /><span>{error}</span><button className="dash-error-retry" onClick={load}>Try again</button></div>;

  return <>
    <div className="dash-header"><div><h2 className="dash-title">Visitor Analytics</h2><p className="dash-subtitle">First-party traffic, page and checkout reporting. Localhost is excluded.</p></div><div className="dash-period-btns">{[7, 30, 90].map((value) => <button key={value} className={`dash-period-btn${days === value ? " active" : ""}`} onClick={() => setDays(value)}>{value} days</button>)}</div></div>

    <div className="admin-stats-grid">
      <Metric icon={Users} label="Unique Visitors" value={data.visitors} sub={`${data.sessions} sessions`} />
      <Metric icon={Eye} label="Page Views" value={data.pageViews} sub={`${data.sessions ? (data.pageViews / data.sessions).toFixed(1) : "0"} per session`} />
      <Metric icon={ShoppingCart} label="Checkout Started" value={data.checkoutStarted} sub={`${data.checkoutRate}% of sessions`} />
      <Metric icon={BarChart3} label="Orders" value={data.orders} sub={`${data.conversionRate}% conversion`} />
    </div>

    <div className="dash-charts-row dash-charts-row-main">
      <div className="admin-card"><div className="admin-card-header"><span className="admin-card-title">Traffic & Checkout Trend</span></div><div className="dash-chart-pad"><ResponsiveContainer width="100%" height={260}><LineChart data={data.daily}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0e8" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="visitors" stroke="#1565c0" strokeWidth={2} /><Line type="monotone" dataKey="checkouts" stroke="#c9a961" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
      <div className="admin-card"><div className="admin-card-header"><span className="admin-card-title">Devices</span></div><div className="dash-chart-pad"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data.devices} dataKey="sessions" nameKey="name" innerRadius={55} outerRadius={90}>{data.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
    </div>

    <div className="dash-charts-row"><Ranking title="Traffic Sources" rows={data.sources} /><Ranking title="Visitor Countries" rows={data.countries} /></div>

    <div className="admin-card" style={{ marginBottom: 16 }}><div className="admin-card-header"><span className="admin-card-title">Most Visited Pages</span></div><div style={{ overflowX: "auto" }}><table className="marketing-table"><thead><tr><th>Page</th><th>Views</th><th>Unique Visitors</th></tr></thead><tbody>{data.pages.length === 0 ? <tr><td colSpan={3} className="dash-empty-state">No page data yet</td></tr> : data.pages.map((row) => <tr key={row.page}><td>{row.page}</td><td>{row.views}</td><td>{row.visitors}</td></tr>)}</tbody></table></div></div>

    <div className="admin-quick-stats"><div className="admin-quick-stat"><ShoppingCart className="admin-quick-stat-icon" size={20} /><div><div className="admin-quick-stat-label">Open / Abandoned Records</div><div className="admin-quick-stat-value">{data.abandoned}</div></div></div><div className="admin-quick-stat"><BarChart3 className="admin-quick-stat-icon" size={20} /><div><div className="admin-quick-stat-label">Checkout to Order</div><div className="admin-quick-stat-value">{data.checkoutStarted ? `${((data.orders / data.checkoutStarted) * 100).toFixed(1)}%` : "0%"}</div></div></div></div>
  </>;
}

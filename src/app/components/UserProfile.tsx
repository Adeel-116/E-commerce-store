"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import "../styles/UserProfile.css";

interface OrderItem {
  productId: string;
  title: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  orderId: string;
  status: string;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
    paidAt: string;
  };
  createdAt: string;
}

interface Address {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY_ADDR = {
  firstName: "", lastName: "", line1: "", line2: "",
  city: "", state: "", postalCode: "", country: "",
  phone: "",
};

type Section = "orders" | "profile" | "address";

const navItems: { key: Section; label: string }[] = [
  { key: "orders", label: "MY ORDERS" },
  { key: "profile", label: "PROFILE" },
  { key: "address", label: "ADDRESS" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const UserProfile = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<Section>("orders");
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Orders ──────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Profile form ────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Password form ────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Address (the account only ever holds a single one) ─
  const [address, setAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDR);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userId: string = user?._id || "";

  useEffect(() => {
    if (!profileMsg) return;
    const t = setTimeout(() => setProfileMsg(null), 5000);
    return () => clearTimeout(t);
  }, [profileMsg]);

  useEffect(() => {
    if (!pwMsg) return;
    const t = setTimeout(() => setPwMsg(null), 5000);
    return () => clearTimeout(t);
  }, [pwMsg]);

  useEffect(() => {
    if (!addressMsg) return;
    const t = setTimeout(() => setAddressMsg(null), 5000);
    return () => clearTimeout(t);
  }, [addressMsg]);

  // Auto-open edit form when address section is active and an address exists
  useEffect(() => {
    if (active === "address" && address && !showAddressForm) {
      openEditForm(address);
    }
  }, [active, address]);

  // fetch /me once auth is ready — fills profile form + address
  useEffect(() => {
    if (loading) return;
    api.get("/me").then(({ data }) => {
      const u = data.user;
      setProfileForm({ name: u.name || "", email: u.email || "", phone: u.phone || "" });
      setAddress(u.address || null);
    }).catch(() => { });
  }, [loading]);

  const name = profileForm.name || user?.name || "User";
  const email = profileForm.email || user?.email || "";
  const initials = getInitials(name);

  // ── Fetch orders ──────────────────────────────────────
  const fetchOrders = useCallback(async (pageNum: number) => {
    if (!userId) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const { data } = await api.get(`/orders?userId=${userId}&page=${pageNum}&limit=5`);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setOrdersError("Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (active === "orders" && !loading) fetchOrders(page);
  }, [active, page, fetchOrders, loading]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); router.push("/"); }
    finally { setLoggingOut(false); }
  };

  // ── Profile save ──────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { data } = await api.patch("/user/profile", profileForm);
      setProfileForm({ name: data.user.name, email: data.user.email, phone: data.user.phone || "" });
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err?.response?.data?.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password save ─────────────────────────────────────
  const handlePasswordSave = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.patch("/user/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg({ type: "success", text: "Password changed successfully." });
    } catch (err: any) {
      setPwMsg({ type: "error", text: err?.response?.data?.message || "Failed to change password." });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Address helpers ───────────────────────────────────
  const openAddForm = () => {
    setIsEditingAddress(false);
    setAddressForm(EMPTY_ADDR);
    setAddressMsg(null);
    setShowAddressForm(true);
  };

  const openEditForm = (addr: Address) => {
    setIsEditingAddress(true);
    setAddressForm({
      firstName: addr.firstName, lastName: addr.lastName, line1: addr.line1,
      line2: addr.line2 || "", city: addr.city, state: addr.state,
      postalCode: addr.postalCode, country: addr.country,
      phone: addr.phone,
    });
    setAddressMsg(null);
    setShowAddressForm(true);
  };

  const handleAddressSave = async () => {
    setAddressSaving(true);
    setAddressMsg(null);
    const wasEditing = isEditingAddress;
    try {
      // The account only ever holds one address — the same endpoint creates or replaces it.
      await api.post("/user/address", addressForm);

      // Re-fetch from /me instead of trusting the mutation response shape,
      // so the UI reflects what's actually persisted rather than a stale/empty payload.
      const { data } = await api.get("/me");
      const savedAddress: Address | null = data.user?.address || null;
      setAddress(savedAddress);

      if (!savedAddress) {
        setAddressMsg({
          type: "error",
          text: "The address wasn't saved. Please try again.",
        });
        return;
      }

      setIsEditingAddress(true);
      setAddressForm({
        firstName: savedAddress.firstName,
        lastName: savedAddress.lastName,
        line1: savedAddress.line1,
        line2: savedAddress.line2 || "",
        city: savedAddress.city,
        state: savedAddress.state,
        postalCode: savedAddress.postalCode,
        country: savedAddress.country,
        phone: savedAddress.phone,
      });

      setAddressMsg({
        type: "success",
        text: wasEditing ? "Address updated successfully." : "Address saved successfully.",
      });
    } catch (err: any) {
      setAddressMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to save address.",
      });
    } finally {
      setAddressSaving(false);
    }
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setIsEditingAddress(false);
    setAddressForm(EMPTY_ADDR);
    setAddressMsg(null);
  };

  return (
    <section className="user-profile">
      <div className="user-profile__inner">

        {/* ── Sidebar ── */}
        <aside className="user-profile__sidebar">
          <div className="user-profile__sidebar-avatar">
            <div className="user-profile__initials-lg">{initials}</div>
            <p className="user-profile__sidebar-name">{name}</p>
            {email && <p className="user-profile__sidebar-email">{email}</p>}
          </div>
          <nav className="user-profile__nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`user-profile__nav-item ${active === item.key ? "active" : ""}`}
                onClick={() => setActive(item.key)}
              >
                {item.label}
              </button>
            ))}
            <button
              className="user-profile__nav-item user-profile__logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
            </button>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="user-profile__content">

          {/* ── ORDERS ── */}
          {active === "orders" && (
            <div className="user-profile__section">
              <h2 className="user-profile__section-title">MY ORDERS</h2>
              {ordersLoading ? (
                <p className="user-profile__empty">Loading orders...</p>
              ) : ordersError ? (
                <p className="user-profile__empty">{ordersError}</p>
              ) : orders.length === 0 ? (
                <p className="user-profile__empty">No orders found.</p>
              ) : (
                <>
                  <div className="orders-table-wrap">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.orderId}>
                            <td className="orders-table__id">{order.orderId}</td>
                            <td><span className={`orders-table__badge orders-table__badge--${order.status}`}>{order.status}</span></td>
                            <td><span className={`orders-table__badge orders-table__badge--${order.payment.status}`}>{order.payment.status}</span></td>
                            <td className="orders-table__center">{order.items.length}</td>
                            <td className="orders-table__total">AED {(order.pricing.total ?? 0).toLocaleString()}</td>
                            <td className="orders-table__date">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="orders-pagination">
                      <button className="orders-pagination__btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                      <span className="orders-pagination__info">Page {page} of {totalPages}</span>
                      <button className="orders-pagination__btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PROFILE ── */}
          {active === "profile" && (
            <div className="user-profile__section">
              <h2 className="user-profile__section-title">PROFILE</h2>

              {/* Personal info */}
              <div className="up-subsection">
                <h3 className="up-subsection__title">Personal Information</h3>
                {profileMsg && (
                  <p className={`up-msg up-msg--${profileMsg.type}`}>{profileMsg.text}</p>
                )}
                <div className="user-profile__details-grid">
                  <div className="user-profile__detail-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="user-profile__input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="user-profile__detail-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="user-profile__input"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Your email"
                    />
                  </div>
                  <div className="user-profile__detail-field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="user-profile__input"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <button className="user-profile__save-btn" onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Change password */}
              <div className="up-subsection">
                <h3 className="up-subsection__title">Change Password</h3>
                {pwMsg && (
                  <p className={`up-msg up-msg--${pwMsg.type}`}>{pwMsg.text}</p>
                )}
                <div className="user-profile__details-grid">
                  <div className="user-profile__detail-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      className="user-profile__input"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="user-profile__detail-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="user-profile__input"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div className="user-profile__detail-field">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="user-profile__input"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <button className="user-profile__save-btn" onClick={handlePasswordSave} disabled={pwSaving}>
                  {pwSaving ? "Saving..." : "Change Password"}
                </button>
              </div>
            </div>
          )}

          {/* ── ADDRESS ── */}
          {active === "address" && (
            <div className="user-profile__section">
              <div className="up-section-header">
                <h2 className="user-profile__section-title">ADDRESS</h2>
                {!showAddressForm && !address && (
                  <button className="up-add-btn" onClick={openAddForm}>+ Add New</button>
                )}
              </div>

              {!showAddressForm && !address && (
                <p className="user-profile__empty">No address saved yet.</p>
              )}

              {showAddressForm && (
                <div className="up-address-form">
                  {addressMsg && (
                    <p className={`up-msg up-msg--${addressMsg.type}`}>{addressMsg.text}</p>
                  )}
                  <div className="user-profile__details-grid">
                    {([
                      { label: "First Name", key: "firstName", placeholder: "" },
                      { label: "Last Name", key: "lastName", placeholder: "" },
                      { label: "Area", key: "line1", placeholder: "Street address" },
                      { label: "Apartment, suite, etc. (optional)", key: "line2", placeholder: "Apt, suite, etc." },
                      { label: "City", key: "city", placeholder: "" },
                      { label: "State", key: "state", placeholder: "" },
                      { label: "ZIP Code", key: "postalCode", placeholder: "" },
                      { label: "Country", key: "country", placeholder: "" },
                      { label: "Phone", key: "phone", placeholder: "" },
                    ] as { label: string; key: keyof typeof addressForm; placeholder: string }[]).map(({ label, key, placeholder }) => (
                      <div key={key} className="user-profile__detail-field">
                        <label>{label}</label>
                        <input
                          className="user-profile__input"
                          placeholder={placeholder}
                          value={String(addressForm[key])}
                          onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="up-address-form__actions">
                    <button className="user-profile__save-btn" onClick={handleAddressSave} disabled={addressSaving}>
                      {addressSaving ? "Saving..." : isEditingAddress ? "Update Address" : "Save Address"}
                    </button>
                    {!isEditingAddress && (
                      <button className="up-cancel-btn" onClick={cancelAddressForm}>Cancel</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </section>
  );
};

export default UserProfile;
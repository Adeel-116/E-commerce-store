"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import api from "@/lib/axios";
import "@/styles/admin-banners.css";

type Banner = { _id: string; href: string; order: number; desktop: { url: string }; mobile: { url: string } };
const empty = { href: "/shop", order: 0 };
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || "Request failed. Please try again." : "Something went wrong. Please try again.";

function ImageField({ variant, current, required }: { variant: string; current?: string; required: boolean }) {
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <label className="banner-image-field">
    <span>{variant === "desktop" ? "Desktop image" : "Mobile image"}{required ? " *" : " (optional replacement)"}</span>
    {(preview || current) && <img src={preview || current} alt={`${variant} banner preview`} />}
    <input type="file" name={variant} accept="image/jpeg,image/png,image/webp,image/avif" required={required} onChange={(event) => {
      const file = event.target.files?.[0];
      if (file && file.size > 2 * 1024 * 1024) {
        event.target.setCustomValidity("Each image must be 2 MB or smaller.");
        event.target.reportValidity();
      } else event.target.setCustomValidity("");
      setPreview(file ? URL.createObjectURL(file) : "");
    }} />
  </label>;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(empty);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await api.get("/admin/banners");
    setBanners(response.data.data);
  }
  useEffect(() => {
    const controller = new AbortController();
    api.get("/admin/banners", { signal: controller.signal })
      .then(({ data }) => setBanners(data.data))
      .catch((error) => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  function reset() { setEditing(null); setForm(empty); setFormKey((key) => key + 1); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    for (const variant of ["desktop", "mobile"]) {
      const file = data.get(variant);
      if (file instanceof File && !file.size) data.delete(variant);
    }
    setBusy(true); setError(""); setNotice("");
    try {
      if (editing) await api.put(`/admin/banners/${editing._id}`, data);
      else await api.post("/admin/banners", data);
      reset();
      setNotice("Banner saved. It will appear when the homepage is loaded.");
      await load();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function remove(banner: Banner) {
    if (!window.confirm("Delete this banner and both images?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.delete(`/admin/banners/${banner._id}`);
      if (editing?._id === banner._id) reset();
      setNotice("Banner deleted.");
      await load();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return <div className="admin-banners">
    <h1>Homepage banners</h1>
    <p>Upload a desktop and mobile version for each slide. Lower display order appears first.</p>
    {error && <p className="banner-error" role="alert">{error}</p>}
    {notice && <p className="banner-notice" role="status">{notice}</p>}
    <form key={formKey} onSubmit={save} className="banner-panel">
      <h2>{editing ? "Edit banner" : "Add banner"}</h2>
      <fieldset disabled={busy || loading}>
        <div className="banner-fields">
          <label>Link<input name="href" required pattern="/[^/].*|/" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/shop" /></label>
          <label>Display order<input name="order" type="number" min="0" step="1" required value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></label>
        </div>
        <p>JPG, PNG, WebP or AVIF, up to 2 MB each. Use a wide desktop image and a portrait mobile image. Mobile is shown on screens up to 767px.</p>
        <div className="banner-images">
          <ImageField variant="desktop" current={editing?.desktop.url} required={!editing} />
          <ImageField variant="mobile" current={editing?.mobile.url} required={!editing} />
        </div>
        <div className="banner-actions"><button type="submit">{busy ? "Saving…" : editing ? "Save changes" : "Upload banner"}</button>{editing && <button type="button" onClick={reset}>Cancel</button>}</div>
      </fieldset>
    </form>
    {loading ? <p role="status">Loading banners…</p> : banners.length === 0 ? <p>No uploaded banners yet. The homepage uses the default banners until you add one.</p> :
      <div className="banner-list">{banners.map((banner) => <article className="banner-panel" key={banner._id}>
        <h2>Homepage banner</h2><p>Order: {banner.order} · Link: {banner.href}</p>
        <div className="banner-images"><figure><img src={banner.desktop.url} alt={"Desktop banner preview"} /><figcaption>Desktop</figcaption></figure><figure><img src={banner.mobile.url} alt={"Mobile banner preview"} /><figcaption>Mobile</figcaption></figure></div>
        <div className="banner-actions"><button disabled={busy} onClick={() => { setEditing(banner); setForm({ href: banner.href, order: banner.order }); setFormKey((key) => key + 1); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button disabled={busy} onClick={() => remove(banner)}>Delete</button></div>
      </article>)}</div>}
  </div>;
}

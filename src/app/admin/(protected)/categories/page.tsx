"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import api from "@/lib/axios";
import "@/styles/admin-categories.css";

type Category = {
  _id: string;
  name: string;
  slug: string;
  image: { url: string };
  status: "active" | "inactive";
  order: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  order: number;
  status: "active" | "inactive";
};

const emptyForm: CategoryForm = { name: "", slug: "", order: 0, status: "active" };

function getError(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message || "Request failed. Please try again."
    : "Something went wrong. Please try again.";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const { data } = await api.get("/admin/categories");
    setCategories(data.data || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    api.get("/admin/categories", { signal: controller.signal })
      .then(({ data }) => setCategories(data.data || []))
      .catch((error) => { if (!controller.signal.aborted) setError(getError(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function reset() {
    setEditing(null);
    setForm(emptyForm);
    setImage(null);
    setPreview("");
  }

  function startEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, slug: category.slug, order: category.order, status: category.status });
    setImage(null);
    setPreview("");
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing && !image) {
      setError("Please select a category image.");
      return;
    }
    const data = new FormData();
    data.set("name", form.name);
    data.set("slug", form.slug);
    data.set("order", String(form.order));
    data.set("status", form.status);
    if (image) data.set("image", image);

    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editing) await api.put("/admin/categories/" + editing._id, data);
      else await api.post("/admin/categories", data);
      reset();
      await load();
      setNotice(editing ? "Category updated everywhere." : "Category created and added to the store.");
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm('Delete category "' + category.name + '"?')) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.delete("/admin/categories/" + category._id);
      if (editing?._id === category._id) reset();
      await load();
      setNotice("Category deleted.");
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-categories">
      <div className="category-admin-heading">
        <div>
          <h1>Categories</h1>
          <p>These categories power the product form, storefront navigation and homepage category cards.</p>
        </div>
        <span>{categories.length} total</span>
      </div>

      {error && <p className="category-admin-message is-error" role="alert">{error}</p>}
      {notice && <p className="category-admin-message is-success" role="status">{notice}</p>}

      <form className="category-admin-form" onSubmit={save}>
        <div className="category-admin-form-title">
          <div className="category-admin-icon">{editing ? <Pencil size={19} /> : <Plus size={20} />}</div>
          <div><h2>{editing ? "Edit category" : "Add category"}</h2><p>Name and image will appear on the storefront.</p></div>
          {editing && <button type="button" className="category-admin-cancel" onClick={reset}><X size={15} /> Cancel</button>}
        </div>
        <fieldset disabled={busy}>
          <div className="category-admin-fields">
            <label>Name<input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Co-ord Sets" /></label>
            <label>Slug <small>Leave blank to generate from name</small><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="co-ord-sets" /></label>
            <label>Display order<input type="number" min={0} step={1} value={form.order} onChange={(event) => setForm({ ...form, order: Number(event.target.value) })} /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "active" | "inactive" })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          </div>
          <label className="category-admin-image">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => {
              const file = event.target.files?.[0] || null;
              if (file && file.size > 10 * 1024 * 1024) {
                event.target.setCustomValidity("Image must be 10 MB or smaller.");
                event.target.reportValidity();
                return;
              }
              event.target.setCustomValidity("");
              setImage(file);
              setPreview(file ? URL.createObjectURL(file) : "");
            }} />
            {preview || editing?.image.url ? <img src={preview || editing?.image.url} alt="Category preview" /> : <div><ImagePlus size={27} /><strong>Choose category image</strong><span>JPG, PNG, WebP or AVIF</span></div>}
          </label>
          <button className="category-admin-submit" type="submit">{busy ? "Saving..." : editing ? "Save changes" : "Add category"}</button>
        </fieldset>
      </form>

      {loading ? <p>Loading categories...</p> : (
        <div className="category-admin-grid">
          {categories.map((category) => (
            <article key={category._id} className="category-admin-card">
              <div className="category-admin-card-image"><img src={category.image.url} alt={category.name} /><span className={category.status}>{category.status}</span></div>
              <div className="category-admin-card-body">
                <div><h2>{category.name}</h2><p>/{category.slug} · Order {category.order}</p></div>
                <div className="category-admin-card-actions">
                  <button onClick={() => startEdit(category)} disabled={busy} aria-label={"Edit " + category.name}><Pencil size={15} /> Edit</button>
                  <button onClick={() => remove(category)} disabled={busy} aria-label={"Delete " + category.name}><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
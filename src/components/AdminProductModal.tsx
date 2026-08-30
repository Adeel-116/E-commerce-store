"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, X, Upload } from "lucide-react";
import AdminModal from "./AdminModal";
import axios from "axios";
import api from "@/lib/axios";
import { DEFAULT_VARIANT_NAME } from "@/app/hooks/useProductCardImages";
import "@/styles/admin-products.css";

export type TableProduct = {
  id: string;
  _id: string;
  image?: string;
  title: string;
  price: string;
  comparePrice: string;
  category: string;
  stock: string;
  status: string;
};

export type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

type RawProduct = {
  _id: string;
  productId: number;
  title: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  colors: ColorVariant[];
  isNew: boolean;
  isBestSeller: boolean;
  showInYouMayAlsoLike: boolean;
  stock: boolean;
  status: "active" | "inactive";
  isStitched?: boolean;
  isUnstitched?: boolean;
  stitchedPrice?: number | null;
  displayOrder?: number;
};

export type ProductSaveData = {
  title: string;
  stock: boolean;
  status: string;
};

const categoryOptions = ["western", "top-jeans", "fashion", "maxi"];
const categoryLabels: Record<string, string> = {
  western: "Western Fashion",
  "top-jeans": "Top & Jeans",
  fashion: "Pakistani Fashion",
  maxi: "Maxi",
};
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

type FormValues = {
  title: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: boolean;
  status: "active" | "inactive";
  sizes: string[];
  category: string[];
  colors: ColorVariant[];
  isNew: boolean;
  isBestSeller: boolean;
  showInYouMayAlsoLike: boolean;
  isStitched: boolean;
  isUnstitched: boolean;
  stitchedPrice: string;
  displayOrder: string;
};

const emptyForm = (): FormValues => ({
  title: "",
  description: "",
  price: "",
  comparePrice: "",
  stock: true,
  status: "active",
  sizes: [],
  category: [],
  colors: [],
  isNew: false,
  isBestSeller: false,
  showInYouMayAlsoLike: false,
  isStitched: false,
  isUnstitched: false,
  stitchedPrice: "",
  displayOrder: "",
});

interface AdminProductModalProps {
  mode: "add" | "edit" | null;
  selectedProduct?: TableProduct | null;
  onClose: () => void;
  onSave: (data: ProductSaveData) => void;
}

export default function AdminProductModal({
  mode,
  selectedProduct,
  onClose,
  onSave,
}: AdminProductModalProps) {
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#1c1c1c");
  const [uploadingColorIndex, setUploadingColorIndex] = useState<number | null>(
    null,
  );
  const activeColorUploadIndex = useRef<number | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset local state whenever the modal is (re)opened with a new mode —
  // done during render (not in an effect) since it's purely derived from
  // the `mode` / `selectedProduct` props changing, following React's
  // "adjusting state during render" pattern instead of a synchronous
  // setState-in-effect.
  const fetchKey =
    mode === "edit" ? `edit:${selectedProduct?._id ?? ""}` : mode;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (fetchKey !== prevFetchKey) {
    setPrevFetchKey(fetchKey);
    if (mode !== null) {
      setApiError(null);
      setIsLoading(false);
      if (mode === "add") {
        setForm(emptyForm());
      } else if (mode === "edit" && selectedProduct) {
        setIsFetching(true);
      }
    }
  }

  useEffect(() => {
    if (mode !== "edit" || !selectedProduct) return;
    let cancelled = false;

    api
      .get<{ success: boolean; data: RawProduct }>("/getProductById", {
        params: { id: selectedProduct._id },
      })
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.success) {
          setApiError("Failed to load product");
          return;
        }
        const p = data.data;
        const colors = Array.isArray(p.colors) ? p.colors : [];
        const legacyImages = Array.isArray(p.images) ? p.images : [];
        // Older products stored photos in a separate `images` field with no
        // variation. Bring them in as an unnamed "Default" group so they
        // stay editable in the variations-only UI below.
        const seededColors =
          colors.length === 0 && legacyImages.length > 0
            ? [
                {
                  name: DEFAULT_VARIANT_NAME,
                  hex: "#cccccc",
                  images: legacyImages,
                },
              ]
            : colors;
        setForm({
          title: p.title ?? "",
          description: p.description ?? "",
          price: p.price != null ? String(p.price) : "",
          comparePrice: p.comparePrice != null ? String(p.comparePrice) : "",
          stock: p.stock,
          status: p.status ?? "active",
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          category: Array.isArray(p.category) ? p.category : [],
          colors: seededColors,
          isNew: !!p.isNew,
          isBestSeller: !!p.isBestSeller,
          showInYouMayAlsoLike: !!p.showInYouMayAlsoLike,
          isStitched: !!p.isStitched,
          isUnstitched: !!p.isUnstitched,
          stitchedPrice: p.stitchedPrice != null ? String(p.stitchedPrice) : "",
          displayOrder: p.displayOrder != null ? String(p.displayOrder) : "",
        });
      })
      .catch(() => {
        if (!cancelled) setApiError("Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, selectedProduct]);

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => {
    setApiError(null);
    setForm((f) => ({ ...f, [key]: val }));
  };

  const addColor = () => {
    // A blank name just means "more photos, no specific color" — group them
    // under one unnamed "Default" entry instead of forcing a color name.
    const name = newColorName.trim() || DEFAULT_VARIANT_NAME;
    if (form.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setApiError(
        name === DEFAULT_VARIANT_NAME
          ? "You already have a photo group without a color — add photos to it below, or give this one a name."
          : `Color "${name}" is already added.`,
      );
      return;
    }
    setForm((f) => ({
      ...f,
      colors: [...f.colors, { name, hex: newColorHex, images: [] }],
    }));
    setNewColorName("");
    setNewColorHex("#1c1c1c");
  };

  const removeColor = (index: number) => {
    setForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== index) }));
  };

  const triggerColorImageUpload = (index: number) => {
    activeColorUploadIndex.current = index;
    colorFileInputRef.current?.click();
  };

  const handleColorFilesSelected = async (files: FileList | null) => {
    const index = activeColorUploadIndex.current;
    if (!files || files.length === 0 || index === null) return;
    setUploadingColorIndex(index);
    setApiError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post("/admin/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.url) uploadedUrls.push(res.data.url);
      }
      setForm((f) => {
        const colors = [...f.colors];
        colors[index] = {
          ...colors[index],
          images: [...colors[index].images, ...uploadedUrls],
        };
        return { ...f, colors };
      });
    } catch (err) {
      setApiError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : "Failed to upload color image",
      );
    } finally {
      setUploadingColorIndex(null);
      if (colorFileInputRef.current) colorFileInputRef.current.value = "";
    }
  };

  const removeColorImage = (colorIndex: number, url: string) => {
    setForm((f) => {
      const colors = [...f.colors];
      colors[colorIndex] = {
        ...colors[colorIndex],
        images: colors[colorIndex].images.filter((img) => img !== url),
      };
      return { ...f, colors };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setApiError("Product title is required.");
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        // Kept for compatibility with anything still reading the plain
        // `images` field — always mirrors the first variation's photos.
        images: form.colors[0]?.images ?? [],
        price: Number(form.price) || 0,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        category: Array.isArray(form.category) ? form.category : [],
        sizes: Array.isArray(form.sizes) ? form.sizes : [],
        colors: form.colors,
        isNew: form.isNew,
        isBestSeller: form.isBestSeller,
        showInYouMayAlsoLike: form.showInYouMayAlsoLike,
        isStitched: form.isStitched,
        isUnstitched: form.isUnstitched,
        stitchedPrice:
          form.isStitched && form.stitchedPrice
            ? Number(form.stitchedPrice)
            : null,
        stock: form.stock,
        status: form.status,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : 0,
      };

      if (mode === "add") {
        const res = await api.post("/admin/create-product", body);
        if (res.data?.success) {
          onSave({ title: form.title, stock: form.stock, status: form.status });
        } else {
          setApiError(res.data?.message || "Failed to create product");
        }
      } else if (mode === "edit" && selectedProduct) {
        const res = await api.put(
          `/admin/edit-product?id=${selectedProduct._id}`,
          body,
        );
        if (res.data?.success) {
          onSave({ title: form.title, stock: form.stock, status: form.status });
        } else {
          setApiError(res.data?.message || "Failed to update product");
        }
      }
    } catch (err: unknown) {
      setApiError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : "Failed to save",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={mode !== null}
      onClose={onClose}
      title={mode === "add" ? "Add Product" : "Edit Product"}
      subtitle={
        mode === "edit"
          ? `ID: ${selectedProduct?.id}`
          : "Fill in the details below"
      }
      size="md"
      footer={
        <>
          {apiError && (
            <span style={{ fontSize: 12, color: "#f87171", flex: 1 }}>
              {apiError}
            </span>
          )}
          <button
            className="admin-btn admin-btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={isLoading || isFetching || uploadingColorIndex !== null}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="admin-spin" /> Saving…
              </>
            ) : mode === "add" ? (
              "Add Product"
            ) : (
              "Save Changes"
            )}
          </button>
        </>
      }
    >
      {isFetching ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 0",
            gap: 10,
            color: "#aaa",
          }}
        >
          <Loader2 size={18} className="admin-spin" />
          <span style={{ fontSize: 13 }}>Loading product data…</span>
        </div>
      ) : (
        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Title *</label>
            <input
              className="admin-form-input"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Embroidered Maxi Dress"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Price</label>
            <input
              className="admin-form-input"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder="e.g. 250 PKR"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Compare Price</label>
            <input
              className="admin-form-input"
              type="number"
              min={0}
              value={form.comparePrice}
              onChange={(e) => setField("comparePrice", e.target.value)}
              placeholder="Optional — original/was price"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Display Order</label>
            <input
              className="admin-form-input"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setField("displayOrder", e.target.value)}
              placeholder="0"
            />
            <span
              style={{
                fontSize: 11,
                color: "#aaa",
                marginTop: 4,
                display: "block",
              }}
            >
              Controls where this product shows on Best Sellers and the default
              Shop page sort — lower numbers appear first. Leave as 0 for no
              preference.
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Category</label>

            <div className="admin-dropdown" ref={categoryDropdownRef}>
              <div
                className={`admin-dropdown-trigger${categoryDropdownOpen ? " admin-dropdown-trigger--open" : ""}`}
                onClick={() => setCategoryDropdownOpen((p) => !p)}
              >
                <span className="admin-dropdown-chips">
                  {form.category.length > 0 ? (
                    form.category.map((c) => (
                      <span key={c} className="admin-selected-chip">
                        {categoryLabels[c] ?? c}
                      </span>
                    ))
                  ) : (
                    <span className="admin-dropdown-placeholder">
                      Select category…
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={14}
                  className={`admin-dropdown-chevron${categoryDropdownOpen ? " admin-dropdown-chevron--open" : ""}`}
                />
              </div>

              {categoryDropdownOpen && (
                <div className="admin-dropdown-menu">
                  {categoryOptions.map((cat) => {
                    const isSelected = form.category.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`admin-dropdown-item${isSelected ? " admin-dropdown-item--selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setForm((prev) => ({
                              ...prev,
                              category: isSelected
                                ? prev.category.filter((c) => c !== cat)
                                : [...prev.category, cat],
                            }));
                          }}
                        />
                        <span>{categoryLabels[cat] ?? cat}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Sizes</label>

            <div className="admin-multi-select">
              {sizeOptions.map((option) => (
                <label key={option} className="admin-checkbox-pill">
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(option)}
                    onChange={() => {
                      setForm((prev) => ({
                        ...prev,
                        sizes: prev.sizes.includes(option)
                          ? prev.sizes.filter((s) => s !== option)
                          : [...prev.sizes, option],
                      }));
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Stitching Options</label>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <label className="admin-checkbox-pill">
                <input
                  type="checkbox"
                  checked={form.isUnstitched}
                  onChange={(e) => setField("isUnstitched", e.target.checked)}
                />
                <span>Unstitched</span>
              </label>
              <label className="admin-checkbox-pill">
                <input
                  type="checkbox"
                  checked={form.isStitched}
                  onChange={(e) => setField("isStitched", e.target.checked)}
                />
                <span>Stitched</span>
              </label>
            </div>
            {form.isStitched && form.isUnstitched && (
              <div style={{ marginTop: 12 }}>
                <label className="admin-form-label">Stitched Price</label>
                <input
                  className="admin-form-input"
                  type="number"
                  min={0}
                  value={form.stitchedPrice}
                  onChange={(e) => setField("stitchedPrice", e.target.value)}
                  placeholder="Price for stitched variant"
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  The standard "Price" field will be used for Unstitched, and
                  this price for Stitched.
                </span>
              </div>
            )}
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">
              Photos{" "}
              {form.colors.length > 0 &&
                `(${form.colors.length} variation${form.colors.length > 1 ? "s" : ""})`}
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {form.colors.map((color, index) => {
                const isDefault = color.name === DEFAULT_VARIANT_NAME;
                return (
                  <div
                    key={`${color.name}-${index}`}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {!isDefault && (
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: color.hex,
                            border: "1px solid #ddd",
                            flexShrink: 0,
                          }}
                          title={color.hex}
                        />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                        {isDefault ? "Photos (no color)" : color.name}
                      </span>
                      {index === 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#8a8a8a",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            padding: "2px 6px",
                          }}
                        >
                          Shown by default
                        </span>
                      )}
                      {!isDefault && (
                        <span style={{ fontSize: 11, color: "#aaa" }}>
                          {color.hex}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#c62828",
                          color: "#fff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Remove color"
                      >
                        <X size={11} />
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {color.images.map((url) => (
                        <div
                          key={url}
                          style={{
                            position: "relative",
                            width: 50,
                            height: 50,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={color.name}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #eee",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeColorImage(index, url)}
                            style={{
                              position: "absolute",
                              top: -5,
                              right: -5,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "#c62828",
                              color: "#fff",
                              border: "2px solid #fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Remove image"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                      <div
                        onClick={() =>
                          uploadingColorIndex === null &&
                          triggerColorImageUpload(index)
                        }
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 6,
                          border: "1.5px dashed #d0d4c8",
                          background: "#fafaf6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor:
                            uploadingColorIndex === null
                              ? "pointer"
                              : "not-allowed",
                          color: "#aaa",
                        }}
                        title={
                          isDefault ? "Add photos" : "Add image for this color"
                        }
                      >
                        {uploadingColorIndex === index ? (
                          <Loader2 size={14} className="admin-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                  title="Pick hex color — only used if you name this variation"
                />
                <input
                  className="admin-form-input"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  placeholder="Color name (optional) — e.g. Maroon"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={addColor}
                >
                  {newColorName.trim() ? "Add Color" : "Add Photos"}
                </button>
              </div>
              <input
                ref={colorFileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleColorFilesSelected(e.target.files)}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#aaa",
                marginTop: 4,
                display: "block",
              }}
            >
              Add a group of photos for each color, or leave the name blank to
              just upload extra product photos. The first group you add is what
              shows on the storefront by default.
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">New Arrival</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">
                {form.isNew ? "Marked as New" : "Not New"}
              </span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => setField("isNew", e.target.checked)}
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Best Seller</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">
                {form.isBestSeller
                  ? "Shown in Best Sellers"
                  : "Not a Best Seller"}
              </span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) => setField("isBestSeller", e.target.checked)}
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">You May Also Like</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">
                {form.showInYouMayAlsoLike
                  ? "Shown on product pages"
                  : "Not shown"}
              </span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.showInYouMayAlsoLike}
                  onChange={(e) =>
                    setField("showInYouMayAlsoLike", e.target.checked)
                  }
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#aaa",
                marginTop: 4,
                display: "block",
              }}
            >
              When on, this product can appear in the &quot;You May Also
              Like&quot; section on other products&apos; pages.
            </span>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Stock</label>
            <div className="admin-toggle-row">
              <span className="admin-toggle-label">
                {form.stock ? "In Stock" : "Out of Stock"}
              </span>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={form.stock}
                  onChange={(e) => setField("stock", e.target.checked)}
                />
                <span className="admin-toggle-track" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Status</label>
            <select
              className="admin-form-select"
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as "active" | "inactive")
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="admin-form-group admin-form-grid-full">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-textarea"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="A flowing maxi dress with embroidered detailing…"
              style={{ minHeight: 100 }}
            />
          </div>
        </div>
      )}
    </AdminModal>
  );
}

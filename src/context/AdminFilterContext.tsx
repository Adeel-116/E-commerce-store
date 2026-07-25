"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/universalFilter`;
const SESSION_KEY = "admin:zainab_filters";

export type FilterParams = {
  title?: string;
  stock?: string;
  status?: string;
  category?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export type Product = {
  _id: string;
  productId: number;
  title: string;
  slug?: string;
  description?: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  isNew: boolean;
  stock: boolean;
  status: "active" | "inactive";
};

type FilterContextType = {
  products: Product[];
  loading: boolean;
  filters: FilterParams;
  total: number;
  totalPages: number;
  page: number;
  saveFilter: (params: FilterParams) => void;
  setPage: (page: number) => void;
  clearFilter: () => void;
  refresh: () => void;
  getFilter: () => FilterParams;
};

const FilterContext = createContext<FilterContextType | null>(null);

function buildQueryString(params: FilterParams): string {
  const query = new URLSearchParams();
  (Object.entries(params) as [string, unknown][]).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

function loadFromSession(): FilterParams {
  if (typeof window === "undefined") return {};
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export const AdminFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterParams>(loadFromSession);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPageState] = useState(1);

  const filtersRef = useRef<FilterParams>(filters);
  const pageRef = useRef(1);

  const fetchProducts = useCallback(async (params: FilterParams, pageNum: number) => {
    setLoading(true);
    try {
      const qs = buildQueryString({ ...params, page: pageNum, limit: 8 });
      const { data } = await axios.get(qs ? `${BASE_URL}?${qs}` : BASE_URL);
      setProducts(data?.data ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      console.error("Filter fetch failed:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filtersRef.current, 1);
  }, [fetchProducts]);

  const saveFilter = useCallback((params: FilterParams) => {
    const merged = { ...filtersRef.current };
    (Object.keys(params) as (keyof FilterParams)[]).forEach((key) => {
      if (params[key] === undefined) {
        delete merged[key];
      } else {
        (merged as Record<string, unknown>)[key] = params[key];
      }
    });
    delete merged.page;
    filtersRef.current = merged;
    pageRef.current = 1;
    setFilters(merged);
    setPageState(1);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
    fetchProducts(merged, 1);
  }, [fetchProducts]);

  const setPage = useCallback((p: number) => {
    pageRef.current = p;
    setPageState(p);
    fetchProducts(filtersRef.current, p);
  }, [fetchProducts]);

  const clearFilter = useCallback(() => {
    filtersRef.current = {};
    pageRef.current = 1;
    setFilters({});
    setPageState(1);
    sessionStorage.removeItem(SESSION_KEY);
    fetchProducts({}, 1);
  }, [fetchProducts]);

  const refresh = useCallback(() => {
    fetchProducts(filtersRef.current, pageRef.current);
  }, [fetchProducts]);

  const getFilter = useCallback((): FilterParams => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  return (
    <FilterContext.Provider value={{ products, loading, filters, total, totalPages, page, saveFilter, setPage, clearFilter, refresh, getFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within AdminFilterProvider");
  return ctx;
};

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/universalFilter`;
const STORAGE_KEY = "monk_filters";

export type FilterParams = {
  title?: string;
  stock?: boolean;
  category?: string;
  status?: "active" | "inactive";
  sort?: string;
  page?: number;
  limit?: number;
  index?: number;
};

export type Product = {
  _id: string;
  productId?: number;
  title: string;
  description?: string;
  images?: string[];
  slug?: string;
  stock?: boolean;
  status?: "active" | "inactive";
  category?: string[];
  sizes?: string[];
  price?: number;
  comparePrice?: number | null;
  isNew?: boolean;
  activeDiscount?: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  };
};

type FilterContextType = {
  products: Product[];
  loading: boolean;
  filters: FilterParams;
  total: number;
  currentPage: number;
  totalPages: number;
  saveFilter: (params: FilterParams) => void;
  clearFilter: () => void;
};

const FilterContext = createContext<FilterContextType | null>(null);

function buildQueryString(params: FilterParams): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

// sessionStorage helpers — sessionStorage is the source of truth for filters
function getStoredFilters(): FilterParams {
  if (typeof window === "undefined") return {};

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function setStoredFilters(filters: FilterParams) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

function removeStoredFilters() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterParams>(getStoredFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ----------------------------
  // FETCH PRODUCTS (single source)
  // ----------------------------
  const fetchProducts = useCallback(async (activeFilters: FilterParams) => {
    setLoading(true);

    try {
      const qs = buildQueryString(activeFilters);
      const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;

      const { data } = await axios.get(url);

      setProducts(data?.data ?? []);
      setTotal(data?.total ?? 0);
      setCurrentPage(data?.page ?? 1);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      console.error("Filter fetch failed:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------
  // SAVE FILTER
  // ----------------------------
  const saveFilter = useCallback(
    (params: FilterParams) => {
      const updated = { ...getStoredFilters() };

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) {
          delete (updated as any)[key];
        } else {
          (updated as any)[key] = value;
        }
      });

      setStoredFilters(updated);
      setFilters(updated);
      fetchProducts(updated);
    },
    [fetchProducts]
  );

  // ----------------------------
  // CLEAR FILTER
  // ----------------------------
  const clearFilter = useCallback(() => {
    removeStoredFilters();
    setFilters({});
    fetchProducts({});
  }, [fetchProducts]);

  // ----------------------------
  // MEMOIZED CONTEXT VALUE (IMPORTANT FIX)
  // ----------------------------
  const value = useMemo(
    () => ({
      products,
      loading,
      filters,
      total,
      currentPage,
      totalPages,
      saveFilter,
      clearFilter,
    }),
    [products, loading, filters, total, currentPage, totalPages, saveFilter, clearFilter]
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const ctx = useContext(FilterContext);

  if (!ctx) {
    throw new Error("useFilter must be used within FilterProvider");
  }

  return ctx;
};
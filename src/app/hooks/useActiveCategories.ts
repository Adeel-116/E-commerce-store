import { useEffect, useState } from "react";
import api from "@/app/lib/axios";

export function useActiveCategories() {
  const [activeCategories, setActiveCategories] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/getActiveCategories");
        if (!cancelled && data?.success) {
          setActiveCategories(data.data ?? []);
        }
      } catch {
        // Keep null on failure so callers can fall back to showing all links.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return activeCategories;
}

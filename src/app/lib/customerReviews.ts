import api from "@/lib/axios";

export type CustomerReview = {
  _id: string;
  name: string;
  city?: string;
  text: string;
  rating: number;
  screenshot?: string;
  verified?: boolean;
  createdAt?: string;
};

let pending: Promise<CustomerReview[]> | null = null;
let fetchedAt = 0;

export function fetchCustomerReviews(): Promise<CustomerReview[]> {
  if (pending && Date.now() - fetchedAt < 60000) return pending;
  fetchedAt = Date.now();
  pending = api.get("/reviews", { timeout: 15000 }).then(({ data }) => {
    const reviews: CustomerReview[] = data.data ?? [];
    // Keep customer screenshots ahead of text-only reviews on every surface.
    return [...reviews].sort((a, b) => Number(Boolean(b.screenshot)) - Number(Boolean(a.screenshot)));
  }).catch(error => {
    pending = null;
    throw error;
  });
  return pending;
}

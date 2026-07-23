const GUEST_ID_KEY = "guestId";

export const getGuestId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_ID_KEY);
};

export const saveGuestId = (id: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_ID_KEY, id);
};

export const clearGuestId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_ID_KEY);
};

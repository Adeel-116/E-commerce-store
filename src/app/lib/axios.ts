import axios from "axios";
import { getGuestId, saveGuestId } from "./guestId";
import { optimizeCloudinaryData } from "@/lib/cloudinary";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const guestId = getGuestId();
  if (guestId) {
    config.headers["x-guest-id"] = guestId;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const newGuestId = response.headers["x-guest-id"];
  if (newGuestId) {
    saveGuestId(newGuestId);
  }
  response.data = optimizeCloudinaryData(response.data);
  return response;
});

export { BASE_URL };
export default api;

import axios from "axios";
import { optimizeCloudinaryData } from "./cloudinary";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use((response) => {
  response.data = optimizeCloudinaryData(response.data);
  return response;
});

export { BASE_URL };
export default api;

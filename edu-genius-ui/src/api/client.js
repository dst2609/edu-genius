import axios from "axios";

// export const API_BASE = (
//   import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_BACKEND_URL
// ).replace(/\/+$/, "");

export const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

http.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...authHeaders() };
  return config;
});

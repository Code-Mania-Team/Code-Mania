import axios from "axios";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// Normalize to backend root. Some deployments set VITE_API_BASE_URL to ".../v1".
const BASE_URL = String(RAW_BASE_URL)
  .replace(/\/+$/, "")
  .replace(/\/v1$/, "");

// const DEFAULT_HEADERS = {
//   apikey: import.meta.env.VITE_API_KEY,
//   'Content-Type': 'application/json',
// };

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: DEFAULT_HEADERS,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: DEFAULT_HEADERS,
  withCredentials: true,
});

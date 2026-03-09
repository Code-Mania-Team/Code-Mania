import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// const gameAxios = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     apikey: import.meta.env.VITE_API_KEY,
//     "Content-Type": "application/json",
//   },
// });

const gameAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// OPTIONAL: simple 401 retry (NO React)
gameAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      // best effort refresh (cookie-based)
      try {
        await axios.get(`${API_BASE_URL}/v1/refresh`, {
          withCredentials: true,
        });
        return gameAxios(error.config);
      } catch {
        // refresh failed → let it fail
      }
    }
    return Promise.reject(error);
  }
);

export default gameAxios;

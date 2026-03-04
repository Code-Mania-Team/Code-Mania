import axios from "axios";

const gameAxios = axios.create({
  baseURL: "https://code-mania-production.up.railway.app",
  withCredentials: true,
  headers: {
    apikey: import.meta.env.VITE_API_KEY,
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
        await axios.get("https://code-mania-production.up.railway.app/v1/refresh", {
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

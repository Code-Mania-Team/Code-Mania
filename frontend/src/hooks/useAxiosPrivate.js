import { useEffect } from "react";
import { axiosPrivate } from "../api/axios";
import useRefreshToken from "./useRefreshToken";

// Global refresh queue to prevent race conditions
let isRefreshing = false;
let refreshQueue = [];

// Ensure only one interceptor is attached globally
let interceptorUsers = 0;
let responseInterceptorId = null;

const useAxiosPrivate = () => {
  const refresh = useRefreshToken();

  useEffect(() => {
    interceptorUsers += 1;

    const isNoRefreshEndpoint = (url) => {
      const u = String(url || "");
      return (
        u.includes("/v1/refresh") ||
        u.includes("/v1/account/login") ||
        u.includes("/v1/account/logout") ||
        u.includes("/v1/account/signup") ||
        u.includes("/v1/account/signup/verify-otp") ||
        u.includes("/v1/forgot-password")
      );
    };

    if (responseInterceptorId === null) {
      responseInterceptorId = axiosPrivate.interceptors.response.use(
        (response) => response,
        async (error) => {
          const prevRequest = error?.config;
          const status = error?.response?.status;

          if (status === 401 && prevRequest && !prevRequest._retry) {
            prevRequest._retry = true;

            if (isNoRefreshEndpoint(prevRequest?.url)) {
              return Promise.reject(error);
            }

            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject, config: prevRequest });
              });
            }

            isRefreshing = true;

            try {
              const token = await refresh();
              if (!token) throw error;

              refreshQueue.forEach(({ resolve, config }) => {
                resolve(axiosPrivate(config));
              });
              refreshQueue = [];
              isRefreshing = false;

              return axiosPrivate(prevRequest);
            } catch (refreshError) {
              refreshQueue.forEach(({ reject }) => {
                reject(refreshError);
              });
              refreshQueue = [];
              isRefreshing = false;

              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );
    }

    return () => {
      interceptorUsers -= 1;
      if (interceptorUsers <= 0) {
        interceptorUsers = 0;
        if (responseInterceptorId !== null) {
          axiosPrivate.interceptors.response.eject(responseInterceptorId);
          responseInterceptorId = null;
        }
      }
    };
  }, [refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;
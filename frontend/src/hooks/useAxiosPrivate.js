import { useEffect } from "react";
import { axiosPrivate } from "../api/axios";
import useRefreshToken from "./useRefreshToken";

// Global refresh queue to prevent race conditions
let isRefreshing = false;
let refreshQueue = [];

const useAxiosPrivate = () => {
  const refresh = useRefreshToken();

  useEffect(() => {
    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;

        if (error?.response?.status === 401 && prevRequest && !prevRequest._retry) {
          prevRequest._retry = true;
          
          // Check if this is an account endpoint - don't refresh for auth checks
          if (prevRequest?.url?.includes('/v1/account')) {
            console.log("Skipping refresh for auth check endpoint");
            return Promise.reject(error);
          }
          
          // Add to queue if refresh is already in progress
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              refreshQueue.push({ resolve, reject, config: prevRequest });
            });
          }
          
          // Set refresh flag
          isRefreshing = true;
          
          try {
            await refresh();
            
            // Process queued requests
            refreshQueue.forEach(({ resolve, config }) => {
              resolve(axiosPrivate(config));
            });
            refreshQueue = [];
            
            // Clear refresh flag
            isRefreshing = false;
            
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            // Reject all queued requests on failure
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

    return () => {
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;

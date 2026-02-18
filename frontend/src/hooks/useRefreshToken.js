import { axiosPrivate } from "../api/axios";

const useRefreshToken = () => {
  const refresh = async () => {
    try {
      const response = await axiosPrivate.get("/v1/refresh");
      return response.data.accessToken;
    } catch (error) {
      // Silent 401 handling - don't log to console
      if (error.response?.status === 401) {
        console.warn("Session expired - redirecting to login...");
        // Optional: Redirect to login page
        // window.location.href = '/login';
        return null;
      }
      // Log other errors (network issues, server errors)
      console.error("Refresh token error:", error);
      throw error;
    }
  };

  return refresh;
};

export default useRefreshToken;

import { axiosPublic } from "../api/axios";

const useRefreshToken = () => {
  const refresh = async () => {
    try {
      const response = await axiosPublic.post("/v1/refresh",{});
      return response.data.accessToken;
      
    } catch (error) {
      // Silent 401 handling - guest mode is allowed
      if (error.response?.status === 401) {
        return null;
      }
      // Log other errors (network issues, server errors)
      //console.error("Refresh token error:", error);
      throw error;
    }
  };

  return refresh;
};

export default useRefreshToken;

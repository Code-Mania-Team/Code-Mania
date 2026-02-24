import { axiosPublic } from "../api/axios";

const useRefreshToken = () => {
  const refresh = async () => {
    try {
      // Use the public client to avoid any private interceptor loops.
      const response = await axiosPublic.get("/v1/refresh");
      return response.data.accessToken;
    } catch (error) {
      // Keep refresh failures silent; caller decides next steps.
      return null;
    }
  };

  return refresh;
};

export default useRefreshToken;

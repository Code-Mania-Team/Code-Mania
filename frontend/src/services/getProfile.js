import useAxiosPrivate from "../hooks/axiosIntercept.js";

const useGetProfile = () => {
  const axiosPrivate = useAxiosPrivate();

  const getProfile = async () => {
    try {
      const response = await axiosPrivate.get("/v1/account");
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Not logged in or token expired and refresh failed
        return null;
      }
      console.error("Error fetching profile:", error);
      throw error;
    }
  };

  return getProfile;
};

export default useGetProfile;

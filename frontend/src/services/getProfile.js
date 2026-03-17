import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useCallback } from 'react';

const useGetProfile = () => {
  const axiosPrivate = useAxiosPrivate();

  const getProfile = useCallback(async () => {
    try {
      const response = await axiosPrivate.get("/v1/account");
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      console.error("Error fetching profile:", error);
      throw error;
    }
  }, [axiosPrivate]);

  return getProfile;
};

export default useGetProfile;

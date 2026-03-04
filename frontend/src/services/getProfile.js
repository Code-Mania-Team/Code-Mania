import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';

const useGetProfile = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated } = useContext(AuthContext) || { isAuthenticated: false };

  const getProfile = async () => {
    if (!isAuthenticated) return null;
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
  };

  return getProfile;
};

export default useGetProfile;

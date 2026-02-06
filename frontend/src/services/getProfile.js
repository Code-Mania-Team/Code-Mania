import axios from "axios";

const useGetProfile = () => {
  const getProfile = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/v1/account",
        {
          withCredentials: true,
          headers: {
            apikey: import.meta.env.VITE_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

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

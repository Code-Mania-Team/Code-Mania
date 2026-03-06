import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const useGetAllPosts = () => {
  const getAllPosts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/`,
        {
          headers: {
            apikey: import.meta.env.VITE_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'Failed to fetch posts');
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  };

  return getAllPosts;
};

export default useGetAllPosts;

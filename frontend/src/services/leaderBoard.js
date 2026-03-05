import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.codemania.fun";

const useGetAllLeaderboard = () => {
  const getAllLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/leaderboard`,
        {
          headers: {
            apikey: import.meta.env.VITE_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'Failed to fetch leaderboard data');
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      throw error;
    }
  };

  return getAllLeaderboard;
};

export default useGetAllLeaderboard;

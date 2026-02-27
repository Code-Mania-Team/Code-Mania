import { axiosPublic } from "../api/axios";
const useGetAllLeaderboard = () => {
  const getAllLeaderboard = async () => {
    try {
      const response = await axiosPublic.get(
        "/v1/leaderboard",
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

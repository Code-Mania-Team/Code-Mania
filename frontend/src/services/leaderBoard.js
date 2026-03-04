import axios from "axios";

const LEADERBOARD_CACHE_KEY = "leaderboard_cache_all";
const LEADERBOARD_TTL_MS = 30 * 1000;

const useGetAllLeaderboard = () => {
  const getAllLeaderboard = async () => {
    const cached = sessionStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const now = Date.now();

        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.cachedAt &&
          now - Number(parsed.cachedAt) < LEADERBOARD_TTL_MS
        ) {
          return parsed.payload;
        }

        sessionStorage.removeItem(LEADERBOARD_CACHE_KEY);
      } catch {
        sessionStorage.removeItem(LEADERBOARD_CACHE_KEY);
      }
    }

    try {
      const response = await axios.get(
        "http://localhost:3000/v1/leaderboard",
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

      try {
        sessionStorage.setItem(
          LEADERBOARD_CACHE_KEY,
          JSON.stringify({
            cachedAt: Date.now(),
            payload: response.data,
          })
        );
      } catch {
        // sessionStorage may be full; ignore cache write failures
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

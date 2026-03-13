import { axiosPublic } from "../api/axios";

const CACHE_KEY_PREFIX = "exercises_cache_";

const useGetExercises = () => {
  const getExercises = async (languageId) => {
    const cacheKey = `${CACHE_KEY_PREFIX}${languageId}`;

    // Return cached data if available (lasts for the browser session)
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // If parse fails, fall through to fetch fresh data
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Fetch from network and store in cache
    const response = await axiosPublic.get(
      `/v1/exercises/programming-language/${languageId}`
    );

    const data = response.data.data;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // sessionStorage might be full — silently skip caching
    }

    return data;
  };

  return getExercises;
};

export default useGetExercises;

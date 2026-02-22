import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetGameProgress = () => {
  const axiosPrivate = useAxiosPrivate();

  const getGameProgress = async (programmingLanguage) => {
    try {
      const response = await axiosPrivate.get("/v1/learning-data", {
        params: {
          programming_language: programmingLanguage,
        },
      });
      console.log("✅ Game progress fetched:", response.data);

      return response.data; // { completedQuests: [...] }
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }

      console.error("Error fetching game progress:", error);
      throw error;
    }
  };

  return getGameProgress;
};

export default useGetGameProgress;

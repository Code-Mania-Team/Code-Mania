import { axiosPrivate } from "../api/axios";

// Post a badge/achievement
export const postBadge = async (achievementId) => {
  try {
    const response = await axiosPrivate.post("/v1/achievements/post-badge", {
      id: achievementId, // Backend expects 'id' parameter
    });
    return response.data;
  } catch (error) {
    console.error("Error posting badge:", error);
    throw error;
  }
};

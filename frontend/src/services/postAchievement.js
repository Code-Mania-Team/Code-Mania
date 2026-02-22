import gameAxios from "../api/gameAxios";

export async function postAchievement({ achievementId }) {
  try {
    const response = await gameAxios.post("/v1/achievements/post-badge", {
      achievementId: achievementId,
    });

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error saving achievement:",
      error.response?.data || error,
    );
    throw error;
  }
}

import gameAxios from "../api/gameAxios";

export async function postGameProgress({
  questId,
  xp,
  programming_language,
}) {
  try {
    const response = await gameAxios.post("/v1/game-data", {
      exercise_id: Number(questId),
      xp_earned: Number(xp ?? 0),
      programming_language:
        programming_language,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error saving game progress:", error.response?.data || error);
    throw error;
  }
}

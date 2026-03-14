import { axiosPublic } from "../api/axios";

const GUEST_PROGRESS_KEY = "guestProgress:v1";

export const readGuestProgress = () => {
  try {
    const payload = JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY) || "null");
    if (!payload || typeof payload !== "object") return null;
    if (!payload.completedByLang || typeof payload.completedByLang !== "object") return null;
    return payload;
  } catch {
    return null;
  }
};

export const clearGuestProgress = () => {
  try {
    localStorage.removeItem(GUEST_PROGRESS_KEY);
  } catch {
    // ignore
  }
};

const migrateGuestProgress = async () => {
  const payload = readGuestProgress();
  if (!payload) return { migrated: 0, results: [] };

  const completedByLang = payload.completedByLang;
  const entries = Object.entries(completedByLang);

  let migrated = 0;
  const results = [];

  for (const [langId, questIds] of entries) {
    const programming_language_id = Number(langId);
    const completedQuestIds = Array.isArray(questIds) ? questIds : [];
    if (!Number.isFinite(programming_language_id) || completedQuestIds.length === 0) continue;

    const res = await axiosPublic.post(
      "/v1/game/migrate-guest",
      { programming_language_id, completedQuestIds },
      { withCredentials: true }
    );

    const data = res?.data || {};
    const count = Number(data?.migrated || 0);
    migrated += Number.isFinite(count) ? count : 0;
    results.push(data);
  }

  if (migrated > 0) {
    clearGuestProgress();
  }

  return { migrated, results };
};

export default migrateGuestProgress;

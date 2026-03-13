const STORAGE_KEY = "guestProgressV1";

// We prefer localStorage so guest progress survives browser restarts.
// For backward compatibility, we still read from sessionStorage if needed.
const readRaw = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeRaw = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
};

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getGuestProgress = () => {
  try {
    const raw = readRaw();
    const parsed = safeParse(raw);
    const completedQuestIds = Array.isArray(parsed?.completedQuestIds)
      ? parsed.completedQuestIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      : [];

    return {
      completedQuestIds: Array.from(new Set(completedQuestIds)),
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return { completedQuestIds: [], updatedAt: null };
  }
};

export const getGuestCompletedQuestIds = () => {
  return getGuestProgress().completedQuestIds;
};

export const recordGuestQuestComplete = (questId) => {
  const id = Number(questId);
  if (!Number.isFinite(id)) return;

  try {
    const current = getGuestProgress();
    const next = {
      completedQuestIds: Array.from(new Set([...(current.completedQuestIds || []), id])),
      updatedAt: new Date().toISOString(),
    };
    writeRaw(JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const clearGuestProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

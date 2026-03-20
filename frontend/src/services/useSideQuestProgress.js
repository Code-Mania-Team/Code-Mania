import { useCallback, useEffect, useMemo, useState } from "react";
import { axiosPublic } from "../api/axios";

const normalizeTag = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "multipication") return "multiplication";
  return normalized;
};

const getQuestTags = (quest) => {
  const direct = normalizeTag(quest?.tag);
  return direct ? [direct] : [];
};

const useSideQuestProgress = ({
  enabled = true,
  isAdmin = false,
  languageSlug = "",
  programmingLanguageId = null,
} = {}) => {
  const [sideQuests, setSideQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localStatusByQuestId, setLocalStatusByQuestId] = useState({});

  const applyLocalOverrides = useCallback(
    (list) => {
      if (!isAdmin) return list;
      return (Array.isArray(list) ? list : []).map((quest) => {
        const key = Number(quest?.quest_id);
        const override = Number.isFinite(key) ? localStatusByQuestId[key] : null;
        if (!override) return quest;
        return {
          ...quest,
          userStatus: override.status,
          completedAt: override.completedAt || null,
          xpAwarded: Number(override.xpAwarded || 0),
        };
      });
    },
    [isAdmin, localStatusByQuestId]
  );

  const refreshSideQuests = useCallback(async () => {
    if (!enabled) {
      setSideQuests([]);
      return [];
    }

    setLoading(true);
    try {
      const params = {};
      const langId = Number(programmingLanguageId);
      if (Number.isFinite(langId) && langId > 0) {
        params.programming_language_id = langId;
      } else {
        const slug = String(languageSlug || "").trim().toLowerCase();
        if (slug) params.language = slug;
      }

      const response = await axiosPublic.get("/v1/side-quests/active", { params });
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      const merged = applyLocalOverrides(list);
      setSideQuests(merged);
      return merged;
    } catch {
      setSideQuests([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [applyLocalOverrides, enabled, languageSlug, programmingLanguageId]);

  const markLocalStatus = useCallback((questId, status, xpAwarded = 0) => {
    if (!isAdmin) return sideQuests;

    const numericId = Number(questId);
    if (!Number.isFinite(numericId) || numericId <= 0) return sideQuests;

    const normalizedStatus = status === "completed" ? "completed" : "in_progress";
    const completedAt = normalizedStatus === "completed" ? new Date().toISOString() : null;
    const numericXp = Math.max(0, Number(xpAwarded || 0));

    setLocalStatusByQuestId((prev) => ({
      ...prev,
      [numericId]: {
        status: normalizedStatus,
        completedAt,
        xpAwarded: normalizedStatus === "completed" ? numericXp : 0,
      },
    }));

    const updatedList = (Array.isArray(sideQuests) ? sideQuests : []).map((quest) =>
      Number(quest?.quest_id) === numericId
        ? {
            ...quest,
            userStatus: normalizedStatus,
            completedAt,
            xpAwarded: normalizedStatus === "completed" ? numericXp : 0,
          }
        : quest
    );

    setSideQuests(updatedList);
    return updatedList;
  }, [isAdmin, sideQuests]);

  const acceptRequiredByTags = useCallback(
    async (tags) => {
      if (!enabled) return [];

      const normalizedRequired = Array.from(
        new Set((Array.isArray(tags) ? tags : []).map((tag) => normalizeTag(tag)).filter(Boolean))
      );
      if (!normalizedRequired.length) {
        return sideQuests;
      }

      const acceptedIds = [];

      for (const tag of normalizedRequired) {
        const row = sideQuests.find((quest) => getQuestTags(quest).includes(tag)) || null;
        const status = String(row?.userStatus || "not_started");
        if (!row?.quest_id || status === "in_progress" || status === "completed") continue;

        if (isAdmin) {
          acceptedIds.push(Number(row.quest_id));
          continue;
        }

        try {
          await axiosPublic.post(`/v1/side-quests/${row.quest_id}/accept`);
        } catch {
          // Best effort.
        }
      }

      if (isAdmin) {
        if (acceptedIds.length) {
          const acceptedSet = new Set(acceptedIds.filter((id) => Number.isFinite(id) && id > 0));
          const now = new Date().toISOString();

          setLocalStatusByQuestId((prev) => {
            const next = { ...prev };
            acceptedSet.forEach((id) => {
              next[id] = {
                status: "in_progress",
                completedAt: null,
                xpAwarded: 0,
                updatedAt: now,
              };
            });
            return next;
          });

          const updatedList = sideQuests.map((quest) => {
            const id = Number(quest?.quest_id);
            if (!acceptedSet.has(id)) return quest;
            return {
              ...quest,
              userStatus: "in_progress",
              completedAt: null,
              xpAwarded: 0,
            };
          });

          setSideQuests(updatedList);
          return updatedList;
        }

        return sideQuests;
      }
      return refreshSideQuests();
    },
    [enabled, isAdmin, refreshSideQuests, sideQuests]
  );

  useEffect(() => {
    refreshSideQuests();
  }, [refreshSideQuests]);

  const completedTags = useMemo(() => {
    const tags = new Set();
    sideQuests.forEach((quest) => {
      if (String(quest?.userStatus || "") !== "completed") return;
      getQuestTags(quest).forEach((tag) => tags.add(tag));
    });
    return tags;
  }, [sideQuests]);

  return {
    sideQuests,
    loading,
    completedTags,
    refreshSideQuests,
    acceptRequiredByTags,
    markLocalStatus,
  };
};

export default useSideQuestProgress;

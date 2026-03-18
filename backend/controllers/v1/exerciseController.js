import ExerciseModel from "../../models/exercises.js";
import axios from "axios";
import Notification from "../../models/notification.js";
import QuizModel from "../../models/quiz.js";
import { getTotalXpEarned } from "../../services/xpService.js";

const TERMINAL_API_BASE_URL =
  process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

const parseJsonIfString = (value, fieldName) => {
  if (value === undefined) return value;
  if (value === null) return null;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const message = err?.message ? `: ${err.message}` : "";
    const error = new Error(`${fieldName} must be valid JSON${message}`);
    error.statusCode = 400;
    throw error;
  }
};

class ExerciseController {
  constructor() {
    this.exerciseModel = new ExerciseModel();
    this.notificationModel = new Notification();
    this.quizModel = new QuizModel();
  }

  async maybeTriggerNotifications({ userId, quest, beforeXp, afterXp }) {
    if (!userId || !quest) return;
    const langSlug = quest?.programming_languages?.slug || null;

    // XP milestone notifications (selected milestones)
    const before = Number(beforeXp || 0);
    const after = Number(afterXp || 0);
    const milestones = [1000, 5000, 10000];
    for (const milestone of milestones) {
      if (before < milestone && after >= milestone) {
        await this.notificationModel.createOnce({
          user_id: userId,
          type: "xp_milestone",
          title: `Milestone reached: ${milestone.toLocaleString()} XP`,
          message: "Keep going - your next unlock is closer than you think.",
          metadata: {
            milestone_xp: milestone,
            href: "/dashboard",
          },
          dedupe_key: `xp_milestone_${milestone}`,
        });
      }
    }

    // Quiz reminder at stage boundaries (every 4 quests)
    const orderIndex = Number(quest?.order_index);
    const languageId = Number(quest?.programming_language_id);
    const isBoundary = Number.isFinite(orderIndex) && orderIndex > 0 && orderIndex % 4 === 0;

    if (isBoundary && Number.isFinite(languageId) && langSlug) {
      const stageNumber = Math.floor(orderIndex / 4);
      try {
        const quiz = await this.quizModel.getQuizByLanguageAndStage({
          programmingLanguageId: languageId,
          stageNumber,
          select: "id, route",
        });

        const hasAttempt = await this.quizModel.hasUserAttempt({ userId, quizId: quiz?.id });
        if (!hasAttempt) {
          await this.notificationModel.createOnce({
            user_id: userId,
            type: "system",
            title: `Quiz unlocked: ${langSlug.toUpperCase()} Stage ${stageNumber}`,
            message: "Take the quiz now to lock in what you just learned.",
            metadata: {
              language: langSlug,
              stage: stageNumber,
              kind: "quiz_reminder",
              href: `/quiz/${encodeURIComponent(langSlug)}/${encodeURIComponent(String(stageNumber))}`,
            },
            dedupe_key: `quiz_reminder_${langSlug}_stage_${stageNumber}`,
          });
        }
      } catch {
        // If the quiz doesn't exist yet, skip silently.
      }
    }
  }

  // Validate quest output without marking completion (for "Run" checks)
  async validateExercisePreview(req, res) {
    try {
      const { questId, output, code } = req.body;
      const userId = res.locals.user_id || null;
      // Preview validation is used to show test cases on Run / page load.
      // It intentionally does NOT mark completion or award XP.

      // if (!userId) {
      //   return res.status(401).json({
      //     success: false,
      //     message: "Authentication required",
      //   });
      // }

      if (!questId || typeof output !== "string") {
        return res.status(400).json({
          success: false,
          message: "questId and output are required",
        });
      }

      const quest = await this.exerciseModel.getExerciseById(questId);
      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Quest not found",
        });
      }

      const { data: validationResult } = await axios.post(
        `${TERMINAL_API_BASE_URL}/exercise/validate`,
        {
          output,
          code,
          quest: {
            expected_output: quest.expected_output,
            validation_mode: quest.validation_mode,
            requirements: quest.requirements,
          },
          programming_language_id: quest.programming_language_id,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_KEY,
          },
        }
      );

      const ok = Boolean(validationResult?.success);

      return res.status(200).json({
        success: ok,
        message: ok ? "Validation passed" : (validationResult?.message || "Validation failed"),
        objectives: validationResult?.objectives || null,
        test_results: validationResult?.test_results || [],
        runtime_passed: validationResult?.runtime_passed ?? null,
      });
    } catch (error) {
      console.error("validateExercisePreview error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Create a new exercise (admin only)
  async createExercise(req, res) {
    try {
      const {
        title,
        description,
        task,
        lesson_header,
        lesson_example,
        starting_code,
        hints,
        requirements,
        validation_mode,
        experience,
        programming_language_id,
        dialogue_id,
        grants,
        achievements_id,
        mapKey,
      } = req.body;

      const normalizedRequirements = parseJsonIfString(
        requirements,
        "requirements",
      );

      // Validate required fields
      if (!title || !description || !task || !programming_language_id) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: title, description, task, programming_language_id",
        });
      }

      // Validate programming_language_id is a number
      if (isNaN(programming_language_id)) {
        return res.status(400).json({
          success: false,
          message: "programming_language_id must be a valid number",
        });
      }

      const exerciseData = {
        title,
        description,
        task,
        lesson_header,
        lesson_example,
        starting_code,
        hints,
        requirements: normalizedRequirements,
        validation_mode,
        experience,
        programming_language_id: parseInt(programming_language_id),
        dialogue_id,
        grants,
        achievements_id,
        mapKey,
      };

      const newExercise = await this.exerciseModel.createExercise(exerciseData);

      res.status(201).json({
        success: true,
        message: "Exercise created successfully",
        data: {
          id: newExercise.id,
          title: newExercise.title,
          description: newExercise.description,
          task: newExercise.task,
          programming_language_id: newExercise.programming_language_id,
          experience: newExercise.experience,
          mapKey: newExercise.mapKey,
          created_at: newExercise.created_at,
        },
      });
    } catch (error) {
      console.error("Error in createExercise:", error);
      const status = error?.statusCode || 500;
      res.status(status).json({
        success: false,
        message:
          status === 400
            ? error.message
            : "Internal server error while creating exercise",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get all exercises (admin only)
  async getAllExercises(req, res) {
    try {
      const exercises = await this.exerciseModel.getAllExercises();

      res.status(200).json({
        success: true,
        message: "Exercises retrieved successfully",
        data: exercises,
      });
    } catch (error) {
      console.error("Error in getAllExercises:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving exercises",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get exercise by ID (admin only)
  async getExerciseById(req, res) {
    try {
      const { id } = req.params;
      const userId = res.locals.user_id;
      const isAdmin =
        res.locals.role === "admin" ||
        (await this.exerciseModel.isAdminUser(userId));

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exercise id",
        });
      }

      const exercise = await this.exerciseModel.getExerciseById(id);

      // ❌ Quest does not exist
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      if (isAdmin) {
        return res.status(200).json({
          success: true,
          data: exercise,
        });
      }

      // If not logged in → allow first quest only
      // If not logged in → allow first TWO quests
      if (!userId) {

        if (exercise.order_index <= 2) {
          return res.status(200).json({
            success: true,
            data: exercise,
          });
        }

        return res.status(403).json({
          success: false,
          message: "Authentication required",
        });
      }

      // 🟢 First quest always allowed
      if (exercise.order_index === 1) {
        return res.status(200).json({
          success: true,
          data: exercise,
        });
      }

      const isCompleted = await this.exerciseModel.isQuestCompleted(userId, id);

      if (isCompleted) {
        return res.status(200).json({
          success: true,
          data: exercise,
        });
      }

      const latestAllowed = await this.exerciseModel.getLatestUnlockedQuest(
        userId,
        exercise.programming_language_id,
      );

      if (!latestAllowed) {
        return res.status(403).json({
          success: false,
          message: "Quest locked",
        });
      }

      if (latestAllowed.id === exercise.id) {
        return res.status(200).json({
          success: true,
          data: exercise,
        });
      }

      return res.status(403).json({
        success: false,
        message: "Quest locked",
        redirectTo: latestAllowed.id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async getNextExercise(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exercise ID",
        });
      }

      const current = await this.exerciseModel.getExerciseById(id);

      if (!current) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      const next = await this.exerciseModel.getNextExercise(
        current.programming_language_id,
        current.order_index,
      );

      if (!next) {
        return res.status(200).json({
          success: true,
          data: null, // 🔥 IMPORTANT
          message: "No more exercises",
        });
      }

      return res.status(200).json({
        success: true,
        data: next,
      });
    } catch (error) {
      console.error("getNextExercise error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update exercise (admin only)
  async updateExercise(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exercise ID",
        });
      }

      // Check if exercise exists
      const existingExercise = await this.exerciseModel.getExerciseById(id);
      if (!existingExercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      // Get only the fields that are provided in the request body
      const updateFields = {};
      const allowedFields = [
        "title",
        "description",
        "task",
        "lesson_header",
        "lesson_example",
        "starting_code",
        "hints",
        "requirements",
        "validation_mode",
        "experience",
        "programming_language_id",
        "dialogue_id",
        "grants",
        "achievements_id",
      ];

      // Build update object with only provided fields
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });

      if (updateFields.requirements !== undefined) {
        updateFields.requirements = parseJsonIfString(
          updateFields.requirements,
          "requirements",
        );
      }

      // Check if at least one field is being updated
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields provided for update",
        });
      }

      const updatedExercise = await this.exerciseModel.updateExercise(
        id,
        updateFields,
      );

      res.status(200).json({
        success: true,
        message: "Exercise updated successfully",
        data: updatedExercise,
      });
    } catch (error) {
      console.error("Error in updateExercise:", error);
      const status = error?.statusCode || 500;
      res.status(status).json({
        success: false,
        message:
          status === 400
            ? error.message
            : "Internal server error while updating exercise",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Delete exercise (admin only)
  async deleteExercise(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exercise ID",
        });
      }

      // Check if exercise exists
      const existingExercise = await this.exerciseModel.getExerciseById(id);
      if (!existingExercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      const deletedExercise = await this.exerciseModel.deleteExercise(id);

      res.status(200).json({
        success: true,
        message: "Exercise deleted successfully",
        data: deletedExercise,
      });
    } catch (error) {
      console.error("Error in deleteExercise:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while deleting exercise",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get exercises by programming language (admin only)
  async getExercisesByLanguage(req, res) {
    try {
      const { programming_language_id } = req.params;

      if (isNaN(programming_language_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid programming language ID",
        });
      }

      const exercises = await this.exerciseModel.getExercisesByLanguage(
        programming_language_id,
      );

      res.status(200).json({
        success: true,
        message: "Exercises retrieved successfully",
        data: exercises,
      });
    } catch (error) {
      console.error("Error in getExercisesByLanguage:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving exercises",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async getLatestUnlocked(req, res) {
    try {
      const userId = res.locals.user_id;
      const { programming_language_id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const latest = await this.exerciseModel.getLatestUnlockedQuest(
        userId,
        parseInt(programming_language_id),
      );

      return res.status(200).json({
        success: true,
        data: latest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  // Validate quest output
  async validateExercise(req, res) {
    try {
      const { questId, output, code } = req.body;

      const userId = res.locals.user_id || null;

      let alreadyCompleted = false;

      const isAdmin =
        res.locals.role === "admin" ||
        (userId && (await this.exerciseModel.isAdminUser(userId)));

      if (!questId || typeof output !== "string") {
        return res.status(400).json({
          success: false,
          message: "questId and output are required",
        });
      }

      // 1️⃣ Get quest
      const quest = await this.exerciseModel.getExerciseById(questId);

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Quest not found",
        });
      }

      // 2️⃣ Logged users must have started quest
      if (!isAdmin && userId) {
        const questState = await this.exerciseModel.getQuestState(
          userId,
          questId
        );

        alreadyCompleted = questState?.status === "completed";

        if (!questState || (questState.status !== "active" && !alreadyCompleted)) {
          return res.status(403).json({
            success: false,
            message: "You must start this quest first",
          });
        }
      }

      // 3️⃣ Run validation engine
      const { data: validationResult } = await axios.post(
        `${TERMINAL_API_BASE_URL}/exercise/validate`,
        {
          output,
          code,
          quest: {
            expected_output: quest.expected_output,
            validation_mode: quest.validation_mode,
            requirements: quest.requirements,
          },
          programming_language_id: quest.programming_language_id,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_KEY,
          },
        }
      );

      // ❌ Validation failed
      if (!validationResult?.success) {
        return res.status(200).json({
          success: false,
          objectives: validationResult?.objectives || null,
          test_results: validationResult?.test_results || [],
          runtime_passed: validationResult?.runtime_passed ?? null,
          message: validationResult?.message,
        });
      }

      // ==================================================
      // 🎮 PROGRESSION CHECK (LOGGED USERS ONLY)
      // ==================================================

      if (!isAdmin && userId) {
        const previousQuest = await this.exerciseModel.getPreviousQuest(quest);

        if (previousQuest) {
          const prevCompleted = await this.exerciseModel.isQuestCompleted(
            userId,
            previousQuest.id
          );

          if (!prevCompleted) {
            return res.status(403).json({
              success: false,
              message: "Complete previous quest first",
            });
          }
        }
      }

      // ==================================================
      // 🏆 MARK COMPLETE (LOGGED USERS ONLY)
      // ==================================================

      if (!isAdmin && userId && !alreadyCompleted) {
        const beforeXp = await getTotalXpEarned(userId);
        await this.exerciseModel.markQuestComplete(userId, questId);

        await this.exerciseModel.addXp(userId, quest.experience);

        const afterXp = Number(beforeXp || 0) + Number(quest.experience || 0);
        try {
          await this.maybeTriggerNotifications({ userId, quest, beforeXp, afterXp });
        } catch (err) {
          // Notifications are best-effort; do not fail quest completion.
          console.error("Notification trigger failed:", err);
        }

        if (quest.achievements_id) {
          await this.exerciseModel.grantAchievement(
            userId,
            quest.achievements_id
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: userId
          ? alreadyCompleted
            ? "Quest already completed"
            : "Quest completed"
          : "Quest validated (guest preview)",
        xp: userId && !alreadyCompleted ? quest.experience : 0,
        objectives: validationResult?.objectives || null,
        test_results: validationResult?.test_results || [],
        runtime_passed: validationResult?.runtime_passed ?? null,
      });

    } catch (error) {
      console.error("validateExercise error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async startExercise(req, res) {
    try {
      const userId = res.locals.user_id || null;
      const isAdmin =
        res.locals.role === "admin" ||
        (userId && (await this.exerciseModel.isAdminUser(userId)));
      const { questId } = req.body;

      if (!questId) {
        return res.status(400).json({ success: false, message: "questId is required" });
      }

      const quest = await this.exerciseModel.getExerciseById(questId);
      if (!quest) {
        return res.status(404).json({ success: false, message: "Quest not found" });
      }

      // Guest mode: allow starting Exercises 1-2 without DB writes.
      if (!userId) {
        if (quest.order_index <= 2) {
          return res.status(200).json({ success: true, message: "Quest start acknowledged (guest)" });
        }
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      if (isAdmin) {
        return res.status(200).json({ success: true });
      }

      await this.exerciseModel.startQuest(userId, questId);

      return res.status(200).json({ success: true });
    } catch (err) {
      const message = String(err?.message || "");

      if (
        err?.code === "23505" ||
        (err?.code === "42703" && message.includes("users_game_data.id"))
      ) {
        // Legacy/parallel-safe fallback: do not block quest start in client flow
        return res.status(200).json({
          success: true,
          message: "Quest start acknowledged",
        });
      }

      console.error(err);
      return res.status(500).json({ success: false, message });
    }
  }
}

export default ExerciseController;

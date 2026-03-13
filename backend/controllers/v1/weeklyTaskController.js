import WeeklyTask from "../../models/weeklyTask.js";
import WeeklyTaskService from "../../services/weeklyTaskService.js";

class WeeklyTaskController {
  constructor() {
    this.model = new WeeklyTask();
    this.service = new WeeklyTaskService();
  }

  // ── Admin: create a weekly task ──────────────────────────────
  async createTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { title, description, reward_xp, reward_badge, difficulty, language, starter_code, test_cases, solution_code, min_xp_required, starts_at, expires_at } = req.body || {};

      if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required." });
      }

      const task = await this.model.createTask({
        title,
        description,
        reward_xp,
        reward_badge,
        difficulty,
        language,
        starter_code,
        test_cases,
        solution_code,
        min_xp_required,
        starts_at,
        expires_at,
        created_by: user_id,
      });

      res.json({ success: true, message: "Weekly task created successfully", data: task });
    } catch (err) {
      console.error("Error creating weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to create weekly task." });
    }
  }

  // ── Admin: update a weekly task ──────────────────────────────
  async updateTask(req, res) {
    try {
      const { task_id } = req.params;
      const fields = req.body || {};

      const task = await this.model.updateTask(Number(task_id), fields);
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found." });
      }

      res.json({ success: true, message: "Weekly task updated", data: task });
    } catch (err) {
      console.error("Error updating weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update weekly task." });
    }
  }

  // ── Admin: delete a weekly task ──────────────────────────────
  async deleteTask(req, res) {
    try {
      const { task_id } = req.params;
      await this.model.deleteTask(Number(task_id));
      res.json({ success: true, message: "Weekly task deleted" });
    } catch (err) {
      console.error("Error deleting weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to delete weekly task." });
    }
  }

  // ── Admin: get all tasks ─────────────────────────────────────
  async getAllTasks(req, res) {
    try {
      const tasks = await this.model.getAllTasks();
      res.json({ success: true, data: tasks });
    } catch (err) {
      console.error("Error fetching all tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
    }
  }

  // ── User: get active tasks (only if user has 5k+ XP) ────────
  async getActiveTasks(req, res) {
    try {
      const user_id = res.locals.user_id;

      const tasks = await this.model.getActiveTasks();
      const progress = await this.model.getUserTaskProgress(user_id);

      // Map progress onto tasks
      const progressMap = {};
      for (const p of progress) {
        progressMap[p.task_id] = p;
      }

      const tasksWithProgress = tasks.map((task) => ({
        ...task,
        userStatus: progressMap[task.task_id]?.status || "not_started",
        completedAt: progressMap[task.task_id]?.completed_at || null,
        xpAwarded: progressMap[task.task_id]?.xp_awarded || 0,
      }));

      res.json({ success: true, data: tasksWithProgress });
    } catch (err) {
      console.error("Error fetching active tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
    }
  }

  // ── User: fetch one weekly task (safe) ───────────────────────
  async getTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const task = await this.service.getTaskSafe({ taskId, userId: user_id });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      return res.json({ success: true, data: task });
    } catch (err) {
      console.error("Error fetching weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch task." });
    }
  }

  // ── User: submit weekly task code (runs tests) ───────────────
  async submitTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const code = req.body?.code;
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ success: false, message: "code is required" });
      }

      const result = await this.service.submit({ userId: user_id, taskId, code });
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error("Error submitting weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to submit task." });
    }
  }

  // ── Public: list past challenges w/ participants + winners ───
  async listPast(req, res) {
    try {
      const limitRaw = req.query.limit ? Number(req.query.limit) : 30;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

      const tasks = await this.model.getPastTasks({ limit });

      const enriched = await Promise.all(
        (tasks || []).map(async (t) => {
          const [participantsCount, winners] = await Promise.all([
            this.model.countParticipants({ taskId: t.task_id }),
            this.model.listWinners({ taskId: t.task_id }),
          ]);

          return {
            ...t,
            participants_count: participantsCount,
            winners: (winners || []).map((w) => ({
              user_id: w.user_id,
              rank: w.rank,
              note: w.note,
              username: w.users?.username || null,
              character_id: w.users?.character_id ?? null,
            })),
          };
        })
      );

      return res.json({ success: true, data: enriched });
    } catch (err) {
      console.error("Error listing past weekly tasks:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch past challenges." });
    }
  }

  // ── Public: list participants for a past challenge ───────────
  async listParticipants(req, res) {
    try {
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const limitRaw = req.query.limit ? Number(req.query.limit) : 200;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

      const rows = await this.model.listParticipants({ taskId, limit });

      const participants = (rows || []).map((r) => ({
        user_id: r.user_id,
        username: r.users?.username || null,
        character_id: r.users?.character_id ?? null,
        status: r.status,
        xp_awarded: r.xp_awarded || 0,
        completed_at: r.completed_at || null,
        created_at: r.created_at || null,
      }));

      return res.json({ success: true, data: participants });
    } catch (err) {
      console.error("Error listing weekly task participants:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch participants." });
    }
  }

  // ── Admin: set winners (handpicked) ──────────────────────────
  async setWinners(req, res) {
    try {
      const pickedBy = res.locals.user_id;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const winnersRaw = req.body?.winners;
      if (!Array.isArray(winnersRaw)) {
        return res.status(400).json({ success: false, message: "winners must be an array" });
      }

      // Allow sending either user_id or username.
      const wantedUsernames = winnersRaw
        .map((w) => (w?.username ? String(w.username).trim() : ""))
        .filter(Boolean);

      const users = wantedUsernames.length
        ? await this.model.getUsersByUsernames(wantedUsernames)
        : [];
      const userIdByUsername = new Map(users.map((u) => [String(u.username || "").trim(), u.user_id]));

      const normalized = winnersRaw
        .map((w, idx) => {
          const user_id = Number(w?.user_id) || userIdByUsername.get(String(w?.username || "").trim()) || null;
          const rank = w?.rank ?? idx + 1;
          const note = w?.note ?? null;
          return { user_id, rank, note };
        })
        .filter((w) => w.user_id);

      await this.model.replaceWinners({ taskId, pickedBy, winners: normalized });
      const winners = await this.model.listWinners({ taskId });

      return res.json({
        success: true,
        message: "Winners updated",
        data: (winners || []).map((w) => ({
          user_id: w.user_id,
          rank: w.rank,
          note: w.note,
          username: w.users?.username || null,
          character_id: w.users?.character_id ?? null,
        })),
      });
    } catch (err) {
      console.error("Error setting weekly task winners:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to set winners." });
    }
  }

  // ── User: accept a task ──────────────────────────────────────
  async acceptTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { task_id } = req.params;

      const result = await this.model.acceptTask(user_id, Number(task_id));
      res.json({ success: true, message: "Task accepted", data: result });
    } catch (err) {
      console.error("Error accepting task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to accept task." });
    }
  }

  // ── User: complete a task ────────────────────────────────────
  async completeTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { task_id } = req.params;
      const { xp_awarded } = req.body || {};

      const result = await this.model.completeTask(user_id, Number(task_id), xp_awarded);
      res.json({ success: true, message: "Task completed!", data: result });
    } catch (err) {
      console.error("Error completing task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to complete task." });
    }
  }
}

export default WeeklyTaskController;

import MonthlyTask from "../../models/monthlyTask.js";

class MonthlyTaskController {
  constructor() {
    this.model = new MonthlyTask();
  }

  // ── Admin: create a monthly task ─────────────────────────────
  async createTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const {
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
      } = req.body || {};

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

      res.json({ success: true, message: "Monthly task created successfully", data: task });
    } catch (err) {
      console.error("Error creating monthly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to create monthly task." });
    }
  }

  // ── Admin: update a monthly task ─────────────────────────────
  async updateTask(req, res) {
    try {
      const { task_id } = req.params;
      const fields = req.body || {};

      const task = await this.model.updateTask(Number(task_id), fields);
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found." });
      }

      res.json({ success: true, message: "Monthly task updated", data: task });
    } catch (err) {
      console.error("Error updating monthly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update monthly task." });
    }
  }

  // ── Admin: delete a monthly task ─────────────────────────────
  async deleteTask(req, res) {
    try {
      const { task_id } = req.params;
      await this.model.deleteTask(Number(task_id));
      res.json({ success: true, message: "Monthly task deleted" });
    } catch (err) {
      console.error("Error deleting monthly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to delete monthly task." });
    }
  }

  // ── Admin: get all tasks ─────────────────────────────────────
  async getAllTasks(req, res) {
    try {
      const tasks = await this.model.getAllTasks();
      res.json({ success: true, data: tasks });
    } catch (err) {
      console.error("Error fetching all monthly tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
    }
  }

  // ── User: get active tasks ───────────────────────────────────
  async getActiveTasks(req, res) {
    try {
      const user_id = res.locals.user_id;

      const tasks = await this.model.getActiveTasks();
      const progress = await this.model.getUserTaskProgress(user_id);

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
      console.error("Error fetching active monthly tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
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
      const status = Number(err?.status) || 500;
      console.error("Error accepting monthly task:", err);
      res.status(status).json({ success: false, message: err.message || "Failed to accept task." });
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
      console.error("Error completing monthly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to complete task." });
    }
  }
}

export default MonthlyTaskController;

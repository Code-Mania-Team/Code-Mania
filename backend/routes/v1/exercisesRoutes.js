import { Router } from "express";
import ExerciseModel from "../../models/exercises.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
const router = Router();
// Get exercises for a course (public - only published exercises)
router.get("/exercises/:course", async (req, res) => {
  try {
    const { course } = req.params;
    if (!["python", "javascript", "cpp"].includes(course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course. Must be python, javascript, or cpp",
      });
    }
    const exercises = await ExerciseModel.getExercises(course, false);
    res.json({ success: true, data: exercises });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Get all exercises for admin (includes drafts)
router.get("/admin/exercises", requireAdmin, async (req, res) => {
  try {
    const { course } = req.query;
    if (course && !["python", "javascript", "cpp"].includes(course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course. Must be python, javascript, or cpp",
      });
    }
    let exercises;
    if (course) {
      exercises = await ExerciseModel.getExercises(course, true);
    } else {
      // Get all exercises from all courses
      const allExercises = [];
      for (const courseName of ["python", "javascript", "cpp"]) {
        const courseExercises = await ExerciseModel.getExercises(
          courseName,
          true,
        );
        allExercises.push(...courseExercises);
      }
      exercises = allExercises;
    }
    res.json({ success: true, data: exercises });
  } catch (error) {
    console.error("Error fetching admin exercises:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Get datasets summary for admin dashboard
router.get("/admin/datasets", requireAdmin, async (req, res) => {
  try {
    const summary = await ExerciseModel.getDatasetsSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching datasets summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Get single exercise
router.get("/admin/exercises/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await ExerciseModel.getExercise(id);
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }
    res.json({ success: true, data: exercise });
  } catch (error) {
    console.error("Error fetching exercise:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Create new exercise
router.post("/admin/exercises", requireAdmin, async (req, res) => {
  try {
    const exerciseData = req.body;
    // Validate required fields
    const requiredFields = [
      "course",
      "exercise_id",
      "title",
      "validation_mode",
      "dialogue",
    ];
    for (const field of requiredFields) {
      if (!exerciseData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }
    if (!["python", "javascript", "cpp"].includes(exerciseData.course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course. Must be python, javascript, or cpp",
      });
    }
    const newExercise = await ExerciseModel.createExercise(exerciseData);
    res.status(201).json({ success: true, data: newExercise });
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Update exercise
router.put("/admin/exercises/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const exerciseData = req.body;
    // Check if exercise exists
    const existingExercise = await ExerciseModel.getExercise(id);
    if (!existingExercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }
    const updatedExercise = await ExerciseModel.updateExercise(
      id,
      exerciseData,
    );
    res.json({ success: true, data: updatedExercise });
  } catch (error) {
    console.error("Error updating exercise:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Delete exercise
router.delete("/admin/exercises/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if exercise exists
    const existingExercise = await ExerciseModel.getExercise(id);
    if (!existingExercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }
    await ExerciseModel.deleteExercise(id);
    res.json({ success: true, message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Bulk import exercises (for migration from JSON)
router.post(
  "/admin/exercises/import/:course",
  requireAdmin,
  async (req, res) => {
    try {
      const { course } = req.params;
      const { exercises } = req.body;
      if (!["python", "javascript", "cpp"].includes(course)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course. Must be python, javascript, or cpp",
        });
      }
      if (!Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Exercises must be a non-empty array",
        });
      }
      const importedExercises = await ExerciseModel.bulkImportExercises(
        course,
        exercises,
      );
      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedExercises.length} exercises`,
        data: importedExercises,
      });
    } catch (error) {
      console.error("Error importing exercises:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
);
export default router;

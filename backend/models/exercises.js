import { supabase } from "../core/supabaseClient.js";
class ExerciseModel {
  // Get all exercises for a course (admin can see drafts, public only published)
  static async getExercises(course, includeDrafts = false) {
    try {
      let query = supabase
        .from("exercises")
        .select("*")
        .eq("course", course)
        .order("order_index", { ascending: true });
      if (!includeDrafts) {
        query = query.eq("status", "published");
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
  }
  // Get single exercise by ID
  static async getExercise(id) {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching exercise:", error);
      throw error;
    }
  }
  // Create new exercise
  static async createExercise(exerciseData) {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([exerciseData])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating exercise:", error);
      throw error;
    }
  }
  // Update exercise
  static async updateExercise(id, exerciseData) {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .update(exerciseData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
  }
  // Delete exercise
  static async deleteExercise(id) {
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  }
  // Get exercise datasets summary for admin dashboard
  static async getDatasetsSummary() {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("course, status, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      // Group by course and count status
      const summary = {};
      data.forEach((exercise) => {
        if (!summary[exercise.course]) {
          summary[exercise.course] = {
            total: 0,
            published: 0,
            draft: 0,
            lastUpdated: null,
          };
        }
        summary[exercise.course].total++;
        summary[exercise.course][exercise.status]++;
        if (
          !summary[exercise.course].lastUpdated ||
          new Date(exercise.updated_at) >
            new Date(summary[exercise.course].lastUpdated)
        ) {
          summary[exercise.course].lastUpdated = exercise.updated_at;
        }
      });
      return summary;
    } catch (error) {
      console.error("Error fetching datasets summary:", error);
      throw error;
    }
  }
  // Bulk import exercises from JSON (for migration)
  static async bulkImportExercises(course, exercises) {
    try {
      const exercisesWithMetadata = exercises.map((exercise, index) => ({
        ...exercise,
        course,
        order_index: index + 1,
        status: "published",
      }));
      const { data, error } = await supabase
        .from("exercises")
        .insert(exercisesWithMetadata)
        .select();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error bulk importing exercises:", error);
      throw error;
    }
  }
}
export default ExerciseModel;

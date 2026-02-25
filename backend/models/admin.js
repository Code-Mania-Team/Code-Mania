import { supabase } from "../core/supabaseClient.js";
import dayjs from "dayjs";

class AdminModel {
  constructor() {
    this.db = supabase;
  }

  async getTotalUsers() {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count;
  }

  async getNewUsersSince(days) {
    const date = dayjs().subtract(days, "day").toISOString();

    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", data);
    if (error) throw error;
    return count;
  }

  async getSignupsPerDayLastWeek() {
    const start = dayjs().subtract(7, "day").startOf("day").toISOString();

    const { data, error } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", start);

    if (error) throw error;
    return data;
  }
}

export default AdminModel;

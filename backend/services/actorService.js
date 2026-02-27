import { supabase } from "../core/supabaseClient.js";

class ActorService {
  async isAdmin(userId, tokenRole) {
    if (tokenRole === "admin") return true;
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return false;
      return data?.role === "admin";
    } catch {
      return false;
    }
  }
}

export default ActorService;

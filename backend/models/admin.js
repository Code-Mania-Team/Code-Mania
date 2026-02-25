import { supabase } from "../core/supabaseClient.js";
import dayjs from "dayjs";

class AdminModel {
  constructor() {
    this.db = supabase;
  }
}

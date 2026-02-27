import User from "../models/user.js";
import TempUser from "../models/tempUser.js";
import { encryptPassword } from "../utils/hash.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";
import { supabase } from "../core/supabaseClient.js";

class AccountService {
  constructor() {
    this.user = new User();
    this.tempUser = new TempUser();
  }

  async ensureAdmin(userId) {
    if (!userId) {
      throw new Error("Forbidden");
    }

    const role = await this.userModel.getUserRole(userId);

    if (role !== "admin") {
      throw new Error("Forbidden");
    }

    return true;
  }

  async requestSignupOtp(email, password) {
    const existingUser = await this.user.findByEmail(email);

    if (existingUser) {
      throw new Error("email");
    }

    const otp = generateOtp();

    const hashedPassword = encryptPassword(password);

    const expiresAt = new Date(Date.now() + 60 * 1000);

    const record = await this.tempUser.upsertByEmail({
      email,

      password: hashedPassword,

      otp,

      expiry_time: expiresAt.toISOString(),
    });

    // await sendOtpEmail(email, otp);

    await sendOtpEmail({
      toEmail: email,

      otp,

      type: "signup",
    });

    return record;
  }

  async verifySignupOtp(email, otp) {
    const otpEntry = await this.tempUser.findByEmailAndOtp(email, otp);

    if (!otpEntry) throw new Error("OTP not found");

    if (otpEntry.is_verified) throw new Error("OTP already used");

    if (new Date(otpEntry.expiry_time) < new Date())
      throw new Error("OTP expired");

    await this.tempUser.markVerified(otpEntry.temp_user_id);

    const newUser = await this.user.create({
      email: otpEntry.email,

      password: otpEntry.password,

      provider: null,
    });

    return newUser;
  }

  async loginWithPassword(email, password) {
    const user = await this.user.findByEmail(email);

    if (!user || !user.email) throw new Error("Email not registered yet");

    const hashedPassword = encryptPassword(password);

    const authUser = await this.user.findByEmailAndPasswordHash(
      email,
      hashedPassword,
    );

    return authUser;
  }

  async getProfileSummary(user_id) {
    if (!user_id) {
      throw new Error("Unauthorized");
    }

    const { data: completedQuests, error: questError } = await supabase
      .from("users_game_data")
      .select(
        `
                exercise_id,
                status,
                quests (
                    experience
                )
                `,
      )
      .eq("user_id", user_id)
      .eq("status", "completed");

    if (questError) {
      throw questError;
    }

    const questXpTotal = (completedQuests || []).reduce(
      (sum, row) => sum + (row?.quests?.experience || 0),
      0,
    );

    const { data: quizAttempts, error: quizError } = await supabase
      .from("user_quiz_attempts")
      .select("earned_xp")
      .eq("user_id", user_id);

    if (quizError) {
      throw quizError;
    }

    const quizXpTotal = (quizAttempts || []).reduce(
      (sum, row) => sum + (row?.earned_xp || 0),
      0,
    );

    const totalXp = questXpTotal + quizXpTotal;

    // 2️⃣ Get badge count from model

    const badgeCount = await this.user.getUserBadgeCount(user_id);

    return {
      totalXp: questXpTotal + quizXpTotal,

      badgeCount,
    };
  }

  async googleLogin(id, email, provider) {
    const emailExist = await this.user.findByEmail(email);

    const hashedPassword = encryptPassword(id + email);

    if (!emailExist) {
      //Signup

      const newUser = await this.user.create({
        email: email,

        password: hashedPassword,

        provider: provider,
      });

      return {
        id: newUser.user_id,

        email: newUser.email,
      };
    }

    if (
      emailExist &&
      emailExist.password == hashedPassword &&
      emailExist.provider == provider
    ) {
      //Login. Provider must check if it has a value of google (optional)

      console.log("EMAIL: Logged-in success");

      return {
        id: emailExist.user_id,

        message: "Logged in.",
      };
    }
  }

  async getLearningProgress(user_id) {
    if (!user_id) throw new Error("Unauthorized");

    const completed = await this.user.getCompletedExercises(user_id);

    const allExercises = await this.user.getAllExercises();

    const totals = {};

    const completedCounts = {};

    // Count total exercises per language

    allExercises.forEach((q) => {
      totals[q.programming_language_id] =
        (totals[q.programming_language_id] || 0) + 1;
    });

    // Count completed exercises per language

    completed.forEach((row) => {
      const lang = row.quests?.programming_language_id;

      if (!lang) return;

      completedCounts[lang] = (completedCounts[lang] || 0) + 1;
    });

    // Build result safely

    const result = Object.keys(totals).map((langId) => {
      const total = totals[langId];

      const done = completedCounts[langId] || 0;

      return {
        programming_language_id: Number(langId),

        completed: done,

        total,

        percentage: total === 0 ? 0 : Math.round((done / total) * 100),
      };
    });

    return result;
  }
}

export default AccountService;

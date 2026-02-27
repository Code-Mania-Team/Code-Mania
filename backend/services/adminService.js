import dayjs from "dayjs";
import AdminModel from "../models/admin.js";
import AdminExamService from "./adminExamService.js";

class AdminService {
  constructor() {
    this.adminModel = new AdminModel();
  }

  async getUserAnalytics() {
    const totalUsers = await this.adminModel.getTotalUsers();
    const new7 = await this.adminModel.getNewUsersSince(7);
    const new30 = await this.adminModel.getNewUsersSince(30);
    const new365 = await this.adminModel.getNewUsersSince(365);

    const rawSignups = await this.adminModel.getSignupsPerDayLastWeek();

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const signups = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    rawSignups.forEach((u) => {
      const day = days[dayjs(u.created_at).day()];
      signups[day]++;
    });

    return {
      totalUsers,
      newUsers: {
        last7Days: new7,
        last30Days: new30,
        lastYear: new365,
      },
      signupsPerDay: signups,
    };
  }

  async getQuizAnalytics() {
    const userQuizzesData = await this.adminModel.getUserQuizzes();

    const totalAttempts = userQuizzesData.length;
    const totalScore = userQuizzesData.reduce((a, b) => a + b.total_correct, 0);
    const totalExpRewarded = userQuizzesData.reduce(
      (a, b) => a + b.earned_xp,
      0,
    );

    return {
      totalAttempts,
      totalScore,
      totalExpRewarded,
    };
  }
}

export default AdminService;

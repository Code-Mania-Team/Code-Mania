import QuizModel from "../models/quiz.js";

class QuizService {
  constructor(model = new QuizModel()) {
    this.model = model;
  }

  async resolveIsAdmin(userId, tokenRole) {
    if (tokenRole === "admin") return true;
    if (!userId) return false;

    try {
      const role = await this.model.getUserRole(userId);
      return role === "admin";
    } catch {
      return false;
    }
  }

  async getQuizByLanguageAndStage(language, quizId) {
    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return { ok: false, status: 400, message: "Invalid quizId" };
    }

    let languageData;
    try {
      languageData = await this.model.getLanguageBySlug(language);
    } catch {
      return { ok: false, status: 404, message: "Language not found" };
    }

    let quizData;
    try {
      quizData = await this.model.getQuizByLanguageAndStage({
        programmingLanguageId: languageData.id,
        stageNumber,
        select: "*",
      });
    } catch {
      return { ok: false, status: 404, message: "Quiz not found" };
    }

    const questions = await this.model.getQuestionsByQuizId(quizData.id);
    return {
      ok: true,
      data: {
        quiz_title: quizData.quiz_title,
        questions,
      },
    };
  }

  async completeQuiz({ userId, tokenRole, language, quizId, payload }) {
    if (!userId) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return { ok: false, status: 400, message: "Invalid quizId" };
    }

    let languageData;
    try {
      languageData = await this.model.getLanguageBySlug(language);
    } catch {
      return { ok: false, status: 404, message: "Language not found" };
    }

    let quizData;
    try {
      quizData = await this.model.getQuizByLanguageAndStage({
        programmingLanguageId: languageData.id,
        stageNumber,
        select: "id",
      });
    } catch {
      return { ok: false, status: 404, message: "Quiz not found" };
    }

    const isAdmin = await this.resolveIsAdmin(userId, tokenRole);
    if (isAdmin) {
      return { ok: true, data: { success: true, preview: true } };
    }

    try {
      await this.model.createAttempt({
        userId,
        quizId: quizData.id,
        scorePercentage: payload.score_percentage,
        totalCorrect: payload.total_correct,
        totalQuestions: payload.total_questions,
        earnedXp: payload.earned_xp,
      });
      return { ok: true, data: { success: true } };
    } catch {
      return { ok: false, status: 400, message: "Quiz already completed" };
    }
  }
}

export default QuizService;

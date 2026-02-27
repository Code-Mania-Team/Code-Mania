// quiz.service.js
import QuizModel from "../models/quiz.js";

class QuizService {
  constructor() {
    this.quizModel = new QuizModel();
  }

  /* --------------------------------
     GET QUIZ
  --------------------------------- */
  async getQuizById(language, quizId) {
    const stageNumber = Number(quizId);

    if (!Number.isFinite(stageNumber)) {
      throw new Error("Invalid quizId");
    }

    const languageData = await this.quizModel.findLanguageBySlug(language);
    if (!languageData) {
      throw new Error("Language not found");
    }

    const quizData = await this.quizModel.findQuizByStage(
      languageData.id,
      stageNumber
    );

    if (!quizData) {
      throw new Error("Quiz not found");
    }

    const questions = await this.quizModel.findQuestionsByQuizId(quizData.id);

    return {
      quiz_title: quizData.quiz_title,
      questions: questions || [],
    };
  }

  /* --------------------------------
     COMPLETE QUIZ
  --------------------------------- */
  async completeQuiz(language, quizId, userId, attemptData) {
    const stageNumber = Number(quizId);

    if (!Number.isFinite(stageNumber)) {
      throw new Error("Invalid quizId");
    }

    const languageData = await this.quizModel.findLanguageBySlug(language);
    if (!languageData) {
      throw new Error("Language not found");
    }

    const quizData = await this.quizModel.findQuizIdByStage(
      languageData.id,
      stageNumber
    );

    if (!quizData) {
      throw new Error("Quiz not found");
    }

    const inserted = await this.quizModel.insertQuizAttempt({
      user_id: userId,
      quiz_id: quizData.id,
      ...attemptData,
    });

    if (!inserted) {
      throw new Error("Quiz already completed");
    }

    return { quiz_id: quizData.id };
  }
}

export default QuizService;
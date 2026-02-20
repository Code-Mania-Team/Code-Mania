import { supabase } from '../../core/supabaseClient.js';

export const getQuizById = async (req, res) => {
  const { language, quizId } = req.params;
  const stageNumber = Number(quizId);

  try {
    res.set('Cache-Control', 'no-store');

    // 1️⃣ Find programming language ID
    const { data: languageData, error: langError } = await supabase
      .from('programming_languages')
      .select('id')
      .eq('slug', language)
      .single();

    if (langError || !languageData) {
      return res.status(404).json({ message: 'Language not found' });
    }

    // 2️⃣ Find quiz by language + stage number
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('programming_language_id', languageData.id)
      .ilike('route', `%stage-${stageNumber}`)
      .single();

    if (quizError || !quizData) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // 3️⃣ Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizData.id);

    if (questionsError) throw questionsError;

    res.json({
      quiz_title: quizData.quiz_title,
      questions: questions || [],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to fetch quiz',
      questions: [],
    });
  }
};

export const completeQuiz = async (req, res) => {
  const { language, quizId } = req.params;

  const {
    score_percentage,
    total_correct,
    total_questions,
    earned_xp
  } = req.body;

  const userId = res.locals.user_id;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    /* ---------------------------------
       1️⃣ Resolve quiz id
    ----------------------------------- */
    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return res.status(400).json({ message: 'Invalid quizId' });
    }

    const { data: languageData, error: langError } = await supabase
      .from('programming_languages')
      .select('id')
      .eq('slug', language)
      .single();

    if (langError || !languageData) {
      return res.status(404).json({ message: 'Language not found' });
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('programming_language_id', languageData.id)
      .ilike('route', `%stage-${stageNumber}`)
      .single();

    if (quizError || !quizData) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    /* ---------------------------------
       2️⃣ Insert quiz attempt
       (Fails if already completed)
    ----------------------------------- */
    const { error: attemptError } = await supabase
      .from("user_quiz_attempts")
      .insert({
        user_id: userId,
        quiz_id: quizData.id,
        score_percentage,
        total_correct,
        total_questions,
        earned_xp
      });

    if (attemptError) {
      return res.status(400).json({
        message: "Quiz already completed"
      });
    }

    /* ---------------------------------
       SUCCESS
    ----------------------------------- */
    res.json({ success: true });

  } catch (err) {
    console.error("completeQuiz error:", err);
    res.status(500).json({
      message: "Failed to complete quiz"
    });
  }
};
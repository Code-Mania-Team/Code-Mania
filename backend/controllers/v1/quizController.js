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
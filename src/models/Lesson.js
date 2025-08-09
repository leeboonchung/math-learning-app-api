const db = require('../config/database');

class Lesson {
  static async findAll(userId = null) {
    let query = `
      SELECT 
        l.lesson_id
        , l.lesson_name
        , l.lesson_category
        , up.score
        , up.lesson_exp_earned
        , up.completion_date
        , up.progress
      FROM public.lesson l
      INNER JOIN public.user_progress up
      ON l.lesson_id = up.lesson_id
      INNER JOIN public.user u
      ON up.user_id = u.user_id
    `;

    const params = userId ? [userId] : [];
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, includeProblems = false) {
    const lesson = await db.query('SELECT * FROM lesson WHERE id = $1 AND is_active = true', [id]);
    
    if (lesson.rows.length === 0) return null;
    
    const lessonData = lesson.rows[0];
    
    if (includeProblems) {
      const problems = await db.query(`
        SELECT id, question, problem_type, options, order_index
        FROM problems 
        WHERE lesson_id = $1 
        ORDER BY order_index
      `, [id]);
      
      lessonData.problems = problems.rows;
    }
    
    return lessonData;
  }

  static async getWithProgress(id, userId) {
    const result = await db.query(`
      SELECT 
        l.*,
        COALESCE(ulp.is_completed, false) as is_completed,
        COALESCE(ulp.best_score, 0) as best_score,
        COALESCE(ulp.attempts_count, 0) as attempts_count,
        ulp.last_attempted_at,
        ulp.completed_at
      FROM lessons l
      LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id AND ulp.user_id = $2
      WHERE l.id = $1 AND l.is_active = true
    `, [id, userId]);

    if (result.rows.length === 0) return null;

    const lessonData = result.rows[0];
    
    // Get problems without correct answers for frontend
    const problems = await db.query(`
      SELECT id, question, problem_type, options, order_index
      FROM problems 
      WHERE lesson_id = $1 
      ORDER BY order_index
    `, [id]);
    
    lessonData.problems = problems.rows;
    return lessonData;
  }

  static async getProblemsWithAnswers(lessonId) {
    const result = await db.query(`
      SELECT id, question, correct_answer, problem_type, options, order_index
      FROM problems 
      WHERE lesson_id = $1 
      ORDER BY order_index
    `, [lessonId]);
    
    return result.rows;
  }
}

module.exports = Lesson;

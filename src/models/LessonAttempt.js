const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class LessonAttempt {
  static async create(attemptData) {
    const { userId, lessonId, submittedAnswers, score, xpEarned, isCompleted } = attemptData;
    const attemptId = uuidv4();

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Check if attempt already exists (idempotent)
      const existingAttempt = await client.query(
        'SELECT * FROM lesson_attempts WHERE attempt_id = $1',
        [attemptData.attemptId || attemptId]
      );

      if (existingAttempt.rows.length > 0) {
        await client.query('COMMIT');
        return existingAttempt.rows[0];
      }

      // Create new attempt
      const result = await client.query(`
        INSERT INTO lesson_attempts (attempt_id, user_id, lesson_id, submitted_answers, score, xp_earned, is_completed)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [attemptData.attemptId || attemptId, userId, lessonId, JSON.stringify(submittedAnswers), score, xpEarned, isCompleted]);

      // Update or create user lesson progress
      await client.query(`
        INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, best_score, attempts_count, last_attempted_at, completed_at)
        VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, $5)
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET
          is_completed = GREATEST(user_lesson_progress.is_completed::int, $3::int)::boolean,
          best_score = GREATEST(user_lesson_progress.best_score, $4),
          attempts_count = user_lesson_progress.attempts_count + 1,
          last_attempted_at = CURRENT_TIMESTAMP,
          completed_at = CASE WHEN $3 = true AND user_lesson_progress.is_completed = false THEN CURRENT_TIMESTAMP ELSE user_lesson_progress.completed_at END
      `, [userId, lessonId, isCompleted, score, isCompleted ? new Date() : null]);

      // Update user XP and streak
      await client.query(
        'UPDATE users SET total_xp = total_xp + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [xpEarned, userId]
      );

      // Update streak if lesson is completed
      if (isCompleted) {
        await client.query(`
          UPDATE users SET 
            current_streak = current_streak + 1,
            best_streak = GREATEST(best_streak, current_streak + 1),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [userId]);
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByAttemptId(attemptId) {
    const result = await db.query('SELECT * FROM lesson_attempts WHERE attempt_id = $1', [attemptId]);
    return result.rows[0];
  }

  static async getUserAttempts(userId, lessonId = null) {
    let query = 'SELECT * FROM lesson_attempts WHERE user_id = $1';
    let params = [userId];

    if (lessonId) {
      query += ' AND lesson_id = $2';
      params.push(lessonId);
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = LessonAttempt;

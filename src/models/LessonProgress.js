const db = require('../config/database');
const User = require('./User');

class LessonProgress {
  /**
   * Create or update lesson progress and scoring
   * @param {Object} progressData - Progress data
   * @param {string} progressData.userId - User ID
   * @param {string} progressData.lessonId - Lesson ID
   * @param {string} progressData.submissionId - Submission ID
   * @param {number} progressData.score - Score achieved (0-100)
   * @param {number} progressData.xpEarned - XP earned
   * @param {boolean} progressData.isCompleted - Whether lesson was completed
   * @param {Object} progressData.gradingResults - Detailed grading results
   * @returns {Object} Updated progress record
   */
  static async updateProgress(progressData) {
    const { userId, lessonId, submissionId, score, xpEarned, isCompleted, gradingResults } = progressData;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update or create user lesson progress
      const progressResult = await client.query(`
        INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, best_score, attempts_count, last_attempted_at, completed_at)
        VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, $5)
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET
          is_completed = GREATEST(user_lesson_progress.is_completed::int, $3::int)::boolean,
          best_score = GREATEST(user_lesson_progress.best_score, $4),
          attempts_count = user_lesson_progress.attempts_count + 1,
          last_attempted_at = CURRENT_TIMESTAMP,
          completed_at = CASE WHEN $3 = true AND user_lesson_progress.is_completed = false THEN CURRENT_TIMESTAMP ELSE user_lesson_progress.completed_at END
        RETURNING *
      `, [userId, lessonId, isCompleted, score, isCompleted ? new Date() : null]);

      // Update user XP
      await client.query(
        'UPDATE "user" SET total_xp = total_xp + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [xpEarned, userId]
      );

      // Update streak if lesson is completed
      if (isCompleted) {
        await client.query(`
          UPDATE "user" SET 
            current_streak = current_streak + 1,
            best_streak = GREATEST(best_streak, current_streak + 1),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId]);
      }

      await client.query('COMMIT');
      return progressResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user progress for lessons
   * @param {string} userId - User ID
   * @param {string|null} lessonId - Lesson ID (optional)
   * @returns {Object|Array} Progress data (single object if lessonId provided, array otherwise)
   */
  static async getUserProgress(userId, lessonId = null) {
    if (lessonId) {
      // Get progress for specific lesson
      const result = await db.query(`
        SELECT * FROM user_lesson_progress 
        WHERE user_id = $1 AND lesson_id = $2
      `, [userId, lessonId]);
      
      return result.rows[0];
    } else {
      // Get all progress for user
      return this.getAllUserProgress(userId);
    }
  }

  /**
   * Get all progress for a user
   * @param {string} userId - User ID
   * @returns {Array} Progress records
   */
  static async getAllUserProgress(userId) {
    const result = await db.query(`
      SELECT ulp.*, l.lesson_name, l.lesson_category
      FROM user_lesson_progress ulp
      LEFT JOIN lesson l ON ulp.lesson_id = l.lesson_id
      WHERE ulp.user_id = $1
      ORDER BY ulp.last_attempted_at DESC
    `, [userId]);
    
    return result.rows;
  }

  /**
   * Get lesson statistics
   * @param {string} lessonId - Lesson ID
   * @returns {Object} Lesson statistics
   */
  static async getLessonStats(lessonId) {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN is_completed = true THEN user_id END) as completions,
        AVG(best_score) as average_score,
        MAX(best_score) as highest_score,
        MIN(best_score) as lowest_score
      FROM user_lesson_progress 
      WHERE lesson_id = $1
    `, [lessonId]);
    
    return result.rows[0];
  }
}

module.exports = LessonProgress;

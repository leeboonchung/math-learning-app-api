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
    const { userId, lessonId, submissionId, score, xpEarned, gradingResults } = progressData;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Check if progress record already exists
      const existingProgress = await client.query(`
        SELECT * FROM user_progress 
        WHERE user_id = $1 AND lesson_id = $2
      `, [userId, lessonId]);

      let progressResult;
      
      if (existingProgress.rows.length > 0) {
        // Update existing progress
        progressResult = await client.query(`
          UPDATE user_progress 
          SET 
            score = GREATEST(score, $3),
            lesson_exp_earned = lesson_exp_earned + $4,
            completion_date = $5,
            progress = 'Completed'
          WHERE user_id = $1 AND lesson_id = $2
          RETURNING *
        `, [userId, lessonId, score, xpEarned, new Date()]);
      } else {
        // Create new progress record
        progressResult = await client.query(`
          INSERT INTO user_progress 
          (user_id, lesson_id, score, lesson_exp_earned, completion_date, current_problem_id, progress)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [userId, lessonId, score, xpEarned, new Date(), null, 'In Progress']);
      }

      // Update user XP
      await client.query(
        'UPDATE public.user SET total_exp_earned = total_exp_earned + $1, last_activity_date = CURRENT_TIMESTAMP WHERE user_id = $2',
        [xpEarned, userId]
      );

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
        SELECT * FROM user_progress 
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
      SELECT up.*, l.lesson_name, l.lesson_category
      FROM user_progress up
      LEFT JOIN lesson l ON up.lesson_id = l.lesson_id
      WHERE up.user_id = $1
      ORDER BY up.completion_date DESC
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
        COUNT(DISTINCT CASE WHEN progress = 'Completed' THEN user_id END) as completions,
        COALESCE(AVG(score), 0) as average_score,
        COALESCE(MAX(score), 0) as highest_score,
        COALESCE(MIN(score), 0) as lowest_score
      FROM user_progress 
      WHERE lesson_id = $1
    `, [lessonId]);
    
    return result.rows[0];
  }
}

module.exports = LessonProgress;
